import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { getCommandContext } from '../utils/command-context.js';
import { commandText } from '../utils/messages.js';
import {
  getCurrentBranch,
  checkout,
  mergeBranch,
  branchExists,
  hasUncommittedChanges,
  getFeatureWorktrees
} from '../utils/git.js';

export async function mergeCommand(feature) {
  let config;
  let gitRoot;
  let featuresDir;
  try {
    ({ gitRoot, config, featuresDir } = getCommandContext());
  } catch (error) {
    console.error(chalk.red(error.message));
    process.exit(1);
  }

  // Check if feature branch exists
  if (!branchExists(feature, gitRoot)) {
    console.error(chalk.red(`Branch '${feature}' does not exist.`));
    process.exit(1);
  }

  // Check for uncommitted changes in main worktree
  if (hasUncommittedChanges(gitRoot)) {
    console.error(chalk.red('Main worktree has uncommitted changes. Please commit or stash them first.'));
    process.exit(1);
  }

  // Check for uncommitted changes in feature worktree
  const featureWorktrees = getFeatureWorktrees(featuresDir, gitRoot);
  const featureWorktree = featureWorktrees.find(wt => wt.branch === feature);

  if (featureWorktree && hasUncommittedChanges(featureWorktree.path)) {
    console.error(chalk.red(`Feature worktree '${feature}' has uncommitted changes.`));
    console.error(chalk.dim('Please commit changes in the worktree before merging.'));
    process.exit(1);
  }

  const currentBranch = getCurrentBranch(gitRoot);

  // Checkout main if not already on it
  if (currentBranch !== config.mainBranch) {
    const checkoutSpinner = ora(`Checking out ${chalk.cyan(config.mainBranch)}`).start();
    try {
      checkout(config.mainBranch, gitRoot);
      checkoutSpinner.succeed(`Checked out ${chalk.cyan(config.mainBranch)}`);
    } catch (error) {
      checkoutSpinner.fail(`Failed to checkout ${config.mainBranch}: ${error.message}`);
      process.exit(1);
    }
  }

  // Merge the feature branch
  const mergeSpinner = ora(`Merging ${chalk.cyan(feature)} into ${chalk.cyan(config.mainBranch)}`).start();
  try {
    mergeBranch(feature, gitRoot);
    mergeSpinner.succeed(`Merged ${chalk.cyan(feature)} into ${chalk.cyan(config.mainBranch)}`);
  } catch (error) {
    mergeSpinner.fail(`Merge failed: ${error.message}`);
    console.log(chalk.yellow('\nResolve conflicts manually, then commit the merge.'));
    process.exit(1);
  }

  console.log(chalk.green('\nMerge successful!'));

  // Offer to cleanup
  if (featureWorktree) {
    const { cleanup } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'cleanup',
        message: `Remove worktree and delete branch '${feature}'?`,
        default: false
      }
    ]);

    if (cleanup) {
      console.log(chalk.dim(`\nRun: ${commandText(`cleanup ${feature} -d`)}`));
    }
  }
}
