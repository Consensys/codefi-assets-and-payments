import { Producer } from 'pegasys-orchestrate'
import cfg from '../config'

export const deploy = async () => {
  const producer = new Producer([cfg().kafkaHost])
  await producer.connect()

  // Deploy a new Counter contract and returns the ID of the request
  const requestId = await producer.sendTransaction({
    chainName: 'rinkeby',
    contractName: 'Counter',
    methodSignature: 'constructor()',
    from: cfg().ethAccount!,
    gas: 2000000,
  })

  console.log('Transaction request sent with id: ', requestId)

  await producer.disconnect()
}
