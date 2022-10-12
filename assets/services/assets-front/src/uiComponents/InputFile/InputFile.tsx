import React, { useState, useRef } from 'react';
import {
  mdiAlertOctagon,
  mdiClose,
  mdiCloudUpload,
  mdiDownload,
} from '@mdi/js';
import _ from 'lodash';
import { Upload } from 'antd';
import ImgCrop, { ImgCropProps } from 'antd-img-crop';
import styled from 'styled-components';
import { useIntl } from 'react-intl';

import {
  constructCofidocsFileUrl,
  downloadFromCofidocs,
  uploadDocument,
} from 'utils/commonUtils';

import { commonActionsTexts } from 'texts/commun/actions';

import Preview from 'uiComponents/Preview';
import Button from 'uiComponents/Button';
import Icon from 'uiComponents/Icon';
import Input from 'uiComponents/Input';
import Label from 'uiComponents/Label';

import StyledInputFile from './StyledInputFile';
import { spacing, colors } from 'constants/styles';
import { appMessageData } from 'uiComponents/AppMessages/AppMessage';
import { CommonTexts } from 'texts/commun/commonTexts';
import { EventEmitter, Events } from 'features/events/EventEmitter';

const StyledImgCrop: React.FunctionComponent<ImgCropProps> = styled(ImgCrop)`
  .ant-btn-primary {
    background: ${colors.main};
    border-color: ${colors.main};
  }
`;

interface IProps {
  readonly label?: string;
  readonly sublabel?: string | React.ReactNode;
  readonly disabled?: boolean;
  readonly multiline?: boolean;
  readonly value?: Array<string>;
  readonly name?: string;
  readonly buttonLabel?: string;
  readonly buttonIconLeft?: string;
  readonly buttonColor?: string;
  readonly required?: boolean;
  readonly preview?: boolean;
  readonly onChange?: (newValue: Array<string>) => void;
  readonly accept?: string;
  readonly isImage?: boolean;
  readonly downloadable?: boolean;
  readonly aspect?: number;
  readonly isLoading?: boolean;
  readonly style?: React.CSSProperties; // workaround avoid to break other pages
}

const InputFile: React.FC<IProps> = ({
  label,
  sublabel,
  required,
  disabled,
  buttonLabel,
  buttonIconLeft,
  multiline,
  buttonColor,
  aspect,
  name,
  value,
  onChange,
  preview = true,
  style,
  isImage,
  downloadable,
  isLoading,
  accept,
}: IProps) => {
  const intl = useIntl();
  const inputFile = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  return (
    <StyledInputFile style={style}>
      <div>
        {label && (
          <Label label={label} disabled={disabled} required={required} />
        )}
        {sublabel && <label className="subLabel">{sublabel}</label>}
        {preview && value && value.length > 0 && (
          <>
            {_.chunk(value, multiline ? 2 : value.length).map(
              (element, elementIndex) => (
                <React.Fragment key={`doc-${element[1]}`}>
                  <div>
                    <Preview
                      label={element[0]}
                      url={constructCofidocsFileUrl(element[1])}
                      filename={element[0]}
                    />
                    {!disabled && onChange && (
                      <button
                        type="button"
                        onClick={async () => {
                          await onChange([
                            ...value.slice(0, elementIndex),
                            ...value.slice(elementIndex + 2),
                          ]);
                        }}
                      >
                        <Icon width={20} icon={mdiClose} />
                      </button>
                    )}
                  </div>
                  {multiline && !disabled && onChange && (
                    <div>
                      <Input
                        style={{ marginBottom: spacing.small }}
                        label="Document name to be displayed on platform"
                        defaultValue={element[0]}
                        onChange={_.debounce((_event, newValue) => {
                          const newValues = [...value];
                          newValues[elementIndex > 0 ? elementIndex + 1 : 0] =
                            newValue;
                          onChange(newValues);
                        }, 500)}
                      />
                    </div>
                  )}
                </React.Fragment>
              ),
            )}
          </>
        )}
      </div>
      <div>
        {disabled && !(value && value.length > 0) && <>-</>}
        {!disabled && (multiline || !(value && value.length > 0)) && (
          <>
            {isImage && !uploading ? (
              <StyledImgCrop
                rotate
                quality={1}
                modalTitle="Edit and upload image"
                aspect={aspect}
                modalOk="Upload image"
              >
                <Upload
                  id={name}
                  name={name}
                  disabled={disabled}
                  accept={accept}
                  showUploadList={false}
                  customRequest={async (options: any) => {
                    if (onChange) {
                      try {
                        setUploading(true);
                        const { filename, docId } = await uploadDocument(
                          options.file,
                        );
                        await onChange([...(value || []), filename, docId]);
                      } catch (error) {
                        EventEmitter.dispatch(
                          Events.EVENT_APP_MESSAGE,
                          appMessageData({
                            message: intl.formatMessage(CommonTexts.error),
                            secondaryMessage: String(error),
                            icon: mdiAlertOctagon,
                            color: colors.error,
                            isDark: true,
                          }),
                        );
                      } finally {
                        setUploading(false);
                      }
                    }
                  }}
                >
                  <Button
                    size="small"
                    disabled={disabled}
                    secondary
                    color={buttonColor || '#666'}
                    iconLeft={buttonIconLeft || mdiCloudUpload}
                  >
                    {buttonLabel ||
                      intl.formatMessage(
                        multiline
                          ? commonActionsTexts.addDocument
                          : commonActionsTexts.chooseFile,
                      )}
                  </Button>
                </Upload>
              </StyledImgCrop>
            ) : (
              <>
                <Button
                  size="small"
                  disabled={disabled}
                  secondary
                  isLoading={uploading}
                  color={buttonColor || '#666'}
                  onClick={() => inputFile?.current?.click()}
                  iconLeft={buttonIconLeft || mdiCloudUpload}
                >
                  {buttonLabel ||
                    intl.formatMessage(
                      multiline
                        ? commonActionsTexts.addDocument
                        : commonActionsTexts.chooseFile,
                    )}
                </Button>
                {uploading && (
                  <span className="uploading">
                    {intl.formatMessage(commonActionsTexts.uploadingFile)}
                  </span>
                )}
                <input
                  disabled={disabled}
                  id={name}
                  name={name}
                  ref={inputFile}
                  value=""
                  required={required && (value || []).length !== 2}
                  accept={accept || '.png,.jpg,jpeg,.JPG,.JPEG,.PNG,.pdf,.PDF'}
                  onChange={async ({ target }) => {
                    if (target.files && target.files[0]) {
                      if (onChange) {
                        try {
                          setUploading(true);
                          const { filename, docId } = await uploadDocument(
                            target.files[0],
                          );
                          await onChange([...(value || []), filename, docId]);
                        } catch (error) {
                          EventEmitter.dispatch(
                            Events.EVENT_APP_MESSAGE,
                            appMessageData({
                              message: intl.formatMessage(CommonTexts.error),
                              secondaryMessage: String(error),
                              icon: mdiAlertOctagon,
                              color: colors.error,
                              isDark: true,
                            }),
                          );
                        } finally {
                          setUploading(false);
                        }
                      }
                    }
                  }}
                  type="file"
                />
              </>
            )}
          </>
        )}
        {value && value.length > 0 && downloadable && (
          <Button
            size="small"
            iconLeft={mdiDownload}
            disabled={isLoading}
            tertiary
            onClick={() => {
              downloadFromCofidocs(value[0], value[1]);
            }}
          />
        )}
      </div>
    </StyledInputFile>
  );
};

export default React.memo(InputFile);
