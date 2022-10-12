import React from 'react';

import './MiniChart.scss';

interface IProps {
  readonly data: Array<number>;
  readonly height?: number;
  readonly width?: number;
}

export const MiniChart: React.FC<IProps> = ({
  data,
  height = 30,
  width = 80,
}: IProps) => {
  // Normalize data
  const min = Math.min(...data);
  const max = Math.max(...data);
  const amplitude = max - min;
  const noramlizedData = data.map(
    (value) => ((value - min) / amplitude) * height,
  );

  const length = data.length;
  const step = width / (length - 1);

  let path = `M0,${height - noramlizedData[0]}`;
  for (let i = 1; i < length - 2; i++) {
    path += `L${i * step},${height - noramlizedData[i]}`;
  }

  return (
    <svg
      className="_uiCompnent_miniChart"
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
    >
      <path d={path} />
    </svg>
  );
};
