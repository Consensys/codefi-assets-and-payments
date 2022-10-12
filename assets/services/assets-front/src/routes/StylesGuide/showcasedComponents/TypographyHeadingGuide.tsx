import React from 'react';
import Example from '../components/Example';

const TypographyHeadingGuide: React.FC = () => {
  return (
    <div>
      <h2>Typographty - Heading</h2>

      <p>
        HTML tag have no associated styles. Font weight and font size should be
        set from the related CSS variables.
      </p>

      <p>
        CSS variables are globally availables in all SCSS files. This is the
        recommended use for colors.
      </p>

      <Example
        code={`<style
  dangerouslySetInnerHTML={{
    __html: '
    .typographyHeadingGuide-div { font-weight: var(--typography-weight-medium); font-size: var(--typography-size-f7); }
    .typographyHeadingGuide-h1 { font-weight: var(--typography-weight-medium); font-size: var(--typography-size-f6); }
    .typographyHeadingGuide-h2 { font-weight: var(--typography-weight-medium); font-size: var(--typography-size-f5); }
    .typographyHeadingGuide-h3 { font-weight: var(--typography-weight-medium); font-size: var(--typography-size-f4); }
    .typographyHeadingGuide-h4 { font-weight: var(--typography-weight-medium); font-size: var(--typography-size-f3); }
    .typographyHeadingGuide-h5 { font-weight: var(--typography-weight-medium); font-size: var(--typography-size-f2); }
    .typographyHeadingGuide-h6 { font-weight: var(--typography-weight-medium); font-size: var(--typography-size-f1); }
    .typographyHeadingGuide-small { font-weight: var(--typography-weight-medium); font-size: var(--typography-size-f0); }
    ',
  }}
/>
<div className="typographyHeadingGuide-div">XL - Helvetica Neue - Medium - 64px - F7</div>
<h1 className="typographyHeadingGuide-h1">H1 - Helvetica Neue - Medium - 48px - F6</h1>
<h2 className="typographyHeadingGuide-h2">H2 - Helvetica Neue - Medium - 32px - F5</h2>
<h3 className="typographyHeadingGuide-h3">H3 - Helvetica Neue - Medium - 24px - F4</h3>
<h4 className="typographyHeadingGuide-h4">H4 - Helvetica Neue - Medium - 20px - F3</h4>
<h5 className="typographyHeadingGuide-h5">H5 - Helvetica Neue - Medium - 16px - F2</h5>
<h6 className="typographyHeadingGuide-h6">H6 - Helvetica Neue - Medium - 14px - F1</h6>
<small className="typographyHeadingGuide-small">SM - Helvetica Neue - Medium - 12px - F0</small>`}
      >
        <style
          dangerouslySetInnerHTML={{
            __html: `
.typographyHeadingGuide-div { font-weight: var(--typography-weight-medium); font-size: var(--typography-size-f7); }
.typographyHeadingGuide-h1 { font-weight: var(--typography-weight-medium); font-size: var(--typography-size-f6); }
.typographyHeadingGuide-h2 { font-weight: var(--typography-weight-medium); font-size: var(--typography-size-f5); }
.typographyHeadingGuide-h3 { font-weight: var(--typography-weight-medium); font-size: var(--typography-size-f4); }
.typographyHeadingGuide-h4 { font-weight: var(--typography-weight-medium); font-size: var(--typography-size-f3); }
.typographyHeadingGuide-h5 { font-weight: var(--typography-weight-medium); font-size: var(--typography-size-f2); }
.typographyHeadingGuide-h6 { font-weight: var(--typography-weight-medium); font-size: var(--typography-size-f1); }
.typographyHeadingGuide-small { font-weight: var(--typography-weight-medium); font-size: var(--typography-size-f0); }
    `,
          }}
        />
        <div className="typographyHeadingGuide-div">
          XL - Helvetica Neue - Medium - 64px - F7
        </div>
        <h1 className="typographyHeadingGuide-h1">
          H1 - Helvetica Neue - Medium - 48px - F6
        </h1>
        <h2 className="typographyHeadingGuide-h2">
          H2 - Helvetica Neue - Medium - 32px - F5
        </h2>
        <h3 className="typographyHeadingGuide-h3">
          H3 - Helvetica Neue - Medium - 24px - F4
        </h3>
        <h4 className="typographyHeadingGuide-h4">
          H4 - Helvetica Neue - Medium - 20px - F3
        </h4>
        <h5 className="typographyHeadingGuide-h5">
          H5 - Helvetica Neue - Medium - 16px - F2
        </h5>
        <h6 className="typographyHeadingGuide-h6">
          H6 - Helvetica Neue - Medium - 14px - F1
        </h6>
        <small className="typographyHeadingGuide-small">
          SM - Helvetica Neue - Medium - 12px - F0
        </small>
      </Example>
    </div>
  );
};
export default TypographyHeadingGuide;
