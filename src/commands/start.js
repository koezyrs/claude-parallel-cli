import chalk from 'chalk';
import ora from 'ora';
import { loadConfig, getFeaturesDir, findGitRoot } from '../utils/config.js';
import { getFeatureWorktrees } from '../utils/git.js';
import { openTerminal } from '../utils/terminal.js';

export async function startCommand(features) {
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

  const featuresDir = getFeaturesDir(config);
  const featureWorktrees = getFeatureWorktrees(featuresDir, gitRoot);

  if (featureWorktrees.length === 0) {
    console.log(chalk.yellow('No feature worktrees found.'));
    console.log(chalk.dim('\nCreate one with: cpw create <feature-name>'));
    return;
  }

  // Filter worktrees if specific features were requested
  let worktreesToStart = featureWorktrees;
  if (features && features.length > 0) {
    worktreesToStart = featureWorktrees.filter(wt =>
      features.some(f => wt.branch === f || wt.path.endsWith(f))
    );

    if (worktreesToStart.length === 0) {
      console.error(chalk.red('No matching worktrees found for specified features.'));
      console.log(chalk.dim('\nAvailable features:'));
      featureWorktrees.forEach(wt => {
        console.log(chalk.dim(`  - ${wt.branch}`));
      });
      return;
    }
  }

  console.log(chalk.bold(`Starting Claude in ${worktreesToStart.length} worktree(s)...\n`));

  const results = [];

  for (const wt of worktreesToStart) {
    const spinner = ora(`Opening terminal for ${chalk.cyan(wt.branch)}`).start();

    try {
      const result = openTerminal(wt.path, 'claude', { terminal: config.terminal });
      spinner.succeed(`Opened ${result.type} for ${chalk.cyan(wt.branch)}`);
      results.push({ ...wt, success: true, terminal: result.type });
    } catch (error) {
      spinner.fail(`Failed to open terminal for ${wt.branch}: ${error.message}`);
      results.push({ ...wt, success: false, error: error.message });
    }
  }

  // Summary
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  console.log('');
  if (successful.length > 0) {
    console.log(chalk.green(`Opened ${successful.length} terminal(s) with Claude`));
  }

  if (failed.length > 0) {
    console.log(chalk.red(`Failed to open ${failed.length} terminal(s)`));
  }
}
