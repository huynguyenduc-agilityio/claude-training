import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const hook = fileURLToPath(new URL('./block-forbidden.mjs', import.meta.url));

const run = (input) =>
  spawnSync(process.execPath, [hook], { input, encoding: 'utf8' });
const call = (tool_name, tool_input) => run(JSON.stringify({ tool_name, tool_input }));
const bash = (command) => call('Bash', { command });
const read = (file_path) => call('Read', { file_path });

const PNPM = 'Use pnpm (CLAUDE.md): pnpm, pnpm exec, pnpm dlx';
const ENV = 'CLAUDE.md forbids reading or printing .env files';
const FORCE = 'Force push is not allowed; ask the user';
const HOOKS = 'Do not skip git hooks; fix the cause';
const AI = 'CLAUDE.md forbids AI attribution';
const trailer = 'feat: x\n\nCo-Authored-By: Claude <noreply@anthropic.com>';

const blocked = [
  ...[
    'npm test', 'yarn add x', 'npx vitest', 'pnpm test && npm run x', 'cd app; npm i',
    'FOO=1 npm test', 'ls | npm x', '& npm test', 'npm.cmd test', 'npx.cmd vitest',
    'yarn.cmd add x', 'FOO=1 BAR=2 yarn x', 'echo hi\nnpm test', 'echo $(npm root)',
  ].map((c) => [c, bash(c), PNPM]),
  ...[
    'cat .env', 'cat app/server/.env', 'Get-Content .env.local', 'type .env',
    'head -5 ".env"', 'grep KEY app/server/.env', 'cat .env.production',
    'git commit -m "x" && cat .env',
  ].map((c) => [c, bash(c), ENV]),
  ['PowerShell Get-Content .env.local', call('PowerShell', { command: 'Get-Content .env.local' }), ENV],
  ['PowerShell npm test', call('PowerShell', { command: 'npm test' }), PNPM],
  ['Read D:\\x\\.env', read('D:\\x\\.env'), ENV],
  ['Read /x/.env.production', read('/x/.env.production'), ENV],
  ...[
    'git push --force', 'git push -f origin main', 'git push --force-with-lease',
    'git -c a=b push -f', 'git push -uf origin x', 'git -C app push --force origin x',
  ].map((c) => [c, bash(c), FORCE]),
  ...[
    'git commit --no-verify -m x', 'git commit -n -m x', 'git commit -an -m x',
    'git -c a=b commit -n -m x',
  ].map((c) => [c, bash(c), HOOKS]),
  ['git commit with Co-Authored-By trailer', bash(`git commit -m "${trailer}"`), AI],
  ['git commit heredoc with trailer', bash(`git commit -m "$(cat <<'EOF'\n${trailer}\nEOF\n)"`), AI],
  ['gh pr create Generated with Claude Code', bash('gh pr create --body "Generated with Claude Code"'), AI],
  ['gh pr edit Generated with Claude Code', bash("gh pr edit --body 'Generated with Claude Code'"), AI],
  ['glab mr create lowercase', bash('glab mr create --description "generated with claude code"'), AI],
  ['heredoc then real npm test', bash("cat > notes.md <<'EOF'\ntext\nEOF\nnpm test"), PNPM],
  ['heredoc on first line of git commit then npm test', bash("git commit -F - <<EOF && npm test\nmsg\nEOF"), PNPM],
  ['heredoc body with Co-Authored-By trailer', bash("git commit -F - <<'EOF'\nmsg\nCo-Authored-By: Claude <noreply@anthropic.com>\nEOF"), AI],
];

const allowed = [
  ...[
    'pnpm test', 'pnpm --filter server exec vitest run x', 'pnpm dlx foo', 'cat .env.example',
    'cat app/server/.env.example', 'git push origin main', 'git push -u github x',
    'git commit -m "fix npm docs; npm is banned"', 'git commit -m "ignore .env files"',
    'git commit -am "ignore .env files"', 'echo "use yarn"', 'rg "npx" docs', 'git log -n 5',
    'git grep -n foo', 'git status', 'cat .envrc', 'cat my.env', 'ls .environment',
    'git commit -m "docs: no Claude here"', 'gh pr create --body "What, Why"',
  ].map((c) => [c, bash(c)]),
  ['Read app/server/.env.example', read('app/server/.env.example')],
  ['Read docs/x.md', read('docs/x.md')],
  ['Edit .env (not covered)', call('Edit', { file_path: '.env' })],
  ['Write .env (not covered)', call('Write', { file_path: '.env' })],
  ['heredoc quoted delimiter: npm and .env in body', bash("cat > notes.md <<'EOF'\nnpm is banned here\nthe file .env is secret\nEOF")],
  ['heredoc unquoted delimiter: npm and .env in body', bash("cat > notes.md <<EOF\nnpm is banned here\nthe file .env is secret\nEOF")],
];

for (const [name, res, reason] of blocked) {
  test(`blocks: ${name.replace(/\n/g, '\\n')}`, () => {
    assert.equal(res.status, 2, res.stderr);
    assert.equal(res.stdout, '');
    assert.equal(res.stderr.trim(), reason);
  });
}

for (const [name, res] of allowed) {
  test(`allows: ${name}`, () => {
    assert.equal(res.status, 0, res.stderr);
    assert.equal(res.stdout, '');
  });
}

test('invalid JSON fails with an exit code other than 0 and 2', () => {
  const { status } = run('not json');
  assert.notEqual(status, 0);
  assert.notEqual(status, 2);
});
