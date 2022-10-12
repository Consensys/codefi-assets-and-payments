import request from "supertest";
import { v4 as uuidv4 } from "uuid";
import { Test, TestingModule } from "@nestjs/testing";
import { AppModule } from "../src/modules/AppModule";
import { INestApplication } from "@nestjs/common";
import { Item } from "../src/data/entities/ItemEntity";
import { Repository } from "typeorm";
import nock from "nock";
import config from "../src/config";

describe("Ipfs", () => {
  let itemRepository: Repository<Item>;
  const defaultResourceId = uuidv4();
  const testTenantId = "test-tenant-id";
  const ipfsHash = "QmT3J2MEc1C6RpiAXZjGoMhTGWh859G8cpz5ZsMyYeMTgU";
  const updatedIpfsHash = "QmWvrAT15xDYeJain2yrkotKvd5TshbaF714mcEZ95dErw";

  const defaultItem = {
    id: defaultResourceId,
    tenantId: testTenantId,
    content: JSON.stringify({
      file: {
        cid: Buffer.from(ipfsHash),
        size: 52,
        path: ipfsHash,
      },
    }),
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

  describe("/POST ipfs/:tenantId/:resourceId", () => {
    const itemId = uuidv4();
    const content = {
      value: "CREATE YOLO",
      anotherProp: "test",
    };

    it("successfully creates an item", async () => {
      nock("https://ipfs.infura.io:5001", { encodedQueryParams: true })
        .post("/api/v0/add")
        .query({ "stream-channels": "true", progress: "false" })
        .reply(200, { Name: ipfsHash, Hash: ipfsHash, Size: "52" }, [
          "Connection",
          "close",
          "X-Chunked-Output",
          "1",
          "Transfer-Encoding",
          "chunked",
        ]);

      nock("https://ipfs.infura.io:5001", { encodedQueryParams: true })
        .post("/api/v0/pin/add")
        .query({ recursive: "true", stream: "true", arg: ipfsHash })
        .reply(200, { Pins: [ipfsHash] });

      const resp = await app
        .post(`/ipfs/${testTenantId}/${itemId}`)
        .attach("file", Buffer.from(JSON.stringify(content)), {
          filename: "originalFileName",
          contentType: "application/json",
        })
        .expect(201);

      expect(resp.text).toEqual(`ipfs://${ipfsHash}`);
    });

    it("fails to create an already existing item", async () => {
      const resp = await app
        .post(`/ipfs/${testTenantId}/${defaultResourceId}`)
        .attach("file", Buffer.from(JSON.stringify(content)), {
          filename: "originalFileName",
          contentType: "application/json",
        })
        .expect(409);

      expect(resp.body).toEqual({
        error: "Conflict",
        message: `Resource "/ipfs/${testTenantId}/${defaultResourceId}" already exists.`,
        statusCode: 409,
      });
    });

    it("fails if more than one file is sent with another property name on formData request", async () => {
      const itemId = uuidv4();

      const resp = await app
        .post(`/ipfs/${testTenantId}/${itemId}`)
        .attach("thisFail", Buffer.from(JSON.stringify(content)), {
          filename: "originalFileName",
          contentType: "application/json",
        })
        .attach("file", Buffer.from(JSON.stringify(content)), {
          filename: "originalFileName",
          contentType: "application/json",
        })
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
        .post(`/ipfs/${testTenantId}/${itemId}`)
        .field("test", "nothing to see here")
        .expect(400);

      expect(resp.body).toEqual({
        message: "Bad Request",
        statusCode: 400,
      });
    });
  });

  describe("/GET ipfs/:tenantId/:resourceId", () => {
    it(`successfully returns content stored`, async () => {
      nock("https://ipfs.infura.io:5001", { encodedQueryParams: true })
        .post("/api/v0/cat")
        .query({ arg: ipfsHash })
        .reply(200, { value: "CREATE YOLO", anotherProp: "test" }, [
          "Content-Type",
          "text/plain",
          "X-Content-Length",
          "44",
          "X-Stream-Output",
          "1",
          "Transfer-Encoding",
          "chunked",
        ]);

      const resp = await app
        .get(`/ipfs/${testTenantId}/${defaultResourceId}`)
        .expect(200);

      expect(resp.body).toEqual({ value: "CREATE YOLO", anotherProp: "test" });
    });

    it("rertuns a 404 when content is not found", async () => {
      const itemId = uuidv4();
      const resp = await app.get(`/ipfs/no-tenant/${itemId}`).expect(404);

      expect(resp.body).toEqual({
        error: "Not Found",
        message: `Resource "/ipfs/no-tenant/${itemId}" does not exist.`,
        statusCode: 404,
      });
    });

    it("retuns a 500 when IPFS throws", async () => {
      nock("https://ipfs.infura.io:5001", { encodedQueryParams: true })
        .post("/api/v0/cat")
        .query({ arg: ipfsHash })
        .reply(400);

      const resp = await app
        .get(`/ipfs/${testTenantId}/${defaultResourceId}`)
        .expect(500);

      expect(resp.body).toEqual({
        message: "Internal Server Error",
        statusCode: 500,
      });
    });
  });

  describe("/PUT ipfs/:tenantId/:resourceId", () => {
    const content = {
      value: "UPDATE YOLO",
      anotherProp: "test",
    };

    it("successfully updates an item", async () => {
      nock("https://ipfs.infura.io:5001", { encodedQueryParams: true })
        .post("/api/v0/pin/rm")
        .query({ recursive: "true", arg: ipfsHash })
        .reply(200, { Pins: [ipfsHash] });

      nock("https://ipfs.infura.io:5001", { encodedQueryParams: true })
        .post("/api/v0/add")
        .query({ "stream-channels": "true", progress: "false" })
        .reply(
          200,
          { Name: updatedIpfsHash, Hash: updatedIpfsHash, Size: "52" },
          [
            "Connection",
            "close",
            "X-Chunked-Output",
            "1",
            "Transfer-Encoding",
            "chunked",
          ]
        );

      nock("https://ipfs.infura.io:5001", { encodedQueryParams: true })
        .post("/api/v0/pin/add")
        .query({ recursive: "true", stream: "true", arg: updatedIpfsHash })
        .reply(200, { Pins: [updatedIpfsHash] });

      const resp = await app
        .put(`/ipfs/${testTenantId}/${defaultResourceId}`)
        .attach("file", Buffer.from(JSON.stringify(content)), {
          filename: "originalFileName",
          contentType: "application/json",
        })
        .expect(201);

      expect(resp.text).toEqual(`ipfs://${updatedIpfsHash}`);
    });

    it("fails to update a non existing item", async () => {
      const itemId = uuidv4();
      const resp = await app
        .put(`/ipfs/${testTenantId}/${itemId}`)
        .attach("file", Buffer.from(JSON.stringify(content)), {
          filename: "originalFileName",
          contentType: "application/json",
        })
        .expect(404);

      expect(resp.body).toEqual({
        error: "Not Found",
        message: `Resource "/ipfs/${testTenantId}/${itemId}" does not exist.`,
        statusCode: 404,
      });
    });

    it("fails if more than one file is sent with another property name on formData request", async () => {
      const itemId = uuidv4();

      const resp = await app
        .put(`/ipfs/${testTenantId}/${itemId}`)
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
        .put(`/ipfs/${testTenantId}/${defaultResourceId}`)
        .field("test", "nothing to see here")
        .expect(400);

      expect(resp.body).toEqual({
        message: "Bad Request",
        statusCode: 400,
      });
    });
  });
});
