import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  try {
   
    const app = await NestFactory.create<NestExpressApplication>(AppModule);
    // Static assets setup
    app.useStaticAssets(join(__dirname, '..', 'uploads'), {
      prefix: '/uploads/', // Access uploaded files via /upload/filename.jpg
    });

    const port = process.env.PORT || 3000;
    // Enable CORS
    app.enableCors({
      origin: '*', // Replace with your frontend URL
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
      credentials: true,
    });

    
    await app.listen(port);
    console.log(`Server is running on: http://localhost:${port}`); // Log the port

  } catch (error) {
    process.exit(1); // Exit the process with failure
  }
}
bootstrap();

