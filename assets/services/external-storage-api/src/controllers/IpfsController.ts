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
import { Readable } from "stream";

import { ItemService } from "../services/ItemService";
import { IpfsService } from "../services/IpfsService";
import { ApiFile } from "../decorators/apiFile.decorator";

@ApiTags("Ipfs")
@Controller("ipfs")
export class IpfsController {
  constructor(
    private readonly logger: NestJSPinoLogger,
    private itemService: ItemService,
    private ipfsService: IpfsService
  ) {
    logger.setContext(IpfsController.name);
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

    const ipfsFile = await this.ipfsService.client.add(file.buffer);
    await this.ipfsService.client.pin.add(ipfsFile.cid);
    await this.itemService.createItem({
      id: resourceId,
      tenantId,
      content: JSON.stringify({
        file: { originalName: file.originalname, ...ipfsFile },
      }),
      contentType: file.mimetype,
    });

    return `ipfs://${ipfsFile.cid}`;
  }

  @Put(`:tenantId/:resourceId`)
  @HttpCode(201)
  @ApiFile()
  @ApiConsumes("multipart/form-data")
  @UseInterceptors(FileInterceptor("file"))
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

    const itemContent = JSON.parse(item.content || "{}");
    const currentIpfsPath = itemContent?.file?.path;

    if (currentIpfsPath) {
      await this.ipfsService.client.pin.rm(currentIpfsPath);
    }

    const ipfsFile = await this.ipfsService.client.add(file.buffer);
    await this.ipfsService.client.pin.add(ipfsFile.cid);
    await this.itemService.updateItem(resourceId, {
      content: JSON.stringify({
        file: { originalName: file.originalname, ...ipfsFile },
      }),
      contentType: file.mimetype,
    });

    return `ipfs://${ipfsFile.cid}`;
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

    const { file: ipfsData } = JSON.parse(resource.content) as any;

    res.setHeader("content-type", resource.contentType);

    const readStream = Readable.from(
      this.ipfsService.client.cat(ipfsData.path)
    ).on("error", (error) => {
      this.logger.error(error);
      res.status(500).send(new InternalServerErrorException().getResponse());
    });

    return new StreamableFile(readStream);
  }
}
