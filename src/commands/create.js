import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs';
import path from 'path';
import { getCommandContext } from '../utils/command-context.js';
import { commandText } from '../utils/messages.js';
import { createWorktree, branchExists, ensureLongPathsEnabled } from '../utils/git.js';
import { copyClaudeConfig, copyCodexConfig } from '../utils/claude.js';

export async function createCommand(features) {
  let gitRoot;
  let config;
  let featuresDir;
  try {
    ({ gitRoot, config, featuresDir } = getCommandContext());
  } catch (error) {
    console.error(chalk.red(error.message));
    process.exit(1);
  }

  // Ensure features directory exists
  if (!fs.existsSync(featuresDir)) {
    fs.mkdirSync(featuresDir, { recursive: true });
    console.log(chalk.dim(`Created features directory: ${featuresDir}`));
  }

  const results = [];

  for (const feature of features) {
    const spinner = ora(`Creating worktree for ${chalk.cyan(feature)}`).start();
    const worktreePath = path.join(featuresDir, feature);

    try {
      // Check if branch already exists
      if (branchExists(feature, gitRoot)) {
        spinner.fail(`Branch '${feature}' already exists`);
        results.push({ feature, success: false, error: 'Branch already exists' });
        continue;
      }

      // Check if worktree path already exists
      if (fs.existsSync(worktreePath)) {
        spinner.fail(`Directory already exists: ${worktreePath}`);
        results.push({ feature, success: false, error: 'Directory already exists' });
        continue;
      }

      // On Windows, ensure git can handle long paths in this repository.
      if (process.platform === 'win32') {
        const longPathStatus = ensureLongPathsEnabled(gitRoot);
        if (longPathStatus.status === 'failed') {
          spinner.text = `Creating worktree for ${chalk.cyan(feature)} (warning: ${longPathStatus.message})`;
        }
      }

      // Create worktree
      createWorktree(worktreePath, feature, config.mainBranch, gitRoot);

      // Copy assistant config folders if enabled (from config directory)
      if (config._configDir) {
        const copiedConfigs = [];
        if (config.copyConfig.claude && copyClaudeConfig(config._configDir, worktreePath)) {
          copiedConfigs.push('.claude');
        }
        if (config.copyConfig.codex && copyCodexConfig(config._configDir, worktreePath)) {
          copiedConfigs.push('.codex');
        }

        if (copiedConfigs.length > 0) {
          spinner.text = `Creating worktree for ${chalk.cyan(feature)} (copied ${copiedConfigs.join(', ')})`;
        }
      }

      spinner.succeed(`Created worktree: ${chalk.cyan(feature)} at ${chalk.dim(worktreePath)}`);
      results.push({ feature, success: true, path: worktreePath });
    } catch (error) {
      const errorMessage = error.message || String(error);
      const normalizedError = errorMessage.toLowerCase();
      const isWindowsLongPathError =
        process.platform === 'win32' &&
        (normalizedError.includes('filename too long') ||
          normalizedError.includes('unable to create file'));
      const failureMessage = isWindowsLongPathError
        ? `${errorMessage}\n` +
          'Windows long-path limits are likely blocking checkout. ' +
          'cpc attempted to set `core.longpaths=true` for this repository. ' +
          'If this still fails, enable Win32 long paths in Windows policy/registry and/or shorten `featuresDir` in .cpc.json.'
        : errorMessage;

      spinner.fail(`Failed to create worktree for ${feature}: ${failureMessage}`);
      results.push({ feature, success: false, error: failureMessage });
    }
  }

  // Summary
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  console.log('');
  if (successful.length > 0) {
    console.log(chalk.green(`Successfully created ${successful.length} worktree(s)`));
    console.log(chalk.cyan('\nNext steps:'));
    console.log(chalk.dim(`  ${commandText('start')}           # Open your configured assistant in all worktrees`));
    console.log(chalk.dim(`  ${commandText('start <feature>')} # Open your configured assistant in specific worktree`));
  }

  if (failed.length > 0) {
    console.log(chalk.red(`\nFailed to create ${failed.length} worktree(s)`));
  }
}
