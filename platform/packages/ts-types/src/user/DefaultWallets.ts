import { WalletRole } from "./WalletRoles";

export interface DefaultWallets {
  [WalletRole.DEPLOYER]: string;
  [WalletRole.OWNER]: string;
  [WalletRole.CONTROLLER]: string;
  [WalletRole.HOLDER]: string;
  [WalletRole.PAYER]: string;
}
