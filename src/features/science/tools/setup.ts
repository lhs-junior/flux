/**
 * Science Setup Tool - Initialize and manage Python environment
 *
 * Actions:
 * - init: Create/initialize Python virtual environment
 * - install: Install packages via pip
 * - list: List installed packages
 * - reset: Reset environment (delete and recreate)
 * - status: Get environment status
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { existsSync, rmSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import {
  ScienceSetupInput,
  ScienceSetupOutput,
  DEFAULT_SCIENCE_CONFIG,
  ScienceEnvironmentError,
} from '../science-types.js';

const execAsync = promisify(exec);

export class ScienceSetup {
  private venvPath: string;
  private pythonPath: string;
  private pipPath: string;

  constructor(venvPath: string = DEFAULT_SCIENCE_CONFIG.venvPath) {
    this.venvPath = venvPath;
    const isWindows = process.platform === 'win32';
    const binDir = isWindows ? 'Scripts' : 'bin';
    const pythonExe = isWindows ? 'python.exe' : 'python';
    const pipExe = isWindows ? 'pip.exe' : 'pip';
    this.pythonPath = join(this.venvPath, binDir, pythonExe);
    this.pipPath = join(this.venvPath, binDir, pipExe);
  }

  /**
   * Execute setup action
   */
  async execute(input: ScienceSetupInput): Promise<ScienceSetupOutput> {
    switch (input.action) {
      case 'init':
        return this.init(input.force);

      case 'install':
        return this.install(input.packages || [], input.requirements);

      case 'list':
        return this.list();

      case 'reset':
        return this.reset();

      case 'status':
        return this.status();

      default:
        return {
          success: false,
          message: `Unknown action: ${input.action}`,
        };
    }
  }

  /**
   * Initialize Python virtual environment
   */
  private async init(force: boolean = false): Promise<ScienceSetupOutput> {
    try {
      // Check if venv already exists
      if (existsSync(this.venvPath)) {
        if (!force) {
          return {
            success: true,
            message: 'Virtual environment already exists. Use force=true to recreate.',
            venvPath: this.venvPath,
          };
        }
        // Remove existing venv
        rmSync(this.venvPath, { recursive: true, force: true });
      }

      // Find Python executable
      const pythonCmd = await this.findPythonCommand();
      if (!pythonCmd) {
        throw new ScienceEnvironmentError(
          'Python 3 not found. Please install Python 3.8 or later.'
        );
      }

      // Create virtual environment
      const { stdout, stderr } = await execAsync(
        `${pythonCmd} -m venv "${this.venvPath}"`
      );

      if (!existsSync(this.pythonPath)) {
        throw new ScienceEnvironmentError(
          'Failed to create virtual environment',
          { stdout, stderr }
        );
      }

      // Upgrade pip
      await execAsync(`"${this.pythonPath}" -m pip install --upgrade pip`);

      // Get Python version
      const versionResult = await execAsync(`"${this.pythonPath}" --version`);
      const pythonVersion = versionResult.stdout.trim();

      // Install default packages
      const defaultPackages = DEFAULT_SCIENCE_CONFIG.defaultPackages;
      if (defaultPackages.length > 0) {
        await this.installPackages(defaultPackages);
      }

      return {
        success: true,
        message: `Python environment initialized successfully with ${defaultPackages.length} default packages.`,
        venvPath: this.venvPath,
        pythonVersion,
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Failed to initialize environment: ${error.message}`,
      };
    }
  }

  /**
   * Install packages
   */
  private async install(
    packages: string[],
    requirements?: string
  ): Promise<ScienceSetupOutput> {
    try {
      // Check if venv exists
      if (!existsSync(this.pythonPath)) {
        return {
          success: false,
          message: 'Virtual environment not initialized. Run init action first.',
        };
      }

      let installedPackages: string[] = [];

      // Install from requirements file
      if (requirements) {
        if (!existsSync(requirements)) {
          return {
            success: false,
            message: `Requirements file not found: ${requirements}`,
          };
        }

        await execAsync(
          `"${this.pipPath}" install -r "${requirements}"`,
          { maxBuffer: 10 * 1024 * 1024 }
        );

        // Read packages from requirements
        const content = readFileSync(requirements, 'utf-8');
        installedPackages = content
          .split('\n')
          .filter((line) => line.trim() && !line.startsWith('#'))
          .map((line) => {
            const parts = line.split('==');
            return parts[0]?.trim() || '';
          })
          .filter((pkg) => pkg);
      }

      // Install individual packages
      if (packages.length > 0) {
        await this.installPackages(packages);
        installedPackages.push(...packages);
      }

      // Get updated package list
      const packageList = await this.getInstalledPackages();

      return {
        success: true,
        message: `Successfully installed ${installedPackages.length} package(s).`,
        packages: packageList,
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Failed to install packages: ${error.message}`,
      };
    }
  }

  /**
   * List installed packages
   */
  private async list(): Promise<ScienceSetupOutput> {
    try {
      if (!existsSync(this.pythonPath)) {
        return {
          success: false,
          message: 'Virtual environment not initialized. Run init action first.',
        };
      }

      const packages = await this.getInstalledPackages();

      return {
        success: true,
        message: `Found ${packages.length} installed package(s).`,
        packages,
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Failed to list packages: ${error.message}`,
      };
    }
  }

  /**
   * Reset environment
   */
  private async reset(): Promise<ScienceSetupOutput> {
    try {
      if (existsSync(this.venvPath)) {
        rmSync(this.venvPath, { recursive: true, force: true });
      }

      return {
        success: true,
        message: 'Virtual environment reset successfully. Run init to recreate.',
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Failed to reset environment: ${error.message}`,
      };
    }
  }

  /**
   * Get environment status
   */
  private async status(): Promise<ScienceSetupOutput> {
    try {
      const initialized = existsSync(this.pythonPath);

      if (!initialized) {
        return {
          success: true,
          message: 'Virtual environment not initialized.',
          status: {
            initialized: false,
            packagesInstalled: 0,
            diskUsage: 0,
          },
        };
      }

      // Get Python version
      const versionResult = await execAsync(`"${this.pythonPath}" --version`);
      const pythonVersion = versionResult.stdout.trim();

      // Get installed packages count
      const packages = await this.getInstalledPackages();

      // Get disk usage (approximate)
      const diskUsage = await this.getDiskUsage(this.venvPath);

      return {
        success: true,
        message: 'Virtual environment is initialized and ready.',
        venvPath: this.venvPath,
        pythonVersion,
        packages,
        status: {
          initialized: true,
          packagesInstalled: packages.length,
          diskUsage,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Failed to get status: ${error.message}`,
      };
    }
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  /**
   * Find available Python command
   */
  private async findPythonCommand(): Promise<string | null> {
    const candidates = ['python3', 'python'];

    for (const cmd of candidates) {
      try {
        const { stdout } = await execAsync(`${cmd} --version`);
        const version = stdout.toLowerCase();
        if (version.includes('python 3')) {
          return cmd;
        }
      } catch {
        // Try next candidate
      }
    }

    return null;
  }

  /**
   * Install packages using pip
   */
  private async installPackages(packages: string[]): Promise<void> {
    const packageList = packages.join(' ');
    await execAsync(
      `"${this.pipPath}" install ${packageList}`,
      { maxBuffer: 10 * 1024 * 1024 }
    );
  }

  /**
   * Get list of installed packages
   */
  private async getInstalledPackages(): Promise<
    Array<{ name: string; version: string }>
  > {
    try {
      const { stdout } = await execAsync(`"${this.pipPath}" list --format=json`);
      const packages = JSON.parse(stdout);
      return packages.map((pkg: any) => ({
        name: pkg.name,
        version: pkg.version,
      }));
    } catch {
      return [];
    }
  }

  /**
   * Get disk usage of directory (in bytes)
   */
  private async getDiskUsage(dirPath: string): Promise<number> {
    try {
      const isWindows = process.platform === 'win32';
      const cmd = isWindows
        ? `powershell -Command "(Get-ChildItem -Path '${dirPath}' -Recurse | Measure-Object -Property Length -Sum).Sum"`
        : `du -sb "${dirPath}" | cut -f1`;

      const { stdout } = await execAsync(cmd);
      return parseInt(stdout.trim(), 10) || 0;
    } catch {
      return 0;
    }
  }
}
