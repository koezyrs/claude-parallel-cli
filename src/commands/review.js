import chalk from 'chalk';
import ora from 'ora';
import { getCommandContext } from '../utils/command-context.js';
import { commandText } from '../utils/messages.js';
import {
  getFeatureWorktrees,
  getCurrentBranch,
  checkout,
  checkoutNewBranch,
  deleteBranch,
  branchExists,
  getCommitCount,
  getChangedFiles,
  getShortLog
} from '../utils/git.js';

export async function reviewCommand(features, options) {
  let config;
  let gitRoot;
  let featuresDir;
  try {
    ({ gitRoot, config, featuresDir } = getCommandContext());
  } catch (error) {
    console.error(chalk.red(error.message));
    process.exit(1);
  }

  // Handle --back option
  if (options.back) {
    return returnToMain(gitRoot, config);
  }

  const featureWorktrees = getFeatureWorktrees(featuresDir, gitRoot);

  if (featureWorktrees.length === 0) {
    console.log(chalk.yellow('No feature worktrees found.'));
    return;
  }

  // Determine which features to review
  let featuresToReview = [];
  if (features && features.length > 0) {
    featuresToReview = features;
  } else {
    // Review all features if none specified
    featuresToReview = featureWorktrees.map(wt => wt.branch);
  }

  if (featuresToReview.length === 0) {
    console.log(chalk.yellow('No features specified for review.'));
    return;
  }

  // Check for valid feature branches
  const validFeatures = featuresToReview.filter(feature => {
    const exists = branchExists(feature, gitRoot);
    if (!exists) {
      console.log(chalk.yellow(`Branch '${feature}' does not exist, skipping.`));
    }
    return exists;
  });

  if (validFeatures.length === 0) {
    console.log(chalk.red('No valid feature branches found.'));
    return;
  }

  console.log(chalk.bold(`Reviewing ${validFeatures.length} feature(s)...\n`));

  for (const feature of validFeatures) {
    const tempBranch = `temp/${feature}`;
    const spinner = ora(`Creating review branch ${chalk.cyan(tempBranch)}`).start();

    try {
      // Create temp branch pointing to the feature branch
      checkoutNewBranch(tempBranch, feature, gitRoot);
      spinner.succeed(`Checked out ${chalk.cyan(tempBranch)}`);

      // Show summary info
      const commitCount = getCommitCount(config.mainBranch, feature, gitRoot);
      const changedFiles = getChangedFiles(config.mainBranch, feature, gitRoot);

      console.log(chalk.dim(`  Commits ahead of ${config.mainBranch}: ${commitCount}`));
      console.log(chalk.dim(`  Changed files: ${changedFiles.length}`));

      if (changedFiles.length > 0 && changedFiles.length <= 10) {
        console.log(chalk.dim('  Files:'));
        changedFiles.forEach(f => console.log(chalk.dim(`    - ${f}`)));
      } else if (changedFiles.length > 10) {
        console.log(chalk.dim(`  Files (first 10 of ${changedFiles.length}):`));
        changedFiles.slice(0, 10).forEach(f => console.log(chalk.dim(`    - ${f}`)));
      }

      // Show commit log
      if (commitCount > 0) {
        const log = getShortLog(config.mainBranch, feature, gitRoot);
        if (log) {
          console.log(chalk.dim('  Recent commits:'));
          log.split('\n').slice(0, 5).forEach(line => {
            console.log(chalk.dim(`    ${line}`));
          });
        }
      }

      console.log('');
    } catch (error) {
      spinner.fail(`Failed to review ${feature}: ${error.message}`);
    }
  }

  console.log(chalk.cyan('Review the changes in your editor, then run:'));
  console.log(chalk.dim(`  ${commandText('review --back')}    # Return to main branch`));
  console.log(chalk.dim(`  ${commandText('merge <feature>')}  # Merge a feature to main`));
}

async function returnToMain(gitRoot, config) {
  const currentBranch = getCurrentBranch(gitRoot);
  const spinner = ora(`Returning to ${chalk.cyan(config.mainBranch)}`).start();

  try {
    // Checkout main branch
    checkout(config.mainBranch, gitRoot);
    spinner.succeed(`Checked out ${chalk.cyan(config.mainBranch)}`);

    // Delete temp branches
    if (currentBranch.startsWith('temp/')) {
      const tempSpinner = ora(`Deleting temp branch ${chalk.cyan(currentBranch)}`).start();
      try {
        deleteBranch(currentBranch, true, gitRoot);
        tempSpinner.succeed(`Deleted ${chalk.cyan(currentBranch)}`);
      } catch (error) {
        tempSpinner.warn(`Could not delete ${currentBranch}: ${error.message}`);
      }
    }

    console.log(chalk.green('\nReturned to main branch.'));
  } catch (error) {
    spinner.fail(`Failed to return to main: ${error.message}`);
  }
}
