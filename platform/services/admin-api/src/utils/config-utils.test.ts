import { envBool, envInt, envJson, envRegex, envString } from './config-utils'

describe('config-utils', () => {
  describe('envString', () => {
    it('get string value', () => {
      process.env.VAL = 'val'

      const val = envString('VAL')
      expect(val).toEqual('val')
    })

    it('throws an error if a value is not provided', () => {
      // Missing ENVs don't throw if NODE_ENV is not set and Jest had set it to 'test'
      process.env.NODE_ENV = 'dev'

      delete process.env.VAL

      expect(() => {
        envString('VAL')
      }).toThrowError('Environment variable VAL not defined')
    })

    it('returns a default value if provided', () => {
      delete process.env.VAL

      const val = envString('VAL', 'def')
      expect(val).toEqual('def')
    })

    it('if nullable true returns a undefined', () => {
      delete process.env.VAL

      const val = envString('VAL', undefined, true)
      expect(val).toBeUndefined()
    })
  })

  describe('envInt', () => {
    it('parses int value', () => {
      process.env.VAL = '123'

      const val = envInt('VAL')
      expect(val).toEqual(123)
    })

    it('throws an error if cannot parse int value', () => {
      process.env.VAL = 'abc'

      expect(() => {
        envInt('VAL')
      }).toThrowError('Failed to parse environment variable VAL=abc as integer')
    })

    it('throws an error if a value is not provided', () => {
      delete process.env.VAL

      expect(() => {
        envInt('VAL')
      }).toThrowError('Environment variable VAL not defined')
    })

    it('returns a default value if provided', () => {
      delete process.env.VAL

      const val = envInt('VAL', 234)
      expect(val).toEqual(234)
    })
  })

  describe('envBool', () => {
    it('parses true boolean value', () => {
      process.env.VAL = 'true'

      const val = envBool('VAL')
      expect(val).toEqual(true)
    })

    it('parses false boolean value', () => {
      process.env.VAL = 'FalSe'

      const val = envBool('VAL')
      expect(val).toEqual(false)
    })

    it('throws an error if cannot parse boolean value', () => {
      process.env.VAL = 'abc'

      expect(() => {
        envBool('VAL')
      }).toThrowError('Failed to parse environment variable VAL=abc as boolean')
    })

    it('throws an error if a value is not provided', () => {
      delete process.env.VAL

      expect(() => {
        envBool('VAL')
      }).toThrowError('Environment variable VAL not defined')
    })

    it('returns a default value if provided', () => {
      delete process.env.VAL

      const val = envBool('VAL', false)
      expect(val).toEqual(false)
    })
  })

  describe('envRegex', () => {
    it('parses value from env using regex', () => {
      process.env.VAL = 'test1somevaluetest2'

      const val = envRegex('VAL', /test1(.+)test2/)
      expect(val).toEqual('somevalue')
    })

    it('parses value from env using regex and specific group', () => {
      process.env.VAL = 'test1somevaluetest2someothervaluetest3'

      const val = envRegex('VAL', /test1(.+)test2(.+)test3/, 2)
      expect(val).toEqual('someothervalue')
    })

    it('returns undefined if no env', () => {
      process.env.VAL = undefined

      const val = envRegex('VAL', /test1(.+)test2/)
      expect(val).toBeUndefined()
    })

    it('returns undefined if regex does not match', () => {
      process.env.VAL = 'invalidvalue'

      const val = envRegex('VAL', /test1(.+)test2/)
      expect(val).toEqual(undefined)
    })
  })

  describe('envJson', () => {
    it('get value from json', () => {
      process.env.VAL = '["value1","value2"]'

      const val = envJson<string[]>('VAL')
      expect(val).toEqual(['value1', 'value2'])
    })

    it('throws an error if a value is not provided', () => {
      delete process.env.VAL

      expect(() => {
        envJson<string[]>('VAL')
      }).toThrowError('Environment variable VAL not defined')
    })

    it('returns a default value if provided', () => {
      delete process.env.VAL

      const val = envJson<string[]>('VAL', ['value1'])
      expect(val).toEqual(['value1'])
    })

    it('throws an error if invalid JSON', () => {
      process.env.VAL = 'invalidjson'

      expect(() => {
        envJson<string[]>('VAL')
      }).toThrowError(
        'Failed to parse environment variable VAL=invalidjson as JSON',
      )
    })
  })
})
