const fs = require('fs');
const path = require('path');
const child = require('child_process');
const root = path.resolve(__dirname, '..');
const required = ['index.html', 'client.html', 'netlify.toml', 'package.json', 'netlify/functions/workout-board.js'];
for (const item of required) {
  if (!fs.existsSync(path.join(root, item))) throw new Error(`Missing required deployment file: ${item}`);
}
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
if (!pkg.dependencies || pkg.dependencies['@netlify/blobs'] !== '10.7.9') throw new Error('The Netlify Blobs dependency is not pinned correctly.');
const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const client = fs.readFileSync(path.join(root, 'client.html'), 'utf8');
const terms = [String.fromCharCode(106,97,120,114,111,109,97,110), String.fromCharCode(97,120,111,110,50,54), String.fromCharCode(65,100,109,105,110,49,57,57,57)];
for (const term of terms) {
  if (index.includes(term) || client.includes(term)) throw new Error('A static login value was found in deploy output.');
}
function inlineJsSyntax(file) {
  const html = fs.readFileSync(file, 'utf8');
  const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/gi)].map(m => m[1]);
  scripts.forEach((script, i) => {
    const candidate = path.join(root, `.verify-inline-${i}.js`);
    fs.writeFileSync(candidate, script);
    try { child.execFileSync(process.execPath, ['--check', candidate], { stdio: 'pipe' }); }
    finally { fs.rmSync(candidate, { force: true }); }
  });
}
inlineJsSyntax(path.join(root, 'index.html'));
inlineJsSyntax(path.join(root, 'client.html'));
child.execFileSync(process.execPath, ['--check', path.join(root, 'netlify/functions/workout-board.js')], { stdio: 'pipe' });
console.log('[verify] Admin dashboard, client portal, and single shared-board Function are ready.');
