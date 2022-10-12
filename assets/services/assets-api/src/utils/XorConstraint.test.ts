import { validate, Validate } from 'class-validator';
import { XorConstraint } from './XorConstraint';

class TestClass {
  @Validate(XorConstraint, ['attributeTwo'])
  attributeOne: string;

  @Validate(XorConstraint, ['attributeOne'])
  attributeTwo?: string;

  constructor(one: string, two?: string) {
    this.attributeOne = one;
    this.attributeTwo = two;
  }
}

describe('XorConstraint', () => {
  it('shouldPass', async () => {
    const shouldPass = new TestClass('firstParameter');
    const validationErrors = await validate(shouldPass);
    expect(validationErrors).toHaveLength(0);
  });

  it('shouldFail', async () => {
    const shouldFail = new TestClass('firstParameter', 'failedXOr');
    const validationErrors = await validate(shouldFail);
    expect(validationErrors).toHaveLength(2);
  });
});
