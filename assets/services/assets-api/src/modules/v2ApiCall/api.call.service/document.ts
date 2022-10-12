import { Injectable } from '@nestjs/common';
import FormData from 'form-data';
import axios, { AxiosInstance } from 'axios';
import ErrorService from 'src/utils/errorService';
import { ApiCallHelperService } from '.';

const DOCUMENT_HOST: string = process.env.COFI_DOCS_API;
const API_NAME = 'Document-Api';

@Injectable()
export class ApiDocumentCallService {
  constructor(private readonly apiCallHelperService: ApiCallHelperService) {
    this.documentApi = axios.create({
      baseURL: DOCUMENT_HOST,
    });
  }

  private documentApi: AxiosInstance;

  /**
   * [Upload document]
   * @param req Readable Stream
   */
  async uploadDocument(file, filename, fileType, fileSize) {
    try {
      const url = '/document';
      const formData = new FormData();

      formData.append('file', file, {
        contentType: fileType,
        filename: filename,
        knownLength: fileSize,
      });

      const response = await this.documentApi.post(url, formData, {
        headers: formData.getHeaders(),
      });

      this.apiCallHelperService.checkRequestResponseFormat(
        'uploading document',
        response,
      );

      if (!response.data.uploadedDocument) {
        throw new Error(
          'invalid response from Document-API, missing field: uploadedDocument',
        );
      }

      return response.data.uploadedDocument;
    } catch (error) {
      ErrorService.throwApiCallError('uploadDocument', API_NAME, error, 500);
    }
  }

  /**
   * [Download file]
   * @param _fileName name of the file
   */
  async downloadFile(fileName) {
    try {
      const requestUrl = `/document/${fileName}`;

      const response = await this.documentApi.get(requestUrl, {
        responseType: 'stream',
      });
      this.apiCallHelperService.checkRequestResponseFormat(
        'downloading document',
        response,
      );

      return response.data;
    } catch (error) {
      ErrorService.throwApiCallError('downloadFile', API_NAME, error, 500);
    }
  }
}
