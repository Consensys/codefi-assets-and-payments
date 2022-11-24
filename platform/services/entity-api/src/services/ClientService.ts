import { FindManyOptions, Repository } from 'typeorm'
import { NestJSPinoLogger } from '@consensys/observability'
import { AdminApiService } from './AdminApiService'
import {
  ClientType,
  EntityClientCreateRequest,
  EntityStatus,
} from '@consensys/ts-types'
import { ClientEntity } from '../data/entities/ClientEntity'
import { Injectable } from '@nestjs/common'
import { TenantEntity } from '../data/entities/TenantEntity'
import { EntityEntity } from '../data/entities/EntityEntity'
import { InjectRepository } from '@nestjs/typeorm'
import { v4 as uuidv4 } from 'uuid'
import { ValidationException } from '@consensys/error-handler'
import { LocalErrorName } from '../LocalErrorNameEnum'

const SUPPORTED_TYPES = [ClientType.SinglePage, ClientType.NonInteractive]

const GRANT_TYPES_SPA = [
  'password',
  'authorization_code',
  'implicit',
  'refresh_token',
]

const GRANT_TYPES_M2M = [...GRANT_TYPES_SPA, 'client_credentials']

const SUFFIX_BY_TYPE = {
  [ClientType.SinglePage]: '',
  [ClientType.NonInteractive]: ' - M2M',
}

const GRANT_TYPES_BY_TYPE = {
  [ClientType.SinglePage]: GRANT_TYPES_SPA,
  [ClientType.NonInteractive]: GRANT_TYPES_M2M,
}

@Injectable()
export class ClientService {
  constructor(
    logger: NestJSPinoLogger,
    private readonly adminApiService: AdminApiService,
    @InjectRepository(TenantEntity)
    private readonly tenantRepository: Repository<TenantEntity>,
    @InjectRepository(EntityEntity)
    private readonly entityRepository: Repository<EntityEntity>,
    @InjectRepository(ClientEntity)
    private readonly clientRepository: Repository<ClientEntity>,
  ) {
    logger.setContext(ClientService.name)
  }

  async getAll(filter?: FindManyOptions<ClientEntity>) {
    return this.clientRepository.findAndCount(filter)
  }

  async create(
    tenantId: string,
    entityId: string,
    request: EntityClientCreateRequest,
  ) {
    if (!SUPPORTED_TYPES.includes(request.type)) {
      throw new ValidationException(
        LocalErrorName.ClientTypeNotSupportedException,
        `Clients cannot be created with the type: ${request.type}`,
        request,
      )
    }

    const parent = entityId
      ? await this.entityRepository.findOne({ id: entityId, tenantId })
      : await this.tenantRepository.findOne({ id: tenantId })

    const type = request.type
    const suffix = SUFFIX_BY_TYPE[type]
    const clientName = `${parent.name}${suffix}`
    const grantTypes = GRANT_TYPES_BY_TYPE[type]

    const existingClient = await this.clientRepository.findOne({
      tenantId,
      entityId,
      name: clientName,
    })

    if (existingClient)
      throw new ValidationException(
        LocalErrorName.DuplicateClientException,
        `A client already exists with the following: Tenant ID: ${tenantId} | Entity ID: ${entityId} | Name: ${clientName}`,
        existingClient,
      )

    const newClient = {
      id: uuidv4(),
      tenantId,
      entityId,
      type,
      name: clientName,
      status: EntityStatus.Pending,
    } as ClientEntity

    await this.clientRepository.insert(newClient)

    await this.adminApiService.createClient(
      clientName,
      type,
      grantTypes,
      tenantId,
      entityId,
    )
  }

  async updateStatus(
    tenantId: string,
    entityId: string,
    name: string,
    clientId: string,
  ) {
    const updatedClient = {
      status: EntityStatus.Confirmed,
      clientId,
    }

    await this.clientRepository.update(
      { tenantId, entityId, name },
      updatedClient,
    )
  }
}
