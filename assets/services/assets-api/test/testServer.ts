import { nestjsLogger } from '@consensys/observability';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { TestingModule, Test } from '@nestjs/testing';
import { AuthenticationGuard } from 'src/authentication.guard';
import { AppModule } from 'src/modules/app.module';
import { ApiEntityCallService } from 'src/modules/v2ApiCall/api.call.service/entity';
import request from 'supertest';

let nestApp: INestApplication;
let moduleRef: TestingModule;
let superTestApp: request.SuperTest<request.Test>;

const initServer = async () => {
  try {
    moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    nestApp = moduleRef.createNestApplication();

    const appLogger = nestjsLogger();
    const apiEntityCallService = moduleRef.get(ApiEntityCallService);

    nestApp.useGlobalGuards(
      new AuthenticationGuard(appLogger.logger, apiEntityCallService),
    );
    nestApp.useGlobalPipes(new ValidationPipe({ transform: true }));
    await nestApp.init();
    nestApp.listen(3002);
    superTestApp = request(nestApp.getHttpServer());
  } catch (error) {
    console.error('Failed to start tests', error);
  }
};

const tearDownServer = async () => {
  if (nestApp) {
    await nestApp.close();
  }
};

beforeAll(async () => {
  await initServer();
});

afterAll(async () => {
  await tearDownServer();
});

export const getServer = () => {
  return {
    nestApp,
    superTestApp,
    moduleRef,
  };
};
