import { expressLogger } from "@codefi-assets-and-payments/observability";

import fs from "fs";
import express from "express";
import bodyParser from "body-parser";
import { Routes } from "./routes/routes";
import { config as dotenvConfig } from "dotenv";
import http from "http";

var swaggerUi = require("swagger-ui-express");
import * as swaggerDocument from "./swagger.json";

import { logger } from "./logging/logger";
import sleep from "./utils/sleep";

// Time in MS
const GRACEFULL_SHUTDOWN_TIME = 5000;
let server: http.Server;

if (fs.existsSync(".env")) {
  logger.info("Using .env file to supply config environment variables");
  dotenvConfig({ path: ".env" });
}

// If any of the mandatory environment variables are missing, log the error and exit the application
if (
  process.env["AWS_ACCESS_KEY_ID"] == null ||
  process.env["AWS_SECRET_ACCESS_KEY"] == null ||
  process.env["AWS_REGION"] == null ||
  process.env["AWS_S3_BUCKET_NAME"] == null
) {
  logger.error(
    "Error: One or more of Mandatory environment variables are not set, please set all of ** AWS_REGION, AWS_S3_BUCKET_NAME, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY**"
  );
  process.exit(1);
}

logger.info(`AWS region: ${process.env["AWS_REGION"]}`);
logger.info(`AWS s3BucketName: ${process.env["AWS_S3_BUCKET_NAME"]}`);

class App {
  public app: express.Application;
  public routePrv: Routes = new Routes();

  constructor() {
    this.app = express();
    this.config();
    this.routePrv.routes(this.app);
    this.app.use(expressLogger());
  }

  private config(): void {
    this.app.use(bodyParser.urlencoded({ extended: true, limit: "50mb" }));
    this.app.use(bodyParser.json({ limit: "50mb" }));
    // serving static files
    this.app.use(express.static("public"));

    this.app.use(
      "/api/cofidocs/api-docs",
      swaggerUi.serve,
      swaggerUi.setup(swaggerDocument)
    );
  }
}

//Use PORT from environment variable PORT if not default to port 80
const PORT = process.env["PORT"] == null ? 3000 : process.env["PORT"];

async function onUncaughtExceptions(caughtException: any) {
  logger.error(caughtException, "An uncaught exception has been thrown.");

  await shutdownService("An uncaught exception has been thrown.");
  process.exit(0);
}

async function onSIGTERM() {
  await shutdownService("Received SIGTERM signal.");
  process.exit(0);
}

async function shutdownService(reason: string) {
  try {
    logger.info(`Gracefully shutting down container: ${reason}`);
    await sleep(GRACEFULL_SHUTDOWN_TIME);
    if (server) server.close();
  } catch (e) {
    logger.error(e, "An error occurred while trying to shutdown the server.");
  }
}

const startServer = async () => {
  process.on("uncaughtException", onUncaughtExceptions);
  process.on("SIGTERM", onSIGTERM);

  /* tslint:disable-next-line */
  server = new App().app.listen(PORT, () => {
    logger.info(`Cofefi-Docs API listening on port ${PORT}!`);
  });
};

startServer();
