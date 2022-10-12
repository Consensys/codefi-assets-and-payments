import React, { FC } from 'react';

interface SettingContainerProps {
  title: string;
  description: string | React.ReactNode;
  children: React.ReactNode;
}

export const SettingsContainer: FC<SettingContainerProps> = ({
  title,
  description,
  children,
}: SettingContainerProps) => {
  return (
    <div
      style={{
        padding: '32px 40px',
        height: '100%',
      }}
    >
      <div
        style={{
          margin: 'auto',
          padding: 40,
          width: 660,
        }}
      >
        <div
          style={{
            borderBottom: '1px solid #DFE0E6',
          }}
        >
          <h2
            style={{
              fontSize: '20px',
              fontStyle: 'normal',
              fontWeight: 500,
              lineHeight: '30px',
            }}
          >
            {title}
          </h2>
          <p
            style={{
              fontSize: '16px',
              fontStyle: 'normal',
              fontWeight: 400,
              lineHeight: '24px',
              color: '#475166',
            }}
          >
            {description}
          </p>
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            marginTop: 24,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
};
