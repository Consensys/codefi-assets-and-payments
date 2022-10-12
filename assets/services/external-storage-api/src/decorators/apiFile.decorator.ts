import { ApiBody } from "@nestjs/swagger";

export const ApiFile =
  (fileName = "file"): MethodDecorator =>
  (target: any, propertyKey: any, descriptor: PropertyDescriptor) => {
    ApiBody({
      schema: {
        type: "object",
        properties: {
          [fileName]: {
            type: "string",
            format: "binary",
          },
        },
      },
    })(target, propertyKey, descriptor);
  };
