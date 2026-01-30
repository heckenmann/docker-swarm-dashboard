# Quick Permission Checklist for Force Push

## Before Attempting Force Push

### ✅ Verification Steps

1. **Check Branch Protection**
   - [ ] Visit: https://github.com/heckenmann/docker-swarm-dashboard/settings/branches
   - [ ] Verify `copilot/update-screenshots-and-readme` allows force pushes
   - [ ] If blocked, temporarily disable or enable "Allow force pushes"

2. **Verify User Permissions**
   - [ ] Visit: https://github.com/heckenmann/docker-swarm-dashboard/settings/access
   - [ ] Confirm you have "Write" or "Admin" access
   - [ ] If insufficient, request access from repository owner

3. **Test with Dry Run**
   ```bash
   git push --force-with-lease --dry-run origin copilot/update-screenshots-and-readme
   ```
   - [ ] Command succeeds without errors
   - [ ] Shows changes that would be pushed

4. **If Using GitHub Actions**
   - [ ] Visit: https://github.com/heckenmann/docker-swarm-dashboard/settings/actions
   - [ ] Under "Workflow permissions", select "Read and write permissions"

5. **Verify Authentication**
   - [ ] Personal Access Token has `repo` scope (if using HTTPS)
   - [ ] SSH key is configured (if using SSH)
   - [ ] Credentials are not expired

## Performing the Force Push

Once all checks pass:

```bash
# Recommended: Use force-with-lease (safer)
git push --force-with-lease origin copilot/update-screenshots-and-readme

# Alternative: Use standard force (less safe)
git push --force origin copilot/update-screenshots-and-readme
```

## Common Error Messages

| Error | Likely Cause | Solution |
|-------|--------------|----------|
| `protected branch hook declined` | Branch protection blocks force push | Modify branch protection rules |
| `permission denied` | Insufficient user permissions | Request Write/Admin access |
| `authentication failed` | Invalid credentials | Regenerate token with `repo` scope |
| `Resource not accessible by integration` | GitHub Actions lacks permissions | Enable "Read and write permissions" |

## After Successful Force Push

- [ ] Verify changes on GitHub web interface
- [ ] Check that commit history is updated
- [ ] Confirm old screenshot files are removed from history
- [ ] Notify team members (they may need to reset local branches)

## Emergency Rollback

If something goes wrong:

```bash
# Find the old commit SHA from reflog
git reflog

# Reset to previous state
git reset --hard <old-commit-sha>

# Force push back to original state
git push --force origin copilot/update-screenshots-and-readme
```

---

**Note**: This checklist is specific to the current operation of removing old screenshots from git history on the `copilot/update-screenshots-and-readme` branch.
