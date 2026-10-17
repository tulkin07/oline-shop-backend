import { Test, TestingModule } from '@nestjs/testing';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import request from 'supertest';
import { HealthController } from './../src/health.controller';
import { setUploadsHeaders } from './../src/common/http/security';

describe('Uploads static headers (e2e)', () => {
  let app: NestExpressApplication;
  let uploadDir: string;

  beforeAll(async () => {
    uploadDir = mkdtempSync(join(tmpdir(), 'shop-uploads-'));
    mkdirSync(join(uploadDir, 'categories'), { recursive: true });
    // RIFF....WEBP header so the file is a valid webp container.
    writeFileSync(
      join(uploadDir, 'categories', 'sample.webp'),
      Buffer.from('RIFF\u0000\u0000\u0000\u0000WEBPVP8 ', 'binary'),
    );

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
    }).compile();

    app = moduleFixture.createNestApplication<NestExpressApplication>();
    app.use(helmet());
    app.useStaticAssets(uploadDir, {
      prefix: '/uploads/',
      setHeaders: setUploadsHeaders,
    });
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    rmSync(uploadDir, { recursive: true, force: true });
  });

  it('serves uploads with image MIME and cross-origin resource policy', async () => {
    const res = await request(app.getHttpServer())
      .get('/uploads/categories/sample.webp')
      .expect(200);

    expect(res.headers['content-type']).toBe('image/webp');
    expect(res.headers['cross-origin-resource-policy']).toBe('cross-origin');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
  });

  it('keeps Helmet same-origin policy for API responses', async () => {
    const res = await request(app.getHttpServer()).get('/health').expect(200);

    expect(res.headers['cross-origin-resource-policy']).toBe('same-origin');
  });
});
