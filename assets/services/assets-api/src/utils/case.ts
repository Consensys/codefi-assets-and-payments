export const setToLowerCaseExceptFirstLetter = (word: string): string => {
  return word
    ? word.toLowerCase().replace(/^.{1}/g, word[0].toUpperCase())
    : word;
};

export const setToLowerCase = (word: string): string => {
  return word ? word.toLowerCase() : word;
};

export const replaceEmptySpacesByUnderscore = (word: string): string => {
  return word ? word.replace(' ', '_') : word;
};
