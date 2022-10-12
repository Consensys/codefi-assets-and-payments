import { UseCaseDto } from 'src/model/dto/UseCaseDto';

export const getMockedUseCase = (
  tenantId: string,
  name: string,
): UseCaseDto => ({
  config: { name: 'test', tenantId },
  name,
  keys: { testKey: 'key' },
});
