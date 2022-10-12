import React from 'react';

interface DotsProps {
  /** Dots color */
  color?: string;
}
export const Dots: React.FC<DotsProps> = ({ color }) => {
  const dotColor = color ?? '#777C8C';
  return (
    <svg
      width="15"
      height="4"
      viewBox="0 0 15 4"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="2.00004" cy="1.66667" r="1.66667" fill={dotColor} />
      <circle cx="12.6667" cy="1.66667" r="1.66667" fill={dotColor} />
      <ellipse
        cx="7.33342"
        cy="1.66667"
        rx="1.66667"
        ry="1.66667"
        fill={dotColor}
      />
    </svg>
  );
};
