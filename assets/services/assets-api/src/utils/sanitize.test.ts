import { sanitize } from './sanitize';

describe('sanitize', () => {
  it('successfully sanitizes a string', () => {
    expect.assertions(1);

    const fakeHtmlElement = '<button type="button">Click Me!</button>';
    const result = sanitize({ value: fakeHtmlElement });
    expect(result).toEqual(
      '&lt;button type="button"&gt;Click Me!&lt;/button&gt;',
    );
  });

  it('successfully sanitizes an object and its inner properties', () => {
    expect.assertions(3);

    const fakeHtmlElement = '<button type="button">Click Me!</button>';
    const fakeHtmlScript = '<script>alert(‘XSS’)</script>';
    const result = sanitize({ value: { fakeHtmlElement, fakeHtmlScript } });

    expect(result).toEqual({
      fakeHtmlElement: '&lt;button type="button"&gt;Click Me!&lt;/button&gt;',
      fakeHtmlScript: '&lt;script&gt;alert(‘XSS’)&lt;/script&gt;',
    });

    expect(result.fakeHtmlElement).toEqual(
      sanitize({ value: fakeHtmlElement }),
    );
    expect(result.fakeHtmlScript).toEqual(sanitize({ value: fakeHtmlScript }));
  });

  it('successfully sanitizes an array of objects and its inner properties', () => {
    const fakeHtmlElement = '<button type="button">Click Me!</button>';
    const fakeHtmlScript = '<script>alert(‘XSS’)</script>';
    const result = sanitize({
      value: [{ fakeHtmlElement }, { fakeHtmlScript }],
    });

    expect(result).toEqual([
      {
        fakeHtmlElement: '&lt;button type="button"&gt;Click Me!&lt;/button&gt;',
      },
      { fakeHtmlScript: '&lt;script&gt;alert(‘XSS’)&lt;/script&gt;' },
    ]);

    expect(result[0].fakeHtmlElement).toEqual(
      sanitize({ value: fakeHtmlElement }),
    );
    expect(result[1].fakeHtmlScript).toEqual(
      sanitize({ value: fakeHtmlScript }),
    );
  });
});
