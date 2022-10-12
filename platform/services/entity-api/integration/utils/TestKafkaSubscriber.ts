import { Injectable } from '@nestjs/common'
import { sleep } from '../../src/utils/sleep'
import { KafkaPreview } from '@codefi-assets-and-payments/nestjs-messaging'

@Injectable()
export class TestKafkaSubscriber<T> implements KafkaPreview.IConsumerListener {
  groupId: string
  private readonly MAX_RETRIES = 40
  private readonly SLEEP_IN_MS = 1000
  private messages: T[]
  public topic: string

  async onMessage(decodedMessage: any) {
    this.messages.push(decodedMessage)
  }

  async cleanMessages() {
    this.messages = []
  }

  async consumeMessage(debugLabel: string) {
    for (let i = 0; i < this.MAX_RETRIES; i++) {
      const newMessage = this.messages.shift()
      if (!newMessage) {
        console.log(
          `Waiting to consume message in topic ${this.topic}${
            debugLabel ? `: ${debugLabel}` : ''
          }`,
        )
        await sleep(this.SLEEP_IN_MS)
      } else {
        console.log(
          `New message consumed in topic ${this.topic}${
            debugLabel ? `: ${debugLabel}` : ''
          }`,
          JSON.stringify(newMessage, undefined, 2),
        )
        return newMessage
      }
    }

    throw new Error(
      `No message consumed in topic ${this.topic} after ${
        this.MAX_RETRIES
      } retries${debugLabel ? `: ${debugLabel}` : ''}`,
    )
  }

  async onStopListener(): Promise<void> {
    console.log('Nothing')
  }
}
