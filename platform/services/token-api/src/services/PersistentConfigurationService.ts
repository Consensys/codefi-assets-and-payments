import { Injectable } from '@nestjs/common'
import { NestJSPinoLogger } from '@consensys/observability'
import config from '../config'
import { ContractRegistry } from '@consensys/nestjs-orchestrate'
import { M2mTokenService } from '@consensys/auth'
import { OrchestrateUtils } from '@consensys/nestjs-orchestrate'

@Injectable()
export class PersistentConfigurationService {
  constructor(
    private logger: NestJSPinoLogger,
    private contractRegistry: ContractRegistry,
    private m2mTokenService: M2mTokenService,
  ) {}
  async performConfiguration() {
    if (!config().performInitialConfiguration) {
      this.logger.info(`Initial configuration will not be performed`)
      return
    }

    this.logger.info(`Performing initial configuration`)
    await this.registerContracts()
  }

  private async registerContracts() {
    this.logger.info(`Crafting authToken required to register contracts`)

    // We need to create a M2M token to configure contracts in Orchestrate
    const authToken = await this.m2mTokenService.createM2mToken(
      config().m2mToken.client.id,
      config().m2mToken.client.secret,
      config().m2mToken.audience,
    )

    this.logger.info(
      {
        clientId: config().m2mToken.client.id,
        audience: config().m2mToken.audience,
      },
      'Registering contracts',
    )

    const contractsToRegister = config().contractsToRegister
    await Promise.all(
      contractsToRegister.map((contractName) => {
        return this.registerContract(contractName, authToken)
      }),
    )
  }

  private async registerContract(contractName: string, authToken: string) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const contractJson = require(`@consensys/contracts/build/contracts/${contractName}.json`)
    if (!contractJson) {
      return
    }

    const logger = this.logger.logger.child({ contractName })

    logger.info({ contractName }, 'Checking if contract is already registered')

    const existingContract =
      await this.contractRegistry.getContractByContractName(
        contractName,
        authToken,
      )

    if (
      !existingContract ||
      existingContract.deployedBytecode != contractJson.deployedBytecode
    ) {
      logger.info('Contract is not registered')
      // Orchestrate multi-tenancy
      //   When calling Orchestrate, the 'tenantId' is extracted from authToken.
      //   By default, 'tenantId' can equal be to anything.
      //   There are 2 reserved 'tenantIds' with special rules associated to them:
      //     1) If 'tenantId' === '_' it means the resource can be accessed by anyone (public-tenant resource).
      //     2) If 'tenantId' === '*' it means the user can create a resource on behalf of another tenant (super user).
      //
      //   In case 2), a super user (user with '*' as 'tenantId' in his authToken), can specify the
      //   'tenantId' of the resource he wants to create by defining the 'X-Tenant-ID' headers.
      //
      //   Consequently the only way to create a public-tenant resource (resource with '_' as 'tenantId')
      //   is that a super user (user with '*' as 'tenantId' in his authToken) calls the function with
      //   'X-Tenant-ID' headers set to '_'.
      //   We call those headers public-tenant headers because they allow the creation of public-tenant resources.
      const publicTenantHeaders =
        OrchestrateUtils.buildOrchestrateHeadersForPublicTenant()

      await this.contractRegistry.registerNewContractVersion(
        contractName,
        contractJson,
        authToken,
        publicTenantHeaders,
      )
      logger.info('Contract registered successfully')
    } else {
      logger.info('Contract is already registered')
    }
  }
}
