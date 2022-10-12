import { keys as UserKeys, User, UserType } from 'src/types/user';

/**
 * [Check link KYC validation granularity]
 */
export const checkUserType = (expectedUserType: UserType, user: User) => {
  if (!user) {
    throw new Error(
      "invalid parameter in 'checkUserType' function: empty user",
    );
  }

  if (user[UserKeys.USER_TYPE] === UserType.SUPERADMIN) {
    return;
  }

  switch (expectedUserType) {
    case UserType.ADMIN:
      if (user[UserKeys.USER_TYPE] === UserType.ADMIN) {
        return;
      }
      break;
    case UserType.ISSUER:
      if (user[UserKeys.USER_TYPE] === UserType.ISSUER) {
        return;
      }
      break;
    case UserType.UNDERWRITER:
      if (
        user[UserKeys.USER_TYPE] === UserType.UNDERWRITER ||
        user[UserKeys.USER_TYPE] === UserType.ISSUER
      ) {
        return;
      }
      break;
    case UserType.BROKER:
      if (
        user[UserKeys.USER_TYPE] === UserType.BROKER ||
        user[UserKeys.USER_TYPE] === UserType.ISSUER
      ) {
        return;
      }
      break;
    case UserType.AGENT:
      if (
        user[UserKeys.USER_TYPE] === UserType.AGENT ||
        user[UserKeys.USER_TYPE] === UserType.ISSUER
      ) {
        return;
      }
      break;
    case UserType.NOTARY:
      if (user[UserKeys.USER_TYPE] === UserType.NOTARY) {
        return;
      }
      break;
    case UserType.VERIFIER:
      if (user[UserKeys.USER_TYPE] === UserType.VERIFIER) {
        return;
      }
      break;
    case UserType.NAV_MANAGER:
      if (user[UserKeys.USER_TYPE] === UserType.NAV_MANAGER) {
        return;
      }
      break;
    case UserType.INVESTOR:
      if (
        user[UserKeys.USER_TYPE] === UserType.VEHICLE ||
        user[UserKeys.USER_TYPE] === UserType.INVESTOR ||
        user[UserKeys.USER_TYPE] === UserType.UNDERWRITER ||
        user[UserKeys.USER_TYPE] === UserType.BROKER ||
        user[UserKeys.USER_TYPE] === UserType.AGENT ||
        user[UserKeys.USER_TYPE] === UserType.VERIFIER ||
        user[UserKeys.USER_TYPE] === UserType.NOTARY ||
        user[UserKeys.USER_TYPE] === UserType.ISSUER ||
        user[UserKeys.USER_TYPE] === UserType.ADMIN
      ) {
        return;
      }
      break;

    default:
      throw new Error(
        `user with ID ${user[UserKeys.USER_ID]} is a(n) ${
          user[UserKeys.USER_TYPE]
        }, thus can not perform an action reserved for users of type ${expectedUserType}`,
      );
  }

  // If not returned so far, means checkUserType is failed

  throw new Error(
    `user with ID ${user[UserKeys.USER_ID]} is a(n) ${
      user[UserKeys.USER_TYPE]
    }, thus can not perform an action reserved for users of type ${expectedUserType}`,
  );
};

/**
 * Check if user type is one of elements in
 * provided array of user types
 */
export const checkUserTypeIsOneOf = (
  expectedUserTypes: UserType[],
  user: User,
) => {
  if (!expectedUserTypes.includes(user[UserKeys.USER_TYPE]))
    throw new Error(
      `user with ID ${user[UserKeys.USER_ID]} is a(n) ${
        user[UserKeys.USER_TYPE]
      }, thus can not perform an action reserved for users of types ${expectedUserTypes.join(
        ', ',
      )}`,
    );
};
