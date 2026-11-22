import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { buildSwaggerConfig } from './common/swagger/document';
import {
  filterDocumentForRole,
  SWAGGER_ROLES,
} from './common/swagger/role-docs';

const SWAGGER_UI_OPTIONS = {
  persistAuthorization: true,
  operationsSorter: 'alpha' as const,
  docExpansion: 'list' as const,
  filter: true,
  displayRequestDuration: true,
};

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
    const swagger = buildSwaggerConfig();
    const document = SwaggerModule.createDocument(app, swagger);

    SwaggerModule.setup('api/docs', app, document, {
      jsonDocumentUrl: 'api/docs-json',
      swaggerOptions: SWAGGER_UI_OPTIONS,
    });

    for (const role of SWAGGER_ROLES) {
      const roleDoc = filterDocumentForRole(document, role);
      SwaggerModule.setup(`api/docs/${role}`, app, roleDoc, {
        jsonDocumentUrl: `api/docs/${role}-json`,
        swaggerOptions: SWAGGER_UI_OPTIONS,
      });
    }
  }

  const port = Number(config.get('PORT') ?? 3001);
  await app.listen(port);
  console.log(`PSC HR Backend listening on http://localhost:${port}/api`);
  if (swaggerEnabled) {
    console.log(`Swagger docs: http://localhost:${port}/api/docs`);
    for (const role of SWAGGER_ROLES) {
      console.log(`  role ${role}: http://localhost:${port}/api/docs/${role}`);
    }
  }
}
bootstrap();
