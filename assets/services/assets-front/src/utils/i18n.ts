const i18n = (
  locale: string,
  translationNode: { [key: string]: string },
): string => {
  if (!translationNode) {
    return 'YOU NEED A TRANSLATION NODE TO TRANSLATE';
  }

  try {
    return translationNode[locale] || translationNode['en'];
  } catch (error) {
    return 'THERE IS NO TRANSLATION FOR THIS NODE OR THIS NODE DOES NOT EXISTS.';
  }
};

export default i18n;
