import { ReferenceDataOperationCommand } from './ReferenceDataOperationCommand';
import { AttestDataCommand } from './AttestDataCommand';
import { DataOracleCommand } from './DataOracleCommand';
import { PrivateChannelCommand } from './PrivateChannelCommand';
import { DataSharedCommand } from './DataSharedCommand';
import { MintConfidentialTokenCommand } from './MintConfidentialTokenCommand';
import { HoldConfidentialTokenCommand } from './HoldConfidentialTokenCommand';
import { AztecAccountCreateCommand } from './AztecAccountCreateCommand';
import { ExecuteHoldConfidentialTokenCommand } from './ExecuteHoldConfidentialTokenCommand';
import { ReleaseHoldConfidentialTokenCommand } from './ReleaseHoldConfidentialTokenCommand';
import { ConfidentialTransferConfidentialTokenCommand } from './ConfidentialTransferConfidentialTokenCommand';
import { CreateDidCommand } from './CreateDidCommand';
import { BurnConfidentialTokenCommand } from './BurnConfidentialTokenCommand';
import { MintTokenCommand } from './MintTokenCommand';
import { DeployTokenCommand } from './DeployTokenCommand';
import { TransferTokenCommand } from './TransferTokenCommand';
import { BurnTokenCommand } from './BurnTokenCommand';
import { TenantCreateCommand } from './TenantCreateCommand';
import { TenantUpdateCommand } from './TenantUpdateCommand';
import { TenantDeleteCommand } from './TenantDeleteCommand';
import { EntityCreateCommand } from './EntityCreateCommand';
import { EntityUpdateCommand } from './EntityUpdateCommand';
import { EntityDeleteCommand } from './EntityDeleteCommand';
import { WalletCreateCommand } from './WalletCreateCommand';
import { WalletUpdateCommand } from './WalletUpdateCommand';
import { WalletDeleteCommand } from './WalletDeleteCommand';
import { RegisterNetworkCommand } from './RegisterNetworkCommand';
import { RegisterTokenCommand } from './RegisterTokenCommand';
import { RegisterAccountCommand } from './RegisterAccountCommand';
import { CreateAccountCommand } from './CreateAccountCommand';
import { UserCreateCommand } from './UserCreateCommand';
import { ExecTokenCommand } from './ExecTokenCommand';
import { SetTokenURICommand } from './SetTokenURICommand';
import { ClientCreateCommand } from './ClientCreateCommand';

/**
 * Kafka messages listed here will perform some action
 */
export class Commands {
  public static referenceDataOperationCommand =
    new ReferenceDataOperationCommand();
  public static attestDataCommand = new AttestDataCommand();
  public static dataOracleCommand = new DataOracleCommand();
  public static privateChannelCommand = new PrivateChannelCommand();
  public static dataSharedCommand = new DataSharedCommand();
  public static mintConfidentialTokenCommand =
    new MintConfidentialTokenCommand();
  public static burnConfidentialTokenCommand =
    new BurnConfidentialTokenCommand();
  public static holdConfidentialTokenCommand =
    new HoldConfidentialTokenCommand();
  public static aztecAccountCreateCommand = new AztecAccountCreateCommand();
  public static executeHoldConfidentialTokenCommand =
    new ExecuteHoldConfidentialTokenCommand();
  public static releaseHoldConfidentialTokenCommand =
    new ReleaseHoldConfidentialTokenCommand();
  public static confidentialTransferConfidentialTokenCommand =
    new ConfidentialTransferConfidentialTokenCommand();
  public static createDidCommand = new CreateDidCommand();
  public static tokenMintCommand = new MintTokenCommand();
  public static tokenDeployCommand = new DeployTokenCommand();
  public static transferTokenCommand = new TransferTokenCommand();
  public static burnTokenCommand = new BurnTokenCommand();
  public static tenantCreateCommand = new TenantCreateCommand();
  public static tenantUpdateCommand = new TenantUpdateCommand();
  public static tenantDeleteCommand = new TenantDeleteCommand();
  public static entityCreateCommand = new EntityCreateCommand();
  public static entityUpdateCommand = new EntityUpdateCommand();
  public static entityDeleteCommand = new EntityDeleteCommand();
  public static walletCreateCommand = new WalletCreateCommand();
  public static walletUpdateCommand = new WalletUpdateCommand();
  public static walletDeleteCommand = new WalletDeleteCommand();
  public static registerNetworkCommand = new RegisterNetworkCommand();
  public static registerTokenCommand = new RegisterTokenCommand();
  public static registerAccountCommand = new RegisterAccountCommand();
  public static createAccountCommand = new CreateAccountCommand();
  public static userCreateCommand = new UserCreateCommand();
  public static execTokenCommand = new ExecTokenCommand();
  public static setTokenURICommand = new SetTokenURICommand();
  public static clientCreateCommand = new ClientCreateCommand();
}
