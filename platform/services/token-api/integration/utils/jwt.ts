import jwt from 'jsonwebtoken'

export const createTokenWithMetadata = (
  ethereumAddress: string,
  nft721Address?: string,
) => {
  const metadata = {
    ethereum_address: ethereumAddress,
  } as any
  if (nft721Address) {
    metadata.erc721_address = nft721Address
  }
  const token = jwt.sign({ 'http://metadata': metadata }, 'key')
  return token
}
