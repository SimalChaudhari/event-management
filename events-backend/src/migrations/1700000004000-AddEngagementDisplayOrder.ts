import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddEngagementDisplayOrder1700000004000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'engagements',
      new TableColumn({
        name: 'displayOrder',
        type: 'int',
        isNullable: false,
        default: 0,
      }),
    );

    const engagements: Array<{ id: string }> = await queryRunner.query(
      `SELECT id FROM engagements ORDER BY "createdAt" ASC`,
    );

    let order = 0;
    for (const engagement of engagements) {
      await queryRunner.query(
        `UPDATE engagements SET "displayOrder" = $1 WHERE id = $2`,
        [order, engagement.id],
      );
      order += 1;
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('engagements', 'displayOrder');
  }
}


