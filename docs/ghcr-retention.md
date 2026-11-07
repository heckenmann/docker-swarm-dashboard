# GHCR retention

The workflow runs the official
[Snok Container Retention Policy action v3.1.0](https://github.com/snok/container-retention-policy/releases/tag/v3.1.0).
Scheduled runs preview untagged dashboard package versions older than 30 days.
Snok excludes direct children of retained tagged multi-platform indexes.

Each successful preview is checked automatically against the current package
inventory and registry. Current tags and the manifests they reference define
which releases are protected. The check also protects references from any
other version that will remain in the package.

Snok targets GHCR package version IDs. It does not delete layer blobs directly.
A retained image continues to reference its layers even if a candidate uses
the same layers. A candidate that is itself a referenced manifest blocks the
batch. Deletion is currently disabled.

## Verify and apply in a disposable package

1. Reproduce [the previous pull outage](https://github.com/heckenmann/docker-swarm-dashboard/issues/339)
   in a public `ghcr-retention-test-*` package owned by `heckenmann`. Use a
   multi-platform index tagged `master` and `latest`, untagged child manifests,
   and a separate orphan image. Allow the images to age for one hour.
2. Stop all other writers to that package, including restores and retags, and
   run the workflow manually with the test package name. Review the exact
   candidate IDs in Snok's preview log.
3. To repeat verification manually, run the workflow again from the same
   revision of `master`, with the same
   test package and the successful first-attempt preview's run ID (no more
   than 24 hours old). The check reads Snok's
   candidate IDs from that run and verifies them against the current package
   inventory, retained manifest trees (including untagged indexes), and
   referrers. A missing or used candidate blocks the entire batch. The check
   reads the inventory again before passing the exclusions to Snok.
4. The workflow keeps the deletion and final inventory check commented out
   during validation. If enabled for the disposable package, the final check
   confirms that only the verified versions disappeared. Test fresh pulls for
   both `linux/amd64` and `linux/arm64`.

Snok does not accept an exact apply list, so the workflow uses its digest
exclusion list. Test packages must have no concurrent writers and must never
contain release images. The one-hour cutoff also excludes new uploads.
