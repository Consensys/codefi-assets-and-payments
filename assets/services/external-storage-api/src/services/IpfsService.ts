import { Injectable } from "@nestjs/common";
import { NestJSPinoLogger } from "@codefi-assets-and-payments/observability";
import { IPFSHTTPClient, create } from "ipfs-http-client";
import config from "../config";

@Injectable()
export class IpfsService {
  constructor(private readonly logger: NestJSPinoLogger) {
    logger.setContext(IpfsService.name);

    const { projectId, projectSecret, host } = config().ipfs;
    const credentials = Buffer.from(`${projectId}:${projectSecret}`).toString(
      "base64"
    );

    this.client = create({
      url: host,
      headers: {
        authorization: `Basic ${credentials}`,
      },
    });
  }

  client: IPFSHTTPClient;
}
