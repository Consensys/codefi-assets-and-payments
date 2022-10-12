import React from 'react';
import CSS from 'csstype';

import './loaderStyles.scss';

export interface ILoaderProps {
  readonly className?: string;
  readonly color?: string;
  readonly label?: string;
  readonly style?: CSS.Properties;
  readonly width?: number;
}

const Loader: React.FC<ILoaderProps> = ({
  className,
  color,
  label,
  style,
  width,
}: ILoaderProps) => {
  return (
    <div style={style} className={`uiComponent_loader ${className || ''}`}>
      <svg
        height={`${width || '40'}px`}
        viewBox="0 0 50 50"
        width={`${width || '40'}px`}
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fill={color || '#666'}
          d="M25.251,6.461c-10.318,0-18.683,8.365-18.683,18.683h4.068c0-8.071,6.543-14.615,14.615-14.615V6.461z"
        >
          <animateTransform
            attributeType="xml"
            attributeName="transform"
            type="rotate"
            from="0 25 25"
            to="360 25 25"
            dur="0.5s"
            repeatCount="indefinite"
          />
        </path>
      </svg>

      {label && <p style={{ ...(color && { color }) }}>{label}</p>}
    </div>
  );
};

export default React.memo(Loader);
