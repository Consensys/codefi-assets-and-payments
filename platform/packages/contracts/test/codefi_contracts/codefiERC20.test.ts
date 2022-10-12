declare const contract
declare const artifacts

import { expect } from 'chai'
import { BigNumber } from 'ethers/utils'
import { expectRevert } from '@openzeppelin/test-helpers'

const CodefiERC20 = artifacts.require('CodefiERC20')

contract('CodefiERC20', async (accounts: string[]) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_, owner] = accounts
  let codefiERC20: any = null

  beforeEach(async function () {
    codefiERC20 = await CodefiERC20.new('token', 'symbol', 18, { from: owner })
  })

  it('should throw if not owner', async () => {
    await expectRevert(
      codefiERC20.burn(200),
      'Ownable: caller is not the owner.',
    )
  })

  it('should throw if exceeds balance', async () => {
    await expectRevert(
      codefiERC20.burn(200, { from: owner }),
      'ERC20: burn amount exceeds balance.',
    )
  })

  it('burnFrom should not be allowed', async () => {
    await expectRevert(
      codefiERC20.burnFrom(owner, 200, { from: owner }),
      'burnFrom is not supported.',
    )
  })

  it('should be able to burn if burn tokens < minted', async () => {
    const totalMinted = new BigNumber('0x30D40')
    const hasMintedReceipt = await codefiERC20.mint(owner, totalMinted, {
      from: owner,
    })
    expect(hasMintedReceipt).to.not.be.null

    // event
    const mintEventValue = hasMintedReceipt.receipt.logs[0].args.value
    expect(mintEventValue.toNumber()).to.be.equal(totalMinted.toNumber())

    // supply query
    const supplyBeforeBurn = await codefiERC20.totalSupply()
    expect(supplyBeforeBurn.toNumber()).to.be.equal(totalMinted.toNumber())

    // burn
    const amountToBurn = 200
    const result = await codefiERC20.burn(amountToBurn, { from: owner })
    expect(result).to.not.be.null
    expect(result.receipt.status).to.be.equal(true)

    // after
    const supplyAfterBurn = await codefiERC20.totalSupply()
    expect(supplyAfterBurn.toNumber()).to.be.equal(
      totalMinted.toNumber() - amountToBurn,
    )
  })
})
