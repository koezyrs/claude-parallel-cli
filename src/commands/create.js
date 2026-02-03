import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs';
import path from 'path';
import { loadConfig, getFeaturesDir, findGitRoot } from '../utils/config.js';
import { createWorktree, branchExists } from '../utils/git.js';
import { copyClaudeConfig } from '../utils/claude.js';

export async function createCommand(features) {
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

      // Create worktree
      createWorktree(worktreePath, feature, config.mainBranch, gitRoot);

      // Copy .claude config if enabled (from config directory)
      if (config.copyClaudeConfig && config._configDir) {
        const copied = copyClaudeConfig(config._configDir, worktreePath);
        if (copied) {
          spinner.text = `Creating worktree for ${chalk.cyan(feature)} (copied .claude config)`;
        }
      }

      spinner.succeed(`Created worktree: ${chalk.cyan(feature)} at ${chalk.dim(worktreePath)}`);
      results.push({ feature, success: true, path: worktreePath });
    } catch (error) {
      spinner.fail(`Failed to create worktree for ${feature}: ${error.message}`);
      results.push({ feature, success: false, error: error.message });
    }
  }

  // Summary
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  console.log('');
  if (successful.length > 0) {
    console.log(chalk.green(`Successfully created ${successful.length} worktree(s)`));
    console.log(chalk.cyan('\nNext steps:'));
    console.log(chalk.dim('  cpw start           # Open Claude in all worktrees'));
    console.log(chalk.dim('  cpw start <feature> # Open Claude in specific worktree'));
  }

  if (failed.length > 0) {
    console.log(chalk.red(`\nFailed to create ${failed.length} worktree(s)`));
  }
}
