import { envBool, envInt, envString } from './config-utils';

describe('config-utils', () => {
  describe('envString', () => {
    it('get string value', () => {
      process.env.VAL = 'val';

      const val = envString('VAL');
      expect(val).toEqual('val');
    });

    it('returns a default value if provided', () => {
      delete process.env.VAL;

      const val = envString('VAL', 'def');
      expect(val).toEqual('def');
    });

    it('returns undefined if no value and no default', () => {
      delete process.env.VAL;

      const val = envString('VAL');
      expect(val).toBeUndefined();
    });
  });

  describe('envInt', () => {
    it('parses int value', () => {
      process.env.VAL = '123';

      const val = envInt('VAL');
      expect(val).toEqual(123);
    });

    it('throws an error if cannot parse int value', () => {
      process.env.VAL = 'abc';

      expect(() => {
        envInt('VAL');
      }).toThrowError(
        'Failed to parse environment variable VAL=abc as integer'
      );
    });

    it('returns a default value if provided', () => {
      delete process.env.VAL;

      const val = envInt('VAL', 234);
      expect(val).toEqual(234);
    });

    it('returns undefined if no value and no default', () => {
      delete process.env.VAL;

      const val = envInt('VAL');
      expect(val).toBeUndefined();
    });
  });

  describe('envBool', () => {
    it('parses true boolean value', () => {
      process.env.VAL = 'true';

      const val = envBool('VAL');
      expect(val).toEqual(true);
    });

    it('parses false boolean value', () => {
      process.env.VAL = 'FalSe';

      const val = envBool('VAL');
      expect(val).toEqual(false);
    });

    it('throws an error if cannot parse boolean value', () => {
      process.env.VAL = 'abc';

      expect(() => {
        envBool('VAL');
      }).toThrowError(
        'Failed to parse environment variable VAL=abc as boolean'
      );
    });

    it('returns a default value if provided', () => {
      delete process.env.VAL;

      const val = envBool('VAL', false);
      expect(val).toEqual(false);
    });

    it('returns undefined if no value and no default', () => {
      delete process.env.VAL;

      const val = envBool('VAL');
      expect(val).toBeUndefined();
    });
  });
});
