import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Allow one chat thread per user-pair per event (and one global thread when eventId is null).
 * Replaces unique (userID, receiverID) which blocked separate Event1 vs Event3 chats.
 */
export class ChatThreadsPerEventUnique1700000020000 implements MigrationInterface {
  name = 'ChatThreadsPerEventUnique1700000020000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop TypeORM / legacy unique indexes on user+receiver only
    await queryRunner.query(`
      DO $$
      DECLARE
        idx_name text;
      BEGIN
        FOR idx_name IN
          SELECT i.relname
          FROM pg_class t
          JOIN pg_index ix ON t.oid = ix.indrelid
          JOIN pg_class i ON i.oid = ix.indexrelid
          JOIN pg_attribute a1 ON a1.attrelid = t.oid AND a1.attnum = ix.indkey[0]
          JOIN pg_attribute a2 ON a2.attrelid = t.oid AND a2.attnum = ix.indkey[1]
          WHERE t.relname = 'chat_threads'
            AND ix.indisunique = true
            AND ix.indnkeyatts = 2
            AND a1.attname IN ('userID', 'userId')
            AND a2.attname IN ('receiverID', 'receiverId')
        LOOP
          EXECUTE format('DROP INDEX IF EXISTS %I', idx_name);
        END LOOP;
      END $$;
    `);

    // Also drop known TypeORM-generated name if present
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_chat_threads_userID_receiverID"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_6c8d0c8e8a0c0c0c0c0c0c0c0"`,
    );

    // One thread per unordered pair per event
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_chat_threads_pair_event"
      ON "chat_threads" (
        LEAST("userID", "receiverID"),
        GREATEST("userID", "receiverID"),
        "eventId"
      )
      WHERE "eventId" IS NOT NULL
    `);

    // One global (non-event) thread per unordered pair
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_chat_threads_pair_global"
      ON "chat_threads" (
        LEAST("userID", "receiverID"),
        GREATEST("userID", "receiverID")
      )
      WHERE "eventId" IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_chat_threads_pair_event"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_chat_threads_pair_global"`,
    );

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_chat_threads_userID_receiverID"
      ON "chat_threads" ("userID", "receiverID")
    `);
  }
}
