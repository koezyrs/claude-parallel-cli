# Repository Guidelines

## Project Structure & Module Organization
`cpw` is a Node.js CLI with a thin entrypoint and command modules. `bin/cpw.js` defines the Commander interface and routes to handlers in `src/commands/` (`init`, `create`, `start`, `review`, `merge`, `cleanup`, `status`, `list`). Shared logic lives in `src/utils/` (config discovery, git wrappers, terminal launching, Claude config copy). `src/constants.js` holds shared constants. Keep feature logic in commands and reusable logic in utils. There is currently no `test/` directory.

## Build, Test, and Development Commands
- `npm install`: install dependencies.
- `npm link`: expose local `cpw` and `claude-parallel` commands for development.
- `cpw --help`: confirm CLI wiring and command registration.
- `cpw init`: create `.cpw.json` in a target repo.
- `npm test`: placeholder script that exits with an error (no automated test suite configured yet).

## Coding Style & Naming Conventions
Use ES Modules only (`import`/`export`) and keep files as `.js`. Follow existing style: 2-space indentation, semicolons, single quotes, and small focused functions. Name command files by action (`create.js`, `merge.js`) and exported handlers as `<name>Command` (for example, `createCommand`). Name utilities with verb-first functions (`loadConfig`, `createWorktree`, `getFeatureWorktrees`). Prefer explicit error messages for CLI users.

## Agent Workflow (Serena MCP)
Use Serena MCP Server to optimize context and reduce broad file scans. Prefer symbol-aware operations (`get_symbols_overview`, `find_symbol`, `find_referencing_symbols`) before raw text searches. Read only files needed for the current change, and use targeted edits over large rewrites. Use shell commands for validation and CLI behavior checks, but rely on Serena MCP as the primary code navigation path.

## MCP Tool Permissions
Codex is explicitly allowed to use all available Serena MCP tools and all available Unity MCP tools for this repository when needed to complete tasks.

## Testing Guidelines
Automated tests are not configured today, so validate changes manually in a disposable git repo. At minimum, exercise changed flows with command-level checks (for example: `cpw init`, `cpw create feature-a`, `cpw list`, `cpw status`). If you introduce a test framework later, add tests under `test/` and mirror source naming for traceability.

## Commit & Pull Request Guidelines
Use concise imperative commit messages, consistent with history (for example, `Fix Tabby command execution on Windows`, `Add README with documentation`). Keep each commit focused. PRs should include: purpose, scope, validation commands run, and representative CLI output for behavior changes. Link related issues when available.

## Configuration & Safety Notes
Primary runtime config is `.cpw.json` (`featuresDir`, `mainBranch`, `copyClaudeConfig`, `terminal`). Prefer safe git operations in development and avoid destructive cleanup in shared repositories unless explicitly intended.
