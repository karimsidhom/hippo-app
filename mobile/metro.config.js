// Metro config — bare workflow compatible with expo-router.
// The `watchFolders` entry lets Metro resolve symlinks into the web
// app's `src/lib/shared/` so the mobile app can import Zod schemas,
// EPA data, and API types directly from the Next.js codebase without
// a publish step. (Phase 2: promote to a proper monorepo with pnpm
// workspaces so `@hippo/shared` resolves via package.json instead.)

const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '..');

const config = getDefaultConfig(projectRoot);

// Watch the web app's src/lib for live shared-code updates.
config.watchFolders = [path.resolve(workspaceRoot, 'src', 'lib')];

// Resolve node_modules from mobile/ first, then the repo root (useful
// once hoisted deps exist).
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// Don't bundle the .web.tsx variants on native builds.
config.resolver.sourceExts = ['tsx', 'ts', 'jsx', 'js', 'json', 'cjs', 'mjs'];

module.exports = config;
