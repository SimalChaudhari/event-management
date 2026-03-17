import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddIsPrivateToEvents1700000018000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'events',
      new TableColumn({
        name: 'isPrivate',
        type: 'boolean',
        default: false,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('events', 'isPrivate');
  }
}
