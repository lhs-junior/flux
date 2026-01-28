import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import * as path from 'path';
import * as os from 'os';
import type { GitHubRepoInfo } from './github-explorer.js';
import type { MCPServerConfig } from '../core/types.js';
import logger from '../utils/logger.js';

export interface InstallOptions {
  configDir?: string; // Default: ~/.config/awesome-plugin
  installGlobally?: boolean; // Use npm -g or local install
  skipConfirmation?: boolean; // For automated testing
}

export interface InstallResult {
  success: boolean;
  pluginId: string;
  config: MCPServerConfig;
  error?: string;
  installedPackage?: string;
}

// Regex to validate npm package names (including scoped packages)
// Matches: package-name, @scope/package-name, package_name.with-chars~123
const PACKAGE_NAME_REGEX = /^(@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/;

export class PluginInstaller {
  private configDir: string;
  private installGlobally: boolean;

  constructor(options: InstallOptions = {}) {
    this.configDir = options.configDir || path.join(os.homedir(), '.config', 'awesome-plugin');
    this.installGlobally = options.installGlobally ?? false;
  }

  /**
   * Install a plugin from npm package name
   */
  async installFromNpm(packageName: string): Promise<InstallResult> {
    const pluginId = this.generatePluginId(packageName);

    logger.info(`Installing plugin: ${packageName}`);

    try {
      // Install npm package
      await this.runNpmInstall(packageName);

      // Create config directory if it doesn't exist
      await this.ensureConfigDir();

      // Generate MCP server config
      const config = await this.generateConfig(pluginId, packageName);

      // Save config file
      await this.saveConfig(pluginId, config);

      logger.info(`✅ Successfully installed: ${packageName}`);

      return {
        success: true,
        pluginId,
        config,
        installedPackage: packageName,
      };
    } catch (error: any) {
      logger.error(`❌ Failed to install ${packageName}:`, error.message);
      return {
        success: false,
        pluginId,
        config: {} as MCPServerConfig,
        error: error.message,
      };
    }
  }

  /**
   * Install a plugin from GitHub repository
   */
  async installFromGitHub(repo: GitHubRepoInfo): Promise<InstallResult> {
    // Try to install from npm if package.json exists
    if (repo.packageJson?.name) {
      return this.installFromNpm(repo.packageJson.name);
    }

    // Fallback: Install from GitHub URL
    const githubUrl = `github:${repo.fullName}`;
    const pluginId = this.generatePluginId(repo.name);

    logger.info(`Installing plugin from GitHub: ${repo.fullName}`);

    try {
      await this.runNpmInstall(githubUrl);

      await this.ensureConfigDir();

      const config = await this.generateConfig(pluginId, repo.name);

      await this.saveConfig(pluginId, config);

      logger.info(`✅ Successfully installed: ${repo.fullName}`);

      return {
        success: true,
        pluginId,
        config,
        installedPackage: githubUrl,
      };
    } catch (error: any) {
      logger.error(`❌ Failed to install ${repo.fullName}:`, error.message);
      return {
        success: false,
        pluginId,
        config: {} as MCPServerConfig,
        error: error.message,
      };
    }
  }

  /**
   * Uninstall a plugin
   */
  async uninstall(pluginId: string): Promise<boolean> {
    try {
      // Remove config file
      const configPath = path.join(this.configDir, 'servers', `${pluginId}.json`);
      await fs.unlink(configPath);

      logger.info(`✅ Successfully uninstalled: ${pluginId}`);
      return true;
    } catch (error: any) {
      logger.error(`❌ Failed to uninstall ${pluginId}:`, error.message);
      return false;
    }
  }

  /**
   * List installed plugins
   */
  async listInstalled(): Promise<MCPServerConfig[]> {
    try {
      const serversDir = path.join(this.configDir, 'servers');
      const files = await fs.readdir(serversDir);

      const configs: MCPServerConfig[] = [];

      for (const file of files) {
        if (file.endsWith('.json')) {
          const configPath = path.join(serversDir, file);
          const content = await fs.readFile(configPath, 'utf-8');
          const config = JSON.parse(content) as MCPServerConfig;
          configs.push(config);
        }
      }

      return configs;
    } catch (error) {
      return [];
    }
  }

  /**
   * Get plugin config by ID
   */
  async getConfig(pluginId: string): Promise<MCPServerConfig | null> {
    try {
      const configPath = path.join(this.configDir, 'servers', `${pluginId}.json`);
      const content = await fs.readFile(configPath, 'utf-8');
      return JSON.parse(content) as MCPServerConfig;
    } catch {
      return null;
    }
  }

  /**
   * Validate package name to prevent command injection
   */
  private validatePackageName(packageName: string): void {
    // Allow GitHub URLs (github:user/repo format)
    if (packageName.startsWith('github:')) {
      return;
    }

    // Validate npm package name format
    if (!PACKAGE_NAME_REGEX.test(packageName)) {
      throw new Error(
        `Invalid package name: "${packageName}". Package names must only contain lowercase letters, numbers, hyphens, underscores, dots, and tildes. Scoped packages must follow @scope/name format.`
      );
    }
  }

  /**
   * Run npm install command
   */
  private runNpmInstall(packageName: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // Validate package name to prevent command injection
      this.validatePackageName(packageName);

      const args = this.installGlobally
        ? ['install', '-g', packageName]
        : ['install', packageName, '--save'];

      const npm = spawn('npm', args, {
        stdio: 'pipe',
        shell: false,
      });

      let output = '';
      let errorOutput = '';

      npm.stdout?.on('data', (data) => {
        output += data.toString();
        // Show progress
        if (data.toString().includes('progress')) {
          process.stdout.write('.');
        }
      });

      npm.stderr?.on('data', (data) => {
        errorOutput += data.toString();
      });

      npm.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`npm install failed: ${errorOutput || output}`));
        }
      });

      npm.on('error', (error) => {
        reject(new Error(`Failed to spawn npm: ${error.message}`));
      });
    });
  }

  /**
   * Ensure config directory exists
   */
  private async ensureConfigDir(): Promise<void> {
    const serversDir = path.join(this.configDir, 'servers');
    await fs.mkdir(serversDir, { recursive: true });
  }

  /**
   * Generate plugin ID from package name
   */
  private generatePluginId(packageName: string): string {
    // Remove npm scope if present (@scope/package -> package)
    const name = packageName.replace(/^@[^/]+\//, '');
    // Convert to kebab-case and remove special characters
    return name
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  /**
   * Generate MCP server config
   */
  private async generateConfig(pluginId: string, packageName: string): Promise<MCPServerConfig> {
    // Try to find the installed package's entry point
    let command = 'npx';
    let args = [packageName];

    // For global installs, use the package directly
    if (this.installGlobally) {
      command = packageName;
      args = [];
    }

    return {
      id: pluginId,
      name: pluginId,
      command,
      args,
      env: {},
    };
  }

  /**
   * Save config to file
   */
  private async saveConfig(pluginId: string, config: MCPServerConfig): Promise<void> {
    const configPath = path.join(this.configDir, 'servers', `${pluginId}.json`);
    await fs.writeFile(configPath, JSON.stringify(config, null, 2), 'utf-8');
  }

  /**
   * Get config directory path
   */
  getConfigDir(): string {
    return this.configDir;
  }
}
