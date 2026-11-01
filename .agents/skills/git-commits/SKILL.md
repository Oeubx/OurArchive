---
name: git-commits
description: Drafts or executes backlog-linked OurArchive commit messages using the canonical OurArchive backlog reference, enforcing development branch offshoots and PR-only merges.
---

# OurArchive Git Commit Skill

Use this skill whenever asked to draft, generate, review, or execute a git commit for the `OurArchive` repository.

---

## 1. Required References & Source of Truth

1. Read `README.md` in the repository root.
2. Read `docs/backlogs/OA_Sprint_Backlogs_Commit_Reference.md`.
3. All commits touching `OurArchive` must link to a valid module feature code using the system prefix **`OA-M#-F#`** (e.g., `[OA-M0-F0]`, `[OA-M2-F1]`, `[OA-M3-F2]`).

---

## 2. Branching & Delivery Rules

1. **Branch Off `development`**:
   - All feature, bugfix, documentation, and chore branches must branch off the active **`development`** branch.
   - Never branch directly off `main` for regular feature work.
2. **Branch Naming Standard**:
   - Use the format `<type>/<changes>` or `docs/<type>-<scope>`.
   - Examples:
     - `feat/drive-upload`
     - `feat/drive-verification`
     - `fix/preview-modal`
     - `docs/feat-skills-cicd`
     - `docs/feat-database`
     - `chore/supabase-setup`
3. **Mandatory Pull Request Workflow**:
   - Direct pushing to `development` or `main` is strictly prohibited for standard features.
   - All changes must be delivered via a Pull Request targeting `development`.
   - Refer to `.agents/skills/github-pr/SKILL.md` for opening and structuring PRs.

---

## 3. Commit Message Grammar

Draft every commit message using Conventional Commits grammar and the specialized OurArchive backlog code:

```text
<type>(<scope>): <concise description in past-tense> [OA-M#-F#]

- <Past-tense change bullet>
- <Past-tense change bullet>
```

### Valid Commit Types
- `feat`: A new feature, page, or user-facing capability (e.g. view-only reader, Drive search).
- `fix`: A bug fix or patch for unexpected behavior.
- `docs`: Documentation updates under `/docs` or README files.
- `refactor`: Code reorganization that neither fixes a bug nor adds a feature.
- `test`: Adding or modifying automated unit/integration tests.
- `chore`: Routine maintenance, updating dependencies, or `.gitignore` tweaks.
- `ci`: Changes to CI/CD workflows (`.github/workflows/*`).
- `perf`: Performance optimizations (e.g. database indexing, caching).
- `style`: Formatting, whitespace, or linting adjustments with no logic changes.
- `revert`: Reverting a previous commit.

### Format Rules
- **Past-Tense Summary**: Use past-tense in bullets and summaries (e.g., "Added...", "Fixed...", "Updated...").
- **Strict Relative Paths**: Always use relative file paths (e.g., `./docs/architecture/system_overview.md`, `./app/viewer/...`). Never use absolute local file paths (`C:\...`).
- **UTF-8 Without BOM**: All markdown and commit files must be strictly encoded as UTF-8 without BOM.
- **Never Commit Secrets**: Never stage `.env`, `.env.local`, API keys, service account JSON files, or private credentials.

---

## 4. Execution Guardrails

- You MUST NOT execute `git commit`, `git push`, or open a pull request automatically unless the user explicitly requested it in the chat.
- Always present the draft message/command and wait for confirmation when acting autonomously.
