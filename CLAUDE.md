# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Claude Parallel CLI (`cpw`) is a Node.js CLI tool that automates parallel Claude Code workflows using Git worktrees. It enables running multiple Claude agents simultaneously on different features in isolated environments.

## Commands

```bash
# Install dependencies and link for local development
npm install
npm link

# Run commands after linking
cpw <command>
```

No tests are currently configured (`npm test` will exit with error).

## Architecture

```
bin/cpw.js                    # CLI entry point (commander-based)
    ↓
src/commands/*.js             # Command handlers
    ├── init.js               # Create .cpw.json config
    ├── create.js             # Create git worktrees
    ├── list.js               # List worktrees
    ├── start.js              # Launch Claude in terminals
    ├── review.js             # Create temp branches for review
    ├── merge.js              # Merge feature branches
    ├── cleanup.js            # Remove worktrees
    └── status.js             # Show worktree status
    ↓
src/utils/*.js                # Shared utilities
    ├── config.js             # Config loading, git root detection
    ├── git.js                # Git operations via execSync
    ├── terminal.js           # Cross-platform terminal spawning
    └── claude.js             # Copy .claude config to worktrees
```

### Key Design Patterns

- **ES Modules**: All files use `import`/`export` syntax
- **Config-first**: `.cpw.json` created by `init`, loaded by other commands
- **Git worktree abstraction**: `utils/git.js` wraps all git operations
- **Cross-platform terminal support**: `utils/terminal.js` detects platform and available terminals (Windows Terminal, Tabby, CMD, iTerm2, etc.)
- **User feedback**: `ora` spinners for async operations, `chalk` for colored output, `inquirer` for prompts

### Data Flow

1. User runs `cpw <command>` via bin/cpw.js
2. Commander routes to appropriate command handler in src/commands/
3. Command loads config from `.cpw.json` via utils/config.js
4. Git operations performed via utils/git.js (execSync)
5. Terminal launching via utils/terminal.js (spawn detached)
6. Output formatted with chalk + ora spinners

### Configuration

`.cpw.json` stores project settings:
- `featuresDir`: Where worktrees are created (relative path)
- `mainBranch`: Branch to base features from
- `copyClaudeConfig`: Whether to copy .claude folder to worktrees
- `terminal`: Terminal preference (auto/wt/cmd/tabby/powershell)

Config is discovered by searching up directory tree from cwd.
