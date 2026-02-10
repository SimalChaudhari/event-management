import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddCheckoutBillingSameAsShipping1700000006000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'checkouts',
      new TableColumn({
        name: 'billingSameAsShipping',
        type: 'boolean',
        isNullable: false,
        default: false,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('checkouts', 'billingSameAsShipping');
  }
}
