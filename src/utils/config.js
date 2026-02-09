import fs from 'fs';
import path from 'path';
import { CONFIG_FILENAME, DEFAULT_CONFIG } from '../constants.js';

function normalizeConfig(config = {}) {
  return {
    ...DEFAULT_CONFIG,
    ...config,
    copyConfig: {
      ...DEFAULT_CONFIG.copyConfig,
      ...(config.copyConfig || {})
    }
  };
}

function validateConfigSchema(config) {
  if (Object.prototype.hasOwnProperty.call(config, 'copyClaudeConfig')) {
    throw new Error(
      'Unsupported config key "copyClaudeConfig". Re-run `cpc init` to migrate to the new `copyConfig` schema.'
    );
  }

  if (!config.copyConfig || typeof config.copyConfig !== 'object') {
    throw new Error(
      'Missing or invalid "copyConfig" in .cpc.json. Re-run `cpc init` to regenerate config.'
    );
  }

  if (typeof config.agent !== 'string' || !['claude', 'codex'].includes(config.agent)) {
    throw new Error(
      'Invalid "agent" in .cpc.json. Supported values are "claude" or "codex".'
    );
  }
}

/**
 * Get the current working directory
 */
export function getCwd() {
  return process.cwd();
}

/**
 * Find the project root by looking for .git directory
 */
export function findGitRoot(startDir = process.cwd()) {
  let dir = startDir;
  while (dir !== path.parse(dir).root) {
    if (fs.existsSync(path.join(dir, '.git'))) {
      return dir;
    }
    dir = path.dirname(dir);
  }
  return null;
}

/**
 * Find config file by traversing up from current directory
 */
export function findConfigDir(startDir = process.cwd()) {
  let dir = startDir;
  while (dir !== path.parse(dir).root) {
    if (fs.existsSync(path.join(dir, CONFIG_FILENAME))) {
      return dir;
    }
    dir = path.dirname(dir);
  }
  return null;
}

/**
 * Get the config file path
 */
export function getConfigPath(configDir = null) {
  const dir = configDir || findConfigDir();
  if (!dir) {
    throw new Error(`Config file not found. Run 'cpc init' first.`);
  }
  return path.join(dir, CONFIG_FILENAME);
}

/**
 * Check if config file exists
 */
export function configExists(startDir = process.cwd()) {
  return findConfigDir(startDir) !== null;
}

/**
 * Load config from file
 */
export function loadConfig(startDir = process.cwd()) {
  const configDir = findConfigDir(startDir);

  if (!configDir) {
    throw new Error(`Config file not found. Run 'cpc init' first.`);
  }

  const configPath = path.join(configDir, CONFIG_FILENAME);
  const content = fs.readFileSync(configPath, 'utf-8');
  const config = JSON.parse(content);
  validateConfigSchema(config);

  // Return config with the directory it was found in
  return {
    ...normalizeConfig(config),
    _configDir: configDir  // Internal: where the config was found
  };
}

/**
 * Save config to file in the current working directory
 */
export function saveConfig(config, targetDir = process.cwd()) {
  const configPath = path.join(targetDir, CONFIG_FILENAME);

  // Remove internal properties before saving
  const { _configDir, ...configToSave } = config;
  const mergedConfig = normalizeConfig(configToSave);

  fs.writeFileSync(configPath, JSON.stringify(mergedConfig, null, 2) + '\n');

  return configPath;
}

/**
 * Get the absolute path to the features directory
 */
export function getFeaturesDir(config) {
  const baseDir = config._configDir || process.cwd();
  return path.resolve(baseDir, config.featuresDir);
}

// Keep backward compatibility alias
export const findProjectRoot = findGitRoot;
