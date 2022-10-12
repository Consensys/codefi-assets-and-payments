import Web3 from 'web3'
import { LegalEntityEntity } from '../data/entities/LegalEntityEntity'
import { EthereumAddressService } from '../services/EthereumAddressService'
import { LegalEntityService } from '../services/LegalEntityService'

export const findLegalEntityByEthereumAddress = async (
  legalEntityService: LegalEntityService,
  ethereumAddressService: EthereumAddressService,
  address: string,
): Promise<LegalEntityEntity> => {
  const checkSummedAddress = Web3.utils.toChecksumAddress(address)
  // find by default wallet
  const entity = await legalEntityService.findOne({
    ethereumAddress: checkSummedAddress,
  })
  if (entity) {
    // found
    return entity
  }
  // find ethereum address non default wallet
  const addr = await ethereumAddressService.findOne({
    address: checkSummedAddress,
  })
  if (addr) {
    // there is an address, return the legal entity that owns it
    const legalEntity = await legalEntityService.findOne({
      id: addr.entityId,
    })
    return legalEntity
  }
}
