import React from 'react';

interface NoDataProps {
  /** Arrow color */
  color?: string;
}
export const NoData: React.FC<NoDataProps> = ({ color }) => {
  const defaultColor = color ?? '#1a5afe';
  return (
    <svg
      width="80"
      height="80"
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle opacity="0.25" cx="40" cy="40" r="40" fill={defaultColor} />
      <svg
        width="80"
        height="80"
        viewBox="0 0 80 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          style={{
            transform: 'translate(16px, 16px)',
          }}
          d="M38 10V38H10V10H38ZM40.2 6H7.8C6.8 6 6 6.8 6 7.8V40.2C6 41 6.8 42 7.8 42H40.2C41 42 42 41 42 40.2V7.8C42 6.8 41 6 40.2 6ZM22 14H34V18H22V14ZM22 22H34V26H22V22ZM22 30H34V34H22V30ZM14 14H18V18H14V14ZM14 22H18V26H14V22ZM14 30H18V34H14V30Z"
          fill={defaultColor}
        />
      </svg>
    </svg>
  );
};
