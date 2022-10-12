// eslint-disable-next-line @typescript-eslint/no-unused-vars
export interface MicroserviceMessage<BodyType> {
  messageSchema: any;
  getMessageName(): string;
  fullyQualifiedName(): string;
}
