import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import fs from 'fs';
import { loadConfig, getFeaturesDir, findProjectRoot } from '../utils/config.js';
import {
  getFeatureWorktrees,
  removeWorktree,
  deleteBranch,
  pruneWorktrees
} from '../utils/git.js';

export async function cleanupCommand(features, options) {
  const projectRoot = findProjectRoot();

  if (!projectRoot) {
    console.error(chalk.red('Error: Not in a git repository'));
    process.exit(1);
  }

  let config;
  try {
    config = loadConfig(projectRoot);
  } catch (error) {
    console.error(chalk.red(error.message));
    process.exit(1);
  }

  const featuresDir = getFeaturesDir(config, projectRoot);
  const featureWorktrees = getFeatureWorktrees(featuresDir, projectRoot);

  if (featureWorktrees.length === 0) {
    console.log(chalk.yellow('No feature worktrees found.'));
    return;
  }

  // Determine which worktrees to clean up
  let worktreesToClean = [];

  if (options.all) {
    // Confirm before removing all
    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: `Remove ALL ${featureWorktrees.length} feature worktree(s)?`,
        default: false
      }
    ]);

    if (!confirm) {
      console.log(chalk.yellow('Cleanup cancelled.'));
      return;
    }

    worktreesToClean = featureWorktrees;
  } else if (features && features.length > 0) {
    worktreesToClean = featureWorktrees.filter(wt =>
      features.some(f => wt.branch === f || wt.path.endsWith(f))
    );

    if (worktreesToClean.length === 0) {
      console.error(chalk.red('No matching worktrees found.'));
      console.log(chalk.dim('\nAvailable worktrees:'));
      featureWorktrees.forEach(wt => {
        console.log(chalk.dim(`  - ${wt.branch}`));
      });
      return;
    }
  } else {
    console.error(chalk.red('Please specify features to clean up or use --all flag.'));
    console.log(chalk.dim('\nUsage:'));
    console.log(chalk.dim('  cpw cleanup <feature>  # Remove specific worktree'));
    console.log(chalk.dim('  cpw cleanup --all      # Remove all worktrees'));
    return;
  }

  const deleteBranches = options.deleteBranch;
  const results = [];

  for (const wt of worktreesToClean) {
    const spinner = ora(`Removing worktree ${chalk.cyan(wt.branch)}`).start();

    try {
      // Remove worktree
      removeWorktree(wt.path, true, projectRoot);
      spinner.succeed(`Removed worktree ${chalk.cyan(wt.branch)}`);

      // Delete branch if requested
      if (deleteBranches && wt.branch) {
        const branchSpinner = ora(`Deleting branch ${chalk.cyan(wt.branch)}`).start();
        try {
          deleteBranch(wt.branch, true, projectRoot);
          branchSpinner.succeed(`Deleted branch ${chalk.cyan(wt.branch)}`);
        } catch (error) {
          branchSpinner.warn(`Could not delete branch ${wt.branch}: ${error.message}`);
        }
      }

      results.push({ ...wt, success: true });
    } catch (error) {
      spinner.fail(`Failed to remove worktree ${wt.branch}: ${error.message}`);
      results.push({ ...wt, success: false, error: error.message });
    }
  }

  // Prune worktrees
  pruneWorktrees(projectRoot);

  // Clean up empty features directory
  if (options.all) {
    try {
      const remaining = fs.readdirSync(featuresDir);
      if (remaining.length === 0) {
        fs.rmdirSync(featuresDir);
        console.log(chalk.dim(`\nRemoved empty features directory: ${featuresDir}`));
      }
    } catch {
      // Ignore errors when trying to remove directory
    }
  }

  // Summary
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  console.log('');
  if (successful.length > 0) {
    console.log(chalk.green(`Successfully removed ${successful.length} worktree(s)`));
  }

  if (failed.length > 0) {
    console.log(chalk.red(`Failed to remove ${failed.length} worktree(s)`));
  }
}
