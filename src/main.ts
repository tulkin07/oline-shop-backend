import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { UnprocessableEntityException } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get(ConfigService);
  const uploadDir = config.get<string>('uploadDir') ?? './uploads';

  app.setGlobalPrefix('api');
  app.set('trust proxy', 1);
  app.use(helmet());
  app.enableCors({
    origin: config.get<string>('corsOrigin') || '*',
    credentials: true,
  });
  app.useStaticAssets(join(process.cwd(), uploadDir), { prefix: '/uploads/' });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: { enableImplicitConversion: true },
      exceptionFactory: (errors) => {
        const message = errors
          .map((error) => {
            const constraints = error.constraints
              ? Object.values(error.constraints).join(', ')
              : 'invalid';
            return `${error.property}: ${constraints}`;
          })
          .join('; ');
        return new UnprocessableEntityException({
          message,
          error: 'VALIDATION_ERROR',
        });
      },
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('ElectroShop API')
    .setDescription(
      'Production backend for an online electronics shop. Cash on delivery only — no payment gateway.',
    )
    .setVersion('1.0')
    .addBearerAuth({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      description: 'Customer or admin JWT access token',
    })
    .addTag('Auth')
    .addTag('Admin Auth')
    .addTag('Products')
    .addTag('Admin Products')
    .addTag('Categories')
    .addTag('Orders')
    .addTag('Admin Dashboard')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document, {
    useGlobalPrefix: true,
    swaggerOptions: { persistAuthorization: true },
  });

  const port = config.get<number>('port') ?? 3000;
  await app.listen(port, '0.0.0.0');
}

bootstrap();
