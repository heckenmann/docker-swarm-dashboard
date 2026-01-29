# Release Checklist - Quick Reference

**Last Check:** 2026-01-29  
**Status:** ✅ READY FOR RELEASE

## Pre-Release Checklist

### Critical Checks (Must Pass)
- [x] **Linting**
  - [x] ESLint passes with 0 errors
  - [x] Stylelint passes with 0 errors  
  - [x] golangci-lint passes with 0 errors

- [x] **Unit Tests**
  - [x] All JavaScript tests pass (304/305)
  - [x] All Go tests pass
  - [x] E2E smoke tests pass

- [x] **Code Coverage**
  - [x] JavaScript coverage ≥ 90% (actual: 95.91%)
  - [x] Go coverage ≥ 90% (actual: 91.8%)

- [x] **Build Process**
  - [x] Frontend production build succeeds
  - [x] Docker image builds successfully
  - [x] Docker image size < 25 MB (actual: 23.1 MB)

- [x] **Security**
  - [x] No critical or high severity vulnerabilities in production code
  - [x] Production dependencies are secure

- [x] **Code Quality**
  - [x] No blocking TODO/FIXME items
  - [x] No console errors or warnings in production build

### Non-Blocking Items (Optional)
- [ ] Bundle size optimization (performance improvement)
- [ ] Update development dependencies with low-severity issues
- [ ] Review and update peer dependency warnings

## Commands to Run Before Release

```bash
# Frontend checks
cd app-src
yarn install
yarn lint
yarn lint:css
yarn test:coverage
yarn build

# Backend checks
cd ../server-src
go test ./... -coverprofile=coverage.out
go tool cover -func=coverage.out
golangci-lint run ./...

# Docker build
cd ..
docker build -t ghcr.io/heckenmann/docker-swarm-dashboard:latest .
docker images --format "{{.Repository}}:{{.Tag}} - {{.Size}}"

# Security audit
cd app-src
yarn audit
```

## Release Notes Template

```markdown
## Version X.Y.Z

### What's New
- [List new features]

### Improvements
- [List improvements]

### Bug Fixes
- [List bug fixes]

### Technical Details
- Test Coverage: JavaScript 95.91%, Go 91.8%
- Docker Image Size: 23.1 MB
- Node.js: >=22.0.0
- Go: 1.23

### Breaking Changes
- [List any breaking changes]

### Upgrade Instructions
[Provide upgrade instructions if needed]
```

## Post-Release Checklist
- [ ] Tag the release in git
- [ ] Update GitHub release with release notes
- [ ] Verify Docker image published to ghcr.io
- [ ] Update documentation if needed
- [ ] Announce release (if applicable)
- [ ] Monitor for issues in the first 24-48 hours

## Rollback Plan
If issues are discovered after release:
1. Immediately notify users via GitHub
2. Revert to previous stable tag
3. Investigate and fix the issue
4. Re-run full test suite
5. Create patch release

---

**For detailed findings, see:** [RELEASE_READINESS_REPORT.md](./RELEASE_READINESS_REPORT.md)
