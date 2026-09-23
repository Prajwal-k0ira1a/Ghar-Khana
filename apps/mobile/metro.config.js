const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

// 1. Find the project and workspace directories
const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// 2. Watch all files within the monorepo (merge with Expo defaults, don't overwrite)
if (!config.watchFolders.includes(monorepoRoot)) {
  config.watchFolders.push(monorepoRoot);
}

// 3. Let Metro know where to resolve packages and in what order
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

module.exports = config;
