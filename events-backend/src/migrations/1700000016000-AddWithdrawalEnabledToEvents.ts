import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddWithdrawalEnabledToEvents1700000016000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'events',
      new TableColumn({
        name: 'withdrawalEnabled',
        type: 'boolean',
        default: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('events', 'withdrawalEnabled');
  }
}
