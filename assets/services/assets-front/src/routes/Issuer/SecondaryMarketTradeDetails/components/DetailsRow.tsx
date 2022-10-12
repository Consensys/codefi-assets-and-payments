import React, { ReactNode } from 'react';
import styled from 'styled-components';

interface IDetailsRow {
  label: string;
  value: ReactNode;
  gutterBottom?: boolean;
}

const StyledRow = styled.div<{ gutterBottom: boolean }>`
  display: flex;
  color: #475166;
  margin-bottom: ${(p) => (p.gutterBottom ? '24px;' : '8px;')};
  & :first-child {
    font-weight: 500;
  }
  & :last-child {
    margin-left: auto;
    font-weight: 400;
  }
`;

const DetailsRow = ({ label, value, gutterBottom = false }: IDetailsRow) => {
  return (
    <StyledRow gutterBottom={gutterBottom}>
      <div>{label}</div>
      <div>{value}</div>
    </StyledRow>
  );
};

export default DetailsRow;
