import React from 'react';
import { mdiEye } from '@mdi/js';

import { colors } from 'constants/styles';
import Button from 'uiComponents/Button';

import { appModalData } from 'uiComponents/AppModal/AppModal';

import { useDispatch } from 'react-redux';

import './Preview.scss';
import { setAppModal } from 'features/user/user.store';

interface IProps {
  label: string;
  filename: string;
  url: string | Promise<string>;
  isLoading?: boolean;
  showIconLeft?: boolean;
}

const Preview: React.FC<IProps> = ({
  url,
  label,
  isLoading,
  showIconLeft,
  filename,
}: IProps) => {
  const dispatch = useDispatch();
  const handleClick = async () => {
    const fileSplit = filename.split('.');
    let fileExtension;
    if (fileSplit.length > 1) {
      fileExtension = filename.split('.').slice(-1)[0];
    } else {
      fileExtension = 'pdf';
    }

    let src;
    if (typeof url === 'string') {
      src = url;
    } else {
      src = await url;
    }

    dispatch(
      setAppModal(
        appModalData({
          closeIcon: true,
          title: label,
          content: (
            <div className="_uiComponent_preview">
              {['png', 'jpeg', 'jpg'].indexOf(fileExtension.toLowerCase()) >
                -1 && (
                <img style={{ maxWidth: '70vw' }} src={src} alt="preview" />
              )}
              {fileExtension.toLowerCase() === 'pdf' && (
                <object
                  className="pdf"
                  data={src}
                  type="application/pdf"
                  aria-label="preview pdf"
                />
              )}
            </div>
          ),
        }),
      ),
    );
  };

  return (
    <>
      <Button
        onClick={handleClick}
        size="small"
        tertiary
        noUnderline
        style={{ padding: 0, fontWeight: 400 }}
        isLoading={isLoading}
        color={colors.main}
        iconLeft={showIconLeft ? mdiEye : undefined}
      >
        {label}
      </Button>
    </>
  );
};

export default Preview;
