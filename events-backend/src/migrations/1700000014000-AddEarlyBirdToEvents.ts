import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddEarlyBirdToEvents1700000014000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'events',
      new TableColumn({
        name: 'earlyBirdPrice',
        type: 'decimal',
        precision: 10,
        scale: 2,
        isNullable: true,
      }),
    );
    await queryRunner.addColumn(
      'events',
      new TableColumn({
        name: 'earlyBirdStartDate',
        type: 'date',
        isNullable: true,
      }),
    );
    await queryRunner.addColumn(
      'events',
      new TableColumn({
        name: 'earlyBirdEndDate',
        type: 'date',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('events', 'earlyBirdEndDate');
    await queryRunner.dropColumn('events', 'earlyBirdStartDate');
    await queryRunner.dropColumn('events', 'earlyBirdPrice');
  }
}
