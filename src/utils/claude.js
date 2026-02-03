import fs from 'fs';
import path from 'path';

/**
 * Copy .claude directory from source to destination
 */
export function copyClaudeConfig(sourceDir, destDir) {
  const claudeDir = path.join(sourceDir, '.claude');

  if (!fs.existsSync(claudeDir)) {
    return false;
  }

  const destClaudeDir = path.join(destDir, '.claude');
  copyDirRecursive(claudeDir, destClaudeDir);

  return true;
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
 * Check if .claude directory exists in a directory
 */
export function hasClaudeConfig(dir) {
  return fs.existsSync(path.join(dir, '.claude'));
}
