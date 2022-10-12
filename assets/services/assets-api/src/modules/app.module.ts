import { MiddlewareConsumer, Module } from '@nestjs/common';
import {
  ExceptionInterceptor,
  TenantIdMiddleware,
  CodefiLoggerModule,
  ApmModule,
} from '@codefi-assets-and-payments/observability';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';

import { AuthGuard } from '@codefi-assets-and-payments/auth';

// V2 modules
import { V2HealthCheckModule } from './HealthCheck/healthCheck.module';
import { V2UserModule } from './v2User/user.module';
import { V2WalletModule } from './v2Wallet/wallet.module';
import { V2TransactionModule } from './v2Transaction/transaction.module';
import { V2NetworkModule } from './v2Network/network.module';
import { V2TokenModule } from './v2Token/token.module';
import { V2TokenFungibleModule } from './v2TokenFungible/token.fungible.module';
import { V2TokenNonfungibleModule } from './v2TokenNonfungible/token.nonfungible.module';
import { V2TokenHybridModule } from './v2TokenHybrid/token.hybrid.module';
import { V2DocumentModule } from './v2Document/document.module';
import { V2LegalModule } from './v2Legal/legal.module';
import { V2EmailModule } from './v2Email/email.module';
import { V2HooksModule } from './v2Hooks/hooks.module';
import { V2UtilsModule } from './v2Utils/utils.module';
import { V2KYCDataModule } from './v2KYCData/kyc.data.module';
import { V2KYCElementModule } from './v2KYCElement/kyc.element.module';
import { V2KYCTemplateModule } from './v2KYCTemplate/kyc.template.module';
import { V2KYCWorkflowIssuerRelatedModule } from './v2KYCWorkflowIssuerRelated/kyc.workflow.issuer.module';
import { V2KYCWorkflowTokenRelatedModule } from './v2KYCWorkflowTokenRelated/kyc.workflow.token.module';
import { V2WorkflowsGenericModule } from './v2WorkflowTemplate/workflows.template.module';
import { V2WorkFlowsDigitalAssetModule } from './v2WorkflowsDigitalasset/workflows.digitalasset.module';
import { V2NavModule } from './v2Nav/nav.module';
import { V2ActionModule } from './v2Action/action.module';
import { V2AssetTemplateModule } from './v2AssetTemplate/asset.template.module';
import { V2ProjectModule } from './v2Project/project.module';
import { V2KYCWorkflowProjectRelatedModule } from './v2KYCWorkflowProjectRelated/kyc.workflow.project.module';
import { V2KYCWorkflowPlatformRelatedModule } from './v2KYCWorkflowPlatformRelated/kyc.workflow.platform.module';
import { V2FeesModule } from './v2Fees/fees.module';
import { V2AumModule } from './v2Aum/aum.module';
import { V2LinkModule } from './v2Link/link.module';
import { V2CycleModule } from './v2Cycle/cycle.module';
import { V2OfferModule } from './v2Offer/offer.module';
import { V2EventModule } from './v2Event/event.module';
import { V2UsecaseModule } from './v2Usecase/usecase.module';
import { V2Auth0UserModule } from './v2Auth0User/user.module';

@Module({
  imports: [
    // Utilities
    CodefiLoggerModule.forRoot(),
    ApmModule,
    V2HealthCheckModule,

    // Essentials
    V2Auth0UserModule,
    V2UserModule,
    V2WalletModule,
    V2TransactionModule,
    V2NetworkModule,
    V2TokenModule,
    V2TokenFungibleModule,
    V2TokenNonfungibleModule,
    V2TokenHybridModule,
    V2LinkModule,
    V2ActionModule,
    V2AssetTemplateModule,
    V2FeesModule,
    V2AumModule,
    V2ProjectModule,
    V2UsecaseModule,

    // Workflows
    V2WorkflowsGenericModule,
    V2WorkFlowsDigitalAssetModule,
    V2NavModule,

    // KYC
    V2KYCDataModule,
    V2KYCElementModule,
    V2KYCTemplateModule,
    V2KYCWorkflowIssuerRelatedModule,
    V2KYCWorkflowTokenRelatedModule,
    V2KYCWorkflowProjectRelatedModule,
    V2KYCWorkflowPlatformRelatedModule,

    //Document
    V2DocumentModule,

    //Legal agreements
    V2LegalModule,

    //Email
    V2EmailModule,

    //Utils
    V2UtilsModule,

    //Hooks
    V2HooksModule,

    // Cycles
    V2CycleModule,

    // Offers
    V2OfferModule,

    //Events
    V2EventModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ExceptionInterceptor,
    },
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantIdMiddleware).forRoutes('*');
  }
}
