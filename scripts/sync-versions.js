#!/usr/bin/env node

import fs from 'fs';

/**
 * Synchronize the server version across its swagger config, production config,
 * the local dev config, and the release-please manifest.
 */

const rootPackagePath = './package.json';
const swaggerConfigPath = './config/swagger.js';
const productionConfigPath = './packaging/config/production-config.yaml';
const devConfigPath = './config.yaml';
const releasePleaseManifestPath = './.release-please-manifest.json';

try {
  // Read root package.json (single source of truth)
  const rootPackage = JSON.parse(fs.readFileSync(rootPackagePath, 'utf8'));
  const rootVersion = rootPackage.version;

  // Update swagger config
  let swaggerConfig = fs.readFileSync(swaggerConfigPath, 'utf8');
  swaggerConfig = swaggerConfig.replace(
    /version:\s*['"`][^'"`]*['"`]/g,
    `version: '${rootVersion}'`
  );
  fs.writeFileSync(swaggerConfigPath, swaggerConfig);

  // 4. Update production config (if exists)
  if (fs.existsSync(productionConfigPath)) {
    let productionConfig = fs.readFileSync(productionConfigPath, 'utf8');
    productionConfig = productionConfig.replace(
      /(?<prefix>version:[^\S\n]*\n[^\S\n]+value:[^\S\n]*)[^\n]*/,
      `$<prefix>${rootVersion} # x-release-please-version`
    );
    fs.writeFileSync(productionConfigPath, productionConfig);
  }

  // 5. Update the local dev config (gitignored — present on dev checkouts, absent in CI)
  if (fs.existsSync(devConfigPath)) {
    let devConfig = fs.readFileSync(devConfigPath, 'utf8');
    devConfig = devConfig.replace(
      /(?<prefix>version:[^\S\n]*\n[^\S\n]+value:[^\S\n]*)[^\n]*/,
      `$<prefix>${rootVersion}`
    );
    fs.writeFileSync(devConfigPath, devConfig);
  }

  // 6. Update release-please manifest (if exists)
  if (fs.existsSync(releasePleaseManifestPath)) {
    const releasePleaseManifest = JSON.parse(fs.readFileSync(releasePleaseManifestPath, 'utf8'));
    releasePleaseManifest['.'] = rootVersion;
    fs.writeFileSync(
      releasePleaseManifestPath,
      `${JSON.stringify(releasePleaseManifest, null, 2)}\n`
    );
  }

  console.log(`✅ Synchronized versions to ${rootVersion}`);
  console.log(`   - Root: ${rootVersion}`);
  console.log(`   - Swagger: ${rootVersion}`);
  console.log(`   - Production Config: ${rootVersion}`);
  console.log(
    `   - Dev Config: ${fs.existsSync(devConfigPath) ? rootVersion : 'not present (CI)'}`
  );
  console.log(`   - Release Please Manifest: ${rootVersion}`);
  console.log(`   - Vite: Using define to inject version at build time`);
} catch (error) {
  console.error('❌ Error synchronizing versions:', error.message);
  process.exit(1);
}
