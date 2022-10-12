import { INestApplication } from '@nestjs/common'
import { TestingModule, Test } from '@nestjs/testing'
import { AppModule } from 'src/modules/AppModule'
import request from 'supertest'

let nestApp: INestApplication
let moduleRef: TestingModule
let superTestApp: request.SuperTest<request.Test>

const initServer = async () => {
  try {
    moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    nestApp = moduleRef.createNestApplication()
    await nestApp.init()
    nestApp.listen(process.env.PORT)
    superTestApp = request(nestApp.getHttpServer())
  } catch (error) {
    console.error('Failed to start tests', error)
  }
}

const tearDownServer = async () => {
  if (nestApp) {
    await nestApp.close()
  }
}

beforeAll(async () => {
  await initServer()
})

afterAll(async () => {
  await tearDownServer()
})

export const getServer = () => {
  return {
    nestApp,
    superTestApp,
    moduleRef,
  }
}
