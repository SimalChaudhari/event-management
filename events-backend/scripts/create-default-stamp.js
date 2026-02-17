/**
 * Creates a default stamp placeholder image if it doesn't exist.
 * Run: node scripts/create-default-stamp.js
 */
const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '..', 'uploads', 'defaults');
const filePath = path.join(dir, 'default.png');

// 1x1 transparent PNG (minimal valid PNG)
const PNG_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
const buffer = Buffer.from(PNG_BASE64, 'base64');

if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}
if (!fs.existsSync(filePath)) {
  fs.writeFileSync(filePath, buffer);
  console.log('Created default stamp placeholder:', filePath);
} else {
  console.log('Default stamp placeholder already exists:', filePath);
}
