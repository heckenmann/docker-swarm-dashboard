#!/usr/bin/env bash
# Local regression tests. Run with Bash and jq; no network or credentials are needed.
set -euo pipefail

script_dir=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
command -v jq >/dev/null
fixtures=$(mktemp -d)
touch "$fixtures/gh" "$fixtures/regctl" "$fixtures/outputs" "$fixtures/log" "$fixtures/inventory-seen"
trap 'rm -- "$fixtures/gh" "$fixtures/regctl" "$fixtures/outputs" "$fixtures/log" "$fixtures/inventory-seen"; rmdir -- "$fixtures"' EXIT

cat > "$fixtures/gh" <<'MOCK'
#!/usr/bin/env bash
set -euo pipefail
case "$*" in
  'api user --jq .login') echo heckenmann ;;
  'api repos/heckenmann/docker-swarm-dashboard/actions/runs/123')
    attempt=1
    age=60
    [[ "$SCENARIO" != rerun ]] || attempt=2
    [[ "$SCENARIO" != stale ]] || age=86401
    jq -n --arg sha "$PREVIEW_SHA" --argjson attempt "$attempt" --argjson age "$age" '{
      path: ".github/workflows/container-retention-policy.yml",
      head_branch: "master", head_sha: $sha, event: "workflow_dispatch", conclusion: "success",
      run_attempt: $attempt, created_at: ((now - $age | floor) | todateiso8601)
    }'
    ;;
  'api --paginate --slurp repos/heckenmann/docker-swarm-dashboard/actions/runs/123/attempts/1/jobs?per_page=100')
    echo '[{"jobs":[{"id":456,"name":"Retention preview","conclusion":"success"}]}]'
    ;;
  'api repos/heckenmann/docker-swarm-dashboard/actions/jobs/456/logs')
    echo "the response contains terminal escape sequences" >&2
    exit 1
    ;;
  'api --allow-escape-sequences repos/heckenmann/docker-swarm-dashboard/actions/jobs/456/logs')
    case "$SCENARIO" in
      expired-log) echo "HTTP 410" >&2; exit 1 ;;
      denied-log) echo "HTTP 403" >&2; exit 1 ;;
    esac
    printf '2026-11-07T06:51:11.615Z Retention preview package: %s\n' "$LOG_PACKAGE"
    for id in $CANDIDATE_IDS; do
      if [[ "$SCENARIO" == legacy-log ]]; then
        printf '2026-11-07T06:51:11.6154964Z Would delete image %s:%s.\n' "$LOG_PACKAGE" "$id"
      else
        # Prefix and ANSI field delimiters match the original v3.1 job log.
        printf '2026-11-07T02:43:50.4641020Z \033[2m2026-11-07T02:43:50.463609Z\033[0m \033[32m INFO\033[0m container_retention_policy::client::client: dry-run: Would have deleted \033[34m%s\033[0m:\033[33m<untagged>\033[0m \033[3mpackage_version\033[0m\033[2m=\033[0m%s\n' "$LOG_PACKAGE" "$id"
      fi
    done
    ;;
  "api --paginate --slurp users/heckenmann/packages/container/$PACKAGE/versions?state=active&per_page=100")
    [[ "$SCENARIO" != rate-limit ]] || { echo "HTTP 429" >&2; exit 1; }
    [[ "$SCENARIO" != bad-json ]] || { echo '{'; exit 0; }
    # The second inventory read simulates a tag added during verification.
    inventory_changed=false
    if [[ "$SCENARIO" == inventory-change && -s "$INVENTORY_SEEN" ]]; then
      inventory_changed=true
    fi
    echo seen > "$INVENTORY_SEEN"
    jq -n --arg root "$ROOT" --arg child "$CHILD" --arg orphan "$ORPHAN" --arg other "$OTHER" \
      --arg signature "$SIGNATURE" --arg scenario "$SCENARIO" --argjson changed "$inventory_changed" '
      [
        {id:1,name:$root,tags:["master","latest"]},
        {id:2,name:$child,tags:[]},
        {id:3,name:$orphan,tags:(if $changed then ["new-tag"] else [] end)},
        {id:4,name:$other,tags:(if $scenario == "untagged-index" then [] elif $scenario == "signature" then [$signature] else ["release"] end)}
      ]
      | map({id,name,metadata:{container:{tags}}})
      | if $scenario == "duplicate-page" then [., .]
        elif $scenario == "too-many" then [., [range(101) | {id: .}]]
        else [.[0:2], .[2:]] end
    '
    ;;
  *) echo "Unexpected gh call" >&2; exit 99 ;;
esac
MOCK

cat > "$fixtures/regctl" <<'MOCK'
#!/usr/bin/env bash
set -euo pipefail
case "$1 $2" in
  'tag ls')
    case "$SCENARIO" in
      untagged-index|tag-mismatch) echo '["master","latest"]' ;;
      signature) jq -nc --arg signature "$SIGNATURE" '["master","latest",$signature]' ;;
      *) echo '["master","latest","release"]' ;;
    esac
    ;;
  'image digest')
    case "$3" in
      *:master) if [[ "$SCENARIO" == tag-moved ]]; then echo "$OTHER"; else echo "$ROOT"; fi ;;
      *:latest) echo "$ROOT" ;;
      *) echo "$OTHER" ;;
    esac
    ;;
  'artifact tree')
    digest=${4##*@}
    [[ "$SCENARIO" != manifest-error ]] || { echo "HTTP 404" >&2; exit 1; }
    jq -n --arg digest "$digest" --arg root "$ROOT" --arg child "$CHILD" \
      --arg orphan "$ORPHAN" --arg other "$OTHER" --arg scenario "$SCENARIO" '
      def image($digest):
        {reference:{Digest:$digest},
         manifest:{schemaVersion:2,mediaType:"application/vnd.oci.image.manifest.v1+json"}};
      def index($digest; $children):
        {reference:{Digest:$digest},
         manifest:{schemaVersion:2,mediaType:"application/vnd.oci.image.index.v1+json",
                   manifests:[$children[] | {digest:.reference.Digest}]}, child:$children};
      if $digest == $root then
        if $scenario == "attestation" then
          index($root; [image($child), image($orphan)])
          | .manifest.manifests[1] += {platform:{architecture:"unknown",os:"unknown"},
                                      annotations:{"vnd.docker.reference.type":"attestation-manifest"}}
        else index($root; [image($child)]) end
      elif $digest == $other and $scenario == "untagged-index" then
        index($other; [index($child; [image($orphan)])])
      else image($digest) end
      | if $scenario == "unknown-manifest" then .manifest.mediaType = "application/unknown" else . end
    '
    ;;
  'manifest get') echo '{"schemaVersion":2,"mediaType":"application/vnd.oci.image.manifest.v1+json"}' ;;
  'artifact list') printf '%s\n' "$REFERRERS" ;;
  *) echo "Unexpected regctl call" >&2; exit 99 ;;
esac
MOCK
chmod +x "$fixtures/gh" "$fixtures/regctl"

test_package=ghcr-retention-test-fixture
root=$(printf 'sha256:%064d' 1)
child=$(printf 'sha256:%064d' 2)
orphan=$(printf 'sha256:%064d' 3)
other=$(printf 'sha256:%064d' 4)

run_preview_check() {
  : > "$fixtures/outputs"
  : > "$fixtures/inventory-seen"
  # Isolate each case from local GitHub credentials and other runner settings.
  env -i PATH="$fixtures:$PATH" GH_TOKEN=fixture GHCR_TOKEN=fixture \
    PACKAGE="$1" LOG_PACKAGE="$2" CANDIDATE_IDS="$3" PREVIEW_SHA="$4" REFERRERS="$5" SCENARIO="${6:-normal}" \
    GITHUB_REPOSITORY=heckenmann/docker-swarm-dashboard GITHUB_SHA=fixture PREVIEW_RUN=123 \
    INVENTORY_SEEN="$fixtures/inventory-seen" SIGNATURE="sha256-${orphan#sha256:}.sig" \
    GITHUB_OUTPUT="$fixtures/outputs" ROOT="$root" CHILD="$child" ORPHAN="$orphan" OTHER="$other" \
    bash "$script_dir/check-retention-preview.sh" > "$fixtures/log" 2>&1
}

expect_rejected() {
  local label=$1 message=$2
  shift 2
  # A rejected batch must not leave any outputs that could enable apply.
  if run_preview_check "$@" || ! grep -Fq -- "$message" "$fixtures/log" || [[ -s "$fixtures/outputs" ]]; then
    printf 'FAIL: %s\n' "$label" >&2
    cat "$fixtures/log" "$fixtures/outputs" >&2
    exit 1
  fi
  printf 'PASS: %s\n' "$label"
}

if ! run_preview_check "$test_package" "$test_package" 3 fixture '[]' ||
   [[ "$(cat "$fixtures/outputs")" != "$(printf 'skip-shas=%s,%s,%s\nverified-ids=[3]' "$root" "$child" "$other")" ]]; then
  echo 'FAIL: orphan approved with exact exclusions' >&2
  cat "$fixtures/log" "$fixtures/outputs" >&2
  exit 1
fi
echo 'PASS: orphan approved with exact exclusions'

expect_rejected 'referenced child blocks the whole batch' 'reachable from retained manifest' \
  "$test_package" "$test_package" '3 2' fixture '[]'
expect_rejected 'missing ID' 'missing or has gained a tag' \
  "$test_package" "$test_package" 5 fixture '[]'
expect_rejected 'candidate gained a release tag' 'missing or has gained a tag' \
  "$test_package" "$test_package" 4 fixture '[]'
expect_rejected 'candidate with referrers' 'has referrers' \
  "$test_package" "$test_package" 3 fixture '[{}]'
expect_rejected 'preview belongs to another package' 'Preview belongs to another package' \
  "$test_package" ghcr-retention-test-other 3 fixture '[]'
expect_rejected 'preview uses another revision' 'this master revision' \
  "$test_package" "$test_package" 3 older '[]'
expect_rejected 'malformed candidate ID' 'Unexpected candidate in Snok dry-run log' \
  "$test_package" "$test_package" invalid fixture '[]'
expect_rejected 'empty preview' 'No candidates in the Snok dry run' \
  "$test_package" "$test_package" '' fixture '[]'
expect_rejected 'production package' 'Only disposable test packages can be deleted' \
  docker-swarm-dashboard docker-swarm-dashboard 3 fixture '[]'

expect_rejected 'candidate belongs to a retained untagged nested index' 'reachable from retained manifest' \
  "$test_package" "$test_package" 3 fixture '[]' untagged-index
expect_rejected 'BuildKit attestation in a retained index' 'reachable from retained manifest' \
  "$test_package" "$test_package" 3 fixture '[]' attestation
expect_rejected 'legacy signature tag protects its subject' 'is the subject of sha256-' \
  "$test_package" "$test_package" 3 fixture '[]' signature
expect_rejected 'legacy v2 log format' 'Unexpected candidate in Snok dry-run log' \
  "$test_package" "$test_package" 1514521172 fixture '[]' legacy-log
expect_rejected 'expired GitHub job log' 'Could not download the Snok preview log' \
  "$test_package" "$test_package" 3 fixture '[]' expired-log
expect_rejected 'GitHub log access denied' 'Could not download the Snok preview log' \
  "$test_package" "$test_package" 3 fixture '[]' denied-log
expect_rejected 'package API rate limited' 'inventory is incomplete, invalid or too large' \
  "$test_package" "$test_package" 3 fixture '[]' rate-limit
expect_rejected 'malformed package API response' 'inventory is incomplete, invalid or too large' \
  "$test_package" "$test_package" 3 fixture '[]' bad-json
expect_rejected 'duplicate version IDs across inventory pages' 'inventory is incomplete, invalid or too large' \
  "$test_package" "$test_package" 3 fixture '[]' duplicate-page
expect_rejected 'oversized package inventory' 'inventory is incomplete, invalid or too large' \
  "$test_package" "$test_package" 3 fixture '[]' too-many
expect_rejected 'registry tag list differs from package API' 'disagree on tags' \
  "$test_package" "$test_package" 3 fixture '[]' tag-mismatch
expect_rejected 'tag digest changed after inventory' 'Tag master changed after inventory' \
  "$test_package" "$test_package" 3 fixture '[]' tag-moved
expect_rejected 'registry manifest request failed' 'Could not inspect retained manifest' \
  "$test_package" "$test_package" 3 fixture '[]' manifest-error
expect_rejected 'unknown registry manifest type' 'Unsupported retained manifest tree' \
  "$test_package" "$test_package" 3 fixture '[]' unknown-manifest
expect_rejected 'package version changed during verification' 'Package inventory changed during verification' \
  "$test_package" "$test_package" 3 fixture '[]' inventory-change
expect_rejected 'preview has multiple run attempts' 'first-attempt manual preview' \
  "$test_package" "$test_package" 3 fixture '[]' rerun
expect_rejected 'preview is over 24 hours old' 'at most 24 hours old' \
  "$test_package" "$test_package" 3 fixture '[]' stale
