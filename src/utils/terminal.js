import { spawn, exec, execSync } from "child_process";
import os from "os";
import path from "path";
import fs from "fs";

/**
 * Check if a command exists in PATH
 */
function commandExists(command) {
  try {
    const checkCmd = os.platform() === "win32" ? "where" : "which";
    execSync(`${checkCmd} ${command}`, { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

/**
 * Get Tabby executable path (Windows)
 */
function getTabbyPath() {
  // Check if tabby is in PATH
  if (commandExists("tabby")) {
    return "tabby";
  }

  // Check common installation paths
  const appData = process.env.APPDATA || "";
  const localAppData = process.env.LOCALAPPDATA || "";

  const commonPaths = [
    path.join(localAppData, "Programs", "tabby", "Tabby.exe"),
    path.join(localAppData, "Programs", "Tabby", "Tabby.exe"),
    path.join(
      appData,
      "Microsoft",
      "Windows",
      "Start Menu",
      "Programs",
      "Tabby.lnk",
    ),
    "C:\\Program Files\\Tabby\\Tabby.exe",
    "C:\\Program Files (x86)\\Tabby\\Tabby.exe",
  ];

  for (const p of commonPaths) {
    if (fs.existsSync(p)) {
      return p;
    }
  }

  return null;
}

/**
 * Open a terminal window/tab at the specified directory and run a command
 */
export function openTerminal(workingDir, command, options = {}) {
  const platform = os.platform();
  const terminalPreference = options.terminal || "auto";

  if (platform === "win32") {
    return openWindowsTerminal(workingDir, command, terminalPreference);
  } else if (platform === "darwin") {
    return openMacTerminal(workingDir, command, terminalPreference);
  } else {
    return openLinuxTerminal(workingDir, command, terminalPreference);
  }
}

/**
 * Open terminal on Windows
 */
function openWindowsTerminal(workingDir, command, preference) {
  // Windows Terminal
  if ((preference === "auto" || preference === "wt") && commandExists("wt")) {
    const proc = spawn(
      "wt",
      ["-w", "0", "-d", workingDir, "cmd", "/k", command],
      {
        detached: true,
        stdio: "ignore",
        shell: true,
      },
    );
    proc.unref();
    return { type: "wt", success: true };
  }

  // Tabby
  if (preference === "auto" || preference === "tabby") {
    const tabbyPath = getTabbyPath();
    if (tabbyPath) {
      // Open a new Tabby tab in the working directory
      // Then paste the command to run
      const openProc = spawn(tabbyPath, ["open", workingDir], {
        detached: true,
        stdio: "ignore",
      });
      openProc.unref();

      return { type: "tabby", success: true };
    }
  }

  // PowerShell
  if (preference === "powershell") {
    const psCommand = `Start-Process powershell -ArgumentList '-NoExit', '-Command', 'cd "${workingDir}"; ${command}'`;
    exec(`powershell -Command "${psCommand}"`);
    return { type: "powershell", success: true };
  }

  // CMD fallback
  const assistantName = command ? `${command.charAt(0).toUpperCase()}${command.slice(1)}` : 'Assistant';
  const title = `${assistantName} - ${workingDir.split(/[\\/]/).pop()}`;
  exec(`start "${title}" cmd /D "${workingDir}" /k "${command}"`);
  return { type: "cmd", success: true };
}

/**
 * Open terminal on macOS
 */
function openMacTerminal(workingDir, command, preference) {
  // iTerm2
  if (
    (preference === "auto" || preference === "iterm") &&
    commandExists("osascript")
  ) {
    try {
      const script = `
        tell application "iTerm"
          create window with default profile
          tell current session of current window
            write text "cd '${workingDir}' && ${command}"
          end tell
        end tell
      `;
      execSync(`osascript -e '${script}'`, { stdio: "ignore" });
      return { type: "iterm", success: true };
    } catch {
      // Fall through to Terminal.app
    }
  }

  // Terminal.app fallback
  const script = `
    tell application "Terminal"
      do script "cd '${workingDir}' && ${command}"
      activate
    end tell
  `;
  exec(`osascript -e '${script}'`);
  return { type: "terminal", success: true };
}

/**
 * Open terminal on Linux
 */
function openLinuxTerminal(workingDir, command, preference) {
  // Try common terminal emulators
  const terminals = [
    {
      name: "gnome-terminal",
      args: [
        "--working-directory",
        workingDir,
        "--",
        "bash",
        "-c",
        `${command}; exec bash`,
      ],
    },
    {
      name: "konsole",
      args: [
        "--workdir",
        workingDir,
        "-e",
        "bash",
        "-c",
        `${command}; exec bash`,
      ],
    },
    {
      name: "xfce4-terminal",
      args: [
        "--working-directory",
        workingDir,
        "-e",
        `bash -c "${command}; exec bash"`,
      ],
    },
    { name: "xterm", args: ["-e", `cd "${workingDir}" && ${command} && bash`] },
  ];

  for (const term of terminals) {
    if (commandExists(term.name)) {
      const proc = spawn(term.name, term.args, {
        detached: true,
        stdio: "ignore",
      });
      proc.unref();
      return { type: term.name, success: true };
    }
  }

  throw new Error("No supported terminal emulator found");
}

/**
 * Open multiple terminals
 */
export function openTerminals(configs, options = {}) {
  const results = [];

  for (const config of configs) {
    try {
      const result = openTerminal(config.workingDir, config.command, options);
      results.push({ ...config, ...result });
    } catch (error) {
      results.push({ ...config, success: false, error: error.message });
    }
  }

  return results;
}
