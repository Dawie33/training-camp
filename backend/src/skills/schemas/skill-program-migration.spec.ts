import knex, { Knex } from 'knex'
import { down, up } from '../../database/migrations/20261117150000_add_skill_step_programming'

describe('skill programming migration SQL', () => {
  it('adds nullable columns and has a reversible PostgreSQL down', async () => {
    const db = knex({ client: 'pg' })
    const sql: string[] = []
    const migrationDb = {
      schema: {
        alterTable: (name: string, callback: (table: Knex.AlterTableBuilder) => void) => {
          sql.push(
            ...db.schema
              .alterTable(name, callback)
              .toSQL()
              .map(query => query.sql)
          )
          return Promise.resolve()
        },
      },
    } as unknown as Knex
    try {
      await up(migrationDb)
      expect(sql.join(';')).toContain('alter table "skill_program_steps" add column "frequency" text null')
      expect(sql.join(';')).toContain('add column "when_to_train" text null')
      expect(sql.join(';')).toContain('add column "warmup" text null')
      sql.length = 0
      await down(migrationDb)
      expect(sql.join(';')).toContain('drop column "frequency"')
      expect(sql.join(';')).toContain('drop column "when_to_train"')
      expect(sql.join(';')).toContain('drop column "warmup"')
    } finally {
      await db.destroy()
    }
  })
})
