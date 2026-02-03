import fs from 'fs';
import path from 'path';
import { CONFIG_FILENAME, DEFAULT_CONFIG } from '../constants.js';

/**
 * Find the project root by looking for .git directory
 */
export function findProjectRoot(startDir = process.cwd()) {
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
 * Get the config file path
 */
export function getConfigPath(projectRoot = null) {
  const root = projectRoot || findProjectRoot();
  if (!root) {
    throw new Error('Not in a git repository');
  }
  return path.join(root, CONFIG_FILENAME);
}

/**
 * Check if config file exists
 */
export function configExists(projectRoot = null) {
  try {
    const configPath = getConfigPath(projectRoot);
    return fs.existsSync(configPath);
  } catch {
    return false;
  }
}

/**
 * Load config from file
 */
export function loadConfig(projectRoot = null) {
  const configPath = getConfigPath(projectRoot);

  if (!fs.existsSync(configPath)) {
    throw new Error(`Config file not found. Run 'cpw init' first.`);
  }

  const content = fs.readFileSync(configPath, 'utf-8');
  const config = JSON.parse(content);

  return { ...DEFAULT_CONFIG, ...config };
}

/**
 * Save config to file
 */
export function saveConfig(config, projectRoot = null) {
  const root = projectRoot || findProjectRoot();
  if (!root) {
    throw new Error('Not in a git repository');
  }

  const configPath = path.join(root, CONFIG_FILENAME);
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };

  fs.writeFileSync(configPath, JSON.stringify(mergedConfig, null, 2) + '\n');

  return configPath;
}

/**
 * Get the absolute path to the features directory
 */
export function getFeaturesDir(config, projectRoot = null) {
  const root = projectRoot || findProjectRoot();
  if (!root) {
    throw new Error('Not in a git repository');
  }

  return path.resolve(root, config.featuresDir);
}
