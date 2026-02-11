import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateEventRegistrationShareLinksTable1700000007000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'event_registration_share_links',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          { name: 'eventId', type: 'uuid', isNullable: false },
          { name: 'shareToken', type: 'varchar', length: '64', isNullable: false, isUnique: true },
          { name: 'isActive', type: 'boolean', isNullable: false, default: true },
          { name: 'expiresAt', type: 'timestamp', isNullable: true },
          { name: 'createdAt', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
          { name: 'updatedAt', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true,
    );
    await queryRunner.createIndex(
      'event_registration_share_links',
      new TableIndex({ name: 'IDX_EVENT_REG_SHARE_TOKEN', columnNames: ['shareToken'], isUnique: true }),
    );
    await queryRunner.createIndex(
      'event_registration_share_links',
      new TableIndex({ name: 'IDX_EVENT_REG_SHARE_EVENT', columnNames: ['eventId'] }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('event_registration_share_links', true);
  }
}
