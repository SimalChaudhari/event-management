import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropNumberOfStampsRequiredFromEvents1700000013000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('events', 'numberOfStampsRequired');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "events"
      ADD "numberOfStampsRequired" int
    `);
  }
}
