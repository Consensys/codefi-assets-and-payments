import { TenantKeys, TenantType } from 'constants/tenantKeys';

export interface ITenant {
  clientId: string;
  clientSecret: string;
  name: string;
  description: string;
  appType: string;
  clientMetadata: {
    tenantId?: string;
    useClientIdAsTenantId: string;
    aliases: string;
    region: string;
    tenantType: TenantType;
    createdAt: Date;
    bypassSecondaryTradeIssuerApproval?: string;
  };
  grantTypes: Array<string>;
  jwtConfiguration: {
    lifetime_in_seconds: number;
    secret_encoded: boolean;
  };
  createdAt: Date;
  updatedAt?: Date;
}
