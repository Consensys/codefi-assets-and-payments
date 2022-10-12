import React from 'react';

interface ArrowProps {
  /** Arrow orientation */
  orientation?: 'Up' | 'Left' | 'Right' | 'Down';
  /** Arrow color */
  color?: string;
}
export const Arrow: React.FC<ArrowProps> = ({ orientation, color }) => {
  let rotation = 0;
  switch (orientation) {
    case 'Up':
      rotation = 180;
      break;
    case 'Left':
      rotation = 90;
      break;
    case 'Right':
      rotation = 270;
      break;
    default:
      rotation = 0;
  }
  return (
    <svg
      style={{ margin: '-4px 0' }}
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      transform={`rotate(${rotation})`}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M8.29201 10.2929C8.1052 10.4818 8.00043 10.7368 8.00043 11.0024C8.00043 11.2681 8.1052 11.523 8.29201 11.7119L11.231 14.6769C11.449 14.8919 11.731 14.9989 12.01 14.9989C12.289 14.9989 12.566 14.8919 12.779 14.6769L15.709 11.7219C15.8956 11.5329 16.0002 11.278 16.0002 11.0124C16.0002 10.7469 15.8956 10.492 15.709 10.3029C15.6172 10.2098 15.5077 10.1358 15.387 10.0853C15.2664 10.0347 15.1368 10.0087 15.006 10.0087C14.8752 10.0087 14.7457 10.0347 14.625 10.0853C14.5043 10.1358 14.3948 10.2098 14.303 10.3029L12.005 12.6199L9.69801 10.2929C9.60597 10.2001 9.49646 10.1264 9.3758 10.0762C9.25514 10.0259 9.12572 10 8.99501 10C8.86429 10 8.73487 10.0259 8.61421 10.0762C8.49355 10.1264 8.38404 10.2001 8.29201 10.2929Z"
        fill={color || '#475166'}
      />
    </svg>
  );
};

export const NavigationArrow: React.FC<ArrowProps> = ({
  orientation,
  color,
}) => {
  let rotation = 0;
  switch (orientation) {
    case 'Up':
      rotation = 90;
      break;
    case 'Left':
      rotation = 180;
      break;
    case 'Right':
      rotation = 0;
      break;
    default:
      rotation = 270;
  }
  return (
    <svg
      width="8"
      height="12"
      viewBox="0 0 8 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      transform={`rotate(${rotation})`}
    >
      <path
        d="M0.59 10.59L5.17 6L0.59 1.41L2 0L8 6L2 12L0.59 10.59Z"
        fill={color || '#475166'}
      />
    </svg>
  );
};

export const NavigationEndArrow: React.FC<ArrowProps> = ({
  orientation,
  color,
}) => {
  let rotation = 0;
  switch (orientation) {
    case 'Up':
      rotation = 90;
      break;
    case 'Left':
      rotation = 180;
      break;
    case 'Right':
      rotation = 0;
      break;
    default:
      rotation = 270;
  }
  return (
    <svg
      width="13"
      height="12"
      viewBox="0 0 13 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      transform={`rotate(${rotation})`}
    >
      <path
        d="M0.590027 1.41L5.18003 6L0.590027 10.59L2.00003 12L8.00003 6L2.00003 0L0.590027 1.41ZM11 0H13V12H11V0Z"
        fill={color || '#475166'}
      />
    </svg>
  );
};
