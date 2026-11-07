#!/usr/bin/env bash
# Verify a completed Snok v3.1.0 preview and emit exclusions for the apply job.
set -euo pipefail

fail() {
  echo "::error::$1" >&2
  exit 1
}

# Never infer historical release membership from current tags.
# Snok uses the PAT owner for account=user, so verify the owner as well.
[[ "$PACKAGE" =~ ^ghcr-retention-test-[a-z0-9-]+$ ]] || fail "Only disposable test packages can be deleted"
[[ "$PREVIEW_RUN" =~ ^[1-9][0-9]*$ ]] || fail "Invalid preview run ID"
[[ "$(GH_TOKEN="$GHCR_TOKEN" gh api user --jq .login)" == heckenmann ]] || fail "Unexpected package token owner"

# Bind approval to a recent, manual preview of the same workflow revision.
run_api="repos/$GITHUB_REPOSITORY/actions/runs/$PREVIEW_RUN"
gh api "$run_api" | jq -e --arg sha "$GITHUB_SHA" '
  .path == ".github/workflows/container-retention-policy.yml" and
  .head_branch == "master" and .head_sha == $sha and
  .event == "workflow_dispatch" and .conclusion == "success" and .run_attempt == 1 and
  ((now - (.created_at | fromdateiso8601)) | . >= 0 and . <= 86400)
' >/dev/null || fail "Use a successful first-attempt manual preview from this master revision, at most 24 hours old"

# Read the exact attempt that was reviewed, even if a rerun starts meanwhile.
job_id=$(gh api --paginate --slurp "$run_api/attempts/1/jobs?per_page=100" | jq -er '
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
lines=$(grep -E 'dry-run: Would have deleted|Would delete image' <<< "$log" || [[ $? == 1 ]])
[[ -n "$lines" ]] || fail "No candidates in the Snok dry run"
pattern="dry-run: Would have deleted $PACKAGE:<untagged> package_version=([1-9][0-9]*)[[:space:]]*\$"
ids=$(while IFS= read -r line; do
  [[ "$line" =~ $pattern ]] || fail "Unexpected candidate in Snok dry-run log"
  printf '%s\n' "${BASH_REMATCH[1]}"
done <<< "$lines" | jq -sc 'unique')

versions_api="users/heckenmann/packages/container/$PACKAGE/versions?state=active&per_page=100"
# Normalize page and tag order so the final comparison detects content changes
# rather than differences in the order returned by the package API.
read_inventory() {
  GH_TOKEN="$GHCR_TOKEN" gh api --paginate --slurp "$versions_api" | jq -ce '
  add | select(length > 0 and length <= 100)
  | map({id, digest: .name, tags: .metadata.container.tags})
  | select(all(.[]; (.id | type) == "number" and
      (.digest | test("^sha256:[0-9a-f]{64}$")) and
      (.tags | type) == "array" and all(.tags[]; test("^[A-Za-z0-9_][A-Za-z0-9_.-]{0,127}$"))))
  | select(length == (map(.id) | unique | length) and length == (map(.digest) | unique | length))
  | map(.tags |= sort) | sort_by(.id)
  '
}
versions=$(read_inventory) || fail "Test package inventory is incomplete, invalid or too large"
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
jq -e 'index("master") != null and index("latest") != null' <<< "$package_tags" >/dev/null ||
  fail "Test package must have master and latest tags"

# Check legacy signature and attestation tags, which can name their
# subject in the tag even when the manifest has no OCI subject field.
while IFS=$'\t' read -r tag digest; do
  [[ "$(regctl image digest "$image:$tag")" == "$digest" ]] || fail "Tag $tag changed after inventory"
  if [[ "$tag" =~ ^sha256-([0-9a-f]{64})(\..+)?$ ]]; then
    jq -e --arg subject "sha256:${BASH_REMATCH[1]}" 'all(.[]; .digest != $subject)' \
      <<< "$candidates" >/dev/null || fail "A preview candidate is the subject of $tag"
  fi
done < <(jq -r '.[] | .digest as $digest | .tags[] | [., $digest] | @tsv' <<< "$versions")

# A retained version may still be pulled by digest after losing its tags.
# Walk all retained versions, including untagged indexes and their children.
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
  jq -e --argjson candidates "$candidates" '
    ([.. | objects | .digest?, .Digest? | strings] as $used |
      all($candidates[]; .digest as $digest | $used | index($digest) == null))
  ' <<< "$tree" >/dev/null || fail "A preview candidate is reachable from retained manifest $digest"
done < <(jq -r --argjson ids "$ids" '.[] | select(.id as $id | $ids | index($id) == null) | .digest' <<< "$versions")

# Only standalone leaf images qualify. An index or an artifact with an
# OCI subject can have relationships that are unsafe to remove here.
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

# Check again after the manifest requests. This detects changes before
# issuing the outputs consumed by the next step; the test package still
# must have no other writers during apply.
current_versions=$(read_inventory) || fail "Could not recheck the package inventory"
[[ "$current_versions" == "$versions" ]] || fail "Package inventory changed during verification"

# Snok recalculates its candidates on apply. Exclude every known version
# outside the verified preview because Snok has no exact-ID allowlist.
skip=$(jq -er --argjson ids "$ids" '
  [.[] | select(.id as $id | $ids | index($id) == null) | .digest] | join(",")
' <<< "$versions")
echo "skip-shas=$skip" >> "$GITHUB_OUTPUT"
echo "verified-ids=$(jq -c . <<< "$ids")" >> "$GITHUB_OUTPUT"
echo "Verified Snok preview IDs: $(jq -r 'join(", ")' <<< "$ids")"
