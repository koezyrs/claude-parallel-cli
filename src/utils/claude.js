import fs from 'fs';
import path from 'path';

/**
 * Copy an agent config directory (e.g. .claude, .codex) from source to destination
 */
export function copyAgentConfig(sourceDir, destDir, folderName) {
  const sourceConfigDir = path.join(sourceDir, folderName);

  if (!fs.existsSync(sourceConfigDir)) {
    return false;
  }

  const destinationConfigDir = path.join(destDir, folderName);
  copyDirRecursive(sourceConfigDir, destinationConfigDir);

  return true;
}

export function copyClaudeConfig(sourceDir, destDir) {
  return copyAgentConfig(sourceDir, destDir, '.claude');
}

export function copyCodexConfig(sourceDir, destDir) {
  return copyAgentConfig(sourceDir, destDir, '.codex');
}

/**
 * Recursively copy a directory
 */
function copyDirRecursive(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

/**
 * Check if a config directory exists in a directory
 */
export function hasAgentConfig(dir, folderName) {
  return fs.existsSync(path.join(dir, folderName));
}

export function hasClaudeConfig(dir) {
  return hasAgentConfig(dir, '.claude');
}

export function hasCodexConfig(dir) {
  return hasAgentConfig(dir, '.codex');
}
