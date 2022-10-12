import React, { CSSProperties, useEffect, useState, FC, useRef } from 'react';
import { ChromePicker } from 'react-color';
import Button from 'uiComponents/Button';
import { colors } from 'constants/styles';

interface IProps {
  label: string;
  color?: string;
  disabled?: boolean;
  parentCallback: (color: string) => void;
}

const popover: CSSProperties = {
  position: 'absolute',
  zIndex: 7,
} as CSSProperties;

const cover: CSSProperties = {
  position: 'absolute',
  top: '100%',
  left: '50%',
  transform: 'translateX(-50%)',
  marginTop: 15,
};

export const ColorPicker: FC<IProps> = ({
  label,
  disabled,
  color: defaultColor,
  parentCallback,
}: IProps) => {
  const wrapperRef = useRef(null);
  const [displayColorPicker, setDisplayColorPicker] = useState(false);
  const [color, setColor] = useState(defaultColor || colors.main);

  useEffect(() => {
    const handleClickOutside = (event: any) => {
      if (
        wrapperRef.current &&
        !(wrapperRef.current as unknown as any).contains(event.target)
      ) {
        setDisplayColorPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [wrapperRef]);

  const handleClick = () => {
    setDisplayColorPicker(!displayColorPicker);
  };

  const handleClose = () => {
    setDisplayColorPicker(false);
  };

  const handleChangeComplete = (color: any, event: any) => {
    setColor(color.hex);
    parentCallback(color.hex);
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'center',
        width: '200px',
        position: 'relative',
      }}
    >
      <div
        style={{
          marginTop: '10px',
          marginBottom: '10px',
        }}
      >
        <Button
          onClick={handleClick}
          color={color}
          disabled={disabled}
          style={{
            border: '1px solid black',
          }}
        />
        {displayColorPicker ? (
          <div style={popover} ref={wrapperRef}>
            <div style={cover} onClick={handleClose} />
            <ChromePicker
              color={color}
              onChangeComplete={handleChangeComplete}
            />
          </div>
        ) : null}
      </div>
      <div
        style={{
          marginLeft: '8px',
          fontSize: '16px',
        }}
      >
        {label}
      </div>
    </div>
  );
};
