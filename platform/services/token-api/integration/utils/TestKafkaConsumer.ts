import { KafkaSubscriber } from '@consensys/nestjs-messaging'
import { Injectable } from '@nestjs/common'
import { KafkaMessage } from 'kafkajs'
import { sleep } from '../../src/utils/sleep'

@Injectable()
export class TestKafkaConsumer implements KafkaSubscriber {
  private readonly MAX_RETRIES = 4 * 30 // 30 seconds
  private readonly SLEEP_IN_MS = 250
  public topic: string
  public msg: any

  async onMessage(
    decodedMessage: any,
    rawMessage: KafkaMessage,
    topic: string,
    partition: number,
  ) {
    this.msg = decodedMessage
  }

  async cleanConsumedMessage() {
    this.msg = undefined
  }

  async getConsumedMessage(label: string) {
    console.log('Waiting for message', { topic: this.topic })

    let i = 0
    while (i < this.MAX_RETRIES) {
      if (!this.msg) {
        await sleep(this.SLEEP_IN_MS)

        if (!process.env.PIPELINE) {
          process.stdout.write('#')
        }
      } else {
        const msgTemp = this.msg
        this.msg = undefined
        const duration = i * this.SLEEP_IN_MS
        console.log('Message found', { duration })
        return msgTemp
      }
      i++
    }

    console.log('')

    throw new Error(
      `No message consumed in topic ${this.topic} after ${this.MAX_RETRIES} retries (test description: ${label})`,
    )
  }
}
