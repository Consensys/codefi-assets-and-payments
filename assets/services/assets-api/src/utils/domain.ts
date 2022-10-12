import config from 'src/config';
import { DEV_DOMAIN_NAME } from 'src/types/authentication';
import {
  keys as ClientApplicationKeys,
  ClientApplication,
} from 'src/types/clientApplication';
import ErrorService from 'src/utils/errorService';

const domainName = config().domainName;

export const IS_DEV_OR_DEMO_DOMAIN_NAME =
  domainName.includes('-dev') || // Ex: dev environement (assets-paris-dev.codefi.network)
  domainName.includes('-demo') || // Ex: demo environement (assets-paris-demo.codefi.network)
  domainName.includes('.dev') || // Ex: ephemeral environment (assets-assets-api-fix-fixes-and-optimizations.dev.codefi.network)
  domainName.includes('.demo'); // Not used

export const IS_DEV_DOMAIN_NAME =
  domainName.includes('-dev') ||
  domainName.includes('.dev') ||
  domainName.includes('assets-api');

export const IS_DEMO_DOMAIN_NAME =
  domainName.includes('-demo') || domainName.includes('.demo');

export const filterClientApplicationForDomainNameIfRelevant = (
  clientApplications: Array<ClientApplication>,
) => {
  try {
    if (IS_DEV_OR_DEMO_DOMAIN_NAME) {
      // There's an edge case for our dev/demo environements, which share the same Auth0 tenant.
      // We need to filter those client applications based on their subTenantId.
      return clientApplications.filter(
        (clientApplication: ClientApplication) => {
          const isDevSubTenant: boolean =
            clientApplication &&
            clientApplication[ClientApplicationKeys.METADATA] &&
            clientApplication[ClientApplicationKeys.METADATA][
              ClientApplicationKeys.METADATA__SUB_TENANT_ID
            ] === DEV_DOMAIN_NAME;

          return IS_DEV_DOMAIN_NAME ? isDevSubTenant : !isDevSubTenant;
        },
      );
    } else {
      return clientApplications;
    }
  } catch (error) {
    ErrorService.logAndThrowFunctionError(
      error,
      'filtering client application for domain name (if relevant)',
      'filterClientApplicationForDomainNameIfRelevant',
      false,
      500,
    );
  }
};

export const filterClientApplicationForProduct = (
  clientApplications: Array<ClientApplication>,
) => {
  try {
    return clientApplications.filter((clientApplication: ClientApplication) => {
      return (
        clientApplication &&
        clientApplication[ClientApplicationKeys.METADATA] &&
        clientApplication[ClientApplicationKeys.METADATA][
          ClientApplicationKeys.METADATA__ASSETS
        ] === 'true'
      );
    });
  } catch (error) {
    ErrorService.logAndThrowFunctionError(
      error,
      'filtering client application for product',
      'filterClientApplicationForProduct',
      false,
      500,
    );
  }
};

export const filterClientApplicationForCustomSubDomainName = (
  clientApplications: Array<ClientApplication>,
) => {
  try {
    // Currently, PS team uses Codefi's Auth0 tenant for their own deployment of
    // Codefi Assets. This was a requirement for the KSA region (Saudi Arabia).
    // Consequence of that, is that their client applications appear in the list
    // of Codefi Assets client application, while corresponding tenants don't
    // exist in Codefi environment.
    //
    // The purpose of this function is to filter Codefi Assets client applications
    // in order to distinguish them from PS client application, by adding an
    // optional "customSubDomainName=ksa" flag in PS client applications' metadata.
    //
    const customSubDomainName = config().customSubDomainName;
    if (customSubDomainName) {
      // In case, the "CUSTOM_SUB_DOMAIN_NAME" env variable is defined, we
      // shall keep only client applications including the same flag in
      // their metedata (e.g. PS client applications from the KSA region
      // if CUSTOM_SUB_DOMAIN_NAME='ksa').
      return clientApplications.filter(
        (clientApplication: ClientApplication) => {
          const applicationCustomSubDomain: string =
            clientApplication &&
            clientApplication[ClientApplicationKeys.METADATA] &&
            clientApplication[ClientApplicationKeys.METADATA][
              ClientApplicationKeys.METADATA__CUSTOM_DOMAIN_NAME
            ];

          return applicationCustomSubDomain === customSubDomainName;
        },
      );
    } else {
      // In case, the "CUSTOM_SUB_DOMAIN_NAME" env variable is not defined, we
      // shall keep all client applications without this flag (e.g. all
      // Codefi Assets client applications).
      return clientApplications.filter(
        (clientApplication: ClientApplication) => {
          const applicationCustomSubDomain: string =
            clientApplication &&
            clientApplication[ClientApplicationKeys.METADATA] &&
            clientApplication[ClientApplicationKeys.METADATA][
              ClientApplicationKeys.METADATA__CUSTOM_DOMAIN_NAME
            ];

          return !applicationCustomSubDomain;
        },
      );
    }
  } catch (error) {
    ErrorService.logAndThrowFunctionError(
      error,
      'filtering client application for custom sub domain name',
      'filterClientApplicationForCustomSubDomainName',
      false,
      500,
    );
  }
};
