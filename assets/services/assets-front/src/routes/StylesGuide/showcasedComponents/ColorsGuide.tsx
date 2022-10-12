import React from 'react';

import { colors } from 'constants/styles';

const ColorDisk: React.FC<{
  color: {
    color: string;
    TypeScript: string;
    SCSS: string;
    isSpacer?: boolean;
  };
}> = ({
  color,
}: {
  color: {
    color: string;
    TypeScript: string;
    SCSS: string;
    isSpacer?: boolean;
  };
}) => (
  <div
    style={{
      display: 'flex',
      fontSize: 12,
      marginBottom: color.isSpacer ? 50 : 10,
      alignItems: 'center',
    }}
  >
    <div
      style={{
        background: color.color,
        width: 100,
        height: 40,
        borderRadius: 100,
        marginRight: 10,
      }}
    ></div>
    <div>
      <p>
        SCSS :
        <b
          style={{
            fontFamily:
              'Consolas, Monaco, "Andale Mono", "Ubuntu Mono", monospace',
          }}
        >
          {' '}
          {color.SCSS}
        </b>
      </p>
      <p>
        TypeScript :{' '}
        <b
          style={{
            fontFamily:
              'Consolas, Monaco, "Andale Mono", "Ubuntu Mono", monospace',
          }}
        >
          {' '}
          {color.TypeScript}
        </b>
      </p>
    </div>
  </div>
);

const ColorsGuide: React.FC = () => {
  return (
    <div>
      <h2>Colors</h2>

      <p>
        CSS variables are globally availables in all SCSS files. This is the
        recommended use for colors.
      </p>

      <p>
        To use the colors in a TypeScript file, you need to import the color
        object as follow:
        <b
          style={{
            fontFamily:
              'Consolas, Monaco, "Andale Mono", "Ubuntu Mono", monospace',
          }}
        >
          {" import { colors } from 'constants/styles';"}
        </b>
      </p>

      <p>
        To edit or add colors, edit both SCSS and Typescript files:{' '}
        <b
          style={{
            fontFamily:
              'Consolas, Monaco, "Andale Mono", "Ubuntu Mono", monospace',
          }}
        >
          constants/styles
        </b>
        {' and '}
        <b
          style={{
            fontFamily:
              'Consolas, Monaco, "Andale Mono", "Ubuntu Mono", monospace',
          }}
        >
          constants.scss
        </b>
      </p>

      <h3>UI colors</h3>

      {[
        {
          color: colors.mainLighter,
          TypeScript: 'colors.mainLighter',
          SCSS: 'var(--colors-mainLighter)',
        },
        {
          color: colors.mainLight,
          TypeScript: 'colors.mainLight',
          SCSS: 'var(--colors-mainLight)',
        },
        {
          color: colors.main,
          TypeScript: 'colors.main',
          SCSS: 'var(--colors-main)',
        },
        {
          color: colors.mainDark,
          TypeScript: 'colors.mainDark',
          SCSS: 'var(--colors-mainDark)',
        },
        {
          color: colors.mainDarker,
          TypeScript: 'colors.mainDarker',
          SCSS: 'var(--colors-mainDarker)',
        },
        {
          color: colors.mainText,
          TypeScript: 'colors.mainText',
          SCSS: 'var(--colors-mainText)',
          isSpacer: true,
        },
        {
          color: colors.gradient1,
          TypeScript: 'colors.gradient1',
          SCSS: 'var(--colors-gradient1)',
        },
        {
          color: colors.gradient2,
          TypeScript: 'colors.gradient2',
          SCSS: 'var(--colors-gradient2)',
        },
        {
          color: colors.gradient3,
          TypeScript: 'colors.gradient3',
          SCSS: 'var(--colors-gradient3)',
        },
        {
          color: colors.gradient4,
          TypeScript: 'colors.gradient4',
          SCSS: 'var(--colors-gradient4)',
          isSpacer: true,
        },
        {
          color: colors.accent1,
          TypeScript: 'colors.accent1',
          SCSS: 'var(--colors-accent1)',
        },
        {
          color: colors.accent1Light,
          TypeScript: 'colors.accent1Light',
          SCSS: 'var(--colors-accent1Light)',
        },
        {
          color: colors.accent2,
          TypeScript: 'colors.accent2',
          SCSS: 'var(--colors-accent2)',
        },
        {
          color: colors.accent2Light,
          TypeScript: 'colors.accent2Light',
          SCSS: 'var(--colors-accent2Light)',
        },
        {
          color: colors.accent3,
          TypeScript: 'colors.accent3',
          SCSS: 'var(--colors-accent3)',
        },
        {
          color: colors.accent3Light,
          TypeScript: 'colors.accent3Light',
          SCSS: 'var(--colors-accent3Light)',
        },
        {
          color: colors.accent4,
          TypeScript: 'colors.accent4',
          SCSS: 'var(--colors-accent4)',
        },
        {
          color: colors.accent4Light,
          TypeScript: 'colors.accent4Light',
          SCSS: 'var(--colors-accent4Light)',
        },
        {
          color: colors.accent5,
          TypeScript: 'colors.accent5',
          SCSS: 'var(--colors-accent5)',
        },
        {
          color: colors.accent5Light,
          TypeScript: 'colors.accent5Light',
          SCSS: 'var(--colors-accent5Light)',
        },
      ].map((color) => (
        <ColorDisk color={color} key={color.TypeScript} />
      ))}

      <h3>Semantic colors</h3>

      {[
        {
          color: colors.successLighter,
          TypeScript: 'colors.successLighter',
          SCSS: 'var(--colors-successLighter)',
        },
        {
          color: colors.successLight,
          TypeScript: 'colors.successLight',
          SCSS: 'var(--colors-successLight)',
        },
        {
          color: colors.success,
          TypeScript: 'colors.success',
          SCSS: 'var(--colors-success)',
        },
        {
          color: colors.successDark,
          TypeScript: 'colors.successDark',
          SCSS: 'var(--colors-successDark)',
        },
        {
          color: colors.successDarker,
          TypeScript: 'colors.successDarker',
          SCSS: 'var(--colors-successDarker)',
        },
        {
          color: colors.successText,
          TypeScript: 'colors.successText',
          SCSS: 'var(--colors-successText)',
          isSpacer: true,
        },
        {
          color: colors.warningLighter,
          TypeScript: 'colors.warningLighter',
          SCSS: 'var(--colors-warningLighter)',
        },
        {
          color: colors.warningLight,
          TypeScript: 'colors.warningLight',
          SCSS: 'var(--colors-warningLight)',
        },
        {
          color: colors.warning,
          TypeScript: 'colors.warning',
          SCSS: 'var(--colors-warning)',
        },
        {
          color: colors.warningDark,
          TypeScript: 'colors.warningDark',
          SCSS: 'var(--colors-warningDark)',
        },
        {
          color: colors.warningDarker,
          TypeScript: 'colors.warningDarker',
          SCSS: 'var(--colors-warningDarker)',
        },
        {
          color: colors.warningText,
          TypeScript: 'colors.warningText',
          SCSS: 'var(--colors-warningText)',
          isSpacer: true,
        },
        {
          color: colors.errorLighter,
          TypeScript: 'colors.errorLighter',
          SCSS: 'var(--colors-errorLighter)',
        },
        {
          color: colors.errorLight,
          TypeScript: 'colors.errorLight',
          SCSS: 'var(--colors-errorLight)',
        },
        {
          color: colors.error,
          TypeScript: 'colors.error',
          SCSS: 'var(--colors-error)',
        },
        {
          color: colors.errorDark,
          TypeScript: 'colors.errorDark',
          SCSS: 'var(--colors-errorDark)',
        },
        {
          color: colors.errorDarker,
          TypeScript: 'colors.errorDarker',
          SCSS: 'var(--colors-errorDarker)',
        },
        {
          color: colors.errorText,
          TypeScript: 'colors.errorText',
          SCSS: 'var(--colors-errorText)',
        },
      ].map((color) => (
        <ColorDisk color={color} key={color.TypeScript} />
      ))}
    </div>
  );
};
export default ColorsGuide;
