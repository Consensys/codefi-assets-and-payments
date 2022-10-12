import { keys as UserKeys, User } from '../types/user';
export const getClientName = (user: User): string => {
  return (
    user[UserKeys.DATA][UserKeys.DATA__CLIENT_NAME] ||
    user[UserKeys.DATA][UserKeys.DATA__COMPANY] ||
    `${user[UserKeys.FIRST_NAME]} ${user[UserKeys.LAST_NAME]}`
  );
};
