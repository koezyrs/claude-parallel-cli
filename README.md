# Code Parallel CLI (`cpc`)

A CLI tool to automate parallel AI coding assistant workflows using git worktrees. Run multiple assistants (Claude or Codex) simultaneously on different features in isolated environments.

## Why?

When working with AI coding assistants on larger projects, you often want to work on multiple features in parallel. Git worktrees allow you to have multiple working directories from the same repository, each on a different branch. This tool automates the workflow of creating, managing, and merging these parallel workstreams.

## Installation

```bash
npm install -g code-parallel-cli
```

Or clone and link locally:

```bash
git clone https://github.com/koezyrs/code-parallel-cli.git
cd code-parallel-cli
npm install
npm link
```

## Quick Start

```bash
# Initialize in your project
cd your-project
cpc init

# Create worktrees for features
cpc create auth-system new-dashboard api-refactor

# Start your configured assistant in all worktrees (opens terminal tabs)
cpc start

# Check status of all features
cpc status

# Review a feature before merging
cpc review auth-system

# Merge completed feature
cpc merge auth-system

# Cleanup
cpc cleanup auth-system
```

## Commands

| Command | Description |
|---------|-------------|
| `cpc init` | Initialize config file in current project |
| `cpc create <feature...>` | Create worktrees for one or more features |
| `cpc list` | List all active worktrees |
| `cpc start [feature...]` | Open terminal(s) with your configured assistant in worktree(s) |
| `cpc review [feature...]` | Checkout temp branch to review feature before merge |
| `cpc review --back` | Return to main branch after reviewing |
| `cpc merge <feature>` | Merge a feature branch back to main |
| `cpc cleanup [feature...]` | Remove worktrees and optionally delete branches |
| `cpc cleanup --all` | Remove all feature worktrees |
| `cpc status` | Show status of all feature worktrees |

## Configuration

Running `cpc init` creates a `.cpc.json` file in your project root:

```json
{
  "featuresDir": "../dev-worktrees",
  "mainBranch": "main",
  "agent": "claude",
  "copyConfig": {
    "claude": true,
    "codex": true
  },
  "terminal": "auto"
}
```

`copyClaudeConfig` is no longer supported. Re-run `cpc init` to migrate older configs.

| Option | Description | Default |
|--------|-------------|---------|
| `featuresDir` | Directory where worktrees are created (relative to project) | `../dev-worktrees` |
| `mainBranch` | Branch to create features from | `main` |
| `agent` | Assistant command to start: `claude` or `codex` | `claude` |
| `copyConfig.claude` | Copy `.claude/` folder to new worktrees | `true` |
| `copyConfig.codex` | Copy `.codex/` folder to new worktrees | `true` |
| `terminal` | Terminal to use: `auto`, `wt`, `cmd`, `tabby`, `powershell` | `auto` |

### Windows long-path troubleshooting

When running `cpc create` on Windows, `cpc` automatically runs `git config core.longpaths true` in the current repository before creating worktrees.

If you still get errors like `Filename too long`, Windows OS policy may still block long paths. Enable **Win32 long paths** in Windows, and/or use a shorter `featuresDir` value in `.cpc.json` (for example `../wt`).

## Workflow Example

```bash
# 1. Start a new project session
cd my-project
cpc init

# 2. Create worktrees for three parallel features
cpc create user-auth payment-system admin-dashboard

# 3. Open your configured assistant in all three (opens 3 terminal tabs)
cpc start

# 4. Work with the assistant in each terminal on different features...

# 5. Check progress
cpc status

# 6. Review the auth feature in your main editor
cpc review user-auth
# Browse the code, then return to main
cpc review --back

# 7. Merge completed features
cpc merge user-auth
cpc merge payment-system

# 8. Cleanup
cpc cleanup --all -d
```

## Platform Support

- **Windows**: Windows Terminal (preferred), CMD, PowerShell, Tabby
- **macOS**: iTerm2, Terminal.app
- **Linux**: gnome-terminal, konsole, xfce4-terminal, xterm

## Requirements

- Node.js >= 18
- Git
- Claude Code CLI (`claude`) or Codex CLI (`codex`) based on your `agent` setting

## License

MIT
