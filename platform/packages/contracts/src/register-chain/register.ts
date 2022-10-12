import Axios from 'axios'
import cfg from '../config'
import { utils } from 'ethers'

export const register = async () => {
  const chainResponse = await Axios.post(
    `${cfg().registerHost}/chains`,
    JSON.parse(cfg().chainData!),
  )
  console.log('New chain registered', chainResponse.data)

  const faucetResponse = await Axios.post(`${cfg().registerHost}/faucets`, {
    name: 'rinkeby-faucet',
    amount: utils.parseEther('0.005').toString(),
    chainRule: chainResponse.data.uuid,
    cooldown: '10s',
    creditorAccount: process.env.FAUCET_ACCOUNT,
    maxBalance: utils.parseEther('0.1').toString(),
  })

  console.log('New faucet registered', faucetResponse.data)
}
