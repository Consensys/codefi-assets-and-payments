import React from 'react';

interface CloseProps {
  color?: string;
}
export const Close: React.FC<CloseProps> = ({ color }) => {
  const fillColor = color ?? '#475166';
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M19.3334 2.5465L17.4534 0.666504L10.0001 8.11984L2.54675 0.666504L0.666748 2.5465L8.12008 9.99984L0.666748 17.4532L2.54675 19.3332L10.0001 11.8798L17.4534 19.3332L19.3334 17.4532L11.8801 9.99984L19.3334 2.5465Z"
        fill={fillColor}
      />
    </svg>
  );
};
