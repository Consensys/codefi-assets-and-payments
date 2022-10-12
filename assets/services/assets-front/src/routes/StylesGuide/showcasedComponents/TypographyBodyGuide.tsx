import React from 'react';
import Example from '../components/Example';

const TypographyBodyGuide: React.FC = () => {
  return (
    <div>
      <h2>Typography - Body</h2>

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
.typographyBodyGuide-large { font-size: var(--typography-size-f3); }
.typographyBodyGuide-medium { font-size: var(--typography-size-f2); }
.typographyBodyGuide-small { font-size: var(--typography-size-f1); }
.typographyBodyGuide-x-small { font-size: var(--typography-size-f0); }
',
  }}
/>
<p className="typographyBodyGuide-large">
  <b>body / large</b>
  <br />
  Ethereum is an open source, public, blockchain-based distributed
  computing platform and operating system featuring smart contract
  (scripting) functionality. It supports a modified version of Nakamoto
  consensus via transaction-based state transitions.
</p>
<p className="typographyBodyGuide-medium">
  <b>body / medium</b>
  <br />
  Ethereum is an open source, public, blockchain-based distributed
  computing platform and operating system featuring smart contract
  (scripting) functionality. It supports a modified version of Nakamoto
  consensus via transaction-based state transitions.
</p>
<p className="typographyBodyGuide-small">
  <b>body / small</b>
  <br />
  Ethereum is an open source, public, blockchain-based distributed
  computing platform and operating system featuring smart contract
  (scripting) functionality. It supports a modified version of Nakamoto
  consensus via transaction-based state transitions.
</p>
<p className="typographyBodyGuide-x-small">
  <b>body / x-small</b>
  <br />
  Ethereum is an open source, public, blockchain-based distributed
  computing platform and operating system featuring smart contract
  (scripting) functionality. It supports a modified version of Nakamoto
  consensus via transaction-based state transitions.
</p>`}
      >
        <style
          dangerouslySetInnerHTML={{
            __html: `
.typographyBodyGuide-large { font-size: var(--typography-size-f3); }
.typographyBodyGuide-medium { font-size: var(--typography-size-f2); }
.typographyBodyGuide-small { font-size: var(--typography-size-f1); }
.typographyBodyGuide-x-small { font-size: var(--typography-size-f0); }
    `,
          }}
        />
        <p className="typographyBodyGuide-large">
          <b>body / large</b>
          <br />
          Ethereum is an open source, public, blockchain-based distributed
          computing platform and operating system featuring smart contract
          (scripting) functionality. It supports a modified version of Nakamoto
          consensus via transaction-based state transitions.
        </p>
        <br />
        <p className="typographyBodyGuide-medium">
          <b>body / medium</b>
          <br />
          Ethereum is an open source, public, blockchain-based distributed
          computing platform and operating system featuring smart contract
          (scripting) functionality. It supports a modified version of Nakamoto
          consensus via transaction-based state transitions.
        </p>
        <br />
        <p className="typographyBodyGuide-small">
          <b>body / small</b>
          <br />
          Ethereum is an open source, public, blockchain-based distributed
          computing platform and operating system featuring smart contract
          (scripting) functionality. It supports a modified version of Nakamoto
          consensus via transaction-based state transitions.
        </p>
        <br />
        <p className="typographyBodyGuide-x-small">
          <b>body / x-small</b>
          <br />
          Ethereum is an open source, public, blockchain-based distributed
          computing platform and operating system featuring smart contract
          (scripting) functionality. It supports a modified version of Nakamoto
          consensus via transaction-based state transitions.
        </p>
      </Example>
    </div>
  );
};
export default TypographyBodyGuide;
