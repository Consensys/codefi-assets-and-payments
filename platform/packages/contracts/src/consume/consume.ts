import { Consumer, EventType, ResponseMessage } from 'pegasys-orchestrate'
import cfg from '../config'

export const consume = async () => {
  const consumer = new Consumer([cfg().kafkaHost])
  await consumer.connect()

  consumer.on(EventType.Response, async (responseMessage: ResponseMessage) => {
    const { value } = responseMessage.content()
    if (value.errors && value.errors.length > 0) {
      console.error('Transaction failed with error: ', value.errors)
      return
    } else {
      await responseMessage.commit()
      console.log('Transaction ID:', value.id)
      console.log('Transaction receipt: ', value.receipt)
    }
  })

  await consumer.consume()
}
