import { Trace } from './tracing'

// const tracerTraceFn = sinon.spy(tracer, 'trace');

// eslint-disable-next-line @typescript-eslint/no-unused-vars
class TestClass {
  @Trace('method.trace')
  async method(res: number) {
    return res
  }
}

describe.skip('metrics', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  it('test', () => {
    expect(true).toBe(true)
  })

  // it('trace function returns value from a traced method', async () => {
  //   const res = await trace('test.trace', async () => {
  //     return 'res';
  //   });
  //
  //   expect(res).to.eq('res');
  //
  //   const activatedSpan = tracerTraceFn.firstCall.args[0];
  //   expect(activatedSpan).to.be.eq('test.trace');
  // });
  //
  // it('@Trace annotation returns value from a class method', async () => {
  //   const instance = new TestClass();
  //   const res = await instance.method(10);
  //
  //   expect(res).to.eq(10);
  //
  //   const activatedSpan = tracerTraceFn.firstCall.args[0];
  //   expect(activatedSpan).to.be.eq('method.trace');
  // });
})
