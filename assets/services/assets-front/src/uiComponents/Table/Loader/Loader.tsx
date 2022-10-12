import React from 'react';
import CSS from 'csstype';

import './Loader.css';

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
        height={`${width || '64'}px`}
        viewBox="0 0 64 64"
        width={`${width || '64'}px`}
        xmlns="http://www.w3.org/2000/svg"
      >
        <svg
          width="64"
          height="64"
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <mask
            id="mask0"
            mask-type="alpha"
            maskUnits="userSpaceOnUse"
            x="0"
            y="0"
            width="64"
            height="64"
          >
            <path
              fill={color || '#1A5AFE'}
              fillRule="evenodd"
              clipRule="evenodd"
              d="M32 54.8571C44.6237 54.8571 54.8571 44.6237 54.8571 32C54.8571 19.3764 44.6237 9.14286 32 9.14286C19.3764 9.14286 9.14286 19.3764 9.14286 32C9.14286 44.6237 19.3764 54.8571 32 54.8571ZM32 64C49.6731 64 64 49.6731 64 32C64 14.3269 49.6731 0 32 0C14.3269 0 0 14.3269 0 32C0 49.6731 14.3269 64 32 64Z"
            />
          </mask>
          <g mask="url(#mask0)">
            <path
              d="M36.5713 72V45.7143V33.1428H83.4284V72H36.5713Z"
              fill={color || '#1A5AFE'}
            >
              <animateTransform
                attributeType="xml"
                attributeName="transform"
                type="rotate"
                from="0 32 32"
                to="360 32 32"
                dur="1s"
                repeatCount="indefinite"
              />
            </path>
          </g>
        </svg>
        <svg
          width="64"
          height="64"
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fill={color || '#1A5AFE'}
            opacity="0.1"
            fillRule="evenodd"
            clipRule="evenodd"
            d="M32 54.8571C44.6237 54.8571 54.8571 44.6237 54.8571 32C54.8571 19.3763 44.6237 9.14286 32 9.14286C19.3763 9.14286 9.14286 19.3763 9.14286 32C9.14286 44.6237 19.3763 54.8571 32 54.8571ZM32 64C49.6731 64 64 49.6731 64 32C64 14.3269 49.6731 0 32 0C14.3269 0 0 14.3269 0 32C0 49.6731 14.3269 64 32 64Z"
          />
        </svg>
      </svg>

      {label && <p style={{ ...(color && { color }) }}>{label}</p>}
    </div>
  );
};

export default React.memo(Loader);
