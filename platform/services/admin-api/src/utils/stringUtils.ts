export const randomPassword = () => {
  let result = ''
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
  const numbers = '0123456789'
  const special = '!@#$%^&*'
  const noCharacters = 8
  const noNumbers = 3
  const noSpecial = 3
  for (let i = 0; i < noCharacters; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length))
  }
  for (let i = 0; i < noNumbers; i++) {
    result += numbers.charAt(Math.floor(Math.random() * numbers.length))
  }
  for (let i = 0; i < noSpecial; i++) {
    result += special.charAt(Math.floor(Math.random() * special.length))
  }
  return result
}

export const escapeLuceneKey = (value: string): string => {
  // Escapes the following Lucene query special characters with a backslash:
  // + - & | ! ( ) { } [ ] ^ " ~ * ? : \
  return value.replace(/([\+\-\&\|\!\(\)\{\}\[\]\^\"\~\*\?\:\\])/g, '\\$1')
}

export const escapeLuceneValue = (value: string): string => {
  return value.replace(/([\"\\])/g, '\\$1')
}
