export const generateRandomText = (len: number, prefix = '', postfix = ''): string => {
  let result = ''
  const possible = 'abcdefghijklmnopqrstuvwxyz0123456789'
  for (let i = 0; i < len; i += 1) {
    result += possible.charAt(Math.floor(Math.random() * possible.length))
  }
  return `${prefix}${result}${postfix}`
}

export const generateRandomNumber = (len: number): string => {
  let result = ''
  const possible = '0123456789'
  for (let i = 0; i < len; i += 1) {
    result += possible.charAt(Math.floor(Math.random() * possible.length))
  }
  return result
}