import * as defaults from './config'

function genRandomHex(size) {
  return [...Array(size)]
    .map(() => Math.floor(Math.random() * 16).toString(16))
    .join('')
}

function getRandomEthAddress() {
  return '0x' + genRandomHex(40)
}

export const randomString = (len = 10) => {
  let result = ''
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
  for (let i = 0; i < len; i += 1) {
    result += characters.charAt(Math.floor(Math.random() * characters.length))
  }
  return result
}

export function getEthAddressBalanceList(size) {
  console.log(`${__VU}: Get EthAddress Balance List ${size}`)
  return [...Array(parseInt(size))].map(() => {
    // to do: use legal entity address instead of random one
    return { ethereumAddress: getRandomEthAddress(), balance: '0x0' }
  })
}

export function getCurrentEthAddressBalance(
  ethAddressArray: {
    ethereumAddress: string
    balance: string
  }[],
) {
  const ethereumAddress = ethAddressArray[__VU].ethereumAddress
  const balance = ethAddressArray[__VU].balance
  console.log(
    `${__VU}: Get Current EthAddress And Balance ${__VU} : ${ethereumAddress} : ${balance}`,
  )
  return ethAddressArray[__VU]
}

export function updateCurrentEthAddressBalance(ethAddressArray, balance) {
  const ethereumAddress = ethAddressArray[__VU].ethereumAddress
  console.log(
  `${__VU}: Update Current EthAddress Balance ${__VU} : ${ethereumAddress} : ${parseInt(balance, 16)}`,
  )
  ethAddressArray[__VU].balance = balance
}
