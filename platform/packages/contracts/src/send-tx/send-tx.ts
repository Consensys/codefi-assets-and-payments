import cfg from '../config'
import { Producer } from 'pegasys-orchestrate'

export const sendTx = async () => {
  const producer = new Producer([cfg().kafkaHost])
  await producer.connect()

  const requestId = await producer.sendTransaction({
    chainName: 'rinkeby',
    contractName: 'Counter',
    methodSignature: 'increment(uint256)',
    args: [1],
    to: cfg().counterContractAddress,
    from: cfg().ethAccount!,
  })

  console.log('Transaction request sent with id', requestId)

  await producer.disconnect()
}
