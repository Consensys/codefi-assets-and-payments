import { group } from 'k6'
import { getK6Config } from '../../utils/config'
import { tenantCreateCommandMock } from '../../utils/mocks'
import {
  createTenantCommand,
  createTenantOperationConsumers,
  createTenantCreateProducer,
  waitForTenantOperationMessage,
} from '../../utils/commands'

export const options = getK6Config('CreateTenantKafka')

const producer = createTenantCreateProducer()
const consumers = createTenantOperationConsumers()

export default function () {
  group('Create Tenant', function () {
    const payload = tenantCreateCommandMock()
    createTenantCommand(producer, payload)
    waitForTenantOperationMessage(consumers, payload.tenantId, 'CREATE')
  })
}

export function teardown() {
  producer.close()
  consumers.close()
}
