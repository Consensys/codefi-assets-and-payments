/* eslint react/no-unknown-property: 0 */
import React from 'react';

interface CheckboxProps {
  /** Is checked */
  checked?: boolean;
  /** Is Indeterminate */
  indeterminate?: boolean;
  /** On toggle callback */
  onToggle?: (checked: boolean) => void;
  /** Main color */
  color?: string;
  /* Style */
  style?: React.CSSProperties;
}
export const Checkbox: React.FC<CheckboxProps> = ({
  checked,
  indeterminate,
  onToggle,
  color,
  style,
}) => {
  const mainColor = color || '#1A5AFE';
  return (
    <div
      className="checkbox"
      onClick={() => onToggle && onToggle(!checked)}
      onTouchEnd={() => onToggle && onToggle(!checked)}
      style={{ cursor: 'pointer', ...style }}
    >
      {indeterminate ? (
        <svg
          width="18"
          height="18"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
        >
          <path
            id="svg_1"
            fill={mainColor}
            d="m16,2l0,14l-14,0l0,-14l14,0zm0,-2l-14,0c-1.1,0 -2,0.9 -2,2l0,14c0,1.1 0.9,2 2,2l14,0c1.1,0 2,-0.9 2,-2l0,-14c0,-1.1 -0.9,-2 -2,-2z"
          />
          <rect
            stroke-width="0"
            id="svg_2"
            height="2"
            width="10"
            y="8"
            x="4"
            fill={mainColor}
          />
        </svg>
      ) : !checked ? (
        <svg
          width="18"
          height="18"
          viewBox="0 0 18 18"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M16 2V16H2V2H16ZM16 0H2C0.9 0 0 0.9 0 2V16C0 17.1 0.9 18 2 18H16C17.1 18 18 17.1 18 16V2C18 0.9 17.1 0 16 0Z"
            fill={mainColor}
          />
        </svg>
      ) : (
        <svg
          width="18"
          height="18"
          viewBox="0 0 18 18"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M16 0H2C0.89 0 0 0.9 0 2V16C0 17.1 0.89 18 2 18H16C17.11 18 18 17.1 18 16V2C18 0.9 17.11 0 16 0ZM7 14L2 9L3.41 7.59L7 11.17L14.59 3.58L16 5L7 14Z"
            fill={mainColor}
          />
        </svg>
      )}
      {}
    </div>
  );
};
