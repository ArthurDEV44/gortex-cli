# Branch Protection Rules

This document describes the branch protection rules to configure on GitHub for GORTEX CLI.

---

## 🌳 Branch Strategy Overview

```
main (production)
  ↑
  | Merges from dev (maintainer only)
  |
dev (development)
  ↑
  | Merges from contributors (maintainer only)
  |
contributors (integration)
  ↑
  | Pull requests from contributors
  |
feature/* (contributor work)
```

---

## 🛡️ Protection Rules Configuration

### Branch: `main`

**Purpose:** Production-ready code, published to npm

**Protection Level:** Maximum

#### Settings

**Protect matching branches:**
- ✅ Require a pull request before merging
  - Required approvals: **1** (maintainer approval required)
  - ✅ Dismiss stale pull request approvals when new commits are pushed
  - ✅ Require review from Code Owners (if CODEOWNERS file exists)
  - ✅ Require approval of the most recent reviewable push

- ✅ Require status checks to pass before merging
  - ✅ Require branches to be up to date before merging
  - **Required status checks:**
    - `test` - All tests must pass
    - `build` - Build must succeed
    - `typecheck` - TypeScript compilation must succeed
    - `lint` - Biome linting must pass

- ✅ Require conversation resolution before merging

- ✅ Require signed commits (optional but recommended)

- ✅ Require linear history (optional - prevents merge commits)

- ✅ Do not allow bypassing the above settings
  - Even administrators cannot bypass these rules

**Rules applied to everyone including administrators:**
- ✅ Block force pushes
- ✅ Restrict deletions

**Restrict who can push to matching branches:**
- Only the repository maintainer (you)

---

### Branch: `dev`

**Purpose:** Active development by maintainer

**Protection Level:** High

#### Settings

**Protect matching branches:**
- ✅ Require a pull request before merging
  - Required approvals: **1**
  - ✅ Dismiss stale pull request approvals when new commits are pushed
  - ⚠️ Allow specified actors to bypass pull request requirements
    - Add yourself for emergency hotfixes

- ✅ Require status checks to pass before merging
  - ✅ Require branches to be up to date before merging
  - **Required status checks:**
    - `test`
    - `build`
    - `typecheck`

- ✅ Require conversation resolution before merging

**Rules applied to everyone including administrators:**
- ✅ Block force pushes
- ✅ Restrict deletions

**Restrict who can push to matching branches:**
- Only the repository maintainer (you)

---

### Branch: `contributors`

**Purpose:** Integration branch for external contributions

**Protection Level:** Moderate (to allow contributor PRs)

#### Settings

**Protect matching branches:**
- ✅ Require a pull request before merging
  - Required approvals: **1** (maintainer must review)
  - ✅ Dismiss stale pull request approvals when new commits are pushed

- ✅ Require status checks to pass before merging
  - ✅ Require branches to be up to date before merging
  - **Required status checks:**
    - `test`
    - `build`
    - `typecheck`
    - `lint`

- ✅ Require conversation resolution before merging

**Rules applied to everyone including administrators:**
- ✅ Block force pushes
- ✅ Restrict deletions

**Who can push:**
- Contributors can create PRs targeting this branch
- Only maintainer can merge PRs

---

## 📝 Step-by-Step Configuration

### Configuring Branch Protection on GitHub

1. **Navigate to Settings**
   - Go to your repository on GitHub
   - Click **Settings** (top right)
   - Click **Branches** (left sidebar under "Code and automation")

2. **Add Branch Protection Rule for `main`**
   - Click **Add branch protection rule**
   - Branch name pattern: `main`
   - Configure settings as described above
   - Click **Create** or **Save changes**

3. **Add Branch Protection Rule for `dev`**
   - Click **Add branch protection rule**
   - Branch name pattern: `dev`
   - Configure settings as described above
   - Click **Create** or **Save changes**

4. **Add Branch Protection Rule for `contributors`**
   - Click **Add branch protection rule**
   - Branch name pattern: `contributors`
   - Configure settings as described above
   - Click **Create** or **Save changes**

---

## ⚙️ Status Checks Setup

For the status checks to work, you need GitHub Actions workflows configured. See the CI/CD workflow in `.github/workflows/ci.yml`.

The workflow must define these jobs:
- `test` - Runs `pnpm test`
- `build` - Runs `pnpm build`
- `typecheck` - Runs `pnpm typecheck`
- `lint` - Runs `pnpm lint`

Once the workflow runs successfully at least once, these checks will appear in the "Require status checks to pass" dropdown.

---

## 🔄 Workflow for Maintainer

### Merging Contributor PRs

1. **Review PR** targeting `contributors`
2. **Automated checks** run (tests, build, typecheck, lint)
3. **Review code** and request changes if needed
4. **Approve and merge** to `contributors`
5. **Test integration** on `contributors` branch
6. **Create PR** from `contributors` → `dev`
7. **Merge** to `dev` after testing
8. When ready for release, **create PR** from `dev` → `main`
9. **Merge** to `main` and tag release

### Emergency Hotfixes

For critical production fixes:

1. Create branch from `main`: `hotfix/critical-bug`
2. Fix the issue
3. Create PR to `main` (bypass dev/contributors)
4. After merging to `main`, backport to `dev` and `contributors`

---

## 🔐 Additional Security Recommendations

### CODEOWNERS File

A `.github/CODEOWNERS` file has been created to automatically request reviews and protect critical files.

**Key protections:**
- `.github/workflows/` - Only maintainer can modify CI/CD workflows (security critical)
- `package.json`, `tsconfig.json`, `vitest.config.ts` - Core configuration files
- `src/domain/` - Domain layer requires extra scrutiny
- `src/infrastructure/` - Infrastructure changes need approval

**To enable CODEOWNERS protection:**
1. Go to repository Settings → Branches → Edit rule for `contributors`
2. Enable: **"Require review from Code Owners"**
3. This will automatically block PRs modifying protected files without your approval

**Important:** With CODEOWNERS enabled, contributors **cannot** modify `.github/workflows/` even if they try.

### Required Signed Commits

To require signed commits (recommended for `main`):

1. Enable "Require signed commits" in branch protection
2. Contributors must set up GPG signing:
   ```bash
   git config --global commit.gpgsign true
   git config --global user.signingkey YOUR_GPG_KEY_ID
   ```

### Repository Rulesets (Alternative)

GitHub now offers "Rulesets" as an alternative to branch protection rules:
- More flexible and powerful
- Can target multiple branches with patterns
- Located in Settings → Rules → Rulesets

Consider migrating to Rulesets for more advanced control.

---

## 📊 Quick Reference Table

| Branch | PRs Allowed From | Merges To | Required Checks | Approvals | Force Push | Direct Push |
|--------|------------------|-----------|-----------------|-----------|------------|-------------|
| `main` | `dev` only | - | test, build, typecheck, lint | 1 | ❌ | ❌ |
| `dev` | `contributors`, hotfixes | `main` | test, build, typecheck | 1 | ❌ | ❌ (maintainer only) |
| `contributors` | `feature/*`, `fix/*` | `dev` | test, build, typecheck, lint | 1 | ❌ | ❌ (via PR only) |

---

## 🚨 Troubleshooting

### Status Checks Not Showing Up

**Problem:** Required status checks don't appear in the dropdown

**Solution:**
1. Ensure GitHub Actions workflow has run at least once
2. Check that workflow job names match exactly (case-sensitive)
3. Verify workflow triggers on `pull_request` events for the target branch

### Can't Merge PR Due to Status Checks

**Problem:** Required status checks are failing

**Solution:**
1. Check the Actions tab to see which check failed
2. Fix the issue locally and push again
3. Ensure `pnpm test`, `pnpm build`, `pnpm typecheck` all pass locally

### Accidentally Pushed to Protected Branch

**Problem:** Tried to push directly to protected branch

**Solution:**
1. Create a feature branch from your commit
2. Create a PR targeting the correct branch
3. Protected branches will reject direct pushes (this is working as intended)

---

## 📚 References

- [GitHub Branch Protection Documentation](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)
- [GitHub Rulesets Documentation](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/about-rulesets)
- [Required Status Checks](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches#require-status-checks-before-merging)
- [Signed Commits](https://docs.github.com/en/authentication/managing-commit-signature-verification/about-commit-signature-verification)

---

**Last Updated:** 2025-01-22
