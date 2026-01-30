# Force Push Permission Requirements

This document outlines the permission requirements needed to force push git history changes to the `copilot/update-screenshots-and-readme` branch.

## Why Force Push is Needed

The branch requires a force push because git history has been (or will be) rewritten to:
- Remove old JPEG/JPG screenshot files from entire repository history
- Reduce repository size and bloat
- Clean up obsolete binary files

## Permission Checklist

### 1. GitHub Branch Protection Settings

**Location**: `https://github.com/heckenmann/docker-swarm-dashboard/settings/branches`

Check for protection rules on `copilot/update-screenshots-and-readme`:

- [ ] **Force pushes**: Must be **allowed** (not restricted)
  - If blocked, temporarily disable or modify the rule
  - Setting: "Allow force pushes" checkbox

- [ ] **Require pull request reviews**: 
  - If enabled, force push may still work on feature branches
  - Verify this doesn't block the operation

- [ ] **Include administrators**:
  - If checked, even repository admins are subject to protection rules
  - May need to temporarily disable for admin to force push

### 2. User/Account Permissions

**Location**: `https://github.com/heckenmann/docker-swarm-dashboard/settings/access`

Required permission level:
- **Minimum**: Write access to the repository
- **Recommended**: Admin access (if branch protection includes administrators)

Verify:
- [ ] User account has at least "Write" role
- [ ] User is not restricted by organization policies

### 3. GitHub Actions Permissions (if applicable)

**Location**: `https://github.com/heckenmann/docker-swarm-dashboard/settings/actions`

If using GitHub Actions workflows:

Navigate to: **Actions → General → Workflow permissions**

- [ ] Select "**Read and write permissions**"
  - NOT "Read repository contents and packages permissions"
- [ ] Enable "Allow GitHub Actions to create and approve pull requests" (if needed)

### 4. Authentication Method

#### Personal Access Token (PAT)
If using HTTPS with PAT:
- [ ] Token has **`repo`** scope (full control of private repositories)
- [ ] Token has **not expired**
- [ ] Token belongs to user with write/admin access

**Verify token scopes**: `https://github.com/settings/tokens`

#### SSH Key
If using SSH:
- [ ] SSH key is properly configured
- [ ] SSH key belongs to user with write/admin access
- [ ] SSH key has not been revoked

## Testing Permissions

### Dry Run Test (Recommended)
Test without making changes:

```bash
git push --force-with-lease --dry-run origin copilot/update-screenshots-and-readme
```

**Expected results:**
- ✅ **Success**: Shows what would be pushed → Permissions OK
- ❌ **"protected branch"**: Branch protection blocks force push
- ❌ **"permission denied"**: Insufficient permissions
- ❌ **"authentication failed"**: Credential/token issue

### Alternative Test
Try pushing with force-with-lease (safer than --force):

```bash
git push --force-with-lease origin copilot/update-screenshots-and-readme
```

This will only succeed if no one else has pushed to the branch since your last fetch.

## Common Issues and Solutions

### Issue 1: "protected branch hook declined"
**Cause**: Branch protection rules block force push

**Solution**:
1. Go to Settings → Branches
2. Find the protection rule for your branch
3. Either:
   - Enable "Allow force pushes" checkbox, OR
   - Temporarily delete the protection rule
4. Perform force push
5. Re-enable protection if needed

### Issue 2: "permission denied"
**Cause**: Insufficient user permissions

**Solution**:
1. Verify user has Write or Admin access
2. Check organization-level restrictions
3. Contact repository admin to grant access

### Issue 3: "authentication failed"
**Cause**: Invalid credentials or expired token

**Solution**:
1. Regenerate Personal Access Token with `repo` scope
2. Update git credentials:
   ```bash
   git config credential.helper cache
   ```
3. Try push again (will prompt for new credentials)

### Issue 4: GitHub Actions: "Resource not accessible by integration"
**Cause**: GitHub Actions workflow lacks write permissions

**Solution**:
1. Go to Settings → Actions → General
2. Under "Workflow permissions", select "Read and write permissions"
3. Re-run the workflow

## Recommended Workflow

For performing the force push safely:

1. **Backup**: Ensure all work is backed up
   ```bash
   git branch backup-branch
   ```

2. **Verify permissions**: Run dry-run test
   ```bash
   git push --force-with-lease --dry-run origin copilot/update-screenshots-and-readme
   ```

3. **Use force-with-lease**: Safer than --force
   ```bash
   git push --force-with-lease origin copilot/update-screenshots-and-readme
   ```

4. **Verify success**: Check GitHub web interface
   - Verify commit history is updated
   - Verify old files are gone from history

5. **Notify team**: If working with others, inform them of history rewrite
   - They will need to reset their local branches

## Security Considerations

**Important**: Force pushing rewrites history. This is a destructive operation.

- ✅ **Safe on feature branches**: Like `copilot/update-screenshots-and-readme`
- ⚠️ **Use with caution on shared branches**: Could disrupt other developers
- ❌ **Never on protected branches**: Like `master` or `main` in production

## Current Operation Details

- **Repository**: heckenmann/docker-swarm-dashboard
- **Branch**: copilot/update-screenshots-and-readme
- **Operation**: Remove old screenshot files from git history
- **Tool**: git-filter-repo
- **Required push**: Force push (history rewritten)

## References

- [GitHub: About protected branches](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)
- [GitHub: Managing deploy keys](https://docs.github.com/en/authentication/connecting-to-github-with-ssh/managing-deploy-keys)
- [GitHub: Creating a personal access token](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token)
- [Git: git-push documentation](https://git-scm.com/docs/git-push)
