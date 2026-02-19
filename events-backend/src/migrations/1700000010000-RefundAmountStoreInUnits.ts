import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Store refund amount in currency units (e.g. 144.00 SGD) instead of cents (14400).
 * Converts existing values: amount = amount / 100.
 */
export class RefundAmountStoreInUnits1700000010000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const driver = queryRunner.connection.driver;
    const table = 'refunds';
    const column = 'amount';

    if (driver.options.type === 'postgres') {
      await queryRunner.query(
        `ALTER TABLE "${table}" ALTER COLUMN "${column}" TYPE decimal(12,2) USING (${column} / 100.0)`,
      );
    } else {
      await queryRunner.query(`ALTER TABLE \`${table}\` MODIFY \`${column}\` decimal(12,2) NOT NULL DEFAULT 0`);
      await queryRunner.query(`UPDATE \`${table}\` SET \`${column}\` = \`${column}\` / 100`);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = 'refunds';
    const column = 'amount';

    if (queryRunner.connection.driver.options.type === 'postgres') {
      await queryRunner.query(
        `ALTER TABLE "${table}" ALTER COLUMN "${column}" TYPE integer USING (ROUND((${column} * 100)::numeric)::integer)`,
      );
    } else {
      await queryRunner.query(`UPDATE \`${table}\` SET \`${column}\` = \`${column}\` * 100`);
      await queryRunner.query(`ALTER TABLE \`${table}\` MODIFY \`${column}\` int NOT NULL`);
    }
  }
}
