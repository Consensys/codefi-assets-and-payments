import jwt from 'jsonwebtoken'
import { createOauthToken } from './requests'

export const createTokenWithMetadata = (ethereumAddress: string, nft721Address?: string) => {
  const metadata = {
    ethereum_address: ethereumAddress,
  } as any
  if (nft721Address) {
    metadata.erc721_address = nft721Address
  }
  const token = jwt.sign({ 'http://metadata' : metadata,
  }, 'key')
  return token
}

export const createTokenWithPermissions = async (permissions: string[], apiManagmentAudience = false, withScopes = true) => {
  if (process.env.PIPELINE) { return createOauthToken(withScopes, apiManagmentAudience) }

  const token = {
    permissions,
  }
  const signedToken = jwt.sign(token, 'key')
  return signedToken
}
