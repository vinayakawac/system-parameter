#!/usr/bin/env node
// Scans current tracked and unignored files (or staged content) for credentials and
// confidential material. Zero dependencies; safe to run anywhere git is.
//
//   node scripts/check-secrets.mjs            # tracked and unignored new files
//   node scripts/check-secrets.mjs --staged   # files staged for commit (pre-commit hook)
//
// Matches are reported by file, line and category. The matching text itself
// is masked so this script never echoes a secret into a terminal or CI log.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const staged = process.argv.includes('--staged');
const git = (args, options = {}) => execFileSync('git', args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, ...options });
const root = git(['rev-parse', '--show-toplevel']).trim();
const paths = output => output.split('\0').filter(Boolean);
const files = [...new Set(paths(staged
  ? git(['diff', '--cached', '--name-only', '-z', '--diff-filter=ACMR'], { cwd: root })
  : git(['ls-files', '-z', '--cached', '--others', '--exclude-standard'], { cwd: root })))];

// 1. Paths that must never be committed, regardless of content.
const forbiddenPaths = [
  { test: /(^|\/)\.?npmrc$/i, reason: 'npm registry credentials file' },
  { test: /(^|\/)\.env(\..+)?$/i, allow: /\.example$/i, reason: 'environment file' },
  { test: /(^|\/)(\.netrc|_netrc)$/i, reason: 'network credentials file' },
  { test: /\.(pem|key|p12|pfx|jks|keystore)$/i, reason: 'private key material' },
  { test: /(^|\/)(rxd-design-system|\.rxd-design|\.rxd-desgin|design-references|prd|private|confidential)\//i, reason: 'private design reference or product document' },
  { test: /(^|\/)\.playwright-mcp\//i, reason: 'local browser verification artifact' },
];

// 2. Content patterns. Keep each anchored enough that ordinary source and
//    lockfiles (registry URLs, integrity hashes) do not trip them.
const patterns = [
  ['npm auth token', /:_authToken\s*=[ \t]*(?!\$\{[A-Z_][A-Z0-9_]*\}(?:[ \t]*$))[^\s]+/i],
  ['npm registry password', /:_password\s*=\s*\S+/i],
  ['npm registry basic auth', /:_auth\s*=\s*\S+/i],
  ['GitHub token', /\b(ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{36,}\b/],
  ['GitHub fine-grained token', /\bgithub_pat_[A-Za-z0-9_]{22,}\b/],
  ['npm access token', /\bnpm_[A-Za-z0-9]{36}\b/],
  ['AWS access key id', /\bAKIA[0-9A-Z]{16}\b/],
  ['Google API key', /\bAIza[0-9A-Za-z_-]{35}\b/],
  ['Slack token', /\bxox[abprs]-[A-Za-z0-9-]{10,}\b/],
  ['API secret key', /\bsk-(ant-)?[A-Za-z0-9_-]{20,}\b/],
  ['Azure DevOps personal access token', /\b[a-z2-7]{52}\b/],
  ['Private key block', /-----BEGIN (RSA |EC |DSA |OPENSSH |PGP )?PRIVATE KEY( BLOCK)?-----/],
  ['JSON web token', /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/],
  ['Credentials embedded in a URL', /\b[a-z][a-z0-9+.-]*:\/\/[^\s/:@'"`]+:[^\s/@'"`]+@[^\s'"`]+/i],
  ['Hard-coded secret assignment', /\b(api[_-]?key|client[_-]?secret|secret|password|passwd|access[_-]?token|auth[_-]?token)\b\s*[:=]\s*["'`][^"'`\s]{8,}["'`]/i],
];

const isBinary = buffer => buffer.subarray(0, 8000).includes(0);
const contentOf = file => (staged ? execFileSync('git', ['show', `:${file}`], { cwd: root, maxBuffer: 64 * 1024 * 1024 }) : readFileSync(resolve(root, file)));

const problems = [];
let scanned = 0;
let binaryFiles = 0;
for (const file of files) {
  for (const rule of forbiddenPaths) {
    if (rule.test.test(file) && !(rule.allow && rule.allow.test(file))) problems.push({ file, message: `${rule.reason} must not be committed` });
  }
  let buffer;
  try { buffer = contentOf(file); } catch (error) {
    // Deleted working-tree files are not part of the next commit. Other read
    // failures must not silently turn an incomplete scan into a passing check.
    if (!staged && error.code === 'ENOENT') continue;
    problems.push({ file, message: 'unable to read file for credential scan' });
    continue;
  }
  if (isBinary(buffer)) { binaryFiles++; continue; }
  scanned++;
  const text = buffer.toString('utf8').split(/\r?\n/);
  text.forEach((line, index) => {
    for (const [label, pattern] of patterns) {
      const match = line.match(pattern);
      if (match) problems.push({ file, line: index + 1, message: label });
    }
  });
}

// 3. Files that are tracked even though .gitignore now excludes them.
if (!staged) {
  for (const file of paths(git(['ls-files', '-z', '--cached', '--ignored', '--exclude-standard'], { cwd: root }))) {
    problems.push({ file, message: 'tracked file matches .gitignore; remove it from the index with `git rm --cached`' });
  }
}

if (problems.length) {
  console.error(`check-secrets: ${problems.length} problem${problems.length === 1 ? '' : 's'} found in ${staged ? 'staged' : 'working-tree'} files.\n`);
  for (const problem of problems) console.error(`  ${JSON.stringify(problem.file)}${problem.line ? `:${problem.line}` : ''}  ${problem.message}`);
  console.error('\nRemove the confidential content (or unstage the file) and try again.');
  process.exit(1);
}
console.log(`check-secrets: ${scanned} ${staged ? 'staged' : 'working-tree'} text files scanned; no credential patterns or confidential paths found. ${binaryFiles} binary files not content-scanned.`);
