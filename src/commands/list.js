import chalk from 'chalk';
import { loadConfig, getFeaturesDir, findProjectRoot } from '../utils/config.js';
import { getWorktrees, getFeatureWorktrees } from '../utils/git.js';

export async function listCommand() {
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
    console.log(chalk.dim('\nCreate one with: cpw create <feature-name>'));
    return;
  }

  console.log(chalk.bold('Feature Worktrees:\n'));

  for (const wt of featureWorktrees) {
    const branchName = wt.branch || '(detached)';
    const status = wt.detached ? chalk.yellow('detached') : chalk.green('active');

    console.log(`  ${chalk.cyan(branchName)}`);
    console.log(`    Path: ${chalk.dim(wt.path)}`);
    console.log(`    Status: ${status}`);
    console.log('');
  }

  console.log(chalk.dim(`Total: ${featureWorktrees.length} worktree(s)`));
}
