import { UserCreatedEvent } from './UserCreatedEvent';
import { UserUpdatedEvent } from './UserUpdatedEvent';
import { ReferenceDataOperationEvent } from './ReferenceDataOperationEvent';
import { ClientCreatedEvent } from './ClientCreatedEvent';
import { UserPersonalInfoUpdated } from './UserPersonalInfoUpdated';
import { ExternalKYCResultEvent } from './ExternalKYCResultEvent';
import { TenantCreatedEvent } from './TenantCreatedEvent';
import { PrivateDataSharedEvent } from './PrivateDataSharedEvent';
import { DataAttestedEvent } from './DataAttestedEvent';
import { AsyncOperationResultEvent } from './AsyncOperationResultEvent';
import { DigitalCurrencyNewHoldEvent } from './DigitalCurrencyNewHoldEvent';
import { DigitalCurrencyExecuteHoldEvent } from './DigitalCurrencyExecuteHoldEvent';
import { DigitalCurrencyReleaseHoldEvent } from './DigitalCurrencyReleaseHoldEvent';
import { DidCreatedEvent } from './DidCreatedEvent';
import { DigitalCurrencyMintedEvent } from './DigitalCurrencyMintedEvent';
import { TokenDeployedEvent } from './TokenDeployedEvent';
import { TokenTransferEvent } from './TokenTransferEvent';
import { TokenRegisteredEvent } from './TokenRegisteredEvent';
import { PrivateChannelCreatedEvent } from './PrivateChannelCreated';
import { TenantOperationEvent } from './TenantOperationEvent';
import { EntityOperationEvent } from './EntityOperationEvent';
import { WalletOperationEvent } from './WalletOperationEvent';
import { NetworkInitializedEvent } from './NetworkInitializedEvent';

/**
 * Kafka messages listed here will inform of an action already performed by
 * some microservice
 */
export class Events {
  public static userCreatedEvent = new UserCreatedEvent();
  public static userUpdatedEvent = new UserUpdatedEvent();
  public static tenantCreatedEvent = new TenantCreatedEvent();
  public static referenceDataOperationEvent = new ReferenceDataOperationEvent();
  public static clientCreatedEvent = new ClientCreatedEvent();
  public static userPersonalInfoUpdated = new UserPersonalInfoUpdated();
  public static externalKYCResultEvent = new ExternalKYCResultEvent();
  public static privateDataSharedEvent = new PrivateDataSharedEvent();
  public static privateChannelCreatedEvent = new PrivateChannelCreatedEvent();
  public static dataAttestedEvent = new DataAttestedEvent();
  public static asyncOperationResultEvent = new AsyncOperationResultEvent();
  public static digitalCurrencyNewHoldEvent = new DigitalCurrencyNewHoldEvent();
  public static digitalCurrencyExecuteHoldEvent =
    new DigitalCurrencyExecuteHoldEvent();
  public static digitalCurrencyReleaseHoldEvent =
    new DigitalCurrencyReleaseHoldEvent();
  public static didCreatedEvent = new DidCreatedEvent();
  public static digitalCurrencyMintedEvent = new DigitalCurrencyMintedEvent();
  public static tokenDeployedEvent = new TokenDeployedEvent();
  public static tokenTransferEvent = new TokenTransferEvent();
  public static tenantOperationEvent = new TenantOperationEvent();
  public static entityOperationEvent = new EntityOperationEvent();
  public static walletOperationEvent = new WalletOperationEvent();
  public static networkInitializedEvent = new NetworkInitializedEvent();
  public static tokenRegisteredEvent = new TokenRegisteredEvent();
}
