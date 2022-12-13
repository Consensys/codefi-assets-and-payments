import multer from 'multer';
import { Request, Response } from 'express';
import { createLogger } from '@consensys/observability';

const logger = createLogger('util:uploader');

type File = {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
};

export interface UploadedFileOptions {
  file: string;
  request: Request;
  response: Response;
}
export const uploadedFile = async <T>({
  file,
  request,
  response,
}: UploadedFileOptions): Promise<[File, T]> => {
  try {
    await new Promise((resolve, reject) => {
      const handler = multer({
        limits: {
          fileSize: 10000000, // 10MB limit
        },
      }).single(file);
      handler(request, response, (err) => {
        if (err) {
          return reject(err.message);
        }
        resolve(response);
      });
    });
  } catch (e) {
    logger.error('failed to handle the file', e.message);
  }

  const {
    file: { buffer, originalname, mimetype, size },
  } = request as any;

  logger.info(`file of ${size} bytes decoded as  ${mimetype} `);

  return [{ buffer, originalname, mimetype, size }, request.body];
};
