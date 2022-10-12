import React, { useRef } from 'react';
import { mdiCloudUpload } from '@mdi/js';
import { useIntl } from 'react-intl';

import { commonActionsTexts } from 'texts/commun/actions';

import Button from 'uiComponents/Button';
import Label from 'uiComponents/Label';

import StyledInputFile from './StyledInputFile';

interface IProps {
  readonly label?: string;
  readonly sublabel?: string | React.ReactNode;
  readonly disabled?: boolean;
  readonly multiline?: boolean;
  readonly value?: string;
  readonly name?: string;
  readonly buttonLabel?: string;
  readonly buttonIconLeft?: string;
  readonly buttonColor?: string;
  readonly required?: boolean;
  readonly onChange?: (newValue: string) => void;
  readonly accept?: string;
  readonly aspect?: number;
  readonly style?: React.CSSProperties; // workaround avoid to break other pages
}

const FileReaderInput: React.FC<IProps> = ({
  label,
  sublabel,
  required,
  disabled,
  buttonLabel,
  buttonIconLeft,
  multiline,
  buttonColor,
  name,
  value,
  onChange,
  style,
  accept,
}: IProps) => {
  const intl = useIntl();
  const inputFile = useRef<HTMLInputElement>(null);
  return (
    <StyledInputFile style={style}>
      <div>
        {label && (
          <Label label={label} disabled={disabled} required={required} />
        )}
        {sublabel && <label className="subLabel">{sublabel}</label>}
      </div>
      <div>
        {disabled && !(value && value.length > 0) && <>-</>}
        {!disabled && (multiline || !(value && value.length > 0)) && (
          <>
            <Button
              size="small"
              disabled={disabled}
              secondary
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
            <input
              disabled={disabled}
              id={name}
              name={name}
              ref={inputFile}
              value=""
              required={required && (value || []).length !== 2}
              accept={accept || '.json'}
              onChange={async ({ target }) => {
                if (target.files && target.files[0] && onChange) {
                  const fileReader = new FileReader();
                  fileReader.readAsText(target.files[0], 'UTF-8');
                  fileReader.onload = (e: any) => {
                    onChange(e.target.result);
                  };
                }
              }}
              type="file"
            />
          </>
        )}
      </div>
    </StyledInputFile>
  );
};

export default React.memo(FileReaderInput);
