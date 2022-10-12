import {
  BadRequestException,
  ConflictException,
  Controller,
  Get,
  HttpCode,
  InternalServerErrorException,
  NotFoundException,
  Param,
  Post,
  Put,
  Req,
  Res,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { Request, Response } from "express";
import { NestJSPinoLogger } from "@codefi-assets-and-payments/observability";
import { ApiConsumes, ApiTags } from "@nestjs/swagger";
import { FileInterceptor } from "@nestjs/platform-express";

import { ItemService } from "../services/ItemService";
import { S3Service } from "../services/S3Service";
import { ApiFile } from "../decorators/apiFile.decorator";

// eslint-disable-next-line @typescript-eslint/no-var-requires
require("dotenv").config();

@ApiTags("Public")
@Controller("public")
export class PublicController {
  constructor(
    private readonly logger: NestJSPinoLogger,
    private itemService: ItemService,
    private s3Service: S3Service
  ) {
    logger.setContext(PublicController.name);
  }

  @Post(`:tenantId/:resourceId`)
  @HttpCode(201)
  @UseInterceptors(FileInterceptor("file"))
  @ApiFile()
  @ApiConsumes("multipart/form-data")
  async post(
    @Param("tenantId") tenantId: string,
    @Param("resourceId") resourceId: string,
    @Req() req: Request,
    @UploadedFile() file: Express.Multer.File
  ): Promise<string> {
    this.logger.info({
      tenantId,
      resourceId,
    });

    const item = await this.itemService.getItem(resourceId, tenantId);

    if (item) {
      throw new ConflictException(`Resource "${req.url}" already exists.`);
    }

    if (!file) {
      throw new BadRequestException();
    }

    const s3File = await this.s3Service.addFile(file, resourceId);
    await this.itemService.createItem({
      id: resourceId,
      tenantId,
      content: JSON.stringify({
        file: { originalName: file.originalname, ...s3File },
      }),
      contentType: file.mimetype,
    });

    return `${req.hostname}${req.url}`;
  }

  @Put(`:tenantId/:resourceId`)
  @HttpCode(201)
  @UseInterceptors(FileInterceptor("file"))
  @ApiFile()
  @ApiConsumes("multipart/form-data")
  async put(
    @Param("tenantId") tenantId: string,
    @Param("resourceId") resourceId: string,
    @Req() req: Request,
    @UploadedFile() file: Express.Multer.File
  ): Promise<string> {
    this.logger.info({
      tenantId,
      resourceId,
    });

    const item = await this.itemService.getItem(resourceId, tenantId);

    if (!item) {
      throw new NotFoundException(`Resource "${req.url}" does not exist.`);
    }

    if (!file) {
      throw new BadRequestException();
    }

    const s3File = await this.s3Service.addFile(file, resourceId);
    await this.itemService.updateItem(resourceId, {
      content: JSON.stringify({
        file: { originalName: file.originalname, ...s3File },
      }),
      contentType: file.mimetype,
    });

    return `${req.hostname}${req.url}`;
  }

  @Get(`:tenantId/:resourceId`)
  @HttpCode(200)
  async get(
    @Param("tenantId") tenantId: string,
    @Param("resourceId") resourceId: string,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ): Promise<StreamableFile> {
    this.logger.info({
      tenantId,
      resourceId,
    });
    const resource = await this.itemService.getItem(resourceId, tenantId);

    if (!resource) {
      throw new NotFoundException(`Resource "${req.url}" does not exist.`);
    }

    res.setHeader("content-type", resource.contentType);

    const readStream = this.s3Service
      .getFile({ key: resourceId })
      .on("error", (error) => {
        this.logger.error(error);
        res.status(500).send(new InternalServerErrorException().getResponse());
      });

    return new StreamableFile(readStream);
  }
}
