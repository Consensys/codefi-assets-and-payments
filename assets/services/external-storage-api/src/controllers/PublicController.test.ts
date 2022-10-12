import { PublicController } from "./PublicController";
import { NestJSPinoLogger } from "@codefi-assets-and-payments/observability";
import createMockInstance from "jest-create-mock-instance";
import { getMockedItem, getMockedFile } from "../../test/mocks";
import { ItemService } from "../services/ItemService";
import { S3Service } from "../services/S3Service";
import { Request } from "express";
import { Readable } from "stream";
import httpMocks from "node-mocks-http";
import { EventEmitter } from "events";

describe("PublicController", () => {
  let logger: NestJSPinoLogger;
  let itemServiceMock: jest.Mocked<ItemService>;
  let s3ServiceMock: jest.Mocked<S3Service>;
  let controller: PublicController;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
  });

  beforeEach(() => {
    logger = createMockInstance(NestJSPinoLogger);
    itemServiceMock = createMockInstance(ItemService);
    s3ServiceMock = createMockInstance(S3Service);
    controller = new PublicController(logger, itemServiceMock, s3ServiceMock);
  });

  afterAll(() => {
    jest.clearAllMocks();
  });

  describe("Post", () => {
    const tenantId = "fakeTenantId";
    const resourceId = "fakeResourceId";
    const originalContent = { value: "fakeContent" };
    const file = getMockedFile(originalContent) as Express.Multer.File;

    it("success", async () => {
      itemServiceMock.getItem.mockResolvedValueOnce(undefined);

      await controller.post(
        tenantId,
        resourceId,
        {
          header: (_name: string) => undefined,
        } as Request,
        file
      );
      expect(logger.info).toHaveBeenCalledTimes(1);

      expect(itemServiceMock.getItem).toHaveBeenCalledTimes(1);
      expect(itemServiceMock.getItem).toHaveBeenCalledWith(
        resourceId,
        tenantId
      );
      expect(s3ServiceMock.addFile).toHaveBeenCalledTimes(1);
      expect(s3ServiceMock.addFile).toHaveBeenCalledWith(file, resourceId);

      expect(itemServiceMock.createItem).toHaveBeenCalledTimes(1);
    });

    it("fails when resource already exists", async () => {
      itemServiceMock.getItem.mockResolvedValueOnce(
        getMockedItem(tenantId, resourceId)
      );

      try {
        await controller.post(
          tenantId,
          resourceId,
          {
            url: "fakeRequestUrl",
            header: (_name: string) => undefined,
          } as Request,
          file
        );
        fail();
      } catch (error) {
        expect(logger.info).toHaveBeenCalledTimes(1);

        expect(itemServiceMock.getItem).toHaveBeenCalledTimes(1);
        expect(itemServiceMock.getItem).toHaveBeenCalledWith(
          resourceId,
          tenantId
        );
        expect(itemServiceMock.createItem).not.toHaveBeenCalled;
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toEqual(
          'Resource "fakeRequestUrl" already exists.'
        );
      }
    });
  });

  describe("GetById", () => {
    it("success", (done) => {
      const tenantId = "fakeTenantId";
      const resourceId = "fakeResourceId";
      const fakeItem = getMockedItem(tenantId, resourceId);

      const s3Stream = Readable.from(fakeItem.content, { objectMode: true });

      itemServiceMock.getItem.mockResolvedValueOnce(fakeItem);
      s3ServiceMock.getFile.mockReturnValueOnce(s3Stream);

      const resp = httpMocks.createResponse({
        eventEmitter: EventEmitter,
      });

      controller
        .get(
          tenantId,
          resourceId,
          {
            res: {
              contentType: function (_type: string) {
                return this;
              },
            },
          } as Request,
          resp
        )
        .then((streamResp) => {
          streamResp.getStream().pipe(resp);

          resp.on("finish", () => {
            expect(resp._getData()).toEqual(fakeItem.content);
            expect(resp.header("content-type")).toEqual(fakeItem.contentType);
            expect(s3ServiceMock.getFile).toHaveBeenCalledTimes(1);
            expect(itemServiceMock.getItem).toHaveBeenCalledTimes(1);
            expect(logger.info).toHaveBeenCalledTimes(1);
            done();
          });
        });
    });
  });
});
