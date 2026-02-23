import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddAccessCodeToEventRegistrationShareLinks1700000011000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'event_registration_share_links',
      new TableColumn({
        name: 'accessCode',
        type: 'varchar',
        length: '16',
        isNullable: true,
      }),
    );
    await queryRunner.query(`
      UPDATE event_registration_share_links
      SET "accessCode" = substr(md5(random()::text || id::text), 1, 8)
      WHERE "accessCode" IS NULL
    `);
    await queryRunner.query(`
      ALTER TABLE event_registration_share_links ALTER COLUMN "accessCode" SET NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('event_registration_share_links', 'accessCode');
  }
}
