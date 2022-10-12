import React, { ReactNode, useState, useEffect } from 'react';
import { Menu, Dropdown, Button } from 'antd';
import Icon from 'uiComponents/Icon';
import { mdiMenuDown } from '@mdi/js';
import styled from 'styled-components';
import { useSelector, useDispatch } from 'react-redux';
import { cachedViewSelector, setCachedView } from 'features/user/user.store';

const StyledViewSwitcher = styled.div`
  .ant-btn {
    margin-left: auto;
    display: flex;
    align-items: center;
  }
  > .action-bar {
    display: flex;
  }
`;

const StyledMenuItem = styled(Menu.Item)`
  display: flex;
  align-items: center;
  gap: 1em;
`;

interface IProps {
  actions?: ReactNode;
  viewKey: string;
  views: {
    name: string;
    component: ReactNode;
    icon: string;
  }[];
}

const ViewSwitcher: React.FC<IProps> = ({
  views,
  actions,
  viewKey,
}: IProps) => {
  const dispatch = useDispatch();
  const cachedView = useSelector(cachedViewSelector) as {
    [key: string]: number;
  };
  const [view, setView] = useState(
    cachedView && cachedView[viewKey] ? cachedView[viewKey] : 0,
  );
  useEffect(() => {
    dispatch(setCachedView({ ...cachedView, [viewKey]: view }));

    // eslint-disable-next-line
  }, [view]);
  const menu = (
    <Menu>
      {views.map((v, i) => (
        <React.Fragment key={i}>
          <StyledMenuItem onClick={() => setView(i)}>
            <Icon icon={v.icon} width={24} />
            {v.name}
          </StyledMenuItem>
          {i < views.length - 1 && <Menu.Divider />}
        </React.Fragment>
      ))}
    </Menu>
  );
  return (
    <StyledViewSwitcher>
      <div className="action-bar">
        {actions && actions}
        <Dropdown trigger={['click']} overlay={menu} placement="bottomCenter">
          <Button size="large">
            <Icon icon={views[view].icon} width={24} />
            <Icon icon={mdiMenuDown} width={24} />
          </Button>
        </Dropdown>
      </div>
      {views[view].component}
    </StyledViewSwitcher>
  );
};

export default React.memo(ViewSwitcher);
