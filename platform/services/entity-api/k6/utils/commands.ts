import tenantCreateCommandSchema from '../schema/tenantCreateCommand.json'
import tenantUpdateCommandSchema from '../schema/tenantUpdateCommand.json'
import tenantDeleteCommandSchema from '../schema/tenantDeleteCommand.json'
import entityCreateCommandSchema from '../schema/entityCreateCommand.json'
import entityUpdateCommandSchema from '../schema/entityUpdateCommand.json'
import entityDeleteCommandSchema from '../schema/entityDeleteCommand.json'
import walletCreateCommandSchema from '../schema/walletCreateCommand.json'
import walletUpdateCommandSchema from '../schema/walletUpdateCommand.json'
import walletDeleteCommandSchema from '../schema/walletDeleteCommand.json'
import tenantOperationEventSchema from '../schema/tenantOperationEvent.json'
import entityOperationEventSchema from '../schema/entityOperationEvent.json'
import walletOperationEventSchema from '../schema/walletOperationEvent.json'
import { cfg } from './config'
import {
  ConsumerList,
  createConsumers,
  createProducer,
  sendMessage,
  waitForMessage,
} from './kafka'
import { Writer } from 'k6/x/kafka'

const TOPIC_TENANT_CREATE = 'tenant_create'
const TOPIC_TENANT_UPDATE = 'tenant_update'
const TOPIC_TENANT_DELETE = 'tenant_delete'
const TOPIC_ENTITY_CREATE = 'entity_create'
const TOPIC_ENTITY_UPDATE = 'entity_update'
const TOPIC_ENTITY_DELETE = 'entity_delete'
const TOPIC_WALLET_CREATE = 'wallet_create'
const TOPIC_WALLET_UPDATE = 'wallet_update'
const TOPIC_WALLET_DELETE = 'wallet_delete'
const TOPIC_TENANT_OPERATION = 'tenant_operation'
const TOPIC_ENTITY_OPERATION = 'entity_operation'
const TOPIC_WALLET_OPERATION = 'wallet_operation'

export const getTopic = (topic: string): string => {
  return `${cfg().kafka.topicPrefix}${topic}`
}

export const createTenantCreateProducer = (): Writer => {
  return createProducer(getTopic(TOPIC_TENANT_CREATE))
}

export const createTenantUpdateProducer = (): Writer => {
  return createProducer(getTopic(TOPIC_TENANT_UPDATE))
}

export const createTenantDeleteProducer = (): Writer => {
  return createProducer(getTopic(TOPIC_TENANT_DELETE))
}

export const createEntityCreateProducer = (): Writer => {
  return createProducer(getTopic(TOPIC_ENTITY_CREATE))
}

export const createEntityUpdateProducer = (): Writer => {
  return createProducer(getTopic(TOPIC_ENTITY_UPDATE))
}

export const createEntityDeleteProducer = (): Writer => {
  return createProducer(getTopic(TOPIC_ENTITY_DELETE))
}

export const createWalletCreateProducer = (): Writer => {
  return createProducer(getTopic(TOPIC_WALLET_CREATE))
}

export const createWalletUpdateProducer = (): Writer => {
  return createProducer(getTopic(TOPIC_WALLET_UPDATE))
}

export const createWalletDeleteProducer = (): Writer => {
  return createProducer(getTopic(TOPIC_WALLET_DELETE))
}

export const createTenantOperationConsumers = (): ConsumerList => {
  return createConsumers(
    getTopic(TOPIC_TENANT_OPERATION),
    cfg().kafka.partitionCount,
  )
}

export const createEntityOperationConsumers = (): ConsumerList => {
  return createConsumers(
    getTopic(TOPIC_ENTITY_OPERATION),
    cfg().kafka.partitionCount,
  )
}

export const createWalletOperationConsumers = (): ConsumerList => {
  return createConsumers(
    getTopic(TOPIC_WALLET_OPERATION),
    cfg().kafka.partitionCount,
  )
}

export const createTenantCommand = (producer: Writer, payload: any) => {
  sendMessage(producer, payload, tenantCreateCommandSchema)
}

export const updateTenantCommand = (producer: Writer, payload: any) => {
  sendMessage(producer, payload, tenantUpdateCommandSchema)
}

export const deleteTenantCommand = (producer: Writer, payload: any) => {
  sendMessage(producer, payload, tenantDeleteCommandSchema)
}

export const createEntityCommand = (producer: Writer, payload: any) => {
  sendMessage(producer, payload, entityCreateCommandSchema)
}

export const updateEntityCommand = (producer: Writer, payload: any) => {
  sendMessage(producer, payload, entityUpdateCommandSchema)
}

export const deleteEntityCommand = (producer: Writer, payload: any) => {
  sendMessage(producer, payload, entityDeleteCommandSchema)
}

export const createWalletCommand = (producer: Writer, payload: any) => {
  sendMessage(producer, payload, walletCreateCommandSchema)
}

export const updateWalletCommand = (producer: Writer, payload: any) => {
  sendMessage(producer, payload, walletUpdateCommandSchema)
}

export const deleteWalletCommand = (producer: Writer, payload: any) => {
  sendMessage(producer, payload, walletDeleteCommandSchema)
}

export const waitForTenantOperationMessage = (
  consumers: ConsumerList,
  tenantId: string,
  operation: 'CREATE' | 'UPDATE' | 'DELETE',
) => {
  return waitForMessage(
    consumers,
    tenantOperationEventSchema,
    (messageData) =>
      messageData.tenantId === tenantId && messageData.operation === operation,
  )
}

export const waitForEntityOperationMessage = (
  consumers: ConsumerList,
  entityId: string,
  operation: 'CREATE' | 'UPDATE' | 'DELETE',
) => {
  return waitForMessage(
    consumers,
    entityOperationEventSchema,
    (messageData) =>
      messageData.entityId === entityId && messageData.operation === operation,
  )
}

export const waitForWalletOperationMessage = (
  consumers: ConsumerList,
  operation: 'CREATE' | 'UPDATE' | 'DELETE',
  matcher: (messageData: any) => boolean,
) => {
  return waitForMessage(
    consumers,
    walletOperationEventSchema,
    (messageData) =>
      messageData.operation === operation && matcher(messageData),
  )
}
