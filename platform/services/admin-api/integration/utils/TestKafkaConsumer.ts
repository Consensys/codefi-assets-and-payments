import { KafkaPreview } from '@codefi-assets-and-payments/nestjs-messaging'
import { Injectable } from '@nestjs/common'
import { sleep } from '../../src/utils/sleep'

@Injectable()
export class TestKafkaConsumer implements KafkaPreview.IConsumerListener {
  private readonly MAX_RETRIES = 60
  private readonly SLEEP_IN_MS = 1000

  public topic: string
  public groupId: string
  public msg: any
  public filter: (decodedMessage: any) => boolean

  setFilter(filter: (decodedMessage: any) => boolean) {
    this.filter = filter
  }

  clearFilter() {
    this.filter = undefined
  }

  async onMessage(decodedMessage: any) {
    if (this.filter && !this.filter(decodedMessage)) return
    this.msg = decodedMessage
  }

  async getConsumedMessage() {
    let i = 0
    while (i < this.MAX_RETRIES) {
      console.log(`getConsumedMessage (${i})...`)
      if (!this.msg) {
        await sleep(this.SLEEP_IN_MS)
      } else {
        const msgTemp = this.msg
        this.msg = undefined
        return msgTemp
      }
      i++
    }
    const totalDuration = this.MAX_RETRIES * this.SLEEP_IN_MS
    throw `Did not receive message for topic ${this.topic} after ${totalDuration}ms`
  }

  async onStopListener() {
    console.log(`Stopping ${TestKafkaConsumer.name}`)
  }
}
