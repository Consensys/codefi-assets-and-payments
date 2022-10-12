import { JoiValidationPipe } from './JoiValidationPipe'
import { productsSchema } from './productsSchema'

describe('productSchema', () => {
  const validationPipe = new JoiValidationPipe(productsSchema)

  it('(OK) success when setting valid products', () => {
    const products = {
      assets: true,
      payments: false,
    }

    const result = validationPipe.transform(products)

    expect(result).toEqual(products)
  })

  it('(OK) success when settingno products', () => {
    const products = {}

    const result = validationPipe.transform(products)

    expect(result).toEqual(products)
  })

  it('(FAIL) throws when using invalid key', () => {
    const products = {
      assets: true,
      wrongKey: true,
      payments: false,
    }

    expect(() => validationPipe.transform(products)).toThrowError(
      '"wrongKey" is not allowed',
    )
  })

  it('(FAIL) throws when not using a boolean to set a key', () => {
    const products = {
      assets: true,
      payments: 'wrongValue',
    }

    expect(() => validationPipe.transform(products)).toThrowError(
      '"payments" must be a boolean',
    )
  })
})
