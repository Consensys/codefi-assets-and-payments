import React from 'react';
import Example from '../components/Example';

const SpacesGuide: React.FC = () => {
  return (
    <div>
      <h2>Spaces</h2>

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
    __html: '.spaceGuide--spacing-none { height: var(--spacing-none); }
      .spaceGuide--spacing-xs { height: var(--spacing-xs); }
      .spaceGuide--spacing-small { height: var(--spacing-small); }
      .spaceGuide--spacing-tight { height: var(--spacing-tight); }
      .spaceGuide--spacing-tight-looser { height: var(--spacing-tight-looser); }
      .spaceGuide--spacing-regular { height: var(--spacing-regular); }
      .spaceGuide--spacing-finger { height: var(--spacing-finger); }
      .spaceGuide--spacing-loose { height: var(--spacing-loose); }
      .spaceGuide--spacing-large { height: var(--spacing-large); }
      .spaceGuide--spacing-xl { height: var(--spacing-xl); }
      .spaceGuide--spacing-xxl { height: var(--spacing-xxl); }',
  }}
/>

<div className='spaceGuide--spacing-none' />
<div className='spaceGuide--spacing-xs' />
<div className='spaceGuide--spacing-small' />
<div className='spaceGuide--spacing-tight' />
<div className='spaceGuide--spacing-tight' />
<div className='spaceGuide--spacing-regular' />
<div className='spaceGuide--spacing-finger' />
<div className='spaceGuide--spacing-loose' />
<div className='spaceGuide--spacing-large' />
<div className='spaceGuide--spacing-xl' />
<div className='spaceGuide--spacing-xxl' />`}
      >
        <style
          dangerouslySetInnerHTML={{
            __html: `.spaceGuide--spacing-none { height: var(--spacing-none); }
.spaceGuide--spacing-xs { height: var(--spacing-xs); }
.spaceGuide--spacing-small { height: var(--spacing-small); }
.spaceGuide--spacing-tight { height: var(--spacing-tight); }
.spaceGuide--spacing-tight-looser { height: var(--spacing-tight-looser); }
.spaceGuide--spacing-regular { height: var(--spacing-regular); }
.spaceGuide--spacing-finger { height: var(--spacing-finger); }
.spaceGuide--spacing-loose { height: var(--spacing-loose); }
.spaceGuide--spacing-large { height: var(--spacing-large); }
.spaceGuide--spacing-xl { height: var(--spacing-xl); }
.spaceGuide--spacing-xxl { height: var(--spacing-xxl); }`,
          }}
        />
        {[
          ['--spacing-none', '0'],
          ['--spacing-xs', '4px'],
          ['--spacing-small', '8px'],
          ['--spacing-tight', '16px'],
          ['--spacing-tight-looser', '24px'],
          ['--spacing-regular', '32px'],
          ['--spacing-finger', '48px'],
          ['--spacing-loose', '64px'],
          ['--spacing-large', '128px'],
          ['--spacing-xl', '256px'],
          ['--spacing-xxl', '512px'],
        ].map((tuple) => (
          <div key={tuple[0]} style={{ display: 'flex', marginBottom: 20 }}>
            <code style={{ width: 150, fontSize: 12 }}>
              <div>{tuple[0]}</div>
              <div>({tuple[1]})</div>
            </code>
            <div
              style={{
                background: '#fff',
                border: '1px solid #ccc',
                width: '200px',
              }}
              className={`spaceGuide${tuple[0]}`}
            />
          </div>
        ))}
      </Example>
    </div>
  );
};
export default SpacesGuide;
