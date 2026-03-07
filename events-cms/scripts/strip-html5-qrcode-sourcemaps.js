/**
 * One-time script: removes //# sourceMappingURL lines from html5-qrcode
 * so source-map-loader won't try to load missing .ts sources.
 * Run: npm run create-html5-qrcode-patch
 */
const fs = require('fs');
const path = require('path');

const pkgDir = path.join(__dirname, '..', 'node_modules', 'html5-qrcode');
const sourceMapRegex = /^\s*\/\/#\s*sourceMappingURL=.*$/m;

function getAllJsFiles(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) getAllJsFiles(full, files);
    else if (e.name.endsWith('.js')) files.push(full);
  }
  return files;
}

const jsFiles = [...getAllJsFiles(path.join(pkgDir, 'esm')), ...getAllJsFiles(path.join(pkgDir, 'cjs'))];
let changed = 0;
for (const file of jsFiles) {
  let content = fs.readFileSync(file, 'utf8');
  if (sourceMapRegex.test(content)) {
    content = content.replace(sourceMapRegex, '').replace(/\n\n$/, '\n');
    fs.writeFileSync(file, content, 'utf8');
    changed++;
  }
}
console.log(`Removed sourceMappingURL from ${changed} file(s) in html5-qrcode. Run: npx patch-package html5-qrcode`);
