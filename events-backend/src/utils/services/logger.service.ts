import { ConsoleLogger, Injectable, LogLevel } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';

type LogMetadata = Record<string, unknown>;

@Injectable()
export class LoggerService extends ConsoleLogger {
  private static readonly LEVEL_ORDER: LogLevel[] = ['error', 'warn', 'log', 'debug', 'verbose'];
  private readonly logFilePath: string;
  private readonly contextLogDirectory: string;
  private readonly contextFileCache = new Map<string, string>();

  constructor(private readonly configService: ConfigService) {
    super(LoggerService.name, { timestamp: true });
    this.logFilePath = this.resolveLogFilePath();
    this.contextLogDirectory = path.join(path.dirname(this.logFilePath), 'contexts');
    this.ensureLogDirectory();
    this.applyConfiguredLogLevels();
  }

  log(message: string, context?: string, metadata?: LogMetadata): void {
    const formatted = this.formatLogMessage(message, metadata);
    super.log(formatted, context);
    this.writeToFile('log', context, formatted, metadata);
  }

  warn(message: string, context?: string, metadata?: LogMetadata): void {
    const formatted = this.formatLogMessage(message, metadata);
    super.warn(formatted, context);
    this.writeToFile('warn', context, formatted, metadata);
  }

  error(message: string, error?: unknown, context?: string, metadata?: LogMetadata): void {
    const stack = this.extractStack(error);
    const mergedMetadata = this.mergeErrorMetadata(metadata, error);
    const formatted = this.formatLogMessage(message, mergedMetadata);
    super.error(formatted, stack, context);
    this.writeToFile('error', context, formatted, mergedMetadata, stack);
  }

  debug(message: string, context?: string, metadata?: LogMetadata): void {
    const formatted = this.formatLogMessage(message, metadata);
    super.debug(formatted, context);
    this.writeToFile('debug', context, formatted, metadata);
  }

  verbose(message: string, context?: string, metadata?: LogMetadata): void {
    const formatted = this.formatLogMessage(message, metadata);
    super.verbose(formatted, context);
    this.writeToFile('verbose', context, formatted, metadata);
  }

  /**
   * Create a lightweight wrapper bound to a specific context.
   */
  forContext(context: string) {
    const logger = this;

    return {
      log(message: string, metadata?: LogMetadata) {
        logger.log(message, context, metadata);
      },
      warn(message: string, metadata?: LogMetadata) {
        logger.warn(message, context, metadata);
      },
      error(message: string, error?: unknown, metadata?: LogMetadata) {
        logger.error(message, error, context, metadata);
      },
      debug(message: string, metadata?: LogMetadata) {
        logger.debug(message, context, metadata);
      },
      verbose(message: string, metadata?: LogMetadata) {
        logger.verbose(message, context, metadata);
      },
    };
  }

  private applyConfiguredLogLevels(): void {
    const configuredLevel = this.configService.get<string>('LOG_LEVEL');

    if (!configuredLevel) {
      return;
    }

    const normalizedLevel = configuredLevel.toLowerCase() as LogLevel;
    const index = LoggerService.LEVEL_ORDER.indexOf(normalizedLevel);

    if (index === -1) {
      return;
    }

    this.setLogLevels(LoggerService.LEVEL_ORDER.slice(0, index + 1));
  }

  private resolveLogFilePath(): string {
    const configuredDir = this.configService.get<string>('LOG_DIR');
    const logDirectory = configuredDir
      ? path.isAbsolute(configuredDir)
        ? configuredDir
        : path.resolve(process.cwd(), configuredDir)
      : path.resolve(process.cwd(), 'logs');

    const fileName = this.configService.get<string>('LOG_FILE') ?? 'application.log';
    return path.join(logDirectory, fileName);
  }

  private ensureLogDirectory(): void {
    const directory = path.dirname(this.logFilePath);
    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory, { recursive: true });
    }

    if (!fs.existsSync(this.contextLogDirectory)) {
      fs.mkdirSync(this.contextLogDirectory, { recursive: true });
    }
  }

  private formatLogMessage(message: unknown, metadata?: LogMetadata): string {
    if (!metadata || Object.keys(metadata).length === 0) {
      return this.stringify(message);
    }

    return `${this.stringify(message)} | ${this.safeStringify(metadata)}`;
  }

  private mergeErrorMetadata(metadata: LogMetadata | undefined, error: unknown): LogMetadata | undefined {
    if (!error) {
      return metadata;
    }

    const errorMetadata: LogMetadata =
      error instanceof Error
        ? { name: error.name, message: error.message }
        : { error };

    return { ...(metadata ?? {}), ...errorMetadata };
  }

  private extractStack(error: unknown): string | undefined {
    if (error instanceof Error) {
      return error.stack;
    }

    return undefined;
  }

  private stringify(value: unknown): string {
    if (typeof value === 'string') {
      return value;
    }

    return this.safeStringify(value);
  }

  private safeStringify(value: unknown): string {
    try {
      return JSON.stringify(value);
    } catch {
      return '[unserializable]';
    }
  }

  private async writeToFile(
    level: LogLevel,
    context: string | undefined,
    formattedMessage: string,
    metadata?: LogMetadata,
    stack?: string,
  ): Promise<void> {
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      context: context ?? LoggerService.name,
      message: formattedMessage,
      metadata: metadata && Object.keys(metadata).length > 0 ? metadata : undefined,
      stack,
    };

    const line = `${JSON.stringify(entry)}${lineEnding}`;

    await this.appendLine(this.logFilePath, line);

    const contextFilePath = this.getContextFilePath(context);
    if (contextFilePath) {
      await this.appendLine(contextFilePath, line);
    }
  }

  private async appendLine(filePath: string, line: string): Promise<void> {
    try {
      await fs.promises.appendFile(filePath, line, { encoding: 'utf8' });
    } catch (fileError) {
      const fallbackMessage = `[LOGGER ERROR] Failed to write log entry: ${
        fileError instanceof Error ? fileError.message : 'Unknown error'
      } (${filePath})`;
      process.stderr.write(`${fallbackMessage}${lineEnding}`);
    }
  }

  private getContextFilePath(context?: string): string | undefined {
    if (!context) {
      return undefined;
    }

    const sanitizedContext = this.sanitizeContext(context);

    if (this.contextFileCache.has(sanitizedContext)) {
      return this.contextFileCache.get(sanitizedContext);
    }

    const filePath = path.join(this.contextLogDirectory, `${sanitizedContext}.log`);
    this.ensureDirectoryExists(path.dirname(filePath));
    this.contextFileCache.set(sanitizedContext, filePath);

    return filePath;
  }

  private sanitizeContext(context: string): string {
    return context
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .replace(/-{2,}/g, '-')
      || 'general';
  }

  private ensureDirectoryExists(directory: string): void {
    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory, { recursive: true });
    }
  }
}

const lineEnding = process.platform === 'win32' ? '\r\n' : '\n';

