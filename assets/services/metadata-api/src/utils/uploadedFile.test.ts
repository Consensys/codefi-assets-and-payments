import { uploadedFile } from './uploadedFile';
import fs from 'fs';
import path from 'path';
import MockExpressRequest from 'mock-express-request';
import { Request, Response } from 'express';
import FormData from 'form-data';

jest.mock('multer');
import multer from 'multer';
//jest.mock('multer');
jest.mock('@codefi-assets-and-payments/observability', () => ({
  createLogger: () => ({
    info: jest.fn(),
    error: jest.fn(),
  }),
}));

const multerMock = multer as jest.Mocked<typeof multer>;

describe('uploadedFile', () => {
  let requestMock: Request;
  let responseMock: Response;
  const fileMock = {
    buffer: new Buffer(''),
    originalname: 'originalname',
    mimetype: 'multipart/form-data',
    size: 1,
  };

  const bodyMock = {
    foo: 'bar',
  };

  beforeEach(() => {
    const form = new FormData();
    form.append(
      'my_file',
      fs.createReadStream(
        path.join(__dirname, 'fixtures', 'file-upload-test.txt'),
      ),
    );

    responseMock = {} as Response;
  });

  it('uploads a file', async () => {
    requestMock = new MockExpressRequest({
      method: 'POST',
      host: 'localhost',
      url: '/upload',
      file: fileMock,
    });

    (multerMock as any).mockImplementation(() => ({
      single: jest.fn().mockImplementation(() => Promise.resolve()),
    }));
    await expect(
      uploadedFile({
        file: '',
        request: requestMock,
        response: responseMock,
      }),
    ).resolves.toEqual([
      expect.objectContaining({
        originalname: fileMock.originalname,
        mimetype: fileMock.mimetype,
        size: fileMock.size,
      }),
      undefined,
    ]);
  });

  it('uploads a file and pick a property from the body', async () => {
    requestMock = new MockExpressRequest({
      method: 'POST',
      host: 'localhost',
      url: '/upload',
      file: fileMock,
      body: bodyMock,
    });
    (multerMock as any).mockImplementation(() => ({
      single: jest.fn().mockImplementation(() => Promise.resolve()),
    }));
    await expect(
      uploadedFile<{ foo: string }>({
        file: '',
        request: requestMock,
        response: responseMock,
      }),
    ).resolves.toEqual([
      expect.objectContaining({
        originalname: fileMock.originalname,
        mimetype: fileMock.mimetype,
        size: fileMock.size,
      }),
      bodyMock,
    ]);
  });
});
