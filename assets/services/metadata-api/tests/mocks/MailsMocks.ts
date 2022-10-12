import { MailDto } from 'src/model/dto/MailDto';

export const getMockMail = (tenantId: string): MailDto => ({
  buttonLabel: 'label',
  key: 'mailKey',
  message: 'message',
  messageTitle: 'title',
  subject: 'subject@test.com',
  tenantId,
});
