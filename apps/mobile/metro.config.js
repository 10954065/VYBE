// Learn more: https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// In this monorepo Metro watches the whole workspace, including apps/web's
// Next.js build output. Next rewrites .next/ constantly while its dev server
// runs, and Metro's file watcher crashed on one of those writes (an `lstat`
// of a malformed path), taking the Expo dev server down. Nothing in .next is
// ever imported by the app, so it's excluded from watching and resolution.
const workspaceRoot = path.resolve(__dirname, '../..');
const escapeForRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const nextBuildDir = escapeForRegExp(path.join(workspaceRoot, 'apps', 'web', '.next'));

config.resolver.blockList = [
  ...[].concat(config.resolver.blockList ?? []),
  new RegExp(`^${nextBuildDir}[\\\\/].*`),
];

module.exports = config;
