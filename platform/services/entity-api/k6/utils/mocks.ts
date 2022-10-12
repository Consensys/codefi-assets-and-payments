import { uuidv4 } from './uuid'

export const tenantCreateRequestMock = () => {
  const id = uuidv4()
  return {
    id: `k6_${id}`,
    name: `K6 Tenant - ${id}`,
    products: {
      assets: true,
      payments: true,
      compliance: true,
      staking: false,
      workflows: false,
    },
    defaultNetworkKey: 'mainnet',
    metadata: {
      field1: 'field1',
      field2: 'field2',
    },
  }
}

export const tenantUpdateRequestMock = () => ({
  name: `K6 Tenant Updated - ${uuidv4()}`,
  products: {
    assets: false,
    payments: false,
    compliance: false,
    staking: false,
    workflows: true,
  },
  defaultNetworkKey: 'testnet',
  metadata: {
    field1: 'field1',
    field3: 'field3',
    field4: 'field4',
  },
})

export const entityCreateRequestMock = () => {
  const id = uuidv4()
  return {
    id: `k6_${id}`,
    name: `K6 Entity - ${id}`,
    metadata: {
      field1: 'field1',
      field2: 'field2',
    },
  }
}

export const entityUpdateRequestMock = () => ({
  name: `K6 Entity Updated - ${uuidv4()}`,
  metadata: {
    field1: 'field1',
    field3: 'field3',
    field4: 'field4',
  },
})

export const walletCreateRequestMock = {
  type: 'INTERNAL_CODEFI_HASHICORP_VAULT',
  metadata: {
    field3: 'field3',
  },
}

export const walletUpdateRequestMock = {
  metadata: {
    field99: 'field99',
  },
}

export const messageMock = {
  traceParent: null,
}

export const productsMessageMock = {
  assets: { boolean: true },
  payments: { boolean: true },
  compliance: { boolean: true },
  staking: { boolean: false },
  workflows: { boolean: false },
}

export const tenantCreateCommandMock = () => {
  const id = uuidv4()
  return {
    ...messageMock,
    tenantId: `k6_${id}`,
    name: `K6 Tenant - ${id}`,
    products: productsMessageMock,
    defaultNetworkKey: 'mainnet',
    metadata: {
      string: JSON.stringify({
        field1: 'field1',
        field2: 'field2',
      }),
    },
    initialAdmins: {
      array: [],
    },
    initialEntities: null,
    createdBy: {
      string: 'auth0|615c596dbe37840071904478',
    },
    stores: null,
  }
}

export const tenantUpdateCommandMock = (tenantId: string) => {
  return {
    ...messageMock,
    tenantId,
    name: `K6 Tenant Updated - ${uuidv4()}`,
    products: productsMessageMock,
    defaultNetworkKey: 'testnet',
    metadata: JSON.stringify({
      field1: 'field1',
      field3: 'field3',
      field4: 'field4',
    }),
    stores: null,
  }
}

export const tenantDeleteCommandMock = (tenantId: string) => {
  return {
    ...messageMock,
    tenantId,
  }
}

export const entityCreateCommandMock = (tenantId: string) => {
  const id = uuidv4()
  return {
    ...messageMock,
    tenantId,
    entityId: { string: `k6_${id}` },
    name: `K6 Entity - ${id}`,
    metadata: {
      string: JSON.stringify({
        field1: 'field1',
        field2: 'field2',
      }),
    },
    initialAdmins: {
      array: [],
    },
    initialWallets: { array: [] },
    defaultWallet: null,
    createdBy: {
      string: 'auth0|615c596dbe37840071904478',
    },
    stores: null,
  }
}

export const entityUpdateCommandMock = (
  tenantId: string,
  entityId: string,
  defaultWallet: string,
) => {
  return {
    ...messageMock,
    tenantId: { string: tenantId },
    entityId,
    name: `K6 Entity - ${uuidv4()}`,
    metadata: JSON.stringify({
      field1: 'field1',
      field2: 'field2',
    }),
    defaultWallet,
    stores: null,
  }
}

export const entityDeleteCommandMock = (tenantId: string, entityId: string) => {
  return {
    ...messageMock,
    tenantId: { string: tenantId },
    entityId,
  }
}

export const walletCreateCommandMock = (tenantId: string, entityId: string) => {
  return {
    ...messageMock,
    tenantId: { string: tenantId },
    entityId,
    address: null,
    type: 'INTERNAL_CODEFI_HASHICORP_VAULT',
    metadata: {
      string: JSON.stringify({
        field1: uuidv4(),
      }),
    },
    setAsDefault: false,
    createdBy: {
      string: 'auth0|615c596dbe37840071904478',
    },
  }
}

export const walletUpdateCommandMock = (
  tenantId: string,
  entityId: string,
  walletAddress: string,
) => {
  return {
    ...messageMock,
    tenantId: { string: tenantId },
    entityId: { string: entityId },
    address: walletAddress,
    metadata: JSON.stringify({
      field1: 'field1',
      field2: 'field2',
    }),
    setAsDefault: false,
  }
}

export const walletDeleteCommandMock = (
  tenantId: string,
  entityId: string,
  walletAddress: string,
) => {
  return {
    ...messageMock,
    tenantId: { string: tenantId },
    entityId: { string: entityId },
    address: walletAddress,
  }
}
