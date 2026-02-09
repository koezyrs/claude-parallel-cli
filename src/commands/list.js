import chalk from 'chalk';
import { getCommandContext } from '../utils/command-context.js';
import { commandText } from '../utils/messages.js';
import { getFeatureWorktrees } from '../utils/git.js';

export async function listCommand() {
  let gitRoot;
  let featuresDir;
  try {
    ({ gitRoot, featuresDir } = getCommandContext());
  } catch (error) {
    console.error(chalk.red(error.message));
    process.exit(1);
  }
  const featureWorktrees = getFeatureWorktrees(featuresDir, gitRoot);

  if (featureWorktrees.length === 0) {
    console.log(chalk.yellow('No feature worktrees found.'));
    console.log(chalk.dim(`\nCreate one with: ${commandText('create <feature-name>')}`));
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
