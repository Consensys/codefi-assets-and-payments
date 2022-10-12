import Joi from 'joi'

export const stringifiedMetadataWithOptions = Joi.string().custom(
  (jsonString: string, helper) => {
    const parsedJson = JSON.parse(jsonString)

    for (const key in parsedJson) {
      if (!key.match(/^[a-zA-Z0-9]+$/)) {
        helper.error(
          `Field name ${key} not supported. It contains non-alphanumeric characters`,
        )
      }
    }

    return parsedJson
  },
)
