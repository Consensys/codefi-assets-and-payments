import { Injectable } from "@nestjs/common";
import { NestJSPinoLogger } from "@consensys/observability";
import AWS from "aws-sdk";
import config from "../config";

@Injectable()
export class S3Service {
  readonly s3Bucket: string;
  readonly client: AWS.S3;

  constructor(private readonly logger: NestJSPinoLogger) {
    logger.setContext(S3Service.name);

    const { aws } = config();

    this.client = new AWS.S3({
      region: aws.region,
    });

    this.s3Bucket = aws.defaultBucket;
  }

  addFile(file: Express.Multer.File, key: string) {
    return this.client
      .putObject({
        Bucket: this.s3Bucket,
        Key: key,
        Body: file.buffer,
      })
      .promise();
  }

  getFile({ key }) {
    return this.client
      .getObject({
        Bucket: this.s3Bucket,
        Key: key,
      })
      .createReadStream();
  }
}
