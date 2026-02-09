import chalk from 'chalk';
import inquirer from 'inquirer';
import fs from 'fs';
import path from 'path';
import { saveConfig, getCwd } from '../utils/config.js';
import { getCommandContext } from '../utils/command-context.js';
import { commandText } from '../utils/messages.js';
import { DEFAULT_CONFIG, TERMINAL_OPTIONS, CONFIG_FILENAME } from '../constants.js';

export async function initCommand() {
  const cwd = getCwd();
  try {
    getCommandContext({ requireConfig: false });
  } catch (error) {
    console.error(chalk.red(error.message));
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
      type: 'list',
      name: 'agent',
      message: 'Default assistant to start in worktrees:',
      choices: ['claude', 'codex'],
      default: DEFAULT_CONFIG.agent
    },
    {
      type: 'confirm',
      name: 'copyClaudeConfig',
      message: 'Copy .claude/ folder to new worktrees?',
      default: DEFAULT_CONFIG.copyConfig.claude
    },
    {
      type: 'confirm',
      name: 'copyCodexConfig',
      message: 'Copy .codex/ folder to new worktrees?',
      default: DEFAULT_CONFIG.copyConfig.codex
    },
    {
      type: 'list',
      name: 'terminal',
      message: 'Terminal preference:',
      choices: TERMINAL_OPTIONS,
      default: DEFAULT_CONFIG.terminal
    }
  ]);

  const configToSave = {
    featuresDir: answers.featuresDir,
    mainBranch: answers.mainBranch,
    agent: answers.agent,
    copyConfig: {
      claude: answers.copyClaudeConfig,
      codex: answers.copyCodexConfig
    },
    terminal: answers.terminal
  };

  const savedPath = saveConfig(configToSave, cwd);

  console.log(chalk.green(`\nConfig file created: ${savedPath}`));
  console.log(chalk.dim('\nConfiguration:'));
  console.log(chalk.dim(`  Features directory: ${answers.featuresDir}`));
  console.log(chalk.dim(`  Main branch: ${answers.mainBranch}`));
  console.log(chalk.dim(`  Default assistant: ${answers.agent}`));
  console.log(chalk.dim(`  Copy .claude config: ${answers.copyClaudeConfig}`));
  console.log(chalk.dim(`  Copy .codex config: ${answers.copyCodexConfig}`));
  console.log(chalk.dim(`  Terminal: ${answers.terminal}`));
  console.log(chalk.cyan(`\nRun \`${commandText('create <feature-name>')}\` to create your first worktree.`));
}
