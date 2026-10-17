import { DatabaseStorageProvider } from './database-storage.provider';

describe('DatabaseStorageProvider', () => {
  const create = jest.fn();
  const deleteMany = jest.fn();
  const prisma = { uploadFile: { create, deleteMany } } as never;
  const provider = new DatabaseStorageProvider(prisma);

  const file = {
    originalname: 'Photo (1).WEBP',
    mimetype: 'image/webp',
    size: 4,
    buffer: Buffer.from([1, 2, 3, 4]),
  } as Express.Multer.File;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('stores bytes in the database and returns a /uploads url', async () => {
    const result = await provider.save(file, 'categories');
    expect(create).toHaveBeenCalledTimes(1);
    const data = create.mock.calls[0][0].data;
    expect(data.key).toMatch(/^categories\/[0-9a-f-]{36}\.webp$/);
    expect(data.mimeType).toBe('image/webp');
    expect(data.size).toBe(4);
    expect(Buffer.isBuffer(data.data)).toBe(true);
    expect(result.url).toBe(`/uploads/${data.key}`);
    expect(result.key).toBe(data.key);
  });

  it('sanitizes the folder and falls back to misc', async () => {
    await provider.save(file, '../etc!!');
    const data = create.mock.calls[0][0].data;
    expect(data.key).toMatch(/^etc\/[0-9a-f-]{36}\.webp$/);

    create.mockClear();
    await provider.save(file, '!!!');
    expect(create.mock.calls[0][0].data.key).toMatch(/^misc\//);
  });

  it('deletes by key without throwing when missing', async () => {
    await provider.delete('categories/x.webp');
    expect(deleteMany).toHaveBeenCalledWith({
      where: { key: 'categories/x.webp' },
    });
  });
});
