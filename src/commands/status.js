import chalk from 'chalk';
import { getCommandContext } from '../utils/command-context.js';
import { commandText } from '../utils/messages.js';
import {
  getFeatureWorktrees,
  getCommitCount,
  getChangedFiles,
  hasUncommittedChanges,
  getCurrentBranch
} from '../utils/git.js';

export async function statusCommand() {
  let config;
  let gitRoot;
  let featuresDir;
  try {
    ({ gitRoot, config, featuresDir } = getCommandContext());
  } catch (error) {
    console.error(chalk.red(error.message));
    process.exit(1);
  }

  const mainBranch = getCurrentBranch(gitRoot);
  const mainHasChanges = hasUncommittedChanges(gitRoot);

  console.log(chalk.bold('Main Worktree:'));
  console.log(`  Branch: ${chalk.cyan(mainBranch)}`);
  console.log(`  Status: ${mainHasChanges ? chalk.yellow('uncommitted changes') : chalk.green('clean')}`);
  console.log('');

  const featureWorktrees = getFeatureWorktrees(featuresDir, gitRoot);

  if (featureWorktrees.length === 0) {
    console.log(chalk.yellow('No feature worktrees found.'));
    console.log(chalk.dim(`\nCreate one with: ${commandText('create <feature-name>')}`));
    return;
  }

  console.log(chalk.bold('Feature Worktrees:\n'));

  for (const wt of featureWorktrees) {
    const branchName = wt.branch || '(detached)';
    const wtHasChanges = hasUncommittedChanges(wt.path);

    let commitCount = 0;
    let changedFiles = [];

    if (wt.branch) {
      commitCount = getCommitCount(config.mainBranch, wt.branch, gitRoot);
      changedFiles = getChangedFiles(config.mainBranch, wt.branch, gitRoot);
    }

    let statusIcon;
    let statusText;

    if (wtHasChanges) {
      statusIcon = chalk.yellow('*');
      statusText = chalk.yellow('uncommitted changes');
    } else if (commitCount > 0) {
      statusIcon = chalk.blue('*');
      statusText = chalk.blue(`${commitCount} commit(s) ahead`);
    } else {
      statusIcon = chalk.green('*');
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

  console.log(chalk.dim(`Total: ${featureWorktrees.length} feature worktree(s)`));

  const worktreesWithChanges = featureWorktrees.filter(wt => {
    const commitCount = wt.branch ? getCommitCount(config.mainBranch, wt.branch, gitRoot) : 0;
    return commitCount > 0;
  });

  if (worktreesWithChanges.length > 0) {
    console.log(chalk.cyan('\nReady to review/merge:'));
    worktreesWithChanges.forEach(wt => {
      console.log(chalk.dim(`  ${commandText(`review ${wt.branch}`)}`));
      console.log(chalk.dim(`  ${commandText(`merge ${wt.branch}`)}`));
    });
  }
}
