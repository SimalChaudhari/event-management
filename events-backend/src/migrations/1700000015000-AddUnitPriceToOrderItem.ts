import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddUnitPriceToOrderItem1700000015000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'ordersItem',
      new TableColumn({
        name: 'unitPrice',
        type: 'decimal',
        precision: 10,
        scale: 2,
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('ordersItem', 'unitPrice');
  }
}
