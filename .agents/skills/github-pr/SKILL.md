---
name: github-pr
description: Create GitHub branches, direct pushes, and pull requests for OurArchive. Use when the user asks to create a branch, push, create, open, make, prepare, promote, or generate pull requests for this workspace. Supports feature-to-development delivery, development-to-staging promotion, and staging-to-main release flows.
---

# OurArchive GitHub Delivery Skill

Use this repository-local skill to manage branches, pushes, and pull requests for the `OurArchive` repository.

---

## 1. Allowed Delivery Flows

Only three standardized delivery flows are permitted in `OurArchive`:

### Flow 1: Feature / Documentation Work to `development`
- **Head Branch**: `<type>/<changes>` or `docs/<type>-<scope>` (e.g. `feat/drive-upload`, `fix/preview-modal`, `docs/feat-skills-cicd`).
- **Base Branch**: `development`.
- **Branch Off Rule**: Always branch off the latest `development` branch.
- **Workflow**:
  1. Create the feature branch from `development`.
  2. Implement, test, and commit changes using Conventional Commits with `[OA-M#-F#]`.
  3. Open a Pull Request targeting `--base development`.

### Flow 2: Promotion from `development` to `staging`
- **Head Branch**: `development`.
- **Base Branch**: `staging`.
- Do not create a separate feature branch for promotion; open the PR comparing remote `development` into `staging`.

### Flow 3: Release from `staging` to `main`
- **Head Branch**: `staging`.
- **Base Branch**: `main`.
- Open the PR comparing remote `staging` into `main` after staging validation passes.

---

## 2. Preflight Checklist

Before creating branches, pushing, or opening a PR:

1. **Verify GitHub CLI Availability**:
   ```powershell
   gh --version
   ```
   If missing or not on PATH, check standard installation paths:
   ```powershell
   & "C:\Program Files\GitHub CLI\gh.exe" --version
   ```
2. **Verify Authentication**:
   ```powershell
   gh auth status -h github.com
   ```
   If unauthenticated, alert the user to run `gh auth login`. Never expose or print secret tokens.
3. **Verify Git State**:
   ```powershell
   git status --short --branch
   git branch --show-current
   ```
4. **Verify Remote Branches**:
   ```powershell
   git ls-remote --heads origin development
   git ls-remote --heads origin staging
   git ls-remote --heads origin main
   ```
   Ensure the target base branch exists on the remote before initiating a PR.

---

## 3. Pull Request Title & Description Template

### PR Title Format
```text
<type>(<scope>): <concise description in past-tense> [OA-M#-F#]
```
Example: `docs(skills): configure git-commits and github-pr delivery skills [OA-M0-F0]`

### PR Description Template
```markdown
## Summary
- <Bullet 1 describing the core change>
- <Bullet 2 describing secondary additions or fixes>

## Related Backlog Items
- **Backlog Code**: `[OA-M#-F#]`
- **Module Specification**: `docs/backlogs/module-#-.../README.md`

## Emergency & Safety Compliance
- [x] Strict **Read-Only / Zero-Download** principle maintained (no file storage).
- [x] Relative file paths strictly observed across all references.
- [x] Community disclaimer and immediate takedown policy acknowledged.

## Verification Checklist
- [x] Markdown relative links validated.
- [x] No hardcoded absolute local drive paths (`C:\`, `D:\`).
- [x] Changes tested on feature branch before PR submission.
```

---

## 4. Pull Request Creation Commands

### Creating a Feature PR into `development`
```powershell
# Push current feature branch to remote
git push -u origin <branch-name>

# Create the pull request targeting development
gh pr create `
  --base development `
  --head <branch-name> `
  --title "<type>(<scope>): <concise summary> [OA-M#-F#]" `
  --body-file "<path-to-pr-body.md>"
```

---

## 5. Safety & Execution Guardrails
- **No Direct Push to Protected Branches**: Do not push directly to `development` or `main` unless executing designated Phase 0 initialization tasks.
- **UTF-8 Without BOM**: Ensure all PR body files and commit messages are strictly encoded in UTF-8 without BOM.
- **Confirmation Before Execution**: Present the draft PR title, branch, and description to the user and obtain confirmation before executing push or PR creation commands.
