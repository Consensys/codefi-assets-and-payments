# @consensys/messaging-events

A framework agnostic package to store events AVRO schemas and interfaces

## How to add a new event

1. Create a new AVRO schema under `src/schemas`. For example:

```
export class UserCreatedEventSchema {
  static schema = {
    type: 'record',
    name: 'userCreated',
    namespace: 'net.consensys.codefi.user',
    fields: [{ name: 'client_id', type: 'string' }],
  };
}
```

2. Create the event extending `AbstractEvent`, providing:

* `eventName`: it will be used as the kafka topic
* `eventSchema`: Points to the schema created above

For example:

```
export class UserCreatedEvent extends AbstractEvent {
  public eventName = 'user_created';
  public eventSchema: any = UserCreatedEventSchema.schema;
}
```

3. Create the TypeScript interface:


```
export interface IUserCreatedEvent {
  clientId: string;
}
```

(This step could be automated using an AVRO-to-TypeScript code generator, but I couldn't find any tool flexible enough)

4. Add the event to the static class `Events`, for example:

```
export class Events {
  public static userCreatedEvent = new UserCreatedEvent();
}
```

5. The producers are registering the schemas that they are using depending on this package version into Schema Registry, so nothing else is needed here
