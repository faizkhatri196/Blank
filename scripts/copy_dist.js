const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'client', 'dist');
const destDir = path.join(__dirname, '..', 'dist');

if (fs.existsSync(srcDir)) {
  fs.cpSync(srcDir, destDir, { recursive: true });
  console.log(`[Vercel Deploy Helper] Synced client build to root dist/ (${srcDir} -> ${destDir})`);
} else {
  console.warn(`[Vercel Deploy Helper] Warning: client dist folder not found at ${srcDir}`);
}
