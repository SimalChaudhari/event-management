import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddGalleryTrackTitle1700000008000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'galleries',
      new TableColumn({
        name: 'trackTitle',
        type: 'varchar',
        length: '255',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('galleries', 'trackTitle');
  }
}
