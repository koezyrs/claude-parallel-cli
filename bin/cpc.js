#!/usr/bin/env node

import { program } from 'commander';
import { initCommand } from '../src/commands/init.js';
import { createCommand } from '../src/commands/create.js';
import { listCommand } from '../src/commands/list.js';
import { startCommand } from '../src/commands/start.js';
import { reviewCommand } from '../src/commands/review.js';
import { mergeCommand } from '../src/commands/merge.js';
import { cleanupCommand } from '../src/commands/cleanup.js';
import { statusCommand } from '../src/commands/status.js';

program
  .name('cpc')
  .description('CLI tool to automate parallel AI coding assistant workflows using git worktrees')
  .version('1.0.0');

program
  .command('init')
  .description('Initialize config file in current project')
  .action(initCommand);

program
  .command('create <features...>')
  .description('Create worktrees for one or more features')
  .action(createCommand);

program
  .command('list')
  .description('List all active worktrees')
  .action(listCommand);

program
  .command('start [features...]')
  .description('Open terminal(s) with your configured assistant in worktree(s)')
  .action(startCommand);

program
  .command('review [features...]')
  .description('Checkout temp branch to review feature before merge')
  .option('-b, --back', 'Return to main branch and delete temp branches')
  .action(reviewCommand);

program
  .command('merge <feature>')
  .description('Merge a feature branch back to main')
  .action(mergeCommand);

program
  .command('cleanup [features...]')
  .description('Remove worktrees and optionally delete branches')
  .option('-a, --all', 'Remove all feature worktrees')
  .option('-d, --delete-branch', 'Also delete the feature branches')
  .action(cleanupCommand);

program
  .command('status')
  .description('Show status of all feature worktrees')
  .action(statusCommand);

program.parse();
