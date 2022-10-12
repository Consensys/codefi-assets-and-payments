import {
  Controller,
  Get,
  Post,
  Param,
  Res,
  Req,
  HttpCode,
  Query,
  UseFilters,
} from '@nestjs/common';

import ErrorService from 'src/utils/errorService';

import { IUserContext, keys as UserContextKeys } from 'src/types/userContext';
import { keys as UserKeys, UserType } from 'src/types/user';
import { ApiDocumentCallService } from 'src/modules/v2ApiCall/api.call.service/document';
import { DocumentDownloadQueryInput } from './document.dto';
import { EntityType } from 'src/types/entity';
import { Request, Response } from 'express';
import { NestJSPinoLogger } from '@codefi-assets-and-payments/observability';
import { uploadedFile } from 'src/utils/uploadedFile';
import { checkUserType } from 'src/utils/checks/userType';
import { UserContext } from 'src/utils/decorator/userContext.decorator';
import { UserRetrievalService } from '../v2User/user.service/retrieveUser';
import { Protected } from '@codefi-assets-and-payments/auth';
import { AppToHttpFilter } from '@codefi-assets-and-payments/error-handler';

@Controller('v2/document')
@UseFilters(new AppToHttpFilter()) // Used to preserve error codes coming from packages (Ex: 401 from auth package). Otherwise, coming from packages are turned into 500.
export class DocumentController {
  constructor(
    private readonly logger: NestJSPinoLogger,
    private readonly apiDocumentCallService: ApiDocumentCallService,
    private readonly userRetrievalService: UserRetrievalService,
  ) {
    logger.setContext(DocumentController.name);
  }

  @Post()
  @HttpCode(201)
  @Protected(true, [])
  async uploadDocument(
    @UserContext() userContext: IUserContext,
    @Req() request: Request,
    @Res() response: Response,
  ) {
    // Workaround replace for @UseInterceptors(FileInterceptor('file'))
    // otherwise APM module stops to instrument the calls
    const [file] = await uploadedFile({ file: 'file', request, response });

    try {
      checkUserType(UserType.INVESTOR, userContext[UserContextKeys.USER]);

      const document = await this.apiDocumentCallService.uploadDocument(
        file.buffer,
        file.originalname,
        file.mimetype,
        file.size,
      );

      // https://docs.nestjs.com/controllers
      // Note that when you inject either @Res() or @Response() in a method handler,
      // you put Nest into Library-specific mode for that handler, and you
      // become responsible for managing the response.
      // When doing so, you must issue some kind of response by making a call
      // on the response object (e.g., res.json(...) or res.send(...)),
      // or the HTTP server will hang.

      return response.json({
        document: document,
        message: 'Document uploaded successfully',
      });
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'uploading document',
        'uploadDocument',
        true,
        500,
      );
    }
  }

  @Get('/:fileName')
  @HttpCode(200)
  @Protected(true, [])
  async downloadDocument(
    @UserContext() userContext: IUserContext,
    @Res() res,
    @Param('fileName') fileName: string,
  ) {
    try {
      checkUserType(UserType.INVESTOR, userContext[UserContextKeys.USER]);

      return (await this.apiDocumentCallService.downloadFile(fileName)).pipe(
        res,
      );
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'downloading document',
        'downloadDocument',
        true,
        500,
      );
    }
  }

  @Get('/public/:fileName')
  @HttpCode(200)
  async downloadPublicDocument(
    @Res() res,
    @Param('fileName') fileName: string,
  ) {
    try {
      return (await this.apiDocumentCallService.downloadFile(fileName)).pipe(
        res,
      );
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'downloading document',
        'downloadDocument',
        true,
        500,
      );
    }
  }

  @Get('/:fileName/verifier')
  @HttpCode(200)
  @Protected(true, [])
  async downloadDocumentAsVerifier(
    @UserContext() userContext: IUserContext,
    @Res() res,
    @Param('fileName') fileName: string,
    @Query() documentQuery: DocumentDownloadQueryInput,
  ) {
    try {
      const typeFunctionUser = UserType.VERIFIER;
      checkUserType(typeFunctionUser, userContext[UserContextKeys.USER]);

      let entityId: string;
      let entityType: EntityType;
      if (documentQuery.tokenId && documentQuery.projectId) {
        ErrorService.throwError(
          'token-related data and project-related data can not be queried both with the same API call',
        );
      } else if (documentQuery.tokenId) {
        entityId = documentQuery.tokenId;
        entityType = EntityType.TOKEN;
      } else if (documentQuery.projectId) {
        entityId = documentQuery.projectId;
        entityType = EntityType.PROJECT;
      } else if (documentQuery.issuerId) {
        entityId = documentQuery.issuerId;
        entityType = EntityType.ISSUER;
      }

      if (!documentQuery.submitterId) {
        ErrorService.throwError(
          'the ID of the KYC submitter, whom documents need to be downloaded needs to be specified',
        );
      }

      // Check if verifier is allowed to retrieve user (and consequently his documents)
      await this.userRetrievalService.retrieveUserIfAuthorized(
        userContext[UserContextKeys.TENANT_ID],
        userContext[UserContextKeys.USER_ID],
        userContext[UserContextKeys.USER][UserKeys.USER_TYPE],
        entityId,
        entityType,
        documentQuery.submitterId,
      );

      return (await this.apiDocumentCallService.downloadFile(fileName)).pipe(
        res,
      );
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'downloading document as verifier',
        'downloadDocumentAsVerifier',
        true,
        500,
      );
    }
  }
}
