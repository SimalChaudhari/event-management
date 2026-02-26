import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddStampLimitAndRewardToEvents1700000012000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'events',
      new TableColumn({
        name: 'stampRequiredForReward',
        type: 'int',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('events', 'stampRequiredForReward');
  }
}
