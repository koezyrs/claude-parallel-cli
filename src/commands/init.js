import chalk from 'chalk';
import inquirer from 'inquirer';
import fs from 'fs';
import path from 'path';
import { saveConfig, findGitRoot, getCwd } from '../utils/config.js';
import { DEFAULT_CONFIG, TERMINAL_OPTIONS, CONFIG_FILENAME } from '../constants.js';

export async function initCommand() {
  const cwd = getCwd();
  const gitRoot = findGitRoot();

  if (!gitRoot) {
    console.error(chalk.red('Error: Not in a git repository'));
    process.exit(1);
  }

  const configPath = path.join(cwd, CONFIG_FILENAME);

  if (fs.existsSync(configPath)) {
    const { overwrite } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'overwrite',
        message: 'Config file already exists. Overwrite?',
        default: false
      }
    ]);

    if (!overwrite) {
      console.log(chalk.yellow('Initialization cancelled.'));
      return;
    }
  }

  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'featuresDir',
      message: 'Directory for feature worktrees (relative to this folder):',
      default: DEFAULT_CONFIG.featuresDir
    },
    {
      type: 'input',
      name: 'mainBranch',
      message: 'Main branch name:',
      default: DEFAULT_CONFIG.mainBranch
    },
    {
      type: 'confirm',
      name: 'copyClaudeConfig',
      message: 'Copy .claude/ folder to new worktrees?',
      default: DEFAULT_CONFIG.copyClaudeConfig
    },
    {
      type: 'list',
      name: 'terminal',
      message: 'Terminal preference:',
      choices: TERMINAL_OPTIONS,
      default: DEFAULT_CONFIG.terminal
    }
  ]);

  const savedPath = saveConfig(answers, cwd);

  console.log(chalk.green(`\nConfig file created: ${savedPath}`));
  console.log(chalk.dim('\nConfiguration:'));
  console.log(chalk.dim(`  Features directory: ${answers.featuresDir}`));
  console.log(chalk.dim(`  Main branch: ${answers.mainBranch}`));
  console.log(chalk.dim(`  Copy Claude config: ${answers.copyClaudeConfig}`));
  console.log(chalk.dim(`  Terminal: ${answers.terminal}`));
  console.log(chalk.cyan('\nRun `cpw create <feature-name>` to create your first worktree.'));
}
