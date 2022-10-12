import * as Joi from 'joi';
import { elementSchema } from './elementSchema';

export const elementsSchema = Joi.array().items(elementSchema).required();
