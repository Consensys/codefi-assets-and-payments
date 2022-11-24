import { ErrorCode } from '@consensys/error-handler'
import { WalletType } from '@consensys/ts-types'
import { walletMock } from '../../test/mocks'
import { JoiValidationPipe } from './JoiValidationPipe'
import { walletCreateRequestSchema } from './walletCreateRequestSchema'

describe('walletCreateRequestSchema', () => {
  const validationPipe = new JoiValidationPipe(walletCreateRequestSchema)

  it.each([
    WalletType.EXTERNAL_CLIENT_METAMASK,
    WalletType.EXTERNAL_CLIENT_METAMASK_INSTITUTIONAL,
    WalletType.EXTERNAL_OTHER,
  ])('Should throw if type is %s and no address', (walletType) => {
    try {
      validationPipe.transform({
        ...walletMock,
        type: walletType,
        address: undefined,
      })
      fail('Should not reach this point')
    } catch (error) {
      expect(error.message).toEqual('"address" is required')
      expect(error.errorCode).toEqual(ErrorCode.ApplicationValidation)
    }
  })

  it.each([
    WalletType.INTERNAL_CODEFI_HASHICORP_VAULT,
    WalletType.INTERNAL_CODEFI_AWS_VAULT,
    WalletType.INTERNAL_CODEFI_AZURE_VAULT,
    WalletType.INTERNAL_CLIENT_AWS_VAULT,
    WalletType.INTERNAL_CLIENT_AZURE_VAULT,
  ])('Should succeed if type is %s and no address', (walletType) => {
    validationPipe.transform({
      ...walletMock,
      type: walletType,
      address: undefined,
    })
  })
})
