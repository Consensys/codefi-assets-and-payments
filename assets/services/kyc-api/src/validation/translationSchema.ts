import * as Joi from 'joi';
import { Translation } from 'src/models/Translation';

export const translationSchema = Joi.object<Translation>()
  .keys({
    fr: Joi.string().required(),
    en: Joi.string().required(),
  })
  .pattern(/./, Joi.string());
