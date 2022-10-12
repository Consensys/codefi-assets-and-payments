import createMockInstance from "jest-create-mock-instance";
import { NestJSPinoLogger } from "@codefi-assets-and-payments/observability";
import { Repository } from "typeorm";
import { ItemService } from "./ItemService";
import { Item } from "../data/entities/ItemEntity";
import Mocked = jest.Mocked;
import { getMockedItem } from "../../test/mocks";

describe("ItemService", () => {
  let logger: NestJSPinoLogger;
  let service: ItemService;
  let mockRepository: Mocked<Repository<Item>>;

  beforeEach(() => {
    logger = createMockInstance(NestJSPinoLogger);
    mockRepository = createMockInstance(Repository) as any;
    service = new ItemService(logger, mockRepository);
  });

  it("create item", async () => {
    const mockedItem = getMockedItem("fakeTenant", "fakeResource");
    await service.createItem(mockedItem);

    expect(mockRepository.save).toHaveBeenCalledWith(mockedItem);
  });

  it("get item", async () => {
    await service.getItem("123", "fakeTenantId");

    expect(mockRepository.findOne).toHaveBeenCalledWith({
      where: { id: "123" },
    });
  });
});
