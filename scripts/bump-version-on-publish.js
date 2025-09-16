#!/usr/bin/env node

// Auto-bump patch version if current version already exists on npm
import { readFileSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import path from 'node:path';

const pkgPath = path.resolve(process.cwd(), 'package.json');
const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));

const name = pkg.name;
const current = pkg.version;

function versionExists(name, version) {
  try {
    const out = execSync(`npm view ${name}@${version} version`, { stdio: ['ignore', 'pipe', 'ignore']}).toString().trim();
    return Boolean(out);
  } catch {
    return false;
  }
}

function bumpPatch(version) {
  const [major, minor, patchWithTag] = version.split('.');
  const patch = parseInt(patchWithTag || '0', 10) + 1;
  return `${major}.${minor}.${patch}`;
}

let next = current;
let guard = 0;
while (versionExists(name, next)) {
  next = bumpPatch(next);
  guard++;
  if (guard > 50) {
    console.error('Too many version bumps attempted. Aborting.');
    process.exit(1);
  }
}

if (next !== current) {
  pkg.version = next;
  writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
  console.log(`Version bumped: ${current} -> ${next}`);
} else {
  console.log(`Version ${current} not found on npm. Keeping as is.`);
}


