declare const contract
declare const artifacts
declare const web3

import { expectEvent } from '@openzeppelin/test-helpers'

const DataAttestation = artifacts.require('DataAttestation')

contract('DataAttestation', async (accounts: string[]) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_, owner] = accounts
  let attestation: any
  const merkleRootMock = web3.utils.randomHex(32)

  beforeEach(async function () {
    attestation = await DataAttestation.new({ from: owner })
  })

  it('should attest and emit event', async () => {
    const tx = await attestation.saveMerkleRoot(merkleRootMock, { from: owner })
    expectEvent(tx, 'Attest', { merkleRoot: merkleRootMock })
  })
})
