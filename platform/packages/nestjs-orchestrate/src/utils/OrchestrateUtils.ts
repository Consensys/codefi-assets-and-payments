import {
  ISendTransactionRequest,
  ProtocolType,
  IDeployContractRequest,
  OrchestrateClient,
  IHeaders,
} from 'pegasys-orchestrate'
import { TransactionConfig } from '../transactions/TransactionConfig'
import cfg from '../config'
import { EthereumArgument } from '../transactions/ContractManager'
import jwt from 'jsonwebtoken'
import {
  BadRequestException,
  UnauthorizedException,
} from '@consensys/error-handler'

export class OrchestrateUtils {
  private client: OrchestrateClient

  static async getContractTags(
    contractName: string,
    authToken?: string,
    headers?: IHeaders, // [Optional] Can be used to specify 'X-Tenant-ID' headers, allowing to specify a different tenantId than the one extracted from 'authToken'
  ): Promise<string[]> {
    const client = new OrchestrateClient(cfg().orchestrateUrl)
    try {
      const tags = await client.getContractTags(
        contractName,
        authToken,
        headers,
      )
      return tags
    } catch (error) {
      console.log(`Could not get tags for ${contractName}`)
    }
    return undefined
  }

  static async getContractLastTag(
    name: string,
    authToken?: string,
    headers?: IHeaders, // [Optional] Can be used to specify 'X-Tenant-ID' headers, allowing to specify a different tenantId than the one extracted from 'authToken'
  ): Promise<number> {
    const contractTags = await OrchestrateUtils.getContractTags(
      name,
      authToken,
      headers,
    )
    if (!contractTags) {
      return 0
    }
    const orderedTags = contractTags
      .filter((tag) => {
        return Number.isInteger(parseInt(tag))
      })
      .map((tag) => parseInt(tag))
      .sort((a, b) => a - b)
    if (orderedTags.length === 0) {
      return 0
    }
    const lastTag = orderedTags[orderedTags.length - 1]
    return lastTag
  }

  static async getContractAbi(
    name: string,
    tag?: string,
    authToken?: string,
    headers?: IHeaders, // [Optional] Can be used to specify 'X-Tenant-ID' headers, allowing to specify a different tenantId than the one extracted from 'authToken'
  ): Promise<string[]> {
    const client = new OrchestrateClient(cfg().orchestrateUrl)
    const contract = await client.getContract(name, tag, authToken, headers)
    return contract.abi
  }

  static async buildOrchestrateRequest(
    contractName: string,
    methodName: string,
    config: TransactionConfig,
    params?: EthereumArgument[],
    authToken?: string,
    headers?: IHeaders, // [Optional] Can be used to specify 'X-Tenant-ID' headers, allowing to specify a different tenantId than the one extracted from 'authToken'
    labels?: Record<string, any>,
  ): Promise<ISendTransactionRequest> {
    console.log(`Getting contract last tag for ${contractName}`)
    const tag: string | number =
      cfg().orchestrateContractTag(config.contractTag) ||
      (await OrchestrateUtils.getContractLastTag(
        contractName,
        authToken,
        headers,
      ))
    console.log(`Contract last tag for ${contractName} is ${tag}`)

    let transactionParameters = {
      to: config.to,
      methodSignature: methodName,
      args: params.length === 0 ? undefined : params,
      from: config.from,
      gas: cfg().transactionGas(config.gas),
      gasPrice: cfg().transactionGasPrice(config.gasPrice),
      privateFrom: config.privateFrom,
      privateFor: config.privateFor,
      privacyGroupId: config.privacyGroupId,
      protocol: ProtocolType[config.protocol],
      contractName: contractName,
      contractTag: tag.toString(),
    }

    // mutually exclusive
    transactionParameters = await this.removePropertyPrivateTransaction(
      transactionParameters,
    )

    const chainName = cfg().orchestrateChainName(config.chainName)
    if (!chainName) {
      throw new BadRequestException(
        'Bad request',
        `Config property 'chainName' must be set to send a transaction request to Orchestrate`,
        {
          config,
        },
      )
    }

    const orchestrateRequest: ISendTransactionRequest = {
      chain: chainName,
      params: transactionParameters,
      labels: {
        ...labels,
        filterFlag: cfg().orchestrateFilterFlag,
        tenantId: authToken
          ? this.extractOrchestrateTenantIdFromAuthToken(authToken, headers)
          : undefined, // we inject the tenantId in the labels, in order to re-use it in the consumer if needed
      },
    }
    console.log(
      `Orchestrate transaction request: ${JSON.stringify(orchestrateRequest)}`,
    )
    return orchestrateRequest
  }

  static async buildOrchestrateDeployContractRequest(
    contractName: string,
    config: TransactionConfig,
    params?: EthereumArgument[],
    authToken?: string,
    headers?: IHeaders, // [Optional] Can be used to specify 'X-Tenant-ID' headers, allowing to specify a different tenantId than the one extracted from 'authToken'
    labels?: Record<string, any>,
  ): Promise<IDeployContractRequest> {
    console.log(`Getting contract last tag for ${contractName}`)
    const tag: string | number =
      cfg().orchestrateContractTag(config.contractTag) ||
      (await OrchestrateUtils.getContractLastTag(
        contractName,
        authToken,
        headers,
      ))
    console.log(`Contract last tag for ${contractName} is ${tag}`)

    let deployContractParams = {
      args: params.length === 0 ? undefined : params,
      contractName: contractName,
      contractTag: tag.toString(),
      from: config.from,
      gas: cfg().transactionGas(config.gas),
      gasPrice: cfg().transactionGasPrice(config.gasPrice),
      privateFor: config.privateFor,
      privateFrom: config.privateFrom,
      privacyGroupId: config.privacyGroupId,
      protocol: ProtocolType[config.protocol],
    }

    // mutually exclusive
    deployContractParams = await this.removePropertyPrivateTransaction(
      deployContractParams,
    )

    const chainName = cfg().orchestrateChainName(config.chainName)
    if (!chainName) {
      throw new BadRequestException(
        'Bad request',
        `Config property 'chainName' must be set to send a contract deployment request to Orchestrate`,
        {
          config,
        },
      )
    }

    const orchestrateRequest: IDeployContractRequest = {
      chain: chainName,
      params: deployContractParams,
      labels: {
        ...labels,
        filterFlag: cfg().orchestrateFilterFlag,
        tenantId: authToken
          ? this.extractOrchestrateTenantIdFromAuthToken(authToken, headers)
          : undefined, // we inject the tenantId in the labels, in order to re-use it in the consumer if needed
      },
    }
    console.log(
      `Orchestrate deploy contract request: ${JSON.stringify(
        orchestrateRequest,
      )}`,
    )
    return orchestrateRequest
  }

  static async removePropertyPrivateTransaction(props: any) {
    if (props.privacyGroupId && props.privateFor.length === 0) {
      delete props.privateFor
    } else {
      delete props.privacyGroupId
    }
    return props
  }

  static craftOrchestrateTenantId = (tenantId: string, entityId: string) =>
    `${tenantId}:${entityId}`

  static buildOrchestrateHeadersForTenant = (
    tenantId: string,
    entityId: string,
  ) => ({
    [OrchestrateUtils.orchestrateTenantIdHeader]:
      OrchestrateUtils.craftOrchestrateTenantId(tenantId, entityId),
  })

  static buildOrchestrateHeadersForPublicTenant = () => ({
    [OrchestrateUtils.orchestrateTenantIdHeader]:
      OrchestrateUtils.publicTenantId,
  })

  static decodeToken(authToken: string): { [key: string]: any } | undefined {
    if (authToken) {
      try {
        const decodedToken: { [key: string]: any } = jwt.decode(authToken) as {
          [key: string]: any
        }

        return decodedToken
      } catch (error) {
        throw new UnauthorizedException(
          'Invalid Orchestrate Auth Token',
          `Error decoding auth token ${authToken} because of: ${error?.message}`,
          {
            error,
            authToken,
          },
        )
      }
    }

    return undefined
  }

  static extractOrchestrateTenantIdFromAuthToken(
    authToken: any,
    headers?: IHeaders,
  ) {
    const decodedToken = this.decodeToken(authToken)

    const orchestrateCustomClaims = decodedToken[cfg()?.orchestrateNamespace]

    if (!orchestrateCustomClaims) {
      throw new UnauthorizedException(
        'Invalid Orchestrate Auth Token',
        `Orchestrate Auth token contains no custom claims in namespace: ${
          cfg()?.orchestrateNamespace
        }`,
        {
          decodedToken,
          customNamespace: cfg()?.orchestrateNamespace,
        },
      )
    }

    if (!orchestrateCustomClaims.tenant_id) {
      throw new UnauthorizedException(
        'Invalid Auth Token',
        `Auth token contains no tenantId in custom claim ${
          cfg()?.orchestrateNamespace
        }`,
        {
          decodedToken,
          customNamespace: cfg()?.orchestrateNamespace,
        },
      )
    }

    let tenantId = orchestrateCustomClaims.tenant_id

    if (
      tenantId === this.superTenantId &&
      headers &&
      headers[OrchestrateUtils.orchestrateTenantIdHeader]
    ) {
      // In case authToken has '*' as tenantId, the authToken allows to manage ressources
      // in other tenants by specifying the tenantId inside 'X-Tenant-ID' headers
      tenantId = headers[OrchestrateUtils.orchestrateTenantIdHeader]
    }

    return tenantId
  }

  /**
   * The purpose of this function is to make sure parameters are typed properly,
   * when Orchestrate version >= v21.11.0-alpha.1
   */
  static reformatOrchestrateRequest(request: any) {
    if (request?.params?.gas !== undefined) {
      // Example gas: 6721975
      request.params.gas = this.convertBigIntStringToNumberIfRequired(
        request.params.gas,
      )
    }
    if (request?.params?.gasPrice !== undefined) {
      // Example gasPrice: '0x0'
      request.params.gasPrice = this.convertBigIntStringToHexIfRequired(
        request.params.gasPrice,
      )
    }
    if (request?.params?.value !== undefined) {
      // Example value for 0.1ETH: '0x16345785D8A0000'
      request.params.value = this.convertBigIntStringToHexIfRequired(
        request.params.value,
      )
    }
    if (request?.params?.nonce !== undefined) {
      // Example noce : 21
      request.params.nonce = this.convertBigIntStringToNumberIfRequired(
        request.params.nonce,
      )
    }

    return request
  }

  /**
   * The purpose of this function is to make sure parameters are typed properly, when passed to Orchestrate.
   *
   * Prior Orchestrate v21.11.0-alpha.1:
   * - Orchestrate was expecting BigInt strings for 'tx.gas'
   * - Example of value expected for max quantity of gas in a tx: "6721975"
   *
   * After Orchestrate v21.11.0-alpha.1 (included):
   * - Orchestrate is expecting a number
   * - Example of value expected for max quantity of gas in a tx: 6721975
   */
  static convertBigIntStringToNumberIfRequired(value: any) {
    if (value === undefined) {
      return value
    }

    // In case Orchestrate version < v21.11.0-alpha.1, do nothing
    if (process.env.ORCHESTRATE_USE_DEPRECATED_TYPES) {
      return value
    }

    // In case Orchestrate version >= v21.11.0-alpha.1, convert BigInt strings to number if required
    return Number(value)
  }

  /**
   * The purpose of this function is to make sure parameters are typed properly, when passed to Orchestrate.
   *
   * Prior Orchestrate v21.11.0-alpha.1:
   * - Orchestrate was expecting BigInt strings for 'tx.value', 'tx.gasLimit', 'faucet.amount' and 'faucet.maxBalance'
   * - Example of value expected for 0.1 ETH: "100000000000000000"
   *
   * After Orchestrate v21.11.0-alpha.1 (included):
   * - Orchestrate is expecting an HEX value prefix by "0x"
   * - Example of value expected for 0.1 ETH: "0x16345785D8A0000"
   */
  static convertBigIntStringToHexIfRequired(value: string) {
    if (value === undefined) {
      return value
    }

    if (typeof value !== 'string') {
      throw new Error(
        `shall never happen: unexpected type ${typeof value} for value ${value} (string was expected)`,
      )
    }

    // In case Orchestrate version < v21.11.0-alpha.1, do nothing
    if (process.env.ORCHESTRATE_USE_DEPRECATED_TYPES) {
      return value
    }

    // In case Orchestrate version >= v21.11.0-alpha.1, convert BigInt strings to hex if required
    if (value.startsWith('0x')) {
      return value
    } else {
      return `0x${Number(value).toString(16)}`
    }
  }

  static superTenantId = '*'

  static publicTenantId = '_'

  static orchestrateTenantIdHeader = 'X-Tenant-ID'
}
