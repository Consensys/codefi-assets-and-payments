import React from 'react';
import Example from '../components/Example';

const ShadowsGuide: React.FC = () => {
  return (
    <div>
      <h2>Box shadows</h2>

      <p>
        CSS variables that can be applied to the <code>box-shadow</code>{' '}
        property of any element styles.
      </p>

      <p>
        CSS variables are globally availables in all SCSS files. This is the
        recommended use for colors.
      </p>

      <Example
        code={`<style
  dangerouslySetInnerHTML={{
    __html: '
      .shadowsGuide-shadow-1 { box-shadow: var(--box-shadow-1); }
      .shadowsGuide-shadow-2 { box-shadow: var(--box-shadow-2); }
      .shadowsGuide-shadow-3 { box-shadow: var(--box-shadow-3); }
      .shadowsGuide-shadow-4 { box-shadow: var(--box-shadow-4); }
      .shadowsGuide-shadow-5 { box-shadow: var(--box-shadow-5); }
      .shadowsGuide-shadow-6 { box-shadow: var(--box-shadow-6); }
      ',
  }}
/>
<div className='shadowsGuide-shadow-1' />
<div className='shadowsGuide-shadow-2' />
<div className='shadowsGuide-shadow-3' />
<div className='shadowsGuide-shadow-4' />
<div className='shadowsGuide-shadow-5' />
<div className='shadowsGuide-shadow-6' />`}
      >
        <style
          dangerouslySetInnerHTML={{
            __html: `
.shadowsGuide-shadow-1 { box-shadow: var(--box-shadow-1); }
.shadowsGuide-shadow-2 { box-shadow: var(--box-shadow-2); }
.shadowsGuide-shadow-3 { box-shadow: var(--box-shadow-3); }
.shadowsGuide-shadow-4 { box-shadow: var(--box-shadow-4); }
.shadowsGuide-shadow-5 { box-shadow: var(--box-shadow-5); }
.shadowsGuide-shadow-6 { box-shadow: var(--box-shadow-6); }
    `,
          }}
        />
        <div
          style={{
            width: 200,
            marginBottom: 20,
            background: '#fff',
            height: 75,
          }}
          className="shadowsGuide-shadow-1"
        />
        <div
          style={{
            width: 200,
            marginBottom: 20,
            background: '#fff',
            height: 75,
          }}
          className="shadowsGuide-shadow-2"
        />
        <div
          style={{
            width: 200,
            marginBottom: 20,
            background: '#fff',
            height: 75,
          }}
          className="shadowsGuide-shadow-3"
        />
        <div
          style={{
            width: 200,
            marginBottom: 20,
            background: '#fff',
            height: 75,
          }}
          className="shadowsGuide-shadow-4"
        />
        <div
          style={{
            width: 200,
            marginBottom: 20,
            background: '#fff',
            height: 75,
          }}
          className="shadowsGuide-shadow-5"
        />
        <div
          style={{
            width: 200,
            marginBottom: 20,
            background: '#fff',
            height: 75,
          }}
          className="shadowsGuide-shadow-6"
        />
      </Example>
    </div>
  );
};
export default ShadowsGuide;
