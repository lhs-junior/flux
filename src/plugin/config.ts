import * as path from 'path';
import * as os from 'os';

export interface PluginConfig {
  dbPath: string;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

/**
 * Load configuration from environment variables and defaults
 */
export function loadConfig(options?: Partial<PluginConfig>): PluginConfig {
  const dbPath = options?.dbPath ||
    process.env.AWESOME_PLUGIN_DB_PATH ||
    path.join(os.homedir(), '.awesome-plugin', 'data.db');

  const logLevel = (options?.logLevel ||
    process.env.AWESOME_PLUGIN_LOG_LEVEL ||
    'info') as PluginConfig['logLevel'];

  return {
    dbPath,
    logLevel
  };
}
