import React, { ReactElement, useEffect } from 'react';
import styled from 'styled-components';
import { Notification } from './';
import { mdiCheck, mdiAlertCircle } from '@mdi/js';

const StyledNotificationCard = styled.div`
  background: #ffffff;
  border: 1px solid #dfe0e6;
  box-sizing: border-box;
  box-shadow: 0px 8px 16px rgba(0, 0, 0, 0.1);
  border-radius: 4px;
  padding: 20px 24px;
  max-width: 300px;
  display: flex;
  align-items: baseline;
  gap: 10px;
  & .title {
    font-size: 1.5rem;
    color: #000a28;
    font-weight: 600;
    margin-bottom: 0;
  }
  & .content {
    font-size: 1rem;
    color: #000a28;
    margin-bottom: 0;
  }
`;

function NotificationCard({
  notification,
  remove,
}: {
  notification: Notification;
  remove: (notification: Notification) => void;
}): ReactElement {
  useEffect(() => {
    const trigerRemove = () => {
      setTimeout(() => {
        remove(notification);
      }, 5000);
    };
    trigerRemove();
  }, [notification, remove]);

  return (
    <StyledNotificationCard>
      {notification.type === 'success' ? (
        <img src={mdiCheck} alt="success" />
      ) : (
        <img src={mdiAlertCircle} alt="alert" />
      )}
      <div>
        <div className="title">{notification.title}</div>
        <div className="content">{notification.content}</div>
      </div>
    </StyledNotificationCard>
  );
}

export default NotificationCard;
