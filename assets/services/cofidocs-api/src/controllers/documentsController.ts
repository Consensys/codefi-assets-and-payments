import { Request, Response, response } from "express";
import { uploadFile, getFile } from "../helpers/dataStoreS3";
import multer from "multer";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";

import { logger } from "../logging/logger";

let sendResponse = function (res, status, content) {
  res.status(status);
  res.json(content);
};

export class DocumentController {
  // Controller function to Add/Upload document
  public async uploadDocument(req: Request, res: Response) {
    try {
      await uploadMulter(req, res);
    } catch (error) {
      logger.error(error);
      sendResponse(res, 500, { error: error.message });
    }
  }

  // Controller function to get document with file-name parameter
  public async getDocumentByName(req: Request, res: Response) {
    try {
      var document: any = await getFile(req.params.fileName);
      res.setHeader("Content-type", document.contentType);
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${document.fileName}"`
      );
      res.status(200).send(document.body);
    } catch (error) {
      logger.error(error);
      sendResponse(res, 500, {
        error: error.message,
      });
    }
  }
}

// upload file with Multer
let uploadMulter = async (req, res) => {
  try {
    await prepareForUpload(req, res);
    saveDoc(req, res);
  } catch (error) {
    logger.error("Upload Error", error);
    sendResponse(res, 500, {
      error: error.message,
    });
  }
};

// Set The Storage Engine for multer
let setStorageEngineForMulter = async (req) => {
  return multer.diskStorage({
    destination: "/tmp/uploads/",
    filename: function (req, file, cb) {
      cb(null, uuidv4() + "_" + file.originalname);
    },
  });
};

let prepareForUpload = async (req, res) => {
  // Set The Storage Engine
  const storage = await setStorageEngineForMulter(req);

  // Init Upload
  var upload = await multer({ storage: storage }).single("file");

  return new Promise((resolve, reject) => {
    upload(req, res, (error) => {
      if (error) {
        logger.error("Upload Error", error);
        reject(error);
      } else {
        resolve("success");
      }
    });
  });
};

// Save doc to S3
let saveDoc = async (req, res) => {
  const uploadedFile = req.file.destination + req.file.filename;
  var fileStream = fs.createReadStream(uploadedFile);

  fileStream.on("error", function (error) {
    logger.error(error);
    sendResponse(res, 500, {
      error: error.message,
    });
  });

  try {
    var s3FileObject: any = await uploadFile(
      req.file.filename,
      req.file.mimetype,
      fileStream
    );

    fs.unlink(uploadedFile, (error) => {
      if (error) {
        logger.error("Error while deleting file after upload");
        logger.error(error);
      } else {
        logger.info(`Uploaded file ${uploadedFile} deleted Successfully`);
      }
    });

    sendResponse(res, 201, {
      uploadedDocument: {
        fileName: s3FileObject.Key,
        documentURL: s3FileObject.Location,
      },
    });
  } catch (error) {
    logger.error("Error while uploading file to S3", error);
    sendResponse(res, 500, {
      error: error.message,
    });
  }
};
