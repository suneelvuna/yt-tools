/**
 * YT Tools Project Verification Test Suite
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const filesToTest = [
  'server.js',
  'sw.js',
  'js/app.js',
  'js/youtube-tools.js'
];

let passed = 0;
let failed = 0;

filesToTest.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (!fs.existsSync(filePath)) {
    console.error(`[FAIL] File missing: ${file}`);
    failed++;
    return;
  }

  try {
    const code = fs.readFileSync(filePath, 'utf8');
    new vm.Script(code);
    console.log(`[PASS] ${file}`);
    passed++;
  } catch (err) {
    console.error(`[FAIL] ${file}:`, err.message);
    failed++;
  }
});

console.log(`\nVerification summary: ${passed} passed, ${failed} failed.`);
if (failed > 0) process.exit(1);
