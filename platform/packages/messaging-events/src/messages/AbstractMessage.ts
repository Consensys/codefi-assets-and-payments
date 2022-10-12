import { MicroserviceMessage } from '..';
import { fullPattern } from '../constants';

export abstract class AbstractMessage<BodyType>
  implements MicroserviceMessage<BodyType>
{
  protected messageName: string;
  messageSchema: any;

  getMessageName(): string {
    return fullPattern(this.messageName);
  }

  fullyQualifiedName(): string {
    return `${this.messageSchema.namespace}.${this.messageSchema.name}`;
  }
}
