import * as Joi from 'joi';
import { reviewSchema } from './reviewSchema';

export const reviewsSchema = Joi.array()
  .items(reviewSchema.required())
  .required();
