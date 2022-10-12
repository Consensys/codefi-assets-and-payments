import Joi from 'joi'

export const stringifiedArraySchema = Joi.string().custom(
  (jsonString: string, helper) => {
    const parsedJson = JSON.parse(jsonString)

    if (!Array.isArray(parsedJson)) {
      helper.error(`Field needs to be a JSON array`)
    }

    return parsedJson
  },
)
