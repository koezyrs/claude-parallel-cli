import { findGitRoot, loadConfig, getFeaturesDir } from './config.js';

export function getCommandContext(options = {}) {
  const { requireConfig = true } = options;
  const gitRoot = findGitRoot();

  if (!gitRoot) {
    throw new Error('Error: Not in a git repository');
  }

  if (!requireConfig) {
    return { gitRoot };
  }

  const config = loadConfig();
  const featuresDir = getFeaturesDir(config);

  return { gitRoot, config, featuresDir };
}
