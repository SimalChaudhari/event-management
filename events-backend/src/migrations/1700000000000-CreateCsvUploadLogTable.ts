import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateCsvUploadLogTable1700000000000 implements MigrationInterface {
  name = 'CreateCsvUploadLogTable1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'csv_upload_logs',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'sessionId',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'adminId',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'fileName',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'totalRecords',
            type: 'int',
          },
          {
            name: 'recordsProcessed',
            type: 'int',
            default: 0,
          },
          {
            name: 'recordsFailed',
            type: 'int',
            default: 0,
          },
          {
            name: 'recordsSkipped',
            type: 'int',
            default: 0,
          },
          {
            name: 'newUsersCreated',
            type: 'int',
            default: 0,
          },
          {
            name: 'existingUsersUpdated',
            type: 'int',
            default: 0,
          },
          {
            name: 'passwordsGenerated',
            type: 'int',
            default: 0,
          },
          {
            name: 'emailsTotal',
            type: 'int',
            default: 0,
          },
          {
            name: 'emailsSent',
            type: 'int',
            default: 0,
          },
          {
            name: 'emailsFailed',
            type: 'int',
            default: 0,
          },
          {
            name: 'emailsPending',
            type: 'int',
            default: 0,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'processingTimeMs',
            type: 'bigint',
          },
          {
            name: 'errorDetails',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'skippedRecords',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'failedRecords',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'emailDetails',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'emailSendingEnabled',
            type: 'boolean',
            default: false,
          },
          {
            name: 'summary',
            type: 'varchar',
            length: '1000',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
        indices: [
          {
            name: 'IDX_csv_upload_logs_session_id',
            columnNames: ['sessionId'],
          },
          {
            name: 'IDX_csv_upload_logs_admin_id',
            columnNames: ['adminId'],
          },
          {
            name: 'IDX_csv_upload_logs_status',
            columnNames: ['status'],
          },
          {
            name: 'IDX_csv_upload_logs_created_at',
            columnNames: ['createdAt'],
          },
        ],
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('csv_upload_logs');
  }
}

