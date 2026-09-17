import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scanner = fileURLToPath(new URL('./check-secrets.mjs', import.meta.url));
const fakeToken = ['ghp', '_', 'A'.repeat(36)].join('');
function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'system-parameter-scan-'));
  t.after(() => {
    assert.equal(dirname(resolve(root)), resolve(tmpdir()));
    assert.ok(basename(root).startsWith('system-parameter-scan-'));
    rmSync(root, { recursive: true, force: true });
  });
  const git = (...args) => execFileSync('git', args, { cwd: root, stdio: 'pipe' });
  git('init', '--quiet');
  const write = (name, text) => writeFileSync(join(root, name), text);
  const scan = (...args) => spawnSync(process.execPath, [scanner, ...args], { cwd: root, encoding: 'utf8' });
  return { git, write, scan };
}

test('scans clean untracked source without requiring a commit', t => {
  const f = fixture(t);
  f.write('app.js', 'export const version = 1;');
  const result = f.scan();
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /1 working-tree text files scanned/);
});

test('blocks a token in an untracked Unicode filename without echoing it', t => {
  const f = fixture(t);
  f.write('résumé 参数.txt', fakeToken);
  const result = f.scan();
  assert.equal(result.status, 1);
  assert.match(result.stderr, /résumé 参数\.txt/);
  assert.match(result.stderr, /GitHub token/);
  assert.ok(!result.stderr.includes(fakeToken));
});

test('scans the staged blob even when the working copy was cleaned', t => {
  const f = fixture(t);
  f.write('config.txt', fakeToken);
  f.git('add', '--', 'config.txt');
  f.write('config.txt', 'clean working copy');
  assert.equal(f.scan('--staged').status, 1);
  assert.equal(f.scan().status, 0);
});

test('blocks force-staged credentials paths even without a token', t => {
  const f = fixture(t);
  f.write('.gitignore', 'npmrc\n');
  f.write('npmrc', 'registry=https://registry.npmjs.org/');
  f.git('add', '--force', '--', 'npmrc');
  const result = f.scan('--staged');
  assert.equal(result.status, 1);
  assert.match(result.stderr, /npm registry credentials file/);
});

test('does not read ignored local credentials', t => {
  const f = fixture(t);
  f.write('.gitignore', '.env\n');
  f.write('.env', fakeToken);
  const result = f.scan();
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /1 working-tree text files scanned/);
});

test('does not silently skip text files over two megabytes', t => {
  const f = fixture(t);
  f.write('large.txt', '#'.repeat(2 * 1024 * 1024) + '\n' + fakeToken);
  assert.equal(f.scan().status, 1);
});

test('allows npm environment placeholders but blocks literal or appended credentials', t => {
  const f = fixture(t);
  const prefix = ['//npm.pkg.github.com/', ':_authToken', '='].join('');
  f.write('.npmrc.example', prefix + '${NODE_AUTH_TOKEN}\n');
  assert.equal(f.scan().status, 0);
  f.write('.npmrc.example', prefix + '  literal-registry-credential\n');
  assert.equal(f.scan().status, 1);
  f.write('.npmrc.example', prefix + '${NODE_AUTH_TOKEN}extra\n');
  assert.equal(f.scan().status, 1);
});
