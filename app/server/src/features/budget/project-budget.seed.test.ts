import { execFileSync } from 'node:child_process'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { openDatabase } from '../../shared/db.ts'
import { createProjectBudgetRepository } from './project-budget.repository.ts'

const serverDir = fileURLToPath(new URL('../../../', import.meta.url))

describe('pnpm seed (EXP-112 R6, A-28)', () => {
  it('leaves no project budgets', () => {
    const folder = mkdtempSync(join(tmpdir(), 'seed-budgets-'))
    const file = join(folder, 'usage.db')
    try {
      const before = openDatabase(file)
      createProjectBudgetRepository(before).set('code-review', 10)
      before.close()

      execFileSync(process.execPath, ['--import', 'tsx', 'scripts/seed.ts'], {
        cwd: serverDir,
        env: { ...process.env, DB_PATH: file },
        stdio: 'pipe',
      })

      const after = openDatabase(file)
      const records = after.prepare('SELECT COUNT(*) AS n FROM usage_records').get() as { n: number }
      const budgets = createProjectBudgetRepository(after).list()
      after.close()

      expect(records.n).toBeGreaterThan(0)
      expect(budgets.size).toBe(0)
    } finally {
      rmSync(folder, { recursive: true, force: true })
    }
  }, 60_000)
})
