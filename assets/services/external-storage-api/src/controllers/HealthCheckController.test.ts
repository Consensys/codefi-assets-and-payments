import { HealthCheckController } from "./HealthCheckController";
import { HealthCheckService, HttpHealthIndicator } from "@nestjs/terminus";
import createMockInstance from "jest-create-mock-instance";

describe("HealthCheckController", () => {
  let controller: HealthCheckController;
  let health: jest.Mocked<HealthCheckService>;
  let http: jest.Mocked<HttpHealthIndicator>;

  beforeEach(() => {
    health = createMockInstance(HealthCheckService);
    http = createMockInstance(HttpHealthIndicator);
    controller = new HealthCheckController(health, http);
  });

  it("health", async () => {
    await expect(controller.healthOldCheck()).toBe("OK");
  });
});
