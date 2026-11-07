# GHCR retention

The workflow runs the official
[Snok Container Retention Policy action v3.1.0](https://github.com/snok/container-retention-policy/releases/tag/v3.1.0).
Scheduled runs select untagged dashboard package versions older than 30 days.
The workflow applies a successful selection after verification.

Each successful preview is checked automatically against the current package
inventory and registry. Current tags and the manifests they reference define
which releases are protected. The check also protects references from any
other version that will remain in the package. Any candidate that has gained a
tag or is reachable from a retained manifest blocks the entire batch.

Snok targets GHCR package version IDs. It does not delete layer blobs directly.
A retained image continues to reference its layers even if a candidate uses
the same layers. A candidate that is itself a referenced manifest blocks the
batch. The verifier gives Snok an exclusion list containing every known version
outside the verified candidate set. A final inventory check confirms that only
the approved versions disappeared. Docker publishing and retention share a
concurrency lock to prevent the repository's image builds from changing the
package between verification and deletion.

## Verify and apply in a disposable package

1. Reproduce [the previous pull outage](https://github.com/heckenmann/docker-swarm-dashboard/issues/339)
   in a public `ghcr-retention-test-*` package owned by `heckenmann`. Use a
   multi-platform index tagged `master` and `latest`, untagged child manifests,
   and a separate orphan image. Allow the images to age for one hour.
2. Stop all other writers to that package, including restores and retags. Run
   the workflow manually with the test package name and review the exact
   candidate IDs in Snok's preview log. A preview run never deletes versions.
3. After reviewing the preview, run the workflow again from the same revision
   of `master`, with the same test package and the successful first-attempt
   preview's run ID (no more than 24 hours old). The check reads Snok's
   candidate IDs from that run and verifies them against the current package
   inventory, retained manifest trees (including untagged indexes), and
   referrers. A missing or used candidate blocks the entire batch. The check
   reads the inventory again before passing the exclusions to Snok.
4. The reviewed run deletes only the verified versions and checks the final
   inventory. Test fresh pulls for both `linux/amd64` and `linux/arm64`.

Snok does not accept an exact apply list, so the workflow uses its digest
exclusion list. Test packages must have no concurrent writers and must never
contain release images. The one-hour cutoff also excludes new uploads. On the
production package, tagged releases and every image referenced by a retained
release manifest are protected by the verification step.
