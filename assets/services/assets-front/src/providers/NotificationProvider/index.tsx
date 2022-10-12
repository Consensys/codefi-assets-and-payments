import React, { createContext, ReactElement, ReactNode, useState } from 'react';
import { createPortal } from 'react-dom';
import styled from 'styled-components';
import NotificationCard from './NotificationCard';

const NotificationContext = createContext<
  [(notification: Notification) => void]
>([
  () => {
    // do nothing.
  },
]);

type NotificationType = 'success' | 'error' | 'info';
export interface Notification {
  title: string;
  content: string;
  type: NotificationType;
}

const StyledPortal = styled.div`
  position: fixed;
  bottom: 40px;
  left: 40px;
  display: flex;
  flex-direction: column;
  gap: 1em;
`;

function NotificationProvider({
  children,
}: {
  children: ReactNode;
}): ReactElement {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const addNotification = (notification: Notification) => {
    setNotifications((notifications) => [...notifications, notification]);
  };

  const removeNotification = (notification: Notification) => {
    setNotifications((notifications) =>
      notifications.filter((n) => n !== notification),
    );
  };
  return (
    <NotificationContext.Provider value={[addNotification]}>
      {createPortal(
        <StyledPortal>
          {notifications.map((n, i) => (
            <NotificationCard
              key={i}
              notification={n}
              remove={removeNotification}
            />
          ))}
        </StyledPortal>,
        document.body,
      )}
      {children}
    </NotificationContext.Provider>
  );
}

export { NotificationContext, NotificationProvider };
