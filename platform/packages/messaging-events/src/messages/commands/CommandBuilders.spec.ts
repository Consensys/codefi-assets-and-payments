import { IBuilder } from 'builder-pattern';
import { TransactionConfigBuilder } from '../TokenCommand';
import {
  DeployTokenCommandBuilder,
  IDeployTokenCommand,
} from './DeployTokenCommand';
import { IMintTokenCommand, MintTokenCommandBuilder } from './MintTokenCommand';
import {
  ITransactionConfig,
  TokenType,
} from '@codefi-assets-and-payments/ts-types';

describe('DeployTokenCommandBuilder', () => {
  it('Get builder from DeployTokenCommand', async () => {
    const builder: IBuilder<IDeployTokenCommand> =
      DeployTokenCommandBuilder.get(
        TokenType.ERC20,
        'pName',
        'pp',
        2,
        'pOperationId',
        'subject',
        'tenantId',
        'entityId',
      );
    expect(builder).toBeDefined();
  });

  it('Should build with at least mandatory params', async () => {
    const symbol = 'tokenSymbol';
    const name = 'tokenName';
    const operationId = 'operationId';
    const subject = 'subject';
    const tenantId = 'tenantId';
    const entityId = 'entityId';
    const builder: IBuilder<IDeployTokenCommand> =
      DeployTokenCommandBuilder.get(
        TokenType.ERC20,
        name,
        symbol,
        2,
        operationId,
        subject,
        tenantId,
        entityId,
      );

    const commandBuilt: IDeployTokenCommand = builder.build();
    expect(commandBuilt.type).toBe(TokenType.ERC20);
    expect(commandBuilt.name).toBe(name);
    expect(commandBuilt.operationId).toBe(operationId);
    expect(commandBuilt.subject).toBe(subject);
  });

  it('Should support to add optional params', async () => {
    const symbol = 'tokenSymbol';
    const name = 'tokenName';
    const operationId = 'operationId';
    const subject = 'subject';
    const tenantId = 'tenantId';
    const entityId = 'entityId';
    const builder: IBuilder<IDeployTokenCommand> =
      DeployTokenCommandBuilder.get(
        TokenType.ERC20,
        name,
        symbol,
        2,
        operationId,
        subject,
        tenantId,
        entityId,
      );

    // OPTIONAL
    const certificateSigner = '0x15325623462';
    const isConfidential = true;

    const commandBuilt: IDeployTokenCommand = builder
      .certificateSigner(certificateSigner)
      .confidential(isConfidential)
      .build();
    expect(commandBuilt.type).toBe(TokenType.ERC20);
    expect(commandBuilt.name).toBe(name);
    expect(commandBuilt.operationId).toBe(operationId);
    expect(commandBuilt.subject).toBe(subject);

    // include optional
    expect(commandBuilt.certificateSigner).toBe(certificateSigner);
    expect(commandBuilt.confidential).toBe(isConfidential);
  });

  it('Should built with nested builders and optional tx config', async () => {
    const symbol = 'tokenSymbol';
    const name = 'tokenName';
    const operationId = 'operationId';
    const subject = 'subject';
    const tenantId = 'tenantId';
    const entityId = 'entityId';
    const deployCommandBuilder: IBuilder<IDeployTokenCommand> =
      DeployTokenCommandBuilder.get(
        TokenType.ERC20,
        name,
        symbol,
        2,
        operationId,
        subject,
        tenantId,
        entityId,
      );

    const txFrom = '0xfrom203251251';
    const customChainName = 'customChainName';
    const txConfigBuilder: IBuilder<ITransactionConfig> =
      TransactionConfigBuilder.get(txFrom);
    txConfigBuilder.chainName(customChainName);

    const builtCommand: IDeployTokenCommand = deployCommandBuilder
      .txConfig(txConfigBuilder.build())
      .build();

    expect(builtCommand.txConfig.from).toBe(txFrom);
    expect(builtCommand.txConfig.chainName).toBe(customChainName);
  });
});

describe('MintTokenCommandBuilder', () => {
  it('Get builder from IMintTokenCommand', async () => {
    const builder: IBuilder<IMintTokenCommand> = MintTokenCommandBuilder.get(
      TokenType.ERC20,
      'operationId',
      'subject',
      'tenantId',
      'entityId',
    );
    expect(builder).toBeDefined();
  });
});

describe('TransactionConfigBuilder', () => {
  it('Get builder from ITransactionConfig', async () => {
    const builder: IBuilder<ITransactionConfig> =
      TransactionConfigBuilder.get('fromAddress');
    expect(builder).toBeDefined();
  });
});
