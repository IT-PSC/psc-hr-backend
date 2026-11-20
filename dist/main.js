"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const core_1 = require("@nestjs/core");
const swagger_1 = require("@nestjs/swagger");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const config = app.get(config_1.ConfigService);
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));
    const corsOrigin = config.get('CORS_ORIGIN') ?? 'http://localhost:5173';
    app.enableCors({
        origin: corsOrigin.split(',').map((o) => o.trim()),
        credentials: true,
    });
    const swaggerEnabled = (config.get('SWAGGER_ENABLED') ?? 'true').toLowerCase() === 'true';
    if (swaggerEnabled) {
        const swagger = new swagger_1.DocumentBuilder()
            .setTitle('PSC HR Backend')
            .setDescription('REST API for PSC HR + Finance. Roles match the hr-system SPA. Use Authorize with a JWT from POST /api/auth/login.')
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
        const document = swagger_1.SwaggerModule.createDocument(app, swagger);
        swagger_1.SwaggerModule.setup('api/docs', app, document, {
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
//# sourceMappingURL=main.js.map