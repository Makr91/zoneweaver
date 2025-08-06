#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

/**
 * Synchronize version between root package.json, web/package.json, and web/.env
 * This ensures both frontend and backend always have the same version
 */

const rootPackagePath = './package.json';
const webPackagePath = './web/package.json';
const webEnvPath = './web/.env';

try {
  // Read root package.json
  const rootPackage = JSON.parse(fs.readFileSync(rootPackagePath, 'utf8'));
  const rootVersion = rootPackage.version;
  
  // Read web package.json
  const webPackage = JSON.parse(fs.readFileSync(webPackagePath, 'utf8'));
  
  // Update web package version to match root
  webPackage.version = rootVersion;
  
  // Write back to web package.json
  fs.writeFileSync(webPackagePath, JSON.stringify(webPackage, null, 2) + '\n');
  
  console.log(`✅ Synchronized versions to ${rootVersion}`);
  console.log(`   - Root: ${rootVersion}`);
  console.log(`   - Web:  ${rootVersion}`);
  console.log(`   - Vite: Using define to inject version at build time`);
  
} catch (error) {
  console.error('❌ Error synchronizing versions:', error.message);
  process.exit(1);
}
