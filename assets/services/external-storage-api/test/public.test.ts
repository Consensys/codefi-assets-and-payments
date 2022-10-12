import request from "supertest";
import { v4 as uuidv4 } from "uuid";
import { Test, TestingModule } from "@nestjs/testing";
import { AppModule } from "../src/modules/AppModule";
import { INestApplication } from "@nestjs/common";
import { Item } from "../src/data/entities/ItemEntity";
import { Repository } from "typeorm";
import nock from "nock";
import config from "../src/config";

describe("Public", () => {
  let itemRepository: Repository<Item>;
  const defaultResourceId = uuidv4();
  const testTenantId = "test-tenant-id";
  const { defaultBucket: S3Bucket, region: awsRegion } = config().aws;
  const awsRegionURL = ["", "us-east-1"].includes(awsRegion)
    ? ""
    : awsRegion + ".";
  const awsS3Host = `https://${S3Bucket}.s3.${awsRegionURL}amazonaws.com`;

  const defaultItem = {
    id: defaultResourceId,
    tenantId: testTenantId,
    content: JSON.stringify({ test: "EXISTING RESOURCE" }),
    contentType: "application/json",
  };

  let nestApp: INestApplication;
  let app: request.SuperTest<request.Test>;
  let moduleRef: TestingModule;

  beforeAll(async () => {
    nock.disableNetConnect();
    nock.enableNetConnect("127.0.0.1");
  });

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    nestApp = moduleRef.createNestApplication();
    await nestApp.init();
    nestApp.listen(config().serverPort);

    app = request(nestApp.getHttpServer());
  });

  beforeAll(async () => {
    itemRepository = moduleRef.get("ItemRepository");

    await itemRepository.save(defaultItem);
  });

  afterEach(() => {
    if (!nock.isDone()) {
      throw new Error(`Pending network mocks: ${nock.pendingMocks()}`);
    }
  });

  afterAll(async () => {
    await itemRepository.delete({});
  });

  afterAll(async () => {
    await nestApp.close();
  });

  describe("/POST public/:tenantId/:resourceId", () => {
    const itemId = uuidv4();
    const content = {
      value: "CREATE YOLO",
      anotherProp: "test",
    };

    it("successfully creates an item", async () => {
      nock(awsS3Host)
        .put(`/${itemId}`, content)
        .reply(200, "", [
          "x-amz-id-2",
          "hpWDjngdT55ami7+e8qp/KQklTmEtMSyOBvatRbdjjHYI1qAmCmRTqbM42zVYHFwZA16fO+VZ+g=",
          "x-amz-request-id",
          "3D6W6KAWGKF95D06",
          "ETag",
          '"b3943b6f21050c8b017d28b9c9e56718"',
          "Server",
          "AmazonS3",
          "Content-Length",
          "0",
        ]);

      const resp = await app
        .post(`/public/${testTenantId}/${itemId}`)
        .attach("file", Buffer.from(JSON.stringify(content)), {
          filename: "originalFileName",
          contentType: "application/json",
        })
        .expect(201);

      expect(resp.text).toEqual(`127.0.0.1/public/${testTenantId}/${itemId}`);
    });

    it("fails to create an already existing item", async () => {
      const resp = await app
        .post(`/public/${testTenantId}/${defaultResourceId}`)
        .attach(
          "file",
          Buffer.from(
            JSON.stringify({ value: "CREATE YOLO", anotherProp: "test" })
          ),
          { filename: "originalFileName", contentType: "application/json" }
        )
        .expect(409);

      expect(resp.body).toEqual({
        error: "Conflict",
        message: `Resource "/public/${testTenantId}/${defaultResourceId}" already exists.`,
        statusCode: 409,
      });
    });

    it("fails if more than one file is sent with another property name on formData request", async () => {
      const itemId = uuidv4();

      const resp = await app
        .post(`/public/${testTenantId}/${itemId}`)
        .attach(
          "thisFail",
          Buffer.from(
            JSON.stringify({ value: "CREATE YOLO", anotherProp: "test" })
          ),
          { filename: "originalFileName", contentType: "application/json" }
        )
        .attach(
          "file",
          Buffer.from(
            JSON.stringify({ value: "CREATE YOLO", anotherProp: "test" })
          ),
          { filename: "originalFileName", contentType: "application/json" }
        )
        .expect(400);

      expect(resp.body).toEqual({
        error: "Bad Request",
        message: "Unexpected field",
        statusCode: 400,
      });
    });

    it("fails if no file is sent in the formData request", async () => {
      const itemId = uuidv4();

      const resp = await app
        .post(`/public/${testTenantId}/${itemId}`)
        .field("test", "nothing to see here")
        .expect(400);

      expect(resp.body).toEqual({
        message: "Bad Request",
        statusCode: 400,
      });
    });
  });

  describe("/GET public/:tenantId/:resourceId", () => {
    it("successfully returns content stored", async () => {
      nock(awsS3Host)
        .get(`/${defaultResourceId}`)
        .reply(200, JSON.parse(defaultItem.content), [
          "x-amz-id-2",
          "Z+9cbr+ZpZN/inFx42Aq3+ndYDmLVJeGjNhg5zzju1NDUZ4aPOOf5Z5b7pVKm2Nca89sCXsj7DU=",
          "x-amz-request-id",
          "KXMS96Z3F355RMC2",
          "ETag",
          '"b3943b6f21050c8b017d28b9c9e56718"',
          "Accept-Ranges",
          "bytes",
          "Content-Type",
          "application/json",
          "Content-Length",
          "28",
        ]);

      const resp = await app
        .get(`/public/${testTenantId}/${defaultResourceId}`)
        .expect(200);

      expect(resp.body).toEqual(JSON.parse(defaultItem.content));
    });

    it("rertuns a 404 when content is not found", async () => {
      const itemId = uuidv4();
      const resp = await app.get(`/public/no-tenant/${itemId}`).expect(404);

      expect(resp.body).toEqual({
        error: "Not Found",
        message: `Resource "/public/no-tenant/${itemId}" does not exist.`,
        statusCode: 404,
      });
    });

    it("retuns a 500 when S3 throws", async () => {
      nock(awsS3Host).get(`/${defaultResourceId}`).reply(400);

      const resp = await app
        .get(`/public/${testTenantId}/${defaultResourceId}`)
        .expect(500);

      expect(resp.body).toEqual({
        message: "Internal Server Error",
        statusCode: 500,
      });
    });
  });

  describe("/PUT public/:tenantId/:resourceId", () => {
    const content = {
      value: "UPDATE YOLO",
      anotherProp: "test",
    };

    it("successfully updates an item", async () => {
      nock(awsS3Host)
        .put(`/${defaultResourceId}`, content)
        .reply(200, "", [
          "x-amz-id-2",
          "hpWDjngdT55ami7+e8qp/KQklTmEtMSyOBvatRbdjjHYI1qAmCmRTqbM42zVYHFwZA16fO+VZ+g=",
          "x-amz-request-id",
          "3D6W6KAWGKF95D06",
          "ETag",
          '"b3943b6f21050c8b017d28b9c9e56718"',
          "Server",
          "AmazonS3",
          "Content-Length",
          "0",
        ]);

      const resp = await app
        .put(`/public/${testTenantId}/${defaultResourceId}`)
        .attach("file", Buffer.from(JSON.stringify(content)), {
          filename: "originalFileName",
          contentType: "application/json",
        })
        .expect(201);

      expect(resp.text).toEqual(
        `127.0.0.1/public/${testTenantId}/${defaultResourceId}`
      );
    });

    it("fails to update a non existing item", async () => {
      const itemId = uuidv4();
      const resp = await app
        .put(`/public/${testTenantId}/${itemId}`)
        .attach(
          "file",
          Buffer.from(
            JSON.stringify({ value: "CREATE YOLO", anotherProp: "test" })
          ),
          { filename: "originalFileName", contentType: "application/json" }
        )
        .expect(404);

      expect(resp.body).toEqual({
        error: "Not Found",
        message: `Resource "/public/${testTenantId}/${itemId}" does not exist.`,
        statusCode: 404,
      });
    });

    it("fails if more than one file is sent with another property name on formData request", async () => {
      const itemId = uuidv4();

      const resp = await app
        .put(`/public/${testTenantId}/${itemId}`)
        .attach(
          "thisFail",
          Buffer.from(
            JSON.stringify({ value: "CREATE YOLO", anotherProp: "test" })
          ),
          { filename: "originalFileName", contentType: "application/json" }
        )
        .attach(
          "file",
          Buffer.from(
            JSON.stringify({ value: "CREATE YOLO", anotherProp: "test" })
          ),
          { filename: "originalFileName", contentType: "application/json" }
        )
        .expect(400);

      expect(resp.body).toEqual({
        error: "Bad Request",
        message: "Unexpected field",
        statusCode: 400,
      });
    });

    it("fails if no file is sent in the formData request", async () => {
      const resp = await app
        .put(`/public/${testTenantId}/${defaultResourceId}`)
        .field("test", "nothing to see here")
        .expect(400);

      expect(resp.body).toEqual({
        message: "Bad Request",
        statusCode: 400,
      });
    });
  });
});
