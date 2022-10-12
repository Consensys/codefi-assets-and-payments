/**
 * [Check email address format]
 */
export const checkEmailAddress = (email: string) => {
  const re = new RegExp('[^@]+@[^@]+\\.[^@]+');
  return re.test(String(email).toLowerCase());
};
