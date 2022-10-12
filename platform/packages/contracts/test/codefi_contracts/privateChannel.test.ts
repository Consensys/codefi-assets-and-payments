declare const contract
declare const artifacts
declare const web3

import { expectEvent } from '@openzeppelin/test-helpers'
import { expect } from 'chai'

const PrivateChannel = artifacts.require('PrivateChannel')
const DataStorage = artifacts.require('DataStorage')

enum ClientType {
  BESU,
  QUORUM,
}

contract('PrivateChannel', async (accounts: string[]) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_, creator, anyone] = accounts
  let channel: any
  const channelId = 'channelId'
  const name = 'name'
  const description = 'description'
  const participants: string[] = ['participant01', 'participant02']
  const clientType: ClientType = ClientType.BESU

  beforeEach(async function () {
    channel = await PrivateChannel.new(
      channelId,
      name,
      description,
      clientType,
      participants,
      { from: creator },
    )
  })

  it('should emit PrivateChannelCreated event with all the parameters upon creation', async () => {
    await expectEvent.inTransaction(
      channel.transactionHash,
      channel,
      'PrivateChannelCreated',
      {
        channelId,
        name,
        description,
        clientType: clientType.toString(),
        participants,
        creator,
      },
    )
  })

  it('should deploy a DataStorage instance', async () => {
    const storageAddress = await channel.dataStorage.call()
    const deployedStorageCode = await web3.eth.getCode(storageAddress)
    expect(deployedStorageCode).to.equal(DataStorage.deployedBytecode)
  })

  it('should emit a DataShared event when sharingData', async () => {
    const id = 'dataId'
    const data = 'data'
    const channelId = 'channelId'
    const receipt = await channel.shareData(id, channelId, data, {
      from: anyone,
    })
    expectEvent(receipt, 'DataShared', {
      id,
      channelId,
      data,
      sender: anyone,
    })
  })

  it('should store the shared data in the DataStorage contract', async () => {
    const id = 'dataId'
    const data = 'data'
    const channelId = 'channelId'
    await channel.shareData(id, channelId, data, { from: anyone })
    const storageAddress = await channel.dataStorage.call()
    const storage = await DataStorage.at(storageAddress)
    const storedData = await storage.getString.call(id)
    expect(storedData).to.equal(data)
  })
})
