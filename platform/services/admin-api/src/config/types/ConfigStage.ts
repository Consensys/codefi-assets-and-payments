import { NestJSPinoLogger } from '@consensys/observability'
import { FileSystemInstance } from '../../services/instances/FileSystemInstance'
import { ClientService } from '../../services/ClientService'
import { ManagementClientExtended } from '../../types/Auth0ManagementClientExtended'
import { ClientCredentials } from './ClientCredentials'

export interface ConfigStageRequest {
  managementClient: ManagementClientExtended
  clientService: ClientService
  fs: FileSystemInstance
  logger: NestJSPinoLogger
  clientCredentials?: ClientCredentials
}

export interface IConfigStage {
  run(request: ConfigStageRequest)
}
