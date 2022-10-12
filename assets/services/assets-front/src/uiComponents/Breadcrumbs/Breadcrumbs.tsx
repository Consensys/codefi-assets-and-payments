import React from 'react';
import { Link } from 'react-router-dom';
import { Breadcrumb } from 'antd';
import styled from 'styled-components';

export interface IBreadcrumb {
  to?: string;
  label: string;
}

const StyledBreadcrumb = styled(Breadcrumb)`
  font-size: var(--typography-size-f0);
  text-transform: capitalize;
  line-height: 2;
`;

interface IProps {
  paths: IBreadcrumb[];
}

export const Breadcrumbs: React.FC<IProps> = ({ paths }: IProps) => {
  return (
    <StyledBreadcrumb>
      {paths.map((path: IBreadcrumb, index: number) => {
        return (
          <Breadcrumb.Item key={index}>
            <Link to={path.to || '/'}>{path.label}</Link>
          </Breadcrumb.Item>
        );
      })}
    </StyledBreadcrumb>
  );
};
