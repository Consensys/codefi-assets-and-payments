import { ProjectDto } from 'src/model/dto/ProjectsDto';
import { v4 as uuidv4 } from 'uuid';

export const getMockedProject = (tenantId: string): ProjectDto => ({
  bankAccount: {},
  data: {},
  description: 'desc',
  key: 'project_key',
  name: 'test project',
  picture: [],
  tenantId,
  kycTemplateId: uuidv4(),
});
