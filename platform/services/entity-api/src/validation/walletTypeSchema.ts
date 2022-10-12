import { WalletType } from '@codefi-assets-and-payments/ts-types'
import Joi from 'joi'

export const walletTypeSchema = Joi.string().valid(
  WalletType.INTERNAL_CODEFI_HASHICORP_VAULT,
  WalletType.INTERNAL_CODEFI_AZURE_VAULT,
  WalletType.INTERNAL_CODEFI_AWS_VAULT,
  WalletType.INTERNAL_CLIENT_AZURE_VAULT,
  WalletType.INTERNAL_CLIENT_AWS_VAULT,
  WalletType.EXTERNAL_CLIENT_METAMASK,
  WalletType.EXTERNAL_CLIENT_METAMASK_INSTITUTIONAL,
  WalletType.EXTERNAL_OTHER,
)
