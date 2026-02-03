import chalk from 'chalk';
import { loadConfig, getFeaturesDir, findGitRoot } from '../utils/config.js';
import {
  getFeatureWorktrees,
  getCommitCount,
  getChangedFiles,
  hasUncommittedChanges,
  getCurrentBranch
} from '../utils/git.js';

export async function statusCommand() {
  const gitRoot = findGitRoot();

  if (!gitRoot) {
    console.error(chalk.red('Error: Not in a git repository'));
    process.exit(1);
  }

  let config;
  try {
    config = loadConfig();
  } catch (error) {
    console.error(chalk.red(error.message));
    process.exit(1);
  }

  // Show main worktree status
  const mainBranch = getCurrentBranch(gitRoot);
  const mainHasChanges = hasUncommittedChanges(gitRoot);

  console.log(chalk.bold('Main Worktree:'));
  console.log(`  Branch: ${chalk.cyan(mainBranch)}`);
  console.log(`  Status: ${mainHasChanges ? chalk.yellow('uncommitted changes') : chalk.green('clean')}`);
  console.log('');

  const featuresDir = getFeaturesDir(config);
  const featureWorktrees = getFeatureWorktrees(featuresDir, gitRoot);

  if (featureWorktrees.length === 0) {
    console.log(chalk.yellow('No feature worktrees found.'));
    console.log(chalk.dim('\nCreate one with: cpw create <feature-name>'));
    return;
  }

  console.log(chalk.bold('Feature Worktrees:\n'));

  for (const wt of featureWorktrees) {
    const branchName = wt.branch || '(detached)';
    const wtHasChanges = hasUncommittedChanges(wt.path);

    // Get comparison with main
    let commitCount = 0;
    let changedFiles = [];

    if (wt.branch) {
      commitCount = getCommitCount(config.mainBranch, wt.branch, gitRoot);
      changedFiles = getChangedFiles(config.mainBranch, wt.branch, gitRoot);
    }

    // Status indicator
    let statusIcon;
    let statusText;

    if (wtHasChanges) {
      statusIcon = chalk.yellow('●');
      statusText = chalk.yellow('uncommitted changes');
    } else if (commitCount > 0) {
      statusIcon = chalk.blue('●');
      statusText = chalk.blue(`${commitCount} commit(s) ahead`);
    } else {
      statusIcon = chalk.green('●');
      statusText = chalk.green('up to date');
    }

    console.log(`  ${statusIcon} ${chalk.cyan(branchName)}`);
    console.log(`    Path: ${chalk.dim(wt.path)}`);
    console.log(`    Status: ${statusText}`);

    if (changedFiles.length > 0) {
      console.log(`    Changed files: ${chalk.dim(changedFiles.length)}`);
    }

    console.log('');
  }

  // Summary
  console.log(chalk.dim(`Total: ${featureWorktrees.length} feature worktree(s)`));

  // Show helpful commands
  const worktreesWithChanges = featureWorktrees.filter(wt => {
    const commitCount = wt.branch ? getCommitCount(config.mainBranch, wt.branch, gitRoot) : 0;
    return commitCount > 0;
  });

  if (worktreesWithChanges.length > 0) {
    console.log(chalk.cyan('\nReady to review/merge:'));
    worktreesWithChanges.forEach(wt => {
      console.log(chalk.dim(`  cpw review ${wt.branch}`));
      console.log(chalk.dim(`  cpw merge ${wt.branch}`));
    });
  }
}
