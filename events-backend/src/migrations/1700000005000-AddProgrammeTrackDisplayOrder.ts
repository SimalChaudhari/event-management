import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddProgrammeTrackDisplayOrder1700000005000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'programme_tracks',
      new TableColumn({
        name: 'displayOrder',
        type: 'int',
        isNullable: false,
        default: 0,
      }),
    );

    const tracks: Array<{ id: string }> = await queryRunner.query(
      `SELECT id FROM programme_tracks ORDER BY "createdAt" ASC`,
    );

    let order = 0;
    for (const track of tracks) {
      await queryRunner.query(
        `UPDATE programme_tracks SET "displayOrder" = $1 WHERE id = $2`,
        [order, track.id],
      );
      order += 1;
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('programme_tracks', 'displayOrder');
  }
}


