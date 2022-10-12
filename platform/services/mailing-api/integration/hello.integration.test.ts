import { hello } from './utils/requests'
require('dotenv').config()

jest.setTimeout(10000)

describe('hello', () => {
  it('can say hello', async () => {
    const response = await hello()
    expect(response.data).toBe('OK')
  })
})
