import React from 'react';
import { IUser, UserType } from '../User';

interface IProps {
  user: IUser;
  roles: UserType[];
  children: any;
}

export const hasRole = (user: IUser, roles: UserType[]) => {
  const userRole = user.userType;
  return roles.some((role) => userRole === role);
};

export const HasRole = ({ children, user, roles }: IProps) => {
  return <>{hasRole(user, roles) && children}</>;
};

// TODO LS we could have NegativeComponet <HasntRole> <Role.not><Role.has></Role.not>
