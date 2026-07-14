import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable validation pipes
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // Configure Swagger
  const config = new DocumentBuilder()
    .setTitle('Chat Support API')
    .setDescription('The Chat Support API for handling support tickets and conversations')
    .setVersion('1.0')
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  // Enable CORS with specific origins for development
  app.enableCors({
    origin: (origin, callback) => {
      const allowedOrigins = [
        'http://localhost:3078', // Next.js frontend
        'http://localhost:8080', // Demo server
        'http://localhost:3000', // Alternative React dev server
        'http://127.0.0.1:8080', // Alternative localhost format
        'http://127.0.0.1:3078', // Alternative localhost format
      ];
      
      const allowedPatterns = [
        /^http:\/\/localhost:\d+$/, // Any localhost port for development
        /^http:\/\/127\.0\.0\.1:\d+$/, // Any 127.0.0.1 port for development
        /^file:\/\//, // Support for file:// protocol (local HTML files)
      ];
      
      // Allow requests with no origin (null origin) - this happens with file:// protocol
      if (!origin || origin === 'null') {
        return callback(null, true);
      }
      
      // Check exact matches
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      
      // Check pattern matches
      if (allowedPatterns.some(pattern => pattern.test(origin))) {
        return callback(null, true);
      }
      
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  const port = process.env.PORT || 3003;
  await app.listen(port);
  console.log(`🚀 Chat Support API is running on: http://localhost:${port}`);
  console.log(`📚 API Documentation: http://localhost:${port}/api`);
}
bootstrap();
