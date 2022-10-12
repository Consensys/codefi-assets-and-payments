import { Row, Col } from 'antd';
import React from 'react';
import styled from 'styled-components';
import { Card } from 'uiComponents/Card';
import { useBreakpoint } from 'utils/layout';
import { useIntl } from 'react-intl';
import menuItems from 'routes/SuperAdmin/menuItems';
import { Link } from 'react-router-dom';
import { capitalizeFirstLetter } from 'utils/commonUtils';
import { ISettingsMenuItem } from 'routes/SuperAdmin/types';
import PageTitle from 'uiComponents/PageTitle';
import { menuItemsTexts } from 'texts/commun/menu';

const StyledRow = styled(Row)`
  &.xs {
    .ant-col {
      width: 100%;
    }
  }
`;

const StyledCard = styled(Card)`
  &.md {
    min-height: 124px;
  }
  display: block;
  cursor: pointer;
  width: 100%;
  transform: translate3d(0, 0, 0);
  transition: transform 0.15s ease-out;
  position: relative;
  a {
    display: block;
    padding: 1rem;
    width: 100%;
    height: 100%;
    h1,
    h2,
    h3,
    h4,
    h5 {
      font-size: var(--typography-size-f2);
      color: inherit;
    }
    p {
      font-size: var(--typography-size-f1);
      color: initial;
    }
  }
  &:hover {
    box-shadow: rgba(0, 0, 0, 0.16) 0px 1px 4px;
    /* transform: translate3d(0, -5%, 0); */
  }
`;

const StyledContentContainer = styled.div`
  padding: 32px;
`;

const SettingsMenuItems = () => {
  const intl = useIntl();
  const { responsiveClassNames } = useBreakpoint();

  const renderMenuItem = ({
    title,
    description,
    linkTo,
  }: ISettingsMenuItem): JSX.Element => {
    return (
      <Col key={linkTo} sm={24} md={8}>
        <StyledCard className={responsiveClassNames}>
          <Link key={linkTo} to={linkTo}>
            <h4>{capitalizeFirstLetter(title)}</h4>
            <p>{description}</p>
          </Link>
        </StyledCard>
      </Col>
    );
  };

  return (
    <div>
      <PageTitle
        title={intl.formatMessage(menuItemsTexts.settings)}
        withBreadcrumbs
      />
      <StyledContentContainer>
        <StyledRow
          align="stretch"
          gutter={[16, 16]}
          className={responsiveClassNames}
        >
          {menuItems(intl).map(renderMenuItem)}
        </StyledRow>
      </StyledContentContainer>
    </div>
  );
};

export default SettingsMenuItems;
