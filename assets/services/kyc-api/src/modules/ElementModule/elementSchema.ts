import * as Joi from 'joi';

import { translationSchema } from 'src/validation/translationSchema';
import { ElementStatus, ElementType } from 'src/utils/constants/enum';

export const elementSchema = Joi.object({
  key: Joi.string().required(),
  type: Joi.string()
    .valid(
      ElementType.STRING,
      ElementType.NUMBER,
      ElementType.CHECK,
      ElementType.RADIO,
      ElementType.DOCUMENT,
      ElementType.MULTISTRING,
      ElementType.DATE,
      ElementType.TITLE,
    )
    .required(),
  status: Joi.string()
    .valid(
      ElementStatus.MANDATORY,
      ElementStatus.OPTIONAL,
      ElementStatus.CONDITIONAL,
    )
    .required(),
  label: translationSchema.required(),
  placeholder: translationSchema,
  inputs: Joi.array()
    .items(
      Joi.object({
        label: translationSchema.required(),
        relatedElements: Joi.array(),
        value: Joi.string(),
      }),
    )
    .when('type', {
      switch: [
        { is: ElementType.CHECK, then: Joi.required() },
        { is: ElementType.RADIO, then: Joi.required() },
        { is: ElementType.MULTISTRING, then: Joi.required() },
      ],
      otherwise: Joi.forbidden(),
    }),
  data: Joi.object(),
});
