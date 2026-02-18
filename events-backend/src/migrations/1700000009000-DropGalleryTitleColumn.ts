import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropGalleryTitleColumn1700000009000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('galleries', 'title');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "galleries" ADD "title" varchar(255)`,
    );
  }
}
