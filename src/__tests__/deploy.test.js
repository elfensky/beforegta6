import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterEach, expect, test } from 'vitest';

const script = resolve('scripts/pin-image.sh');
const directories = [];
const repository = 'elfensky/beforegta6';
const oldPin = '1'.repeat(40);
const otherPin = '2'.repeat(40);

afterEach(() => {
  for (const directory of directories.splice(0))
    rmSync(directory, { recursive: true, force: true });
});

function git(cwd, ...args) {
  const result = spawnSync('git', args, { cwd, encoding: 'utf8' });
  if (result.status !== 0) throw new Error(result.stderr);
  return result.stdout.trim();
}

function compose(pin, replicas = 2) {
  return `services:\n  web:\n    image: ghcr.io/${repository}:sha-${pin}\n    deploy:\n      replicas: ${replicas}\n`;
}

function fixture(branch = 'develop') {
  const root = mkdtempSync(join(tmpdir(), 'beforegta6-pin-'));
  directories.push(root);
  const remote = join(root, 'remote.git');
  const checkout = join(root, 'checkout');
  git(root, 'init', '--bare', remote);
  git(root, 'clone', remote, checkout);
  git(checkout, 'config', 'user.name', 'Fixture');
  git(checkout, 'config', 'user.email', 'fixture@example.test');
  git(checkout, 'checkout', '-b', branch);
  for (const environment of ['staging', 'production']) {
    mkdirSync(join(checkout, 'deploy', environment), { recursive: true });
    writeFileSync(join(checkout, 'deploy', environment, 'compose.yaml'), compose(oldPin));
  }
  git(checkout, 'add', '.');
  git(checkout, 'commit', '-m', 'Initial config');
  const target = branch === 'main' ? 'deploy/production' : 'deploy/staging';
  git(checkout, 'push', 'origin', `${branch}:${target}`);
  // Source pins differ from deployment pins. Configuration must propagate without copying these tags.
  writeFileSync(join(checkout, 'deploy/staging/compose.yaml'), compose(otherPin, 3));
  writeFileSync(join(checkout, 'deploy/production/compose.yaml'), compose(otherPin, 4));
  git(checkout, 'add', '.');
  git(checkout, 'commit', '-m', 'Change config');
  git(checkout, 'push', 'origin', branch);
  const sha = git(checkout, 'rev-parse', 'HEAD');
  return { root, remote, checkout, branch, target, sha };
}

function pin(f, overrides = {}) {
  return spawnSync('bash', [script], {
    cwd: f.checkout,
    encoding: 'utf8',
    env: { ...process.env, SHA: f.sha, REPO: repository, BRANCH: f.branch, ...overrides },
  });
}

function remoteFile(f, path, ref = f.target) {
  return git(f.remote, 'show', `${ref}:${path}`);
}

test.each([
  ['develop', 'staging', 'production', 3],
  ['main', 'production', 'staging', 4],
])('%s deploys only through its dedicated branch', (branch, environment, other, replicas) => {
  const f = fixture(branch);
  git(f.checkout, 'checkout', '--detach', f.sha);
  const result = pin(f);
  expect(result.status, result.stdout + result.stderr).toBe(0);
  expect(git(f.remote, 'rev-parse', branch)).toBe(f.sha);
  expect(git(f.checkout, 'rev-parse', 'HEAD')).toBe(f.sha);
  expect(remoteFile(f, `deploy/${environment}/compose.yaml`)).toBe(compose(f.sha, replicas).trim());
  expect(remoteFile(f, `deploy/${other}/compose.yaml`)).toBe(
    compose(oldPin, other === 'production' ? 4 : 3).trim(),
  );
  expect(git(f.remote, 'log', '-1', '--format=%B', f.target)).not.toMatch(/\[skip ci\]/);
});

test('an already-pinned build creates no additional deployment commit', () => {
  const f = fixture();
  expect(pin(f).status).toBe(0);
  const first = git(f.remote, 'rev-parse', f.target);
  const result = pin(f);
  expect(result.status, result.stdout + result.stderr).toBe(0);
  expect(result.stdout).toContain('already pinned');
  expect(git(f.remote, 'rev-parse', f.target)).toBe(first);
});

test('source checkout changes survive pinning', () => {
  const f = fixture();
  const path = join(f.checkout, 'deploy/staging/compose.yaml');
  writeFileSync(path, 'local edits\n');
  writeFileSync(join(f.checkout, 'untracked'), 'keep\n');
  const result = pin(f);
  expect(result.status, result.stdout + result.stderr).toBe(0);
  expect(readFileSync(path, 'utf8')).toBe('local edits\n');
  expect(readFileSync(join(f.checkout, 'untracked'), 'utf8')).toBe('keep\n');
  expect(remoteFile(f, 'deploy/staging/compose.yaml')).toBe(compose(f.sha, 3).trim());
});

test.each([
  ['unknown source', { BRANCH: 'feature/test' }],
  ['wrong deployment target', { TARGET_BRANCH: 'deploy/production' }],
  ['unknown environment', { ENVIRONMENT: 'preview' }],
  ['malformed SHA', { SHA: '../main' }],
  ['malformed repository', { REPO: 'elfensky/beforegta6.*' }],
])('rejects %s without changing remote branches', (_, overrides) => {
  const f = fixture();
  const before = git(f.remote, 'show-ref');
  const result = pin(f, overrides);
  expect(result.status).not.toBe(0);
  expect(git(f.remote, 'show-ref')).toBe(before);
});

test('a missing deployment branch fails with a seeding instruction', () => {
  const f = fixture();
  git(f.remote, 'update-ref', '-d', `refs/heads/${f.target}`);
  const result = pin(f);
  expect(result.status).not.toBe(0);
  expect(result.stdout + result.stderr).toMatch(/seed.*deploy\/staging/i);
  expect(git(f.remote, 'rev-parse', f.branch)).toBe(f.sha);
});

test('an older build cannot replace a deployment after its source branch advances', () => {
  const f = fixture();
  writeFileSync(join(f.checkout, 'index.html'), '<p>New build input</p>\n');
  git(f.checkout, 'add', '.');
  git(f.checkout, 'commit', '-m', 'Newer build');
  git(f.checkout, 'push', 'origin', f.branch);
  const before = git(f.remote, 'rev-parse', f.target);
  const result = pin(f);
  expect(result.status, result.stdout + result.stderr).toBe(0);
  expect(result.stdout).toMatch(/stale build/i);
  expect(git(f.remote, 'rev-parse', f.target)).toBe(before);
});

test.each(['README.md', 'docs/design.md', 'research/candidates.json', '.planning/STATE.md'])(
  'a newer %s change does not suppress a pending image deployment',
  (path) => {
    const f = fixture();
    mkdirSync(join(f.checkout, path, '..'), { recursive: true });
    writeFileSync(join(f.checkout, path), 'Ignored build input\n');
    git(f.checkout, 'add', '.');
    git(f.checkout, 'commit', '-m', 'Docs change');
    git(f.checkout, 'push', 'origin', f.branch);
    const newer = git(f.remote, 'rev-parse', f.branch);
    const result = pin(f);
    expect(result.status, result.stdout + result.stderr).toBe(0);
    expect(remoteFile(f, 'deploy/staging/compose.yaml')).toBe(compose(f.sha, 3).trim());
    expect(git(f.remote, 'rev-parse', f.branch)).toBe(newer);
  },
);

test('a newer content-card Markdown change makes the pending image stale', () => {
  const f = fixture();
  mkdirSync(join(f.checkout, 'src/content/cards'), { recursive: true });
  writeFileSync(join(f.checkout, 'src/content/cards/new.md'), 'New card\n');
  git(f.checkout, 'add', '.');
  git(f.checkout, 'commit', '-m', 'Add card');
  git(f.checkout, 'push', 'origin', f.branch);
  const before = git(f.remote, 'rev-parse', f.target);
  const result = pin(f);
  expect(result.status, result.stdout + result.stderr).toBe(0);
  expect(result.stdout).toMatch(/stale build/i);
  expect(git(f.remote, 'rev-parse', f.target)).toBe(before);
});

test('a built commit outside the source ancestry cannot deploy', () => {
  const f = fixture();
  const tree = git(f.checkout, 'rev-parse', `${f.sha}^{tree}`);
  const unrelated = git(f.checkout, 'commit-tree', tree, '-m', 'Unrelated build');
  const before = git(f.remote, 'rev-parse', f.target);
  const result = pin(f, { SHA: unrelated });
  expect(result.status, result.stdout + result.stderr).toBe(0);
  expect(result.stdout).toMatch(/stale build/i);
  expect(git(f.remote, 'rev-parse', f.target)).toBe(before);
});

test('an older rerun cannot replace an already-pinned docs-only descendant', () => {
  const f = fixture();
  writeFileSync(join(f.checkout, 'README.md'), 'New docs\n');
  git(f.checkout, 'add', '.');
  git(f.checkout, 'commit', '-m', 'Newer docs');
  git(f.checkout, 'push', 'origin', f.branch);
  const newer = git(f.checkout, 'rev-parse', 'HEAD');
  expect(pin(f, { SHA: newer }).status).toBe(0);
  const before = git(f.remote, 'rev-parse', f.target);
  const result = pin(f);
  expect(result.status, result.stdout + result.stderr).toBe(0);
  expect(result.stdout).toMatch(/stale build/i);
  expect(git(f.remote, 'rev-parse', f.target)).toBe(before);
});

test('a missing source image line fails instead of reporting already pinned', () => {
  const f = fixture();
  writeFileSync(join(f.checkout, 'deploy/staging/compose.yaml'), 'services: {}\n');
  git(f.checkout, 'commit', '-am', 'Remove image');
  git(f.checkout, 'push', 'origin', f.branch);
  f.sha = git(f.checkout, 'rev-parse', 'HEAD');
  const before = git(f.remote, 'rev-parse', f.target);
  const result = pin(f);
  expect(result.status).not.toBe(0);
  expect(result.stdout + result.stderr).toMatch(/image.*line/i);
  expect(git(f.remote, 'rev-parse', f.target)).toBe(before);
});

test('a target push race retries from the new target tip without losing its commit', () => {
  const f = fixture();
  const previous = git(f.remote, 'rev-parse', f.target);
  const tree = git(f.remote, 'rev-parse', `${f.target}^{tree}`);
  const race = git(
    f.checkout,
    '-c',
    'user.name=Fixture',
    'commit-tree',
    tree,
    '-p',
    previous,
    '-m',
    'Concurrent pin',
  );
  git(f.checkout, 'push', 'origin', `${race}:refs/heads/race-fixture`);
  const hook = join(f.checkout, '.git/hooks/pre-push');
  writeFileSync(
    hook,
    `#!/usr/bin/env bash\nrm '${hook}'\ngit --git-dir='${f.remote}' update-ref refs/heads/${f.target} ${race} ${previous}\n`,
    { mode: 0o755 },
  );
  const result = pin(f);
  expect(result.status, result.stdout + result.stderr).toBe(0);
  expect(result.stdout).toContain('attempt 2/3');
  expect(git(f.remote, 'rev-parse', `${f.target}^`)).toBe(race);
  expect(remoteFile(f, 'deploy/staging/compose.yaml')).toBe(compose(f.sha, 3).trim());
});

test('a newer build observed during a push retry prevents the older image from deploying', () => {
  const f = fixture();
  const previous = git(f.remote, 'rev-parse', f.target);
  const tree = git(f.remote, 'rev-parse', `${f.target}^{tree}`);
  const race = git(f.checkout, 'commit-tree', tree, '-p', previous, '-m', 'Concurrent pin');
  writeFileSync(join(f.checkout, 'index.html'), '<p>Newer source</p>\n');
  git(f.checkout, 'add', '.');
  git(f.checkout, 'commit', '-m', 'Newer source');
  const newer = git(f.checkout, 'rev-parse', 'HEAD');
  git(
    f.checkout,
    'push',
    'origin',
    `${newer}:refs/heads/race-source`,
    `${race}:refs/heads/race-target`,
  );
  const hook = join(f.checkout, '.git/hooks/pre-push');
  writeFileSync(
    hook,
    `#!/usr/bin/env bash\nrm '${hook}'\ngit --git-dir='${f.remote}' update-ref refs/heads/${f.target} ${race} ${previous}\ngit --git-dir='${f.remote}' update-ref refs/heads/${f.branch} ${newer} ${f.sha}\n`,
    { mode: 0o755 },
  );
  const result = pin(f);
  expect(result.status, result.stdout + result.stderr).toBe(0);
  expect(result.stdout).toMatch(/stale build/i);
  expect(git(f.remote, 'rev-parse', f.target)).toBe(race);
  expect(git(f.remote, 'rev-parse', f.branch)).toBe(newer);
});

test('repeated push rejection fails without changing the remote deployment', () => {
  const f = fixture();
  const before = git(f.remote, 'show-ref');
  writeFileSync(join(f.checkout, '.git/hooks/pre-push'), '#!/usr/bin/env bash\nexit 1\n', {
    mode: 0o755,
  });
  const result = pin(f);
  expect(result.status).not.toBe(0);
  expect(result.stdout + result.stderr).toContain('after 3 attempts');
  expect(git(f.remote, 'show-ref')).toBe(before);
  expect(git(f.checkout, 'worktree', 'list', '--porcelain')).not.toContain('detached');
});

test.each(['services: {}\n', `${compose(oldPin)}${compose(oldPin)}`])(
  'a missing or duplicate deployment image line fails without committing',
  (contents) => {
    const f = fixture();
    git(f.checkout, 'checkout', '--detach', `origin/${f.target}`);
    writeFileSync(join(f.checkout, 'deploy/staging/compose.yaml'), contents);
    git(f.checkout, 'commit', '-am', 'Broken target image');
    git(f.checkout, 'push', 'origin', `HEAD:refs/heads/${f.target}`);
    const before = git(f.remote, 'show-ref');
    const result = pin(f);
    expect(result.status).not.toBe(0);
    expect(result.stdout + result.stderr).toMatch(/image.*line/i);
    expect(git(f.remote, 'show-ref')).toBe(before);
  },
);

test('the CSP lets forms post to Formspark and its error page', () => {
  const csp = readFileSync('deploy/nginx.conf', 'utf8').match(
    /Content-Security-Policy "([^"]+)"/,
  )?.[1];
  expect(csp).toContain(
    "form-action 'self' https://submit-form.com https://submitted.formspark.io;",
  );
});
