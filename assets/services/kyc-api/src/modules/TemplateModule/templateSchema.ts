import * as Joi from 'joi';
import { translationSchema } from 'src/validation/translationSchema';

export const templateSchema = Joi.object({
  issuerId: Joi.string().required(),
  name: Joi.string().required(),
  topSections: Joi.array()
    .items(
      Joi.object({
        key: Joi.string().required(),
        label: translationSchema.required(),
        sections: Joi.array()
          .items({
            key: Joi.string().required(),
            label: translationSchema.required(),
            description: translationSchema,
            elements: Joi.array().items(Joi.string().required()).required(),
          })
          .required(),
      }),
    )
    .required(),
  data: Joi.object(),
});
