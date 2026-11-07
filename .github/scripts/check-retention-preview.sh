#!/usr/bin/env bash
# Verify the completed Snok v3.1.0 preview job against the current registry.
set -euo pipefail

fail() {
  echo "::error::$1" >&2
  exit 1
}

production=false
if [[ "$PACKAGE" == docker-swarm-dashboard ]]; then
  production=true
  [[ -z "${REVIEWED_RUN:-}" ]] || fail "Production must use the preview from this run"
elif [[ ! "$PACKAGE" =~ ^ghcr-retention-test-[a-z0-9-]+$ ]]; then
  fail "Unexpected package name"
fi
# Snok uses the PAT owner for account=user.
[[ "$(GH_TOKEN="$GHCR_TOKEN" gh api user --jq .login)" == heckenmann ]] || fail "Unexpected package token owner"

preview_run=${REVIEWED_RUN:-${GITHUB_RUN_ID:-}}
[[ "$preview_run" =~ ^[1-9][0-9]*$ ]] || fail "Invalid preview run ID"
run_api="repos/$GITHUB_REPOSITORY/actions/runs/$preview_run"
attempt=${GITHUB_RUN_ATTEMPT:-1}
if [[ -n "${REVIEWED_RUN:-}" ]]; then
  # A manually selected test preview must come from this master revision.
  gh api "$run_api" | jq -e --arg sha "$GITHUB_SHA" '
    .path == ".github/workflows/container-retention-policy.yml" and
    .head_branch == "master" and .head_sha == $sha and
    .event == "workflow_dispatch" and .conclusion == "success" and .run_attempt == 1 and
    ((now - (.created_at | fromdateiso8601)) | . >= 0 and . <= 86400)
  ' >/dev/null || fail "Use a successful first-attempt manual preview from this master revision, at most 24 hours old"
  attempt=1
fi

# For automatic checks, needs.preview guarantees the preview has completed.
job_id=$(gh api --paginate --slurp "$run_api/attempts/$attempt/jobs?per_page=100" | jq -er '
  [.[].jobs[] | select(.name == "Retention preview" and .conclusion == "success") | .id]
  | if length == 1 then .[0] else error("Expected exactly one successful preview job") end
')
# gh rejects ANSI sequences by default. Allow them only into the stripping
# pipeline so the colored Snok fields can be parsed as plain text.
log=$(gh api --allow-escape-sequences "repos/$GITHUB_REPOSITORY/actions/jobs/$job_id/logs" | sed -E $'s/\x1b\\[[0-?]*[ -/]*[@-~]//g') ||
  fail "Could not download the Snok preview log"
# Match the fixed marker printed by the preview job, and the version IDs
# emitted by the pinned Snok version. Reject unrecognized candidate lines.
grep -Eq "^[^ ]+ Retention preview package: $PACKAGE\$" <<< "$log" ||
  fail "Preview belongs to another package"

# Snok v3.1.0 can exit successfully after clearing or limiting its candidates.
# Reject those previews before accepting an empty or partial candidate list.
if grep -Eiq \
  -e 'clearing (all |untagged )?deletion candidates' \
  -e 'skipping deletion for this package' \
  -e 'no more requests available in the rate limit' \
  -e 'enough requests remaining in the rate limit to delete all package versions' <<< "$log"; then
  fail "Snok did not complete the candidate selection; see the preview log"
fi

lines=$(grep -E 'dry-run: Would have deleted|Would delete image' <<< "$log" || [[ $? == 1 ]])
if [[ -z "$lines" ]]; then
  [[ -z "${REVIEWED_RUN:-}" ]] || fail "No candidates in the Snok dry run"
  echo "No candidates in the Snok dry run"
  exit 0
fi
pattern="dry-run: Would have deleted $PACKAGE:<untagged> package_version=([1-9][0-9]*)[[:space:]]*\$"
ids=$(while IFS= read -r line; do
  [[ "$line" =~ $pattern ]] || fail "Unexpected candidate in Snok dry-run log"
  printf '%s\n' "${BASH_REMATCH[1]}"
done <<< "$lines" | jq -sc 'unique')

versions_api="users/heckenmann/packages/container/$PACKAGE/versions?state=active&per_page=100"
# Normalize page and tag order so the final comparison detects content changes
# rather than differences in the order returned by the package API.
read_inventory() {
  GH_TOKEN="$GHCR_TOKEN" gh api --paginate --slurp "$versions_api" | jq -ce --argjson production "$production" '
  add | select(length > 0 and ($production or length <= 100))
  | map({id, digest: .name, tags: .metadata.container.tags})
  | select(all(.[]; (.id | type) == "number" and
      (.digest | test("^sha256:[0-9a-f]{64}$")) and
      (.tags | type) == "array" and all(.tags[]; test("^[A-Za-z0-9_][A-Za-z0-9_.-]{0,127}$"))))
  | select(length == (map(.id) | unique | length) and length == (map(.digest) | unique | length))
  | map(.tags |= sort) | sort_by(.id)
  '
}
versions=$(read_inventory) || fail "Package inventory is incomplete, invalid or too large"
candidates=$(jq -ce --argjson ids "$ids" '
  [.[] | select(.id as $id | $ids | index($id))] |
  select(length == ($ids | length) and all(.[]; .tags == []))
' <<< "$versions") || fail "A preview candidate is missing or has gained a tag"

# Package metadata can lag behind the registry after a retag. Require both
# views to agree before relying on their references.
image="ghcr.io/heckenmann/$PACKAGE"
registry_tags=$(regctl tag ls "$image" --format '{{json .Tags}}' | jq -ce 'sort')
package_tags=$(jq -ce '[.[].tags[]] | sort' <<< "$versions")
[[ "$registry_tags" == "$package_tags" ]] || fail "Registry and package API disagree on tags"
if ! "$production"; then
  jq -e 'index("master") != null and index("latest") != null' <<< "$package_tags" >/dev/null ||
    fail "Test package must have master and latest tags"
fi

# Check legacy signature and attestation tags, which can name their
# subject in the tag even when the manifest has no OCI subject field.
while IFS=$'\t' read -r tag digest; do
  [[ "$(regctl image digest "$image:$tag")" == "$digest" ]] || fail "Tag $tag changed after inventory"
  if [[ "$tag" =~ ^sha256-([0-9a-f]{64})(\..+)?$ ]]; then
    jq -e --arg subject "sha256:${BASH_REMATCH[1]}" 'all(.[]; .digest != $subject)' \
      <<< "$candidates" >/dev/null || fail "A preview candidate is the subject of $tag"
  fi
done < <(jq -r '.[] | .digest as $digest | .tags[] | [., $digest] | @tsv' <<< "$versions")

candidate_digests=$(jq -c 'map({key: .digest, value: true}) | from_entries' <<< "$candidates")
# Walk retained manifests, including children of retained untagged indexes.
# Snok deletes package versions, not blobs. Shared layer digests remain
# referenced by the retained manifest and are never submitted for deletion.
while IFS= read -r digest; do
  tree=$(regctl artifact tree --digest-tags "$image@$digest" --format '{{json .}}') ||
    fail "Could not inspect retained manifest $digest"
  jq -e --arg digest "$digest" '
    .reference.Digest == $digest and (.manifest | type) == "object" and
    all(.. | objects | select(has("manifest") and has("reference"));
      .manifest.schemaVersion == 2 and
      (.manifest.mediaType | IN("application/vnd.oci.image.index.v1+json",
        "application/vnd.docker.distribution.manifest.list.v2+json",
        "application/vnd.oci.image.manifest.v1+json",
        "application/vnd.docker.distribution.manifest.v2+json")))
  ' <<< "$tree" >/dev/null || fail "Unsupported retained manifest tree for $digest"
  printf '%s\n' "$candidate_digests" "$tree" | jq -es '
    .[0] as $candidates | .[1] |
    all(.. | objects | .digest?, .Digest? | strings; $candidates[.] == null)
  ' >/dev/null || fail "A preview candidate is reachable from retained manifest $digest"
done < <(jq -r --argjson ids "$ids" '.[] | select(.id as $id | $ids | index($id) == null) | .digest' <<< "$versions")

# Keep the standalone image requirement for the disposable apply experiment.
# Production audits only whether candidates are referenced by retained versions.
if ! "$production"; then
  while IFS= read -r digest; do
    regctl manifest get "$image@$digest" --format raw-body | jq -e '
      .schemaVersion == 2 and
      (.mediaType == "application/vnd.oci.image.manifest.v1+json" or
       .mediaType == "application/vnd.docker.distribution.manifest.v2+json") and
      .subject == null
    ' >/dev/null || fail "Candidate $digest is not a standalone image manifest"
    regctl artifact list --digest-tags "$image@$digest" --format '{{json .Descriptors}}' |
      jq -e '. == []' >/dev/null || fail "Candidate $digest has referrers"
  done < <(jq -r '.[].digest' <<< "$candidates")
fi

# Check again after the manifest requests. This detects changes before
# issuing the outputs consumed by the next step; the test package still
# must have no other writers during apply.
current_versions=$(read_inventory) || fail "Could not recheck the package inventory"
[[ "$current_versions" == "$versions" ]] || fail "Package inventory changed during verification"

echo "Verified $(jq 'length' <<< "$ids") Snok preview candidates against the current registry"

# A production preview is verified and applied in the same workflow run.
# Disposable test packages require a separate, manually reviewed preview run.
if ! "$production" && [[ -z "${REVIEWED_RUN:-}" ]]; then
  echo "Test package preview verified; deletion requires a reviewed-run input"
  exit 0
fi

# Snok recalculates its candidates on apply. Exclude every known version
# outside the verified preview because Snok has no exact-ID allowlist.
skip=$(jq -er --argjson ids "$ids" '
  [.[] | select(.id as $id | $ids | index($id) == null) | .digest] | join(",")
' <<< "$versions")
(( ${#skip} <= 500000 )) || fail "Verified exclusion list is too large to pass safely to the apply step"
retained_ids=$(jq -cer --argjson ids "$ids" '
  [.[] | select(.id as $id | $ids | index($id) == null) | .id] | sort
' <<< "$versions")
echo "apply=true" >> "$GITHUB_OUTPUT"
echo "skip-shas=$skip" >> "$GITHUB_OUTPUT"
echo "verified-ids=$(jq -c . <<< "$ids")" >> "$GITHUB_OUTPUT"
echo "retained-ids=$retained_ids" >> "$GITHUB_OUTPUT"
echo "Verified Snok preview IDs: $(jq -r 'join(", ")' <<< "$ids")"
