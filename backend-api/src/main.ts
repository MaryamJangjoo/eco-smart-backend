import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

<<<<<<< Updated upstream:backend-api/src/main.ts
=======
  app.enableCors({
    origin: '*',
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

>>>>>>> Stashed changes:backend-api/src/application/main.ts
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
  }));

  const config = new DocumentBuilder()
    .setTitle('ECO-SMART API')
    .setDescription('Official API documentation for ECO-SMART project')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(3000);

  console.log('🚀 ECO-SMART Server is running on: http://localhost:3000');
  console.log('📚 Swagger UI: http://localhost:3000/api');
  console.log('🔌 WebSocket Server: ws://localhost:3001');
}
bootstrap();