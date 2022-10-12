export default {
  schema: {
    name: 'storeMapping',
    type: 'record',
    fields: [
      {
        name: 'storeId',
        type: 'string',
      },
      {
        name: 'walletType',
        type: {
          type: 'enum',
          name: 'StoreMappingWalletType',
          symbols: [
            'INTERNAL_CODEFI_HASHICORP_VAULT',
            'INTERNAL_CODEFI_AZURE_VAULT',
            'INTERNAL_CODEFI_AWS_VAULT',
            'INTERNAL_CLIENT_AZURE_VAULT',
            'INTERNAL_CLIENT_AWS_VAULT',
          ],
        },
      },
    ],
  },
};
