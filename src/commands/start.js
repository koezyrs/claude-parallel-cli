import chalk from 'chalk';
import ora from 'ora';
import { getCommandContext } from '../utils/command-context.js';
import { commandText } from '../utils/messages.js';
import { getFeatureWorktrees } from '../utils/git.js';
import { openTerminal } from '../utils/terminal.js';

export async function startCommand(features) {
  let config;
  let gitRoot;
  let featuresDir;
  try {
    ({ gitRoot, config, featuresDir } = getCommandContext());
  } catch (error) {
    console.error(chalk.red(error.message));
    process.exit(1);
  }
  const featureWorktrees = getFeatureWorktrees(featuresDir, gitRoot);
  const assistant = config.agent === 'codex' ? 'codex' : 'claude';
  const assistantLabel = assistant === 'codex' ? 'Codex' : 'Claude';

  if (featureWorktrees.length === 0) {
    console.log(chalk.yellow('No feature worktrees found.'));
    console.log(chalk.dim(`\nCreate one with: ${commandText('create <feature-name>')}`));
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

  console.log(chalk.bold(`Starting ${assistantLabel} in ${worktreesToStart.length} worktree(s)...\n`));

  const results = [];

  for (const wt of worktreesToStart) {
    const spinner = ora(`Opening terminal for ${chalk.cyan(wt.branch)}`).start();

    try {
      const result = openTerminal(wt.path, assistant, { terminal: config.terminal });
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
    console.log(chalk.green(`Opened ${successful.length} terminal(s) with ${assistantLabel}`));
  }

  if (failed.length > 0) {
    console.log(chalk.red(`Failed to open ${failed.length} terminal(s)`));
  }
}
