import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddSurveyUrlsColumn1700000001000 implements MigrationInterface {
  name = 'AddSurveyUrlsColumn1700000001000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'surveys',
      new TableColumn({
        name: 'surveyUrls',
        type: 'json',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('surveys', 'surveyUrls');
  }
}

