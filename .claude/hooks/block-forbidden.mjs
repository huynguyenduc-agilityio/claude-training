import { readFileSync } from 'node:fs';

const { tool_name: tool, tool_input: input = {} } = JSON.parse(readFileSync(0, 'utf8'));

const PKG = /^(npm|npx|yarn)(\.cmd)?$/i;
const ENV = /(?<![\w.-])\.env(?![\w-])(?!\.example(?![\w-]))/;
const AI = /co-authored-by:\s*claude|generated with claude code/i;
const MESSAGE = /(?<=\s)(-[a-zA-Z]*m|--message)(=|\s+)("[^"]*"|'[^']*'|\S+)/g;
const HEREDOC = /<<-?\s*(['"]?)(\w+)\1([^\n]*)\n[\s\S]*?\n[ \t]*\2[ \t]*(?=\n|$)/g;
const GIT_VALUE_OPTS = new Set(['-c', '-C', '--git-dir', '--work-tree', '--namespace']);

const reasons = {
  pkg: 'Use pnpm (CLAUDE.md): pnpm, pnpm exec, pnpm dlx',
  env: 'CLAUDE.md forbids reading or printing .env files',
  force: 'Force push is not allowed; ask the user',
  hooks: 'Do not skip git hooks; fix the cause',
  ai: 'CLAUDE.md forbids AI attribution',
};

function check() {
  if (tool === 'Read') return ENV.test(input.file_path ?? '') && reasons.env;
  if (tool !== 'Bash' && tool !== 'PowerShell') return false;
  const cmd = input.command ?? '';
  const code = cmd.replace(HEREDOC, '$3');
  const plain = code.replace(/"[^"]*"|'[^']*'/g, 'Q');
  let commit = false;
  let attribution = false;
  for (const segment of plain.split(/&&|\|\||[;|&\n`]|\$\(/)) {
    const t = segment.trim().split(/\s+/);
    while (/^\w+=/.test(t[0])) t.shift();
    const name = t[0]?.split(/[\\/]/).pop() ?? '';
    if (PKG.test(name)) return reasons.pkg;
    if (name === 'git') {
      let i = 1;
      while (t[i]?.startsWith('-')) i += GIT_VALUE_OPTS.has(t[i]) ? 2 : 1;
      const args = t.slice(i + 1);
      if (t[i] === 'push' && args.some((a) => /^--force|^-[a-zA-Z]*f/.test(a))) return reasons.force;
      if (t[i] === 'commit') {
        if (args.some((a) => a === '--no-verify' || /^-[a-zA-Z]*n/.test(a))) return reasons.hooks;
        commit = attribution = true;
      }
    } else if ((name === 'gh' && t[1] === 'pr' && /^(create|edit)$/.test(t[2])) || (name === 'glab' && t[1] === 'mr' && t[2] === 'create')) {
      attribution = true;
    }
  }
  if (attribution && AI.test(cmd)) return reasons.ai;
  if (ENV.test(commit ? code.replace(MESSAGE, '') : code)) return reasons.env;
  return false;
}

const reason = check();
if (reason) {
  console.error(reason);
  process.exit(2);
}
