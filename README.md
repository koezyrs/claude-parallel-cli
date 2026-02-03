# Claude Parallel CLI (cpw)

A CLI tool to automate parallel Claude Code workflows using git worktrees. Run multiple Claude agents simultaneously on different features in isolated environments.

## Why?

When working with Claude Code on larger projects, you often want to work on multiple features in parallel. Git worktrees allow you to have multiple working directories from the same repository, each on a different branch. This tool automates the workflow of creating, managing, and merging these parallel workstreams.

## Installation

```bash
npm install -g claude-parallel-cli
```

Or clone and link locally:

```bash
git clone https://github.com/koezyrs/claude-parallel-cli.git
cd claude-parallel-cli
npm install
npm link
```

## Quick Start

```bash
# Initialize in your project
cd your-project
cpw init

# Create worktrees for features
cpw create auth-system new-dashboard api-refactor

# Start Claude in all worktrees (opens terminal tabs)
cpw start

# Check status of all features
cpw status

# Review a feature before merging
cpw review auth-system

# Merge completed feature
cpw merge auth-system

# Cleanup
cpw cleanup auth-system
```

## Commands

| Command | Description |
|---------|-------------|
| `cpw init` | Initialize config file in current project |
| `cpw create <feature...>` | Create worktrees for one or more features |
| `cpw list` | List all active worktrees |
| `cpw start [feature...]` | Open terminal(s) with Claude in worktree(s) |
| `cpw review [feature...]` | Checkout temp branch to review feature before merge |
| `cpw review --back` | Return to main branch after reviewing |
| `cpw merge <feature>` | Merge a feature branch back to main |
| `cpw cleanup [feature...]` | Remove worktrees and optionally delete branches |
| `cpw cleanup --all` | Remove all feature worktrees |
| `cpw status` | Show status of all feature worktrees |

## Configuration

Running `cpw init` creates a `.cpw.json` file in your project root:

```json
{
  "featuresDir": "../project-features",
  "mainBranch": "main",
  "copyClaudeConfig": true,
  "terminal": "auto"
}
```

| Option | Description | Default |
|--------|-------------|---------|
| `featuresDir` | Directory where worktrees are created (relative to project) | `../project-features` |
| `mainBranch` | Branch to create features from | `main` |
| `copyClaudeConfig` | Copy `.claude/` folder to new worktrees | `true` |
| `terminal` | Terminal to use: `auto`, `wt`, `cmd`, `tabby`, `powershell` | `auto` |

## Workflow Example

```bash
# 1. Start a new project session
cd my-project
cpw init

# 2. Create worktrees for three parallel features
cpw create user-auth payment-system admin-dashboard

# 3. Open Claude in all three (opens 3 terminal tabs)
cpw start

# 4. Work with Claude in each terminal on different features...

# 5. Check progress
cpw status

# 6. Review the auth feature in your main editor
cpw review user-auth
# Browse the code, then return to main
cpw review --back

# 7. Merge completed features
cpw merge user-auth
cpw merge payment-system

# 8. Cleanup
cpw cleanup --all -d
```

## Platform Support

- **Windows**: Windows Terminal (preferred), CMD, PowerShell, Tabby
- **macOS**: iTerm2, Terminal.app
- **Linux**: gnome-terminal, konsole, xfce4-terminal, xterm

## Requirements

- Node.js >= 18
- Git
- Claude Code CLI (`claude`)

## License

MIT
