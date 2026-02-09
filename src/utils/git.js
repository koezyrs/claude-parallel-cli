import { execSync, exec } from 'child_process';
import path from 'path';
import { platform } from 'os';
import { findProjectRoot } from './config.js';

/**
 * Force remove directory using OS-native commands (fallback for locked files)
 */
export function forceRemoveDir(dirPath) {
  if (platform() === 'win32') {
    // Windows: use PowerShell with escaped path
    const escapedPath = dirPath.replace(/"/g, '\\"');
    execSync(`powershell -Command "Remove-Item -Path \\"${escapedPath}\\" -Recurse -Force"`, {
      encoding: 'utf-8',
      stdio: 'pipe'
    });
  } else {
    // Unix-like: use rm -rf
    execSync(`rm -rf "${dirPath}"`, {
      encoding: 'utf-8',
      stdio: 'pipe'
    });
  }
}

/**
 * Execute a git command and return the output
 */
export function gitExec(command, options = {}) {
  const cwd = options.cwd || findProjectRoot() || process.cwd();
  try {
    return execSync(`git ${command}`, {
      cwd,
      encoding: 'utf-8',
      stdio: options.stdio || 'pipe'
    }).trim();
  } catch (error) {
    if (options.throwOnError !== false) {
      throw error;
    }
    return null;
  }
}

/**
 * Get the current branch name
 */
export function getCurrentBranch(cwd = null) {
  return gitExec('rev-parse --abbrev-ref HEAD', { cwd });
}

/**
 * Check if there are uncommitted changes
 */
export function hasUncommittedChanges(cwd = null) {
  const status = gitExec('status --porcelain', { cwd });
  return status.length > 0;
}

/**
 * Get list of all worktrees
 */
export function getWorktrees(cwd = null) {
  const output = gitExec('worktree list --porcelain', { cwd });
  const worktrees = [];
  let current = {};

  for (const line of output.split('\n')) {
    if (line.startsWith('worktree ')) {
      if (current.path) {
        worktrees.push(current);
      }
      current = { path: line.slice(9) };
    } else if (line.startsWith('HEAD ')) {
      current.head = line.slice(5);
    } else if (line.startsWith('branch ')) {
      current.branch = line.slice(7).replace('refs/heads/', '');
    } else if (line === 'bare') {
      current.bare = true;
    } else if (line === 'detached') {
      current.detached = true;
    }
  }

  if (current.path) {
    worktrees.push(current);
  }

  return worktrees;
}

/**
 * Get feature worktrees (exclude main worktree)
 */
export function getFeatureWorktrees(featuresDir, cwd = null) {
  const worktrees = getWorktrees(cwd);
  const normalizedFeaturesDir = path.normalize(featuresDir).toLowerCase();

  return worktrees.filter(wt => {
    const normalizedPath = path.normalize(wt.path).toLowerCase();
    return normalizedPath.startsWith(normalizedFeaturesDir);
  });
}

/**
 * Create a new worktree with a new branch
 */
export function createWorktree(worktreePath, branchName, baseBranch, cwd = null) {
  // Ensure we're on the latest of the base branch
  gitExec(`fetch origin ${baseBranch}`, { cwd, throwOnError: false });

  // Create worktree with new branch
  gitExec(`worktree add -b ${branchName} "${worktreePath}" ${baseBranch}`, { cwd });

  return worktreePath;
}

/**
 * Ensure long path support is enabled in the repository on Windows
 */
export function ensureLongPathsEnabled(cwd = null) {
  if (process.platform !== 'win32') {
    return { status: 'not_windows' };
  }

  const currentValue = gitExec('config --get core.longpaths', { cwd, throwOnError: false });
  if (currentValue && currentValue.trim().toLowerCase() === 'true') {
    return { status: 'already_enabled' };
  }

  const setResult = gitExec('config core.longpaths true', { cwd, throwOnError: false });
  if (setResult === null) {
    return {
      status: 'failed',
      message: 'Unable to set git config core.longpaths=true for this repository.'
    };
  }

  const verifyValue = gitExec('config --get core.longpaths', { cwd, throwOnError: false });
  if (verifyValue && verifyValue.trim().toLowerCase() === 'true') {
    return { status: 'enabled' };
  }

  return {
    status: 'failed',
    message: 'core.longpaths could not be verified after setting it.'
  };
}

/**
 * Remove a worktree
 */
export function removeWorktree(worktreePath, force = false, cwd = null) {
  const forceFlag = force ? ' --force' : '';
  gitExec(`worktree remove "${worktreePath}"${forceFlag}`, { cwd });
}

/**
 * Delete a branch
 */
export function deleteBranch(branchName, force = false, cwd = null) {
  const flag = force ? '-D' : '-d';
  gitExec(`branch ${flag} ${branchName}`, { cwd });
}

/**
 * Check if a branch exists
 */
export function branchExists(branchName, cwd = null) {
  const result = gitExec(`rev-parse --verify ${branchName}`, {
    cwd,
    throwOnError: false
  });
  return result !== null;
}

/**
 * Checkout a branch
 */
export function checkout(branchName, cwd = null) {
  gitExec(`checkout ${branchName}`, { cwd });
}

/**
 * Create or reset a branch to point to another ref
 */
export function checkoutNewBranch(branchName, ref, cwd = null) {
  gitExec(`checkout -B ${branchName} ${ref}`, { cwd });
}

/**
 * Merge a branch
 */
export function mergeBranch(branchName, cwd = null) {
  gitExec(`merge ${branchName}`, { cwd });
}

/**
 * Get commit count between two refs
 */
export function getCommitCount(fromRef, toRef, cwd = null) {
  const output = gitExec(`rev-list --count ${fromRef}..${toRef}`, { cwd, throwOnError: false });
  return output ? parseInt(output, 10) : 0;
}

/**
 * Get list of changed files between two refs
 */
export function getChangedFiles(fromRef, toRef, cwd = null) {
  const output = gitExec(`diff --name-only ${fromRef}..${toRef}`, { cwd, throwOnError: false });
  return output ? output.split('\n').filter(Boolean) : [];
}

/**
 * Get short log between two refs
 */
export function getShortLog(fromRef, toRef, cwd = null) {
  const output = gitExec(`log --oneline ${fromRef}..${toRef}`, { cwd, throwOnError: false });
  return output || '';
}

/**
 * Prune worktrees (clean up stale entries)
 */
export function pruneWorktrees(cwd = null) {
  gitExec('worktree prune', { cwd });
}
