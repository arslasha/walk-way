---
trigger: always_on
---

# Directive 02: Version Control & Git Workflow

**Trigger:** You MUST strictly follow this protocol for all version control operations, code saving, branch management, and repository interactions.

## 1. Tooling (GitHub MCP)
- **Always Use GitHub MCP:** You must use the configured GitHub MCP server for committing, branching, and pushing code. 
- Do not run raw `git` commands in the terminal unless the MCP server is unavailable or fails.

## 2. The "Pause & Ask" Rule (CRITICAL)
- **NEVER create a commit automatically without explicit user approval.**
- Whenever you complete a logical unit of work, finish a task, or reach a stable state worthy of a commit, you MUST STOP execution and do the following:
  1. Provide a brief, clear summary of the files modified and the logic implemented.
  2. Propose a Conventional Commit message (e.g., `feat: setup django models with postgis`).
  3. Explicitly ask the user: *"Shall I commit these changes? (Yes/No or provide adjustments)"*.
- You may only execute the commit via GitHub MCP **AFTER** the user has given a clear affirmative response.

## 3. Branching Strategy
- **`main` / `master` is Protected:** NEVER commit directly to the main branch.
- **Feature-Based Branching:** Create a specific branch for every task.
- **Naming Convention:** Use the format `type/phaseX-short-description`.
  - *Examples:* `feat/phase1-kudago-parser`, `fix/phase1-models`, `docs/design-system-update`.

## 4. Atomic Commits & Messaging
- **Atomic Changes:** Commits must be small, atomic, and contain one logical change. Do not group backend database changes and frontend UI changes into a single commit.
- **Conventional Commits:** Strictly use the following format: `type(scope): message`.
  - `feat:` (new feature)
  - `fix:` (bug fix)
  - `chore:` (maintenance/deps)
  - `refactor:` (code restructure)
  - `docs:` (documentation like DESIGN.md)
- If a commit is complex, use the GitHub MCP to add a detailed body to the commit message explaining *why* the change was made.

## 5. Pre-Commit Project Checks (Safety Protocol)
Before proposing a commit to the user, ensure the following project-specific rules are met:
1. **Clean Tracking:** Verify that `.env` files, `__pycache__/`, local SQLite databases (`db.sqlite3`), and `node_modules/` are NOT staged for commit. Ensure `.gitignore` handles them.
2. **Migration Discipline (Django):** If you modified `models.py`, you MUST generate the migration files (`python manage.py makemigrations`) inside the Docker container BEFORE asking to commit. The generated `migrations/000X...py` files must be included in the same commit.
3. **DESIGN.md Sync (Frontend):** If UI or Tailwind classes were changed, ensure `DESIGN.md` is updated and included in the commit.
4. **Sync Before Build:** Before starting new work, check the recent commit history or fetch the latest changes to avoid duplicating logic or causing merge conflicts.