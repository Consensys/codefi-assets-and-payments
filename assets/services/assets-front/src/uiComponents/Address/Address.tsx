import { mdiContentCopy, mdiOpenInNew } from '@mdi/js';
import { colors } from 'constants/styles';
import React, { ReactElement, useRef, useEffect, useState } from 'react';
import CopyToClipboard from 'react-copy-to-clipboard';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import Icon from 'uiComponents/Icon';
import { Tooltip } from 'uiComponents/UiLibraryTooltip';

const truncateAddress = (address = '', start = 6, end = 6): string =>
  address
    ? address.substr(0, start) +
      '...' +
      address.substr(address.length - end, address.length)
    : '';

export interface AddressProps {
  address: string;
  name?: string;
  showNameWithAddress?: boolean;
  blockScoutUrl?: string;
}

const StyledAddress = styled.span`
  color: ${colors.main};
  font-feature-settings: 'calt' 0;
`;

export default function Address({
  address,
  name,
  showNameWithAddress = false,
  blockScoutUrl = '',
}: AddressProps): ReactElement | null {
  const isMounted = useRef(true);
  const [copyPressed, setCopyPressed] = useState(false);
  const getBlockScoutUrl = () => {
    if (address.length === 42) return `${blockScoutUrl}address/${address}`;
    return `${blockScoutUrl}tx/${address}`;
  };
  const boldAddress = () => {
    return truncateAddress(address, 6, 6).replace(
      /(.{4}$)|(^.{4})/gm,
      (match) => {
        return `<b>${match}</b>`;
      },
    );
  };
  useEffect(() => {
    if (copyPressed) {
      setTimeout(() => {
        isMounted.current && setCopyPressed(false);
      }, 2000);
    }
  }, [copyPressed]);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);
  if (!address) return null;
  return (
    <div style={{ display: 'flex' }}>
      {(!showNameWithAddress && name && (
        <Tooltip content={address}>
          <span style={{ marginRight: 8 }}>{name}</span>
        </Tooltip>
      )) || (
        <>
          {showNameWithAddress && name && (
            <Tooltip content={'address'}>
              <span style={{ marginRight: 8 }}>{name}</span>
            </Tooltip>
          )}
          <StyledAddress
            dangerouslySetInnerHTML={{
              __html: boldAddress(),
            }}
          />
        </>
      )}
      {blockScoutUrl && (
        <Link
          to={{
            pathname: getBlockScoutUrl(),
          }}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Icon
            icon={mdiOpenInNew}
            width={16}
            style={{ cursor: 'pointer', marginLeft: '5px' }}
            color="#4D79FF"
          />
        </Link>
      )}

      <CopyToClipboard onCopy={() => setCopyPressed(true)} text={address}>
        <div>
          <Tooltip
            content={copyPressed ? 'Copied to clipboard' : 'Copy address'}
          >
            <div>
              <Icon
                width={16}
                icon={mdiContentCopy}
                style={{ cursor: 'pointer', marginLeft: '5px' }}
                color="#4D79FF"
              />
            </div>
          </Tooltip>
        </div>
      </CopyToClipboard>
    </div>
  );
}
