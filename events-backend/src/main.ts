import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from 'validation/validation.pipe';
import { GlobalExceptionFilter } from 'utils/global-exception.filter';
import { Logger } from '@nestjs/common';
import * as fs from 'fs';

async function bootstrap() {
  try {
    const sslKeyPath = process.env.SSL_KEY_PATH || join(__dirname, '..', 'ssl', 'events.isca.org.sg-key.pem');
    const sslCertPath = process.env.SSL_CERT_PATH || join(__dirname, '..', 'ssl', 'events.isca.org.sg-chain.pem');

    const httpsOptions =
      fs.existsSync(sslKeyPath) && fs.existsSync(sslCertPath)
        ? { key: fs.readFileSync(sslKeyPath), cert: fs.readFileSync(sslCertPath) }
        : undefined;

    const app = await NestFactory.create<NestExpressApplication>(AppModule, { httpsOptions });

    app.useGlobalFilters(new GlobalExceptionFilter());
    // app.useGlobalPipes(new ValidationPipe());

    app.useStaticAssets(join(__dirname, '..', 'uploads'), { prefix: '/uploads/' });

    app.enableCors({
      origin: '*', // ✅ change to your real frontend
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
      credentials: true,
    });

    const port = process.env.PORT || 5000;
    await app.listen(port);
    console.log(
      `✅ Server running on: ${httpsOptions ? 'https' : 'http'}://events.isca.org.sg:${port}`
    );
  } catch (error) {
    Logger.error('Failed to start server:', error);
    process.exit(1);
  }
}
bootstrap();
