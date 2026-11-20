import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const corsOrigin = config.get<string>('CORS_ORIGIN') ?? 'http://localhost:5173';
  app.enableCors({
    origin: corsOrigin.split(',').map((o) => o.trim()),
    credentials: true,
  });

  const swaggerEnabled =
    (config.get<string>('SWAGGER_ENABLED') ?? 'true').toLowerCase() === 'true';
  if (swaggerEnabled) {
    const swagger = new DocumentBuilder()
      .setTitle('PSC HR Backend')
      .setDescription(
        'REST API for PSC HR + Finance. Roles match the hr-system SPA. Use Authorize with a JWT from POST /api/auth/login.',
      )
      .setVersion('0.1.0')
      .addBearerAuth()
      .addTag('Auth')
      .addTag('Employees')
      .addTag('Org')
      .addTag('Time')
      .addTag('Approvals')
      .addTag('PayrollPSC')
      .addTag('AP')
      .addTag('Finance')
      .addTag('Files')
      .addTag('Audit')
      .addTag('Workers')
      .build();
    const document = SwaggerModule.createDocument(app, swagger);
    SwaggerModule.setup('api/docs', app, document, {
      jsonDocumentUrl: 'api/docs-json',
    });
  }

  const port = Number(config.get('PORT') ?? 3001);
  await app.listen(port);
  console.log(`PSC HR Backend listening on http://localhost:${port}/api`);
  if (swaggerEnabled) {
    console.log(`Swagger docs: http://localhost:${port}/api/docs`);
  }
}
bootstrap();
