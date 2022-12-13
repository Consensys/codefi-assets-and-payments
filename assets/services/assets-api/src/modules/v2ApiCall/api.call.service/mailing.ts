import { Injectable } from '@nestjs/common';
import { NestJSPinoLogger } from '@consensys/observability';
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

import ErrorService from 'src/utils/errorService';

import { ApiCallHelperService } from '.';
import { ApiAdminCallService } from './admin';

import {
  keys as ClientApplicationKeys,
  ClientApplication,
} from 'src/types/clientApplication';

import {
  User,
  keys as UserKeys,
  UserType,
  isE2eTestUser,
} from 'src/types/user';
import { Token, keys as TokenKeys } from 'src/types/token';
import { Action } from 'src/types/workflow/workflowInstances/action';
import {
  keys as ActionKeys,
  keys as OrderKeys,
  keys as OfferKeys,
  OrderType,
  ListingStatus,
} from 'src/types/workflow/workflowInstances';
import { Order } from 'src/types/workflow/workflowInstances/order';
import { ApiMetadataCallService } from './metadata';
import { AssetDataService } from 'src/modules/v2AssetData/asset.data.service';
import config from 'src/config';
import { retrieveTokenCurrency } from 'src/types/asset';
import { Offer } from 'src/types/workflow/workflowInstances/offer';

const API_NAME = '[Api-Mailing]';
const MAILING_HOST: string = process.env.MAILING_API_HOST;
const MAILJET_TEMPLATE_ID = config().mailing.mailTemplateId;
const MAILJET_ADMIN_TEMPLATE_ID = config().mailing.adminMailTemplateId;

const APP_URL: string = config().appUrl;

const isLocalHost = (host) => {
  if (
    host &&
    (host.includes('localhost') ||
      host.includes('assets-api') ||
      host.includes('127.0.0.1'))
  ) {
    return true;
  }

  return false;
};

const removeNil = (obj) => {
  for (const key of Object.keys(obj)) {
    if (!obj[key]) {
      if (typeof obj[key] !== 'boolean') {
        delete obj[key];
      }
    } else {
      if (typeof obj[key] === 'object') {
        removeNil(obj[key]);
      }
    }
  }
  return obj;
};
@Injectable()
export class ApiMailingCallService {
  private mailing: AxiosInstance;

  constructor(
    private readonly logger: NestJSPinoLogger,
    private readonly apiAdminCallService: ApiAdminCallService,
    private readonly apiCallHelperService: ApiCallHelperService,
    private readonly apiMetadataCallService: ApiMetadataCallService,
    private readonly assetDataService: AssetDataService,
  ) {
    this.mailing = axios.create({
      baseURL: MAILING_HOST,
    });
  }

  /**
   * [Notifies the issuer when a new asset has been created]
   */
  async craftRegistrationLink(
    tenantId: string,
    email: string,
    userType: UserType,
    firstConnectionCode: string,
  ): Promise<string> {
    try {
      const appUrl = await this.craftAppUrl(tenantId);

      const registrationLink = `${appUrl}/${userType.toLowerCase()}/auth?firstConnectionCode=${firstConnectionCode}&email=${email}`;

      this.logger.info(`Craft registration link: ${registrationLink}`);

      return registrationLink;
    } catch (error) {
      ErrorService.throwApiCallError('craftRegistrationLink', API_NAME, error);
    }
  }

  /**
   * [Craft axios request config]
   */
  async craftAxiosRequestConfig(
    authToken: string,
  ): Promise<AxiosRequestConfig> {
    const requestConfig: AxiosRequestConfig = {
      headers: {
        Authorization: 'Bearer '.concat(authToken),
      },
    };
    return requestConfig;
  }

  /**
   * [Retrieves the full name of the user for use in emails]
   */
  getUserEmailFullName(user: User): string {
    try {
      return (
        user[UserKeys.DATA]?.[UserKeys.DATA__CLIENT_NAME] ??
        `${user[UserKeys.FIRST_NAME]} ${user[UserKeys.LAST_NAME]}`
      );
    } catch (error) {
      ErrorService.throwApiCallError('getUserEmailFullName', API_NAME, error);
    }
  }

  /**
   * [Craft app url]
   */
  async craftAppUrl(tenantId: string): Promise<string> {
    try {
      const clientApplication: ClientApplication =
        await this.apiAdminCallService.retrieveDefaultClientApplicationForTenantId(
          tenantId,
        );

      let alias: string;
      if (
        clientApplication &&
        clientApplication[ClientApplicationKeys.METADATA] &&
        clientApplication[ClientApplicationKeys.METADATA][
          ClientApplicationKeys.METADATA__DEFAULT_ALIAS
        ]
      ) {
        alias =
          clientApplication[ClientApplicationKeys.METADATA][
            ClientApplicationKeys.METADATA__DEFAULT_ALIAS
          ];
      } else if (
        clientApplication &&
        clientApplication[ClientApplicationKeys.METADATA] &&
        clientApplication[ClientApplicationKeys.METADATA][
          ClientApplicationKeys.METADATA__ALIASES
        ]
      ) {
        const aliases = JSON.parse(
          clientApplication[ClientApplicationKeys.METADATA][
            ClientApplicationKeys.METADATA__ALIASES
          ],
        );
        if (aliases && aliases.length > 0) {
          alias = aliases[0];
        }
      }

      let appUrl;
      if (isLocalHost(alias)) {
        appUrl = 'http://localhost:3000';
      } else {
        appUrl = alias ? `https://${alias}` : APP_URL;
      }

      // Make sure app url doesn't end with '/' character
      if (appUrl.endsWith('/')) {
        appUrl = appUrl.slice(0, -1);
      }

      this.logger.info(`Craft app url: ${appUrl}`);

      return appUrl;
    } catch (error) {
      ErrorService.throwApiCallError('craftAppUrl', API_NAME, error);
    }
  }

  /**
   * [Notifies the issuer & investor that KYC form has been successfully submitted]
   */
  async sendKYCSubmittedNotification(
    tenantId: string,
    issuer: User,
    investor: User,
    authToken: string,
  ) {
    try {
      this.sendKYCSubmittedNotificationToIssuer(
        tenantId,
        issuer,
        investor,
        authToken,
      );
      this.sendKYCSubmittedNotificationToInvestor(
        tenantId,
        investor,
        authToken,
      );
    } catch (error) {
      ErrorService.throwApiCallError(
        'sendKYCSubmittedNotification',
        API_NAME,
        error,
      );
    }
  }

  /**
   * [Notifies the issuer that KYC form has been successfully submitted]
   */
  async sendKYCSubmittedNotificationToIssuer(
    tenantId: string,
    issuer: User,
    investor: User,
    authToken: string,
  ) {
    try {
      if (isE2eTestUser(issuer)) {
        return; // We don't want to send emails to fake users created as part of e2e tests
      }

      const appUrl = await this.craftAppUrl(tenantId);
      const URL = `${appUrl}/kyc/issuer-related/${
        investor[UserKeys.USER_ID]
      }/review/null`;

      const {
        subject,
        fromEmail,
        fromName,
        messageTitle,
        message,
        buttonLabel,
        logo,
        color,
        messageFooter,
        poweredBy,
      } = await this.apiMetadataCallService.buildMailBody({
        tenantId,
        key: 'NOTIFY_ISSUER_KYC_SUBMITTED',
        elements: {
          adminFirstName: issuer[UserKeys.FIRST_NAME],
          investorName: this.getUserEmailFullName(investor),
          issuerName: issuer[UserKeys.FIRST_NAME],
        },
      });

      const emailData = {
        toEmail: issuer[UserKeys.EMAIL],
        toName: this.getUserEmailFullName(issuer),
        fromEmail,
        fromName,
        subject,
        templateId: MAILJET_TEMPLATE_ID,
        variables: {
          logo,
          color,
          messageFooter,
          poweredBy,
          messageTitle,
          message,
          buttonLabel,
          buttonHref: URL,
        },
      };

      const requestConfig: AxiosRequestConfig =
        await this.craftAxiosRequestConfig(authToken);

      const response = await this.mailing.post(
        '/send',
        removeNil(emailData),
        requestConfig,
      );

      this.apiCallHelperService.checkRequestResponseCode(
        'error sending email',
        response,
      );
    } catch (error) {
      ErrorService.throwApiCallError(
        'sendKYCSubmittedNotificationToIssuer',
        API_NAME,
        error,
      );
    }
  }

  /**
   * [Notifies the verifier that KYC form has been successfully submitted]
   */
  async sendKYCSubmittedNotificationToAllKYCVerifier(
    tenantId: string,
    verifiers: User[],
    investor: User,
    authToken: string,
  ) {
    try {
      if (verifiers.some((verifier) => isE2eTestUser(verifier))) {
        return; // We don't want to send emails to fake users created as part of e2e tests
      }

      const appUrl = await this.craftAppUrl(tenantId);
      const URL = `${appUrl}/kyc/issuer-related/${
        investor[UserKeys.USER_ID]
      }/review/null`;

      const requestConfig: AxiosRequestConfig =
        await this.craftAxiosRequestConfig(authToken);

      const mailBodies = await Promise.all(
        verifiers.map((verifier) => {
          return this.apiMetadataCallService.buildMailBody({
            tenantId,
            key: 'NOTIFY_VERIFIER_KYC_SUBMITTED',
            elements: {
              verifierFirstName: verifier[UserKeys.FIRST_NAME],
              investorName: this.getUserEmailFullName(investor),
              issuerName: verifier[UserKeys.FIRST_NAME],
            },
          });
        }),
      );

      const mailRequests = mailBodies.map((data, index) => {
        const {
          subject,
          fromEmail,
          fromName,
          messageTitle,
          message,
          buttonLabel,
          logo,
          color,
          messageFooter,
          poweredBy,
        } = data;
        const emailData = {
          toEmail: verifiers[index][UserKeys.EMAIL],
          toName: this.getUserEmailFullName(verifiers[index]),
          fromEmail,
          fromName,
          subject,
          templateId: MAILJET_TEMPLATE_ID,
          variables: {
            logo,
            color,
            messageFooter,
            poweredBy,
            messageTitle,
            message,
            buttonLabel,
            buttonHref: URL,
          },
        };
        return this.mailing.post('/send', removeNil(emailData), requestConfig);
      });

      await Promise.all(mailRequests);
    } catch (error) {
      ErrorService.throwApiCallError(
        'sendKYCSubmittedNotificationToIssuer',
        API_NAME,
        error,
      );
    }
  }

  /**
   * [Notifies the investor that KYC form has been successfully submitted]
   */
  async sendKYCSubmittedNotificationToInvestor(
    tenantId: string,
    investor: User,
    authToken: string,
  ) {
    try {
      if (isE2eTestUser(investor)) {
        return; // We don't want to send emails to fake users created as part of e2e tests
      }

      const investorName = this.getUserEmailFullName(investor);

      const {
        subject,
        fromEmail,
        fromName,
        messageTitle,
        message,
        buttonLabel,
        logo,
        color,
        messageFooter,
        poweredBy,
      } = await this.apiMetadataCallService.buildMailBody({
        tenantId,
        key: 'NOTIFY_INVESTOR_KYC_SUBMITTED',
        elements: {
          investorName,
        },
      });

      const emailData = {
        toEmail: investor[UserKeys.EMAIL],
        toName: investorName,
        fromEmail,
        fromName,
        subject,
        templateId: MAILJET_TEMPLATE_ID,
        variables: {
          logo,
          color,
          messageFooter,
          poweredBy,
          messageTitle,
          message,
          buttonLabel,
        },
      };

      const requestConfig: AxiosRequestConfig =
        await this.craftAxiosRequestConfig(authToken);

      const response = await this.mailing.post(
        '/send',
        removeNil(emailData),
        requestConfig,
      );

      this.apiCallHelperService.checkRequestResponseCode(
        'error sending email',
        response,
      );
    } catch (error) {
      ErrorService.throwApiCallError(
        'sendKYCSubmittedNotificationToInvestor',
        API_NAME,
        error,
      );
    }
  }

  /**
   * [Notifies the investor his KYC form has been validated by the issuer]
   */
  async sendInvestorKYCValidated(
    tenantId: string,
    investor: User,
    authToken: string,
  ) {
    try {
      if (isE2eTestUser(investor)) {
        return; // We don't want to send emails to fake users created as part of e2e tests
      }

      const appUrl = await this.craftAppUrl(tenantId);
      const investmentProductsURL = `${appUrl}/investment-products`;
      const investorName = this.getUserEmailFullName(investor);

      const {
        subject,
        fromEmail,
        fromName,
        messageTitle,
        message,
        buttonLabel,
        logo,
        color,
        messageFooter,
        poweredBy,
      } = await this.apiMetadataCallService.buildMailBody({
        tenantId,
        key: 'NOTIFY_INVESTOR_KYC_VALIDATED',
        elements: {
          investorName,
        },
      });

      const emailData = {
        toEmail: investor[UserKeys.EMAIL],
        toName: investorName,
        fromEmail,
        fromName,
        subject,
        templateId: MAILJET_TEMPLATE_ID,
        variables: {
          logo,
          color,
          messageFooter,
          poweredBy,
          messageTitle,
          message,
          buttonLabel,
          buttonHref: investmentProductsURL,
        },
      };

      const requestConfig: AxiosRequestConfig =
        await this.craftAxiosRequestConfig(authToken);

      const response = await this.mailing.post(
        '/send',
        removeNil(emailData),
        requestConfig,
      );

      this.apiCallHelperService.checkRequestResponseCode(
        'error sending email',
        response,
      );
    } catch (error) {
      ErrorService.throwApiCallError(
        'sendInvestorKYCValidated',
        API_NAME,
        error,
      );
    }
  }

  /**
   * [Notifies the investor he needs to review information on his KYC form]
   */
  async sendInvestorKYCReviewInformation(
    tenantId: string,
    issuer: User,
    investor: User,
    authToken: string,
  ) {
    try {
      if (isE2eTestUser(investor)) {
        return; // We don't want to send emails to fake users created as part of e2e tests
      }

      const appUrl = await this.craftAppUrl(tenantId);
      const reviewInfoURL = `${appUrl}/kyc/issuer-related/${
        issuer[UserKeys.USER_ID]
      }/submit`;
      const investorName = this.getUserEmailFullName(investor);

      const {
        subject,
        fromEmail,
        fromName,
        messageTitle,
        message,
        buttonLabel,
        logo,
        color,
        messageFooter,
        poweredBy,
      } = await this.apiMetadataCallService.buildMailBody({
        tenantId,
        key: 'NOTIFY_INVESTOR_KYC_NEEDS_UPDATE',
        elements: {
          investorName,
        },
      });

      const emailData = {
        toEmail: investor[UserKeys.EMAIL],
        toName: investorName,
        fromEmail,
        fromName,
        subject,
        templateId: MAILJET_TEMPLATE_ID,
        variables: {
          logo,
          color,
          messageFooter,
          poweredBy,
          messageTitle,
          message,
          buttonLabel,
          buttonHref: reviewInfoURL,
        },
      };

      const requestConfig: AxiosRequestConfig =
        await this.craftAxiosRequestConfig(authToken);

      const response = await this.mailing.post(
        '/send',
        removeNil(emailData),
        requestConfig,
      );

      this.apiCallHelperService.checkRequestResponseCode(
        'error sending email',
        response,
      );
    } catch (error) {
      ErrorService.throwApiCallError(
        'sendInvestorKYCReviewInformation',
        API_NAME,
        error,
      );
    }
  }

  /**
   * [Notifies the investor his KYC form has been rejected by the issuer]
   */
  async sendInvestorKYCRejected(
    tenantId: string,
    issuer: User,
    investor: User,
    authToken: string,
  ) {
    try {
      if (isE2eTestUser(investor)) {
        return; // We don't want to send emails to fake users created as part of e2e tests
      }

      const appUrl = await this.craftAppUrl(tenantId);
      const reviewInfoURL = `${appUrl}/kyc/issuer-related/${
        issuer[UserKeys.USER_ID]
      }/submit`;
      const investorName = this.getUserEmailFullName(investor);

      const {
        subject,
        fromEmail,
        fromName,
        messageTitle,
        message,
        buttonLabel,
        logo,
        color,
        messageFooter,
        poweredBy,
      } = await this.apiMetadataCallService.buildMailBody({
        tenantId,
        key: 'NOTIFY_INVESTOR_KYC_REJECTED',
        elements: {
          investorName,
        },
      });

      const emailData = {
        toEmail: investor[UserKeys.EMAIL],
        toName: investorName,
        fromEmail,
        fromName,
        subject,
        templateId: MAILJET_TEMPLATE_ID,
        variables: {
          logo,
          color,
          messageFooter,
          poweredBy,
          messageTitle,
          message,
          buttonLabel,
          buttonHref: reviewInfoURL,
        },
      };

      const requestConfig: AxiosRequestConfig =
        await this.craftAxiosRequestConfig(authToken);

      const response = await this.mailing.post(
        '/send',
        removeNil(emailData),
        requestConfig,
      );

      this.apiCallHelperService.checkRequestResponseCode(
        'error sending email',
        response,
      );
    } catch (error) {
      ErrorService.throwApiCallError(
        'sendInvestorKYCRejected',
        API_NAME,
        error,
      );
    }
  }

  /**
   * [Sends email to investor/broker/underwriter/agent/notary containing registration link to join the platform the first time]
   */
  async sendPlatformInviteInvestorMail(
    tenantId: string,
    issuer: User,
    investor: User,
    authToken: string,
  ) {
    try {
      if (isE2eTestUser(investor)) {
        return; // We don't want to send emails to fake users created as part of e2e tests
      }

      const registrationLink = await this.craftRegistrationLink(
        tenantId,
        investor[UserKeys.EMAIL],
        investor[UserKeys.USER_TYPE],
        investor[UserKeys.FIRST_CONNECTION_CODE],
      );
      const investorName = this.getUserEmailFullName(investor);
      const issuerName = this.getUserEmailFullName(issuer);
      const inviteeType = investor[UserKeys.USER_TYPE].toLowerCase();

      const {
        subject,
        fromEmail,
        fromName,
        messageTitle,
        message,
        buttonLabel,
        logo,
        color,
        messageFooter,
        poweredBy,
      } = await this.apiMetadataCallService.buildMailBody({
        tenantId,
        key: 'NOTIFY_INVESTOR_INVITED',
        elements: {
          issuerName,
          investorName,
          userType: inviteeType,
        },
      });

      const emailData = {
        toEmail: investor[UserKeys.EMAIL],
        toName: investorName,
        fromEmail,
        fromName,
        subject,
        templateId: MAILJET_TEMPLATE_ID,
        variables: {
          logo,
          color,
          messageFooter,
          poweredBy,
          messageTitle,
          message,
          buttonLabel,
          buttonHref: registrationLink,
        },
      };

      const requestConfig: AxiosRequestConfig =
        await this.craftAxiosRequestConfig(authToken);

      const response = await this.mailing.post(
        '/send',
        removeNil(emailData),
        requestConfig,
      );

      this.apiCallHelperService.checkRequestResponseCode(
        'error sending email',
        response,
      );
    } catch (error) {
      ErrorService.throwApiCallError(
        'sendPlatformInviteInvestorMail',
        API_NAME,
        error,
      );
    }
  }

  /**
   * [Sends email to issuer containing asset information review link]
   */
  async sendAssetReviewMail(
    tenantId: string,
    tokenId: string,
    issuer: User,
    investor: User,
    importedFromMsg: string,
    approveForMsg: string,
    authToken: string,
  ) {
    try {
      if (isE2eTestUser(issuer)) {
        return; // We don't want to send emails to fake users created as part of e2e tests
      }

      const appUrl = await this.craftAppUrl(tenantId);
      const reviewUrl = `${appUrl}/project/review/${tokenId}`;

      const name = investor
        ? this.getUserEmailFullName(investor)
        : '[Producer]';
      const issuerFirstName = issuer[UserKeys.FIRST_NAME];
      const toEmail = issuer[UserKeys.EMAIL];
      const toName = this.getUserEmailFullName(issuer);

      const {
        subject,
        fromEmail,
        fromName,
        messageTitle,
        message,
        buttonLabel,
        logo,
        color,
        messageFooter,
        poweredBy,
      } = await this.apiMetadataCallService.buildMailBody({
        tenantId,
        key: 'NOTIFY_ISSUER_ASSET_REVIEW',
        elements: {
          name,
          issuerFirstName,
          importedFromMsg,
          approveForMsg,
        },
      });

      const emailData = {
        toEmail,
        toName,
        fromEmail,
        fromName,
        subject,
        templateId: MAILJET_TEMPLATE_ID,
        variables: {
          logo,
          color,
          messageFooter,
          poweredBy,
          messageTitle,
          message,
          buttonLabel,
          buttonHref: reviewUrl,
        },
      };

      const requestConfig: AxiosRequestConfig =
        await this.craftAxiosRequestConfig(authToken);

      const response = await this.mailing.post(
        '/send',
        removeNil(emailData),
        requestConfig,
      );

      this.apiCallHelperService.checkRequestResponseCode(
        'error sending email',
        response,
      );
    } catch (error) {
      ErrorService.throwApiCallError(
        'sendIssuerAssetReviewMail',
        API_NAME,
        error,
      );
    }
  }

  /**
   * [Sends email to investor (Producer) notifying asset was reviewed and approved]
   */
  async sendInvestorAssetReviewApprovedMail(
    tenantId: string,
    tokenId: string,
    investor: User,
    authToken: string,
  ) {
    try {
      if (isE2eTestUser(investor)) {
        return; // We don't want to send emails to fake users created as part of e2e tests
      }

      const appUrl = await this.craftAppUrl(tenantId);
      const projectUrl = `${appUrl}/project/${tokenId}/details`;
      const investorName = this.getUserEmailFullName(investor);

      const {
        subject,
        fromEmail,
        fromName,
        messageTitle,
        message,
        buttonLabel,
        logo,
        color,
        messageFooter,
        poweredBy,
      } = await this.apiMetadataCallService.buildMailBody({
        tenantId,
        key: 'NOTIFY_INVESTOR_ASSET_APPROVED',
        elements: {
          investorName,
        },
      });

      const emailData = {
        toEmail: investor[UserKeys.EMAIL],
        toName: investorName,
        fromEmail,
        fromName,
        subject,
        templateId: MAILJET_TEMPLATE_ID,
        variables: {
          logo,
          color,
          messageFooter,
          poweredBy,
          messageTitle,
          message,
          buttonLabel,
          buttonHref: projectUrl,
        },
      };

      const requestConfig: AxiosRequestConfig =
        await this.craftAxiosRequestConfig(authToken);

      const response = await this.mailing.post(
        '/send',
        removeNil(emailData),
        requestConfig,
      );

      this.apiCallHelperService.checkRequestResponseCode(
        'error sending email',
        response,
      );
    } catch (error) {
      ErrorService.throwApiCallError(
        'sendInvestorAssetReviewApprovedMail',
        API_NAME,
        error,
      );
    }
  }

  /**
   * [Sends email to investor (Producer) notifying the imported asset was reviewed and approved]
   */
  async sendInvestorImportedAssetReviewApprovedMail(
    tenantId: string,
    investor: User,
    quantity: number,
    token: Token,
    tokenAssetClass: string,
    authToken: string,
  ) {
    try {
      if (isE2eTestUser(investor)) {
        return; // We don't want to send emails to fake users created as part of e2e tests
      }

      const tokenId = token[TokenKeys.TOKEN_ID];
      const assetName = token[TokenKeys.NAME];
      const appUrl = await this.craftAppUrl(tenantId);
      const projectUrl = `${appUrl}/project/details/${tokenId}`;
      const tokenUnit = this.assetDataService.retrieveTokenUnit(
        token,
        tokenAssetClass,
      );
      const investorName = this.getUserEmailFullName(investor);
      const quantityStr = `${quantity.toLocaleString('en')} ${tokenUnit}(s)`;

      const {
        subject,
        fromEmail,
        fromName,
        messageTitle,
        message,
        buttonLabel,
        logo,
        color,
        messageFooter,
        poweredBy,
      } = await this.apiMetadataCallService.buildMailBody({
        tenantId,
        key: 'NOTIFY_INVESTOR_IMPORTED_ASSET_APPROVED',
        elements: {
          investorName,
          assetName,
          quantity: quantityStr,
        },
      });

      const emailData = {
        toEmail: investor[UserKeys.EMAIL],
        toName: investorName,
        fromEmail,
        fromName,
        subject,
        templateId: MAILJET_TEMPLATE_ID,
        variables: {
          logo,
          color,
          messageFooter,
          poweredBy,
          messageTitle,
          message,
          buttonLabel,
          buttonHref: projectUrl,
        },
      };

      const requestConfig: AxiosRequestConfig =
        await this.craftAxiosRequestConfig(authToken);

      const response = await this.mailing.post(
        '/send',
        removeNil(emailData),
        requestConfig,
      );

      this.apiCallHelperService.checkRequestResponseCode(
        'error sending email',
        response,
      );
    } catch (error) {
      ErrorService.throwApiCallError(
        'sendInvestorImportedAssetReviewApprovedMail',
        API_NAME,
        error,
      );
    }
  }

  /**
   * [Sends email to investor (Producer) notifying asset review was rejected]
   */
  async sendInvestorAssetReviewRejectedMail(
    tenantId: string,
    tokenId: string,
    investor: User,
    rejectedReasons: string,
    authToken: string,
  ) {
    try {
      if (isE2eTestUser(investor)) {
        return; // We don't want to send emails to fake users created as part of e2e tests
      }

      const appUrl = await this.craftAppUrl(tenantId);
      const projectUrl = `${appUrl}/project/details/${tokenId}`;
      const investorName = this.getUserEmailFullName(investor);

      const {
        subject,
        fromEmail,
        fromName,
        messageTitle,
        message,
        buttonLabel,
        logo,
        color,
        messageFooter,
        poweredBy,
      } = await this.apiMetadataCallService.buildMailBody({
        tenantId,
        key: 'NOTIFY_INVESTOR_ASSET_REJECTED',
        elements: {
          investorName,
          rejectedReasons,
        },
      });

      const emailData = {
        toEmail: investor[UserKeys.EMAIL],
        toName: investorName,
        fromEmail,
        fromName,
        subject,
        templateId: MAILJET_TEMPLATE_ID,
        variables: {
          logo,
          color,
          messageFooter,
          poweredBy,
          messageTitle,
          message,
          buttonLabel,
          buttonHref: projectUrl,
        },
      };

      const requestConfig: AxiosRequestConfig =
        await this.craftAxiosRequestConfig(authToken);

      const response = await this.mailing.post(
        '/send',
        removeNil(emailData),
        requestConfig,
      );

      this.apiCallHelperService.checkRequestResponseCode(
        'error sending email',
        response,
      );
    } catch (error) {
      ErrorService.throwApiCallError(
        'sendInvestorAssetReviewRejectedMail',
        API_NAME,
        error,
      );
    }
  }

  /**
   * [Sends email to investor (Producer) notifying some tokens were retired]
   */
  async sendInvestorAssetTokenRetiredMail(
    tenantId: string,
    producer: User,
    issuer: User,
    buyer: User,
    quantity: number,
    token: Token,
    tokenAssetClass: string,
    remarks: string,
    authToken: string,
  ) {
    try {
      if (isE2eTestUser(producer)) {
        return; // We don't want to send emails to fake users created as part of e2e tests
      }

      const appUrl = await this.craftAppUrl(tenantId);
      const projectUrl = `${appUrl}/portfolio`;
      const tokenUnit = this.assetDataService.retrieveTokenUnit(
        token,
        tokenAssetClass,
      );
      const producerName = this.getUserEmailFullName(producer);
      const issuerName = this.getUserEmailFullName(issuer);
      const buyerName = this.getUserEmailFullName(buyer);
      const assetName = token[TokenKeys.NAME];
      const quantityStr = `${quantity.toLocaleString('en')} ${tokenUnit}(s)`;

      const {
        subject,
        fromEmail,
        fromName,
        messageTitle,
        message,
        buttonLabel,
        logo,
        color,
        messageFooter,
        poweredBy,
      } = await this.apiMetadataCallService.buildMailBody({
        tenantId,
        key: 'NOTIFY_INVESTOR_ASSET_TOKEN_RETIRED',
        elements: {
          producerName,
          issuerName,
          buyerName,
          quantity: quantityStr,
          assetName,
          remarks: remarks ?? 'N/A', // This cannot be an empty string, metadata-api will throw error
        },
      });

      const emailData = {
        toEmail: producer[UserKeys.EMAIL],
        toName: producerName,
        fromEmail,
        fromName,
        subject,
        templateId: MAILJET_TEMPLATE_ID,
        variables: {
          logo,
          color,
          messageFooter,
          poweredBy,
          messageTitle,
          message,
          buttonLabel,
          buttonHref: projectUrl,
        },
      };

      const requestConfig: AxiosRequestConfig =
        await this.craftAxiosRequestConfig(authToken);

      const response = await this.mailing.post(
        '/send',
        removeNil(emailData),
        requestConfig,
      );

      this.apiCallHelperService.checkRequestResponseCode(
        'error sending email',
        response,
      );
    } catch (error) {
      ErrorService.throwApiCallError(
        'sendInvestorAssetTokenRetiredMail',
        API_NAME,
        error,
      );
    }
  }

  /**
   * [Sends email to issuer for new orders]
   */
  async sendIssuerOrderCreatedNotification(
    tenantId: string,
    issuer: User,
    investor: User,
    token: Token,
    order: Action,
    authToken: string,
  ) {
    try {
      if (isE2eTestUser(issuer)) {
        return; // We don't want to send emails to fake users created as part of e2e tests
      }

      const appUrl = await this.craftAppUrl(tenantId);
      const orderUrl = `${appUrl}/order/${order[ActionKeys.ID]}`;
      const investorName = this.getUserEmailFullName(investor);
      const issuerName = this.getUserEmailFullName(issuer);

      const {
        subject,
        fromEmail,
        fromName,
        messageTitle,
        message,
        buttonLabel,
        logo,
        color,
        messageFooter,
        poweredBy,
      } = await this.apiMetadataCallService.buildMailBody({
        tenantId,
        key: 'NOTIFY_ISSUER_ORDER_PLACED',
        elements: {
          issuerName,
          investorName,
          quantity: String(order[ActionKeys.QUANTITY]),
          assetName: token[TokenKeys.NAME],
        },
      });

      const emailData = {
        toEmail: issuer[UserKeys.EMAIL],
        toName: issuerName,
        fromEmail,
        fromName,
        subject,
        templateId: MAILJET_TEMPLATE_ID,
        variables: {
          logo,
          color,
          messageFooter,
          poweredBy,
          messageTitle,
          message,
          buttonLabel,
          buttonHref: orderUrl,
        },
      };

      const requestConfig: AxiosRequestConfig =
        await this.craftAxiosRequestConfig(authToken);

      const response = await this.mailing.post(
        '/send',
        removeNil(emailData),
        requestConfig,
      );

      this.apiCallHelperService.checkRequestResponseCode(
        'error sending email',
        response,
      );
    } catch (error) {
      ErrorService.throwApiCallError(
        'sendIssuerOrderCreatedNotification',
        API_NAME,
        error,
      );
    }
  }

  /**
   * [Sends email to investor when issuer confirm receipt of order payment]
   */
  async sendInvestorOrderPaymentConfirmedNotification(
    tenantId: string,
    issuer: User,
    investor: User,
    token: Token,
    order: Action,
    orderFee: number,
    authToken: string,
  ) {
    try {
      if (isE2eTestUser(investor)) {
        return; // We don't want to send emails to fake users created as part of e2e tests
      }

      const appUrl = await this.craftAppUrl(tenantId);
      const orderUrl = `${appUrl}/order/${order[ActionKeys.ID]}`;
      const feesInToken = Math.max(
        (orderFee * order[ActionKeys.QUANTITY]) / 100,
        1,
      );
      const investorName = this.getUserEmailFullName(investor);
      const issuerName = this.getUserEmailFullName(issuer);

      const {
        subject,
        fromEmail,
        fromName,
        messageTitle,
        message,
        buttonLabel,
        logo,
        color,
        messageFooter,
        poweredBy,
      } = await this.apiMetadataCallService.buildMailBody({
        tenantId,
        key: 'NOTIFY_INVESTOR_ORDER_PAYMENT_CONFIRMED',
        elements: {
          issuerName,
          investorName,
          quantity: String(order[ActionKeys.QUANTITY]),
          assetName: token[TokenKeys.NAME],
          orderFee: String(feesInToken),
        },
      });

      const emailData = {
        toEmail: investor[UserKeys.EMAIL],
        toName: investorName,
        fromEmail,
        fromName,
        subject,
        templateId: MAILJET_TEMPLATE_ID,
        variables: {
          logo,
          color,
          messageFooter,
          poweredBy,
          messageTitle,
          message,
          buttonLabel,
          buttonHref: orderUrl,
        },
      };

      const requestConfig: AxiosRequestConfig =
        await this.craftAxiosRequestConfig(authToken);

      const response = await this.mailing.post(
        '/send',
        removeNil(emailData),
        requestConfig,
      );

      this.apiCallHelperService.checkRequestResponseCode(
        'error sending email',
        response,
      );
    } catch (error) {
      ErrorService.throwApiCallError(
        'sendInvestorOrderPaymentConfirmedNotification',
        API_NAME,
        error,
      );
    }
  }

  /**
   * [Sends email to investor when issuer issues order tokens/shares]
   */
  async sendInvestorOrderTokensIssuedNotification(
    tenantId: string,
    issuer: User,
    investor: User,
    token: Token,
    quantity: string,
    authToken: string,
  ) {
    try {
      if (isE2eTestUser(investor)) {
        return; // We don't want to send emails to fake users created as part of e2e tests
      }

      const appUrl = await this.craftAppUrl(tenantId);
      const portfolioUrl = `${appUrl}/portfolio`;
      const investorName = this.getUserEmailFullName(investor);
      const issuerName = this.getUserEmailFullName(issuer);

      const {
        subject,
        fromEmail,
        fromName,
        messageTitle,
        message,
        buttonLabel,
        logo,
        color,
        messageFooter,
        poweredBy,
      } = await this.apiMetadataCallService.buildMailBody({
        tenantId,
        key: 'NOTIFY_INVESTOR_ORDER_TOKENS_ISSUED',
        elements: {
          issuerName,
          investorName,
          quantity,
          assetName: token[TokenKeys.NAME],
        },
      });

      const emailData = {
        toEmail: investor[UserKeys.EMAIL],
        toName: investorName,
        fromEmail,
        fromName,
        subject,
        templateId: MAILJET_TEMPLATE_ID,
        variables: {
          logo,
          color,
          messageFooter,
          poweredBy,
          messageTitle,
          message,
          buttonLabel,
          buttonHref: portfolioUrl,
        },
      };

      const requestConfig: AxiosRequestConfig =
        await this.craftAxiosRequestConfig(authToken);

      const response = await this.mailing.post(
        '/send',
        removeNil(emailData),
        requestConfig,
      );

      this.apiCallHelperService.checkRequestResponseCode(
        'error sending email',
        response,
      );
    } catch (error) {
      ErrorService.throwApiCallError(
        'sendInvestorOrderTokensIssuedNotification',
        API_NAME,
        error,
      );
    }
  }

  /**
   * [Sends email to investor when issuer cancels order]
   */
  async sendInvestorOrderCanceledNotification(
    tenantId: string,
    issuer: User,
    investor: User,
    token: Token,
    order: Action,
    authToken: string,
  ) {
    try {
      if (isE2eTestUser(investor)) {
        return; // We don't want to send emails to fake users created as part of e2e tests
      }

      const appUrl = await this.craftAppUrl(tenantId);
      const orderUrl = `${appUrl}/order/${order[ActionKeys.ID]}`;
      const investorName = this.getUserEmailFullName(investor);
      const issuerName = this.getUserEmailFullName(issuer);

      const {
        subject,
        fromEmail,
        fromName,
        messageTitle,
        message,
        buttonLabel,
        logo,
        color,
        messageFooter,
        poweredBy,
      } = await this.apiMetadataCallService.buildMailBody({
        tenantId,
        key: 'NOTIFY_INVESTOR_ORDER_CANCELED',
        elements: {
          issuerName,
          investorName,
          quantity: String(order[ActionKeys.QUANTITY]),
          assetName: token[TokenKeys.NAME],
        },
      });

      const emailData = {
        toEmail: investor[UserKeys.EMAIL],
        toName: investorName,
        fromEmail,
        fromName,
        subject,
        templateId: MAILJET_TEMPLATE_ID,
        variables: {
          logo,
          color,
          messageFooter,
          poweredBy,
          messageTitle,
          message,
          buttonLabel,
          buttonHref: orderUrl,
        },
      };

      const requestConfig: AxiosRequestConfig =
        await this.craftAxiosRequestConfig(authToken);

      const response = await this.mailing.post(
        '/send',
        removeNil(emailData),
        requestConfig,
      );

      this.apiCallHelperService.checkRequestResponseCode(
        'error sending email',
        response,
      );
    } catch (error) {
      ErrorService.throwApiCallError(
        'sendInvestorOrderCanceledNotification',
        API_NAME,
        error,
      );
    }
  }

  /**
   * [Sends email to issuer when investor cancels order]
   */
  async sendIssuerOrderCanceledNotification(
    tenantId: string,
    issuer: User,
    investor: User,
    token: Token,
    order: Action,
    authToken: string,
  ) {
    try {
      if (isE2eTestUser(issuer)) {
        return; // We don't want to send emails to fake users created as part of e2e tests
      }

      const appUrl = await this.craftAppUrl(tenantId);
      const orderUrl = `${appUrl}/order/${order[ActionKeys.ID]}`;
      const investorName = this.getUserEmailFullName(investor);
      const issuerName = this.getUserEmailFullName(issuer);

      const {
        subject,
        fromEmail,
        fromName,
        messageTitle,
        message,
        buttonLabel,
        logo,
        color,
        messageFooter,
        poweredBy,
      } = await this.apiMetadataCallService.buildMailBody({
        tenantId,
        key: 'NOTIFY_ISSUER_ORDER_CANCELED',
        elements: {
          issuerName,
          investorName,
          quantity: String(order[ActionKeys.QUANTITY]),
          assetName: token[TokenKeys.NAME],
        },
      });

      const emailData = {
        toEmail: issuer[UserKeys.EMAIL],
        toName: issuerName,
        fromEmail,
        fromName,
        subject,
        templateId: MAILJET_TEMPLATE_ID,
        variables: {
          logo,
          color,
          messageFooter,
          poweredBy,
          messageTitle,
          message,
          buttonLabel,
          buttonHref: orderUrl,
        },
      };

      const requestConfig: AxiosRequestConfig =
        await this.craftAxiosRequestConfig(authToken);

      const response = await this.mailing.post(
        '/send',
        removeNil(emailData),
        requestConfig,
      );

      this.apiCallHelperService.checkRequestResponseCode(
        'error sending email',
        response,
      );
    } catch (error) {
      ErrorService.throwApiCallError(
        'sendIssuerOrderCanceledNotification',
        API_NAME,
        error,
      );
    }
  }

  /**
   * [Sends email to investor when invited to an asset]
   */
  async sendInvestorAssetInviteNotification(
    tenantId: string,
    investor: User,
    token: Token,
    authToken: string,
  ) {
    try {
      if (isE2eTestUser(investor)) {
        return; // We don't want to send emails to fake users created as part of e2e tests
      }

      const appUrl = await this.craftAppUrl(tenantId);
      const assetUrl = `${appUrl}/investment-products/${
        token[TokenKeys.TOKEN_ID]
      }`;
      const investorName = this.getUserEmailFullName(investor);

      const {
        subject,
        fromEmail,
        fromName,
        messageTitle,
        message,
        buttonLabel,
        logo,
        color,
        messageFooter,
        poweredBy,
      } = await this.apiMetadataCallService.buildMailBody({
        tenantId,
        key: 'NOTIFY_INVESTOR_ASSET_INVITED',
        elements: {
          investorName,
        },
      });

      const emailData = {
        toEmail: investor[UserKeys.EMAIL],
        toName: investorName,
        fromEmail,
        fromName,
        subject,
        templateId: MAILJET_TEMPLATE_ID,
        variables: {
          logo,
          color,
          messageFooter,
          poweredBy,
          messageTitle,
          message,
          buttonLabel,
          buttonHref: assetUrl,
        },
      };

      const requestConfig: AxiosRequestConfig =
        await this.craftAxiosRequestConfig(authToken);

      const response = await this.mailing.post(
        '/send',
        removeNil(emailData),
        requestConfig,
      );

      this.apiCallHelperService.checkRequestResponseCode(
        'error sending email',
        response,
      );
    } catch (error) {
      ErrorService.throwApiCallError(
        'sendInvestorAssetInviteNotification',
        API_NAME,
        error,
      );
    }
  }

  /**
   * [Sends email to issuer containing registration link to join the platform the first time]
   */
  async sendRecipientForceTransferNotification(
    tenantId: string,
    issuer: User,
    recipient: User,
    sender: User,
    token: Token,
    quantity: string,
    authToken: string,
  ) {
    try {
      if (isE2eTestUser(recipient)) {
        return; // We don't want to send emails to fake users created as part of e2e tests
      }

      const appUrl = await this.craftAppUrl(tenantId);
      const portfolioUrl = `${appUrl}/portfolio`;
      const recipientName = this.getUserEmailFullName(recipient);
      const issuerName = this.getUserEmailFullName(issuer);
      const senderName = this.getUserEmailFullName(sender);

      const {
        subject,
        fromEmail,
        fromName,
        messageTitle,
        message,
        buttonLabel,
        logo,
        color,
        messageFooter,
        poweredBy,
      } = await this.apiMetadataCallService.buildMailBody({
        tenantId,
        key: 'NOTIFY_RECEPIENT_FORCE_TRANSFER',
        elements: {
          issuerName,
          recipientName,
          senderName,
          quantity,
          assetName: token[TokenKeys.NAME],
        },
      });

      const emailData = {
        toEmail: recipient[UserKeys.EMAIL],
        toName: recipientName,
        fromEmail,
        fromName,
        subject,
        templateId: MAILJET_TEMPLATE_ID,
        variables: {
          logo,
          color,
          messageFooter,
          poweredBy,
          messageTitle,
          message,
          buttonLabel,
          buttonHref: portfolioUrl,
        },
      };

      const requestConfig: AxiosRequestConfig =
        await this.craftAxiosRequestConfig(authToken);

      const response = await this.mailing.post(
        '/send',
        removeNil(emailData),
        requestConfig,
      );

      this.apiCallHelperService.checkRequestResponseCode(
        'error sending email',
        response,
      );
    } catch (error) {
      ErrorService.throwApiCallError(
        'sendRecipientForceTransferNotification',
        API_NAME,
        error,
      );
    }
  }

  /**
   * [Sends email to issuer containing registration link to join the platform the first time]
   */
  async sendSenderForceTransferNotification(
    tenantId: string,
    issuer: User,
    sender: User,
    recipient: User,
    token: Token,
    quantity: any,
    authToken: string,
  ) {
    try {
      if (isE2eTestUser(sender)) {
        return; // We don't want to send emails to fake users created as part of e2e tests
      }

      const appUrl = await this.craftAppUrl(tenantId);
      const portfolioUrl = `${appUrl}/portfolio`;
      const recipientName = this.getUserEmailFullName(recipient);
      const issuerName = this.getUserEmailFullName(issuer);
      const senderName = this.getUserEmailFullName(sender);

      const {
        subject,
        fromEmail,
        fromName,
        messageTitle,
        message,
        buttonLabel,
        logo,
        color,
        messageFooter,
        poweredBy,
      } = await this.apiMetadataCallService.buildMailBody({
        tenantId,
        key: 'NOTIFY_SENDER_FORCE_TRANSFER',
        elements: {
          issuerName,
          recipientName,
          senderName,
          quantity,
          assetName: token[TokenKeys.NAME],
        },
      });

      const emailData = {
        toEmail: sender[UserKeys.EMAIL],
        toName: senderName,
        fromEmail,
        fromName,
        subject,
        templateId: MAILJET_TEMPLATE_ID,
        variables: {
          logo,
          color,
          messageFooter,
          poweredBy,
          messageTitle,
          message,
          buttonLabel,
          buttonHref: portfolioUrl,
        },
      };

      const requestConfig: AxiosRequestConfig =
        await this.craftAxiosRequestConfig(authToken);

      const response = await this.mailing.post(
        '/send',
        removeNil(emailData),
        requestConfig,
      );

      this.apiCallHelperService.checkRequestResponseCode(
        'error sending email',
        response,
      );
    } catch (error) {
      ErrorService.throwApiCallError(
        'sendSenderForceTransferNotification',
        API_NAME,
        error,
      );
    }
  }

  /**
   * [Sends email to issuer containing registration link to join the platform the first time]
   */
  async sendInvestorMintOrForceBurnNotification(
    tenantId: string,
    issuer: User,
    investor: User,
    token: Token,
    authToken: string,
  ) {
    try {
      if (isE2eTestUser(investor)) {
        return; // We don't want to send emails to fake users created as part of e2e tests
      }

      const appUrl = await this.craftAppUrl(tenantId);
      const portfolioUrl = `${appUrl}/portfolio`;
      const investorName = this.getUserEmailFullName(investor);
      const issuerName = this.getUserEmailFullName(issuer);

      const {
        subject,
        fromEmail,
        fromName,
        messageTitle,
        message,
        buttonLabel,
        logo,
        color,
        messageFooter,
        poweredBy,
      } = await this.apiMetadataCallService.buildMailBody({
        tenantId,
        key: 'NOTIFY_INVESTOR_MINT_OR_FORCE_BURN',
        elements: {
          issuerName,
          investorName,
          assetName: token[TokenKeys.NAME],
        },
      });

      const emailData = {
        toEmail: investor[UserKeys.EMAIL],
        toName: investorName,
        fromEmail,
        fromName,
        subject,
        templateId: MAILJET_TEMPLATE_ID,
        variables: {
          logo,
          color,
          messageFooter,
          poweredBy,
          messageTitle,
          message,
          buttonLabel,
          buttonHref: portfolioUrl,
        },
      };

      const requestConfig: AxiosRequestConfig =
        await this.craftAxiosRequestConfig(authToken);

      const response = await this.mailing.post(
        '/send',
        removeNil(emailData),
        requestConfig,
      );

      this.apiCallHelperService.checkRequestResponseCode(
        'error sending email',
        response,
      );
    } catch (error) {
      ErrorService.throwApiCallError(
        'sendInvestorMintOrForceBurnNotification',
        API_NAME,
        error,
      );
    }
  }

  /**
   * [Sends email to issuer containing registration link to join the platform the first time]
   */
  async sendPlatformInviteIssuerMail(
    tenantId: string,
    issuer: User,
    authToken: string,
  ) {
    try {
      if (isE2eTestUser(issuer)) {
        return; // We don't want to send emails to fake users created as part of e2e tests
      }

      const buttonHref = await this.craftRegistrationLink(
        tenantId,
        issuer[UserKeys.EMAIL],
        issuer[UserKeys.USER_TYPE],
        issuer[UserKeys.FIRST_CONNECTION_CODE],
      );
      const issuerName = this.getUserEmailFullName(issuer);

      const {
        subject,
        fromEmail,
        fromName,
        messageTitle,
        message,
        buttonLabel,
        logo,
        color,
        messageFooter,
        poweredBy,
      } = await this.apiMetadataCallService.buildMailBody({
        tenantId,
        key: 'NOTIFY_ISSUER_INVITED',
        elements: {
          issuerName,
        },
      });

      const emailData = {
        toEmail: issuer[UserKeys.EMAIL],
        toName: issuerName,
        fromEmail,
        fromName,
        subject,
        templateId: MAILJET_TEMPLATE_ID,
        variables: {
          logo,
          color,
          messageFooter,
          poweredBy,
          messageTitle,
          message,
          buttonLabel,
          buttonHref,
        },
      };

      const requestConfig: AxiosRequestConfig =
        await this.craftAxiosRequestConfig(authToken);

      const response = await this.mailing.post(
        '/send',
        removeNil(emailData),
        requestConfig,
      );

      this.apiCallHelperService.checkRequestResponseCode(
        'error sending email',
        response,
      );
    } catch (error) {
      ErrorService.throwApiCallError(
        'sendPlatformInviteIssuerMail',
        API_NAME,
        error,
      );
    }
  }

  /**
   * [notifyIssuerTradeOrderCreated]
   */
  async notifyIssuerTradeOrderCreated(
    tenantId: string,
    issuer: User,
    investor: User,
    order: Order,
    token: Token,
    authToken: string,
  ) {
    try {
      if (isE2eTestUser(issuer)) {
        return; // We don't want to send emails to fake users created as part of e2e tests
      }

      const appUrl = await this.craftAppUrl(tenantId);
      const orderUrl = `${appUrl}/order/${order[ActionKeys.ID]}`;
      const investorName = this.getUserEmailFullName(investor);

      const {
        subject,
        fromEmail,
        fromName,
        messageTitle,
        message,
        buttonLabel,
        logo,
        color,
        messageFooter,
        poweredBy,
      } = await this.apiMetadataCallService.buildMailBody({
        tenantId,
        key: 'NOTIFY_ISSUER_TRADE_ORDER_CREATED',
        elements: {
          issuerFirstName: issuer[UserKeys.FIRST_NAME],
          investorName,
          assetName: token[TokenKeys.NAME],
          quantity: `${order[ActionKeys.QUANTITY]}`,
        },
      });

      const emailData = {
        toEmail: issuer[UserKeys.EMAIL],
        toName: this.getUserEmailFullName(issuer),
        fromEmail,
        fromName,
        subject,
        templateId: MAILJET_TEMPLATE_ID,
        variables: {
          logo,
          color,
          messageFooter,
          poweredBy,
          messageTitle,
          message,
          buttonLabel,
          buttonHref: orderUrl,
        },
      };

      const requestConfig: AxiosRequestConfig =
        await this.craftAxiosRequestConfig(authToken);

      const response = await this.mailing.post(
        '/send',
        removeNil(emailData),
        requestConfig,
      );

      this.apiCallHelperService.checkRequestResponseCode(
        'error sending email',
        response,
      );
    } catch (error) {
      ErrorService.throwApiCallError(
        'notifyIssuerTradeOrderCreated',
        API_NAME,
        error,
      );
    }
  }

  /**
   * [notifyOnboardedRecipientTradeOrderCreated]
   */
  async notifyOnboardedRecipientTradeOrderCreated(
    tenantId: string,
    seller: User,
    buyer: User,
    order: Order,
    token: Token,
    authToken: string,
  ) {
    try {
      if (isE2eTestUser(buyer)) {
        return; // We don't want to send emails to fake users created as part of e2e tests
      }

      const appUrl = await this.craftAppUrl(tenantId);
      const orderUrl = `${appUrl}/order/${order[ActionKeys.ID]}`;
      const sellerName = this.getUserEmailFullName(seller);

      const {
        subject,
        fromEmail,
        fromName,
        messageTitle,
        message,
        buttonLabel,
        logo,
        color,
        messageFooter,
        poweredBy,
      } = await this.apiMetadataCallService.buildMailBody({
        tenantId,
        key: 'NOTIFY_ONBOARDED_RECIPIENT_TRADE_ORDER_CREATED',
        elements: {
          buyerFirstName: buyer[UserKeys.FIRST_NAME],
          sellerName,
          assetName: token[TokenKeys.NAME],
          quantity: `${order[ActionKeys.QUANTITY]}`,
        },
      });

      const emailData = {
        toEmail: buyer[UserKeys.EMAIL],
        toName: this.getUserEmailFullName(buyer),
        fromEmail,
        fromName,
        subject,
        templateId: MAILJET_TEMPLATE_ID,
        variables: {
          logo,
          color,
          messageFooter,
          poweredBy,
          messageTitle,
          message,
          buttonLabel,
          buttonHref: orderUrl,
        },
      };

      const requestConfig: AxiosRequestConfig =
        await this.craftAxiosRequestConfig(authToken);

      const response = await this.mailing.post(
        '/send',
        removeNil(emailData),
        requestConfig,
      );

      this.apiCallHelperService.checkRequestResponseCode(
        'error sending email',
        response,
      );
    } catch (error) {
      ErrorService.throwApiCallError(
        'notifyOnboardedRecipientTradeOrderCreated',
        API_NAME,
        error,
      );
    }
  }

  /**
   * [notifySenderTradeOrderCreated]
   */
  async notifySenderTradeOrderCreated(
    tenantId: string,
    emailRecipient: User,
    buyer: User,
    order: Order,
    token: Token,
    tokenAssetClass: string,
    tradeTypeSubjLabel: string,
    tradeTypeMsgLabel: string,
    authToken: string,
  ) {
    try {
      if (isE2eTestUser(emailRecipient)) {
        return; // We don't want to send emails to fake users created as part of e2e tests
      }

      const appUrl = await this.craftAppUrl(tenantId);
      const orderUrl = `${appUrl}/order/${order[ActionKeys.ID]}`;
      const buyerName = this.getUserEmailFullName(buyer);
      const tokenUnit = this.assetDataService.retrieveTokenUnit(
        token,
        tokenAssetClass,
      );
      const assetCurrency = retrieveTokenCurrency(token, tokenAssetClass);
      const assetCurrencyLabel = assetCurrency ? ` ${assetCurrency}` : '';
      const quantityNum = order[ActionKeys.QUANTITY];
      const totalPriceNum = order[ActionKeys.PRICE];
      const pricePerUnitNum = totalPriceNum / quantityNum;
      const pricePerUnit = `${pricePerUnitNum.toLocaleString('en', {
        maximumFractionDigits: 2,
        minimumFractionDigits: 2,
      })}`;
      const quantity = `${quantityNum.toLocaleString('en')}`;
      const amount = `${totalPriceNum.toLocaleString('en')}`;
      const quantityOrAmount =
        order?.[ActionKeys.DATA]?.[ActionKeys.DATA__ORDER_TYPE] ===
        OrderType.QUANTITY
          ? quantity
          : amount;

      const {
        subject,
        fromEmail,
        fromName,
        messageTitle,
        message,
        buttonLabel,
        logo,
        color,
        messageFooter,
        poweredBy,
      } = await this.apiMetadataCallService.buildMailBody({
        tenantId,
        key: 'NOTIFY_SENDER_TRADE_ORDER_CREATED',
        elements: {
          buyerName,
          sellerFirstName: emailRecipient[UserKeys.FIRST_NAME],
          quantityOrAmount,
          pricePerUnit,
          amount,
          assetName: token[TokenKeys.NAME],
          tradeTypeSubjLabel,
          tradeTypeMsgLabel,
          assetCurrencyLabel,
          tokenUnit,
        },
      });

      const emailData = {
        toEmail: emailRecipient[UserKeys.EMAIL],
        toName: this.getUserEmailFullName(emailRecipient),
        fromEmail,
        fromName,
        subject,
        templateId: MAILJET_TEMPLATE_ID,
        variables: {
          logo,
          color,
          messageFooter,
          poweredBy,
          messageTitle,
          message,
          buttonLabel,
          buttonHref: orderUrl,
        },
      };

      const requestConfig: AxiosRequestConfig =
        await this.craftAxiosRequestConfig(authToken);

      const response = await this.mailing.post(
        '/send',
        removeNil(emailData),
        requestConfig,
      );

      this.apiCallHelperService.checkRequestResponseCode(
        'error sending email',
        response,
      );
    } catch (error) {
      ErrorService.throwApiCallError(
        'notifySenderTradeOrderCreated',
        API_NAME,
        error,
      );
    }
  }

  /**
   * [notifyRecipientTradeOrderAccepted]
   */
  async notifyRecipientTradeOrderAccepted(
    tenantId: string,
    emailRecipient: User,
    seller: User,
    order: Order,
    token: Token,
    tokenAssetClass: string,
    authToken: string,
  ) {
    try {
      if (isE2eTestUser(emailRecipient)) {
        return; // We don't want to send emails to fake users created as part of e2e tests
      }

      const appUrl = await this.craftAppUrl(tenantId);
      const orderUrl = `${appUrl}/order/${order[ActionKeys.ID]}`;
      const sellerName = this.getUserEmailFullName(seller);
      const tokenUnit = this.assetDataService.retrieveTokenUnit(
        token,
        tokenAssetClass,
      );
      const assetCurrency = retrieveTokenCurrency(token, tokenAssetClass);
      const assetCurrencyLabel = assetCurrency ? ` ${assetCurrency}` : '';
      const quantityNum = order[ActionKeys.QUANTITY];
      const totalPriceNum = order[ActionKeys.PRICE];
      const pricePerUnitNum = totalPriceNum / quantityNum;
      const pricePerUnit = `${pricePerUnitNum.toLocaleString('en', {
        maximumFractionDigits: 2,
        minimumFractionDigits: 2,
      })}`;
      const quantity = `${quantityNum.toLocaleString('en')}`;
      const amount = `${totalPriceNum.toLocaleString('en')}`;
      const quantityOrAmount =
        order?.[ActionKeys.DATA]?.[ActionKeys.DATA__ORDER_TYPE] ===
        OrderType.QUANTITY
          ? quantity
          : amount;

      const {
        subject,
        fromEmail,
        fromName,
        messageTitle,
        message,
        buttonLabel,
        logo,
        color,
        messageFooter,
        poweredBy,
      } = await this.apiMetadataCallService.buildMailBody({
        tenantId,
        key: 'NOTIFY_RECIPIENT_TRADE_ORDER_ACCEPTED',
        elements: {
          buyerFirstName: emailRecipient[UserKeys.FIRST_NAME],
          sellerName,
          quantityOrAmount,
          pricePerUnit,
          amount,
          assetName: token[TokenKeys.NAME],
          tokenUnit,
          assetCurrencyLabel,
        },
      });

      const emailData = {
        toEmail: emailRecipient[UserKeys.EMAIL],
        toName: this.getUserEmailFullName(emailRecipient),
        fromEmail,
        fromName,
        subject,
        templateId: MAILJET_TEMPLATE_ID,
        variables: {
          logo,
          color,
          messageFooter,
          poweredBy,
          messageTitle,
          message,
          buttonLabel,
          buttonHref: orderUrl,
        },
      };

      const requestConfig: AxiosRequestConfig =
        await this.craftAxiosRequestConfig(authToken);

      const response = await this.mailing.post(
        '/send',
        removeNil(emailData),
        requestConfig,
      );

      this.apiCallHelperService.checkRequestResponseCode(
        'error sending email',
        response,
      );
    } catch (error) {
      ErrorService.throwApiCallError(
        'notifyRecipientTradeOrderAccepted',
        API_NAME,
        error,
      );
    }
  }

  /**
   * [notifyNoneOnboardedRecipientTradeOrderCreated]
   */
  async notifyNoneOnboardedRecipientTradeOrderCreated(
    tenantId: string,
    seller: User,
    buyer: User,
    order: Order,
    token: Token,
    authToken: string,
  ) {
    try {
      if (isE2eTestUser(buyer)) {
        return; // We don't want to send emails to fake users created as part of e2e tests
      }

      const registrationUrl = await this.craftRegistrationLink(
        tenantId,
        buyer[UserKeys.EMAIL],
        buyer[UserKeys.USER_TYPE],
        buyer[UserKeys.FIRST_CONNECTION_CODE],
      );
      const sellerName = this.getUserEmailFullName(seller);

      const {
        subject,
        fromEmail,
        fromName,
        messageTitle,
        message,
        buttonLabel,
        logo,
        color,
        messageFooter,
        poweredBy,
      } = await this.apiMetadataCallService.buildMailBody({
        tenantId,
        key: 'NOTIFY_NONE_ONBOARDED_RECIPIENT_TRADE_ORDER_CREATED',
        elements: {
          buyerFirstName: buyer[UserKeys.FIRST_NAME],
          sellerName,
          assetName: token[TokenKeys.NAME],
          quantity: `${order[ActionKeys.QUANTITY]}`,
        },
      });

      const emailData = {
        toEmail: buyer[UserKeys.EMAIL],
        toName: this.getUserEmailFullName(buyer),
        fromEmail,
        fromName,
        subject,
        templateId: MAILJET_TEMPLATE_ID,
        variables: {
          logo,
          color,
          messageFooter,
          poweredBy,
          messageTitle,
          message,
          buttonLabel,
          buttonHref: registrationUrl,
        },
      };

      const requestConfig: AxiosRequestConfig =
        await this.craftAxiosRequestConfig(authToken);

      const response = await this.mailing.post(
        '/send',
        removeNil(emailData),
        requestConfig,
      );

      this.apiCallHelperService.checkRequestResponseCode(
        'error sending email',
        response,
      );
    } catch (error) {
      ErrorService.throwApiCallError(
        'notifyNoneOnboardedRecipientTradeOrderCreated',
        API_NAME,
        error,
      );
    }
  }

  /**
   * [notifySenderTradeOrderApproved]
   */
  async notifySenderTradeOrderApproved(
    tenantId: string,
    issuer: User,
    seller: User,
    order: Order,
    token: Token,
    authToken: string,
  ) {
    try {
      if (isE2eTestUser(seller)) {
        return; // We don't want to send emails to fake users created as part of e2e tests
      }

      const appUrl = await this.craftAppUrl(tenantId);
      const orderUrl = `${appUrl}/order/${order[ActionKeys.ID]}`;
      const issuerName = this.getUserEmailFullName(issuer);

      const {
        subject,
        fromEmail,
        fromName,
        messageTitle,
        message,
        buttonLabel,
        logo,
        color,
        messageFooter,
        poweredBy,
      } = await this.apiMetadataCallService.buildMailBody({
        tenantId,
        key: 'NOTIFY_SENDER_TRADE_ORDER_APPROVED',
        elements: {
          sellerFirstName: seller[UserKeys.FIRST_NAME],
          issuerName,
          assetName: token[TokenKeys.NAME],
          quantity: `${order[ActionKeys.QUANTITY]}`,
        },
      });

      const emailData = {
        toEmail: seller[UserKeys.EMAIL],
        toName: this.getUserEmailFullName(seller),
        fromEmail,
        fromName,
        subject,
        templateId: MAILJET_TEMPLATE_ID,
        variables: {
          logo,
          color,
          messageFooter,
          poweredBy,
          messageTitle,
          message,
          buttonLabel,
          buttonHref: orderUrl,
        },
      };

      const requestConfig: AxiosRequestConfig =
        await this.craftAxiosRequestConfig(authToken);

      const response = await this.mailing.post(
        '/send',
        removeNil(emailData),
        requestConfig,
      );

      this.apiCallHelperService.checkRequestResponseCode(
        'error sending email',
        response,
      );
    } catch (error) {
      ErrorService.throwApiCallError(
        'notifySenderTradeOrderApproved',
        API_NAME,
        error,
      );
    }
  }

  /**
   * [notifyIssuerTradeOrderAccepted]
   */
  async notifyIssuerTradeOrderAccepted(
    tenantId: string,
    issuer: User,
    seller: User,
    buyer: User,
    order: Order,
    token: Token,
    authToken: string,
  ) {
    try {
      if (isE2eTestUser(issuer)) {
        return; // We don't want to send emails to fake users created as part of e2e tests
      }

      const appUrl = await this.craftAppUrl(tenantId);
      const orderUrl = `${appUrl}/order/${order[ActionKeys.ID]}`;
      const buyerName = this.getUserEmailFullName(buyer);
      const sellerName = this.getUserEmailFullName(seller);

      const {
        subject,
        fromEmail,
        fromName,
        messageTitle,
        message,
        buttonLabel,
        logo,
        color,
        messageFooter,
        poweredBy,
      } = await this.apiMetadataCallService.buildMailBody({
        tenantId,
        key: 'NOTIFY_ISSUER_TRADE_ORDER_ACCEPTED',
        elements: {
          issuerFirstName: issuer[UserKeys.FIRST_NAME],
          buyerName,
          sellerName,
          assetName: token[TokenKeys.NAME],
          quantity: `${order[ActionKeys.QUANTITY]}`,
        },
      });

      const emailData = {
        toEmail: issuer[UserKeys.EMAIL],
        toName: this.getUserEmailFullName(issuer),
        fromEmail,
        fromName,
        subject,
        templateId: MAILJET_TEMPLATE_ID,
        variables: {
          logo,
          color,
          messageFooter,
          poweredBy,
          messageTitle,
          message,
          buttonLabel,
          buttonHref: orderUrl,
        },
      };

      const requestConfig: AxiosRequestConfig =
        await this.craftAxiosRequestConfig(authToken);

      const response = await this.mailing.post(
        '/send',
        removeNil(emailData),
        requestConfig,
      );

      this.apiCallHelperService.checkRequestResponseCode(
        'error sending email',
        response,
      );
    } catch (error) {
      ErrorService.throwApiCallError(
        'notifyIssuerTradeOrderAccepted',
        API_NAME,
        error,
      );
    }
  }

  /**
   * [notifyRecipientTradeOrderHoldCreated]
   */
  async notifyRecipientTradeOrderHoldCreated(
    tenantId: string,
    emailRecipient: User,
    seller: User,
    buyer: User,
    order: Order,
    token: Token,
    tokenAssetClass: string,
    authToken: string,
  ) {
    try {
      if (isE2eTestUser(emailRecipient)) {
        return; // We don't want to send emails to fake users created as part of e2e tests
      }

      const appUrl = await this.craftAppUrl(tenantId);
      const orderUrl = `${appUrl}/order/${order[ActionKeys.ID]}`;
      const sellerName = this.getUserEmailFullName(seller);
      const buyerName = this.getUserEmailFullName(buyer);
      const tokenUnit = this.assetDataService.retrieveTokenUnit(
        token,
        tokenAssetClass,
      );
      const assetCurrency = retrieveTokenCurrency(token, tokenAssetClass);
      const assetCurrencyLabel = assetCurrency ? ` ${assetCurrency}` : '';
      const quantityNum = order[ActionKeys.QUANTITY];
      const totalPriceNum = order[ActionKeys.PRICE];
      const pricePerUnitNum = totalPriceNum / quantityNum;
      const pricePerUnit = `${pricePerUnitNum.toLocaleString('en', {
        maximumFractionDigits: 2,
        minimumFractionDigits: 2,
      })}`;
      const quantity = `${quantityNum.toLocaleString('en')}`;
      const amount = `${totalPriceNum.toLocaleString('en')}`;

      const {
        subject,
        fromEmail,
        fromName,
        messageTitle,
        message,
        buttonLabel,
        logo,
        color,
        messageFooter,
        poweredBy,
      } = await this.apiMetadataCallService.buildMailBody({
        tenantId,
        key: 'NOTIFY_RECIPIENT_TRADE_ORDER_HOLD_CREATED',
        elements: {
          buyerFirstName: emailRecipient[UserKeys.FIRST_NAME],
          buyerName,
          sellerName,
          assetName: token[TokenKeys.NAME],
          quantity,
          pricePerUnit,
          amount,
          assetCurrencyLabel,
          tokenUnit,
        },
      });

      const emailData = {
        toEmail: emailRecipient[UserKeys.EMAIL],
        toName: this.getUserEmailFullName(emailRecipient),
        fromEmail,
        fromName,
        subject,
        templateId: MAILJET_TEMPLATE_ID,
        variables: {
          logo,
          color,
          messageFooter,
          poweredBy,
          messageTitle,
          message,
          buttonLabel,
          buttonHref: orderUrl,
        },
      };

      const requestConfig: AxiosRequestConfig =
        await this.craftAxiosRequestConfig(authToken);

      const response = await this.mailing.post(
        '/send',
        removeNil(emailData),
        requestConfig,
      );

      this.apiCallHelperService.checkRequestResponseCode(
        'error sending email',
        response,
      );
    } catch (error) {
      ErrorService.throwApiCallError(
        'notifyRecipientTradeOrderHoldCreated',
        API_NAME,
        error,
      );
    }
  }

  /**
   * [notifySenderTradeOrderHoldCreated]
   */
  async notifySenderTradeOrderHoldCreated(
    tenantId: string,
    seller: User,
    buyer: User,
    order: Order,
    token: Token,
    authToken: string,
  ) {
    try {
      if (isE2eTestUser(seller)) {
        return; // We don't want to send emails to fake users created as part of e2e tests
      }

      const appUrl = await this.craftAppUrl(tenantId);
      const orderUrl = `${appUrl}/order/${order[ActionKeys.ID]}`;
      const buyerName = this.getUserEmailFullName(buyer);

      const {
        subject,
        fromEmail,
        fromName,
        messageTitle,
        message,
        buttonLabel,
        logo,
        color,
        messageFooter,
        poweredBy,
      } = await this.apiMetadataCallService.buildMailBody({
        tenantId,
        key: 'NOTIFY_SENDER_TRADE_ORDER_HOLD_CREATED',
        elements: {
          sellerFirstName: seller[UserKeys.FIRST_NAME],
          buyerName,
          assetName: token[TokenKeys.NAME],
          quantity: `${order[ActionKeys.QUANTITY]}`,
        },
      });

      const emailData = {
        toEmail: seller[UserKeys.EMAIL],
        toName: this.getUserEmailFullName(seller),
        fromEmail,
        fromName,
        subject,
        templateId: MAILJET_TEMPLATE_ID,
        variables: {
          logo,
          color,
          messageFooter,
          poweredBy,
          messageTitle,
          message,
          buttonLabel,
          buttonHref: orderUrl,
        },
      };

      const requestConfig: AxiosRequestConfig =
        await this.craftAxiosRequestConfig(authToken);

      const response = await this.mailing.post(
        '/send',
        removeNil(emailData),
        requestConfig,
      );

      this.apiCallHelperService.checkRequestResponseCode(
        'error sending email',
        response,
      );
    } catch (error) {
      ErrorService.throwApiCallError(
        'notifySenderTradeOrderHoldCreated',
        API_NAME,
        error,
      );
    }
  }

  /**
   * [notifySenderAtomicTradeOrderPaid]
   */
  async notifySenderAtomicTradeOrderPaid(
    tenantId: string,
    issuer: User,
    seller: User,
    buyer: User,
    order: Order,
    token: Token,
    authToken: string,
  ) {
    try {
      if (isE2eTestUser(seller)) {
        return; // We don't want to send emails to fake users created as part of e2e tests
      }

      const appUrl = await this.craftAppUrl(tenantId);
      const orderUrl = `${appUrl}/order/${order[ActionKeys.ID]}`;
      const buyerName = this.getUserEmailFullName(buyer);
      const issuerName = this.getUserEmailFullName(issuer);

      const {
        subject,
        fromEmail,
        fromName,
        messageTitle,
        message,
        buttonLabel,
        logo,
        color,
        messageFooter,
        poweredBy,
      } = await this.apiMetadataCallService.buildMailBody({
        tenantId,
        key: 'NOTIFY_SENDER_ATOMIC_TRADE_ORDER_PAID',
        elements: {
          amount: `${order[ActionKeys.PRICE]}`,
          assetName: token[TokenKeys.NAME],
          buyerName,
          issuerName,
          quantity: `${order[ActionKeys.QUANTITY]}`,
          sellerFirstName: seller[UserKeys.FIRST_NAME],
        },
      });

      const emailData = {
        toEmail: seller[UserKeys.EMAIL],
        toName: this.getUserEmailFullName(seller),
        fromEmail,
        fromName,
        subject,
        templateId: MAILJET_TEMPLATE_ID,
        variables: {
          logo,
          color,
          messageFooter,
          poweredBy,
          messageTitle,
          message,
          buttonLabel,
          buttonHref: orderUrl,
        },
      };

      const requestConfig: AxiosRequestConfig =
        await this.craftAxiosRequestConfig(authToken);

      const response = await this.mailing.post(
        '/send',
        removeNil(emailData),
        requestConfig,
      );

      this.apiCallHelperService.checkRequestResponseCode(
        'error sending email',
        response,
      );
    } catch (error) {
      ErrorService.throwApiCallError(
        'notifySenderAtomicTradeOrderPaid',
        API_NAME,
        error,
      );
    }
  }

  /**
   * [notifySenderNonAtomicTradeOrderPaid]
   */
  async notifySenderNonAtomicTradeOrderPaid(
    tenantId: string,
    seller: User,
    buyer: User,
    order: Order,
    token: Token,
    tokenAssetClass: string,
    authToken: string,
  ) {
    try {
      if (isE2eTestUser(seller)) {
        return; // We don't want to send emails to fake users created as part of e2e tests
      }

      const appUrl = await this.craftAppUrl(tenantId);
      const orderUrl = `${appUrl}/order/${order[ActionKeys.ID]}`;
      const buyerName = this.getUserEmailFullName(buyer);
      const tokenUnit = this.assetDataService.retrieveTokenUnit(
        token,
        tokenAssetClass,
      );
      const assetCurrency = retrieveTokenCurrency(token, tokenAssetClass);
      const assetCurrencyLabel = assetCurrency ? ` ${assetCurrency}` : '';
      const quantityNum = order[ActionKeys.QUANTITY];
      const totalPriceNum = order[ActionKeys.PRICE];
      const pricePerUnitNum = totalPriceNum / quantityNum;
      const pricePerUnit = `${pricePerUnitNum.toLocaleString('en', {
        maximumFractionDigits: 2,
        minimumFractionDigits: 2,
      })}`;
      const quantity = `${quantityNum.toLocaleString('en')}`;
      const amount = `${totalPriceNum.toLocaleString('en')}`;

      const {
        subject,
        fromEmail,
        fromName,
        messageTitle,
        message,
        buttonLabel,
        logo,
        color,
        messageFooter,
        poweredBy,
      } = await this.apiMetadataCallService.buildMailBody({
        tenantId,
        key: 'NOTIFY_SENDER_NONE_ATOMIC_TRADE_ORDER_PAID',
        elements: {
          sellerFirstName: seller[UserKeys.FIRST_NAME],
          buyerName,
          assetName: token[TokenKeys.NAME],
          quantity,
          amount,
          pricePerUnit,
          assetCurrencyLabel,
          tokenUnit,
        },
      });

      const emailData = {
        toEmail: seller[UserKeys.EMAIL],
        toName: this.getUserEmailFullName(seller),
        fromEmail,
        fromName,
        subject,
        templateId: MAILJET_TEMPLATE_ID,
        variables: {
          logo,
          color,
          messageFooter,
          poweredBy,
          messageTitle,
          message,
          buttonLabel,
          buttonHref: orderUrl,
        },
      };

      const requestConfig: AxiosRequestConfig =
        await this.craftAxiosRequestConfig(authToken);

      const response = await this.mailing.post(
        '/send',
        removeNil(emailData),
        requestConfig,
      );

      this.apiCallHelperService.checkRequestResponseCode(
        'error sending email',
        response,
      );
    } catch (error) {
      ErrorService.throwApiCallError(
        'notifySenderNonAtomicTradeOrderPaid',
        API_NAME,
        error,
      );
    }
  }

  /**
   * [notifyIssuerTradeOrderPaid]
   */
  async notifyIssuerTradeOrderPaid(
    tenantId: string,
    issuer: User,
    seller: User,
    buyer: User,
    order: Order,
    token: Token,
    tokenAssetClass: string,
    authToken: string,
  ) {
    try {
      if (isE2eTestUser(issuer)) {
        return; // We don't want to send emails to fake users created as part of e2e tests
      }

      const appUrl = await this.craftAppUrl(tenantId);
      const orderUrl = `${appUrl}/order/${order[ActionKeys.ID]}`;
      const buyerName = this.getUserEmailFullName(buyer);
      const sellerName = this.getUserEmailFullName(seller);
      const tokenUnit = this.assetDataService.retrieveTokenUnit(
        token,
        tokenAssetClass,
      );
      const assetCurrency = retrieveTokenCurrency(token, tokenAssetClass);
      const assetCurrencyLabel = assetCurrency ? ` ${assetCurrency}` : '';
      const quantityNum = order[ActionKeys.QUANTITY];
      const totalPriceNum = order[ActionKeys.PRICE];
      const pricePerUnitNum = totalPriceNum / quantityNum;
      const pricePerUnit = `${pricePerUnitNum.toLocaleString('en', {
        maximumFractionDigits: 2,
        minimumFractionDigits: 2,
      })}`;
      const quantity = `${quantityNum.toLocaleString('en')}`;
      const amount = `${totalPriceNum.toLocaleString('en')}`;

      const {
        subject,
        fromEmail,
        fromName,
        messageTitle,
        message,
        buttonLabel,
        logo,
        color,
        messageFooter,
        poweredBy,
      } = await this.apiMetadataCallService.buildMailBody({
        tenantId,
        key: 'NOTIFY_ISSUER_TRADE_ORDER_PAID',
        elements: {
          issuerFirstName: issuer[UserKeys.FIRST_NAME],
          buyerName,
          sellerName,
          assetName: token[TokenKeys.NAME],
          quantity,
          amount,
          pricePerUnit,
          assetCurrencyLabel,
          tokenUnit,
        },
      });

      const emailData = {
        toEmail: issuer[UserKeys.EMAIL],
        toName: this.getUserEmailFullName(issuer),
        fromEmail,
        fromName,
        subject,
        templateId: MAILJET_TEMPLATE_ID,
        variables: {
          logo,
          color,
          messageFooter,
          poweredBy,
          messageTitle,
          message,
          buttonLabel,
          buttonHref: orderUrl,
        },
      };

      const requestConfig: AxiosRequestConfig =
        await this.craftAxiosRequestConfig(authToken);

      const response = await this.mailing.post(
        '/send',
        removeNil(emailData),
        requestConfig,
      );

      this.apiCallHelperService.checkRequestResponseCode(
        'error sending email',
        response,
      );
    } catch (error) {
      ErrorService.throwApiCallError(
        'notifyIssuerTradeOrderPaid',
        API_NAME,
        error,
      );
    }
  }

  /**
   * [noFtifyRecipientTradeOrderPaymentConfirmed]
   */
  async notifyRecipientTradeOrderPaymentConfirmed(
    tenantId: string,
    issuer: User,
    seller: User,
    buyer: User,
    order: Order,
    token: Token,
    tokenAssetClass: string,
    authToken: string,
  ) {
    try {
      if (isE2eTestUser(buyer)) {
        return; // We don't want to send emails to fake users created as part of e2e tests
      }

      const appUrl = await this.craftAppUrl(tenantId);
      const orderUrl = `${appUrl}/order/${order[ActionKeys.ID]}`;
      const issuerName = this.getUserEmailFullName(issuer);
      const sellerName = this.getUserEmailFullName(seller);
      const tokenUnit = this.assetDataService.retrieveTokenUnit(
        token,
        tokenAssetClass,
      );
      const assetCurrency = retrieveTokenCurrency(token, tokenAssetClass);
      const assetCurrencyLabel = assetCurrency ? ` ${assetCurrency}` : '';
      const quantityNum = order[ActionKeys.QUANTITY];
      const totalPriceNum = order[ActionKeys.PRICE];
      const pricePerUnitNum = totalPriceNum / quantityNum;
      const pricePerUnit = `${pricePerUnitNum.toLocaleString('en', {
        maximumFractionDigits: 2,
        minimumFractionDigits: 2,
      })}`;
      const quantity = `${quantityNum.toLocaleString('en')}`;
      const amount = `${totalPriceNum.toLocaleString('en')}`;

      const {
        subject,
        fromEmail,
        fromName,
        messageTitle,
        message,
        buttonLabel,
        logo,
        color,
        messageFooter,
        poweredBy,
      } = await this.apiMetadataCallService.buildMailBody({
        tenantId,
        key: 'NOTIFY_RECIPIENT_TRADE_ORDER_PAYMENT_CONFIRMED',
        elements: {
          buyerFirstName: buyer[UserKeys.FIRST_NAME],
          sellerName,
          issuerName,
          assetName: token[TokenKeys.NAME],
          quantity,
          pricePerUnit,
          amount,
          assetCurrencyLabel,
          tokenUnit,
        },
      });

      const emailData = {
        toEmail: buyer[UserKeys.EMAIL],
        toName: this.getUserEmailFullName(buyer),
        fromEmail,
        fromName,
        subject,
        templateId: MAILJET_TEMPLATE_ID,
        variables: {
          logo,
          color,
          messageFooter,
          poweredBy,
          messageTitle,
          message,
          buttonLabel,
          buttonHref: orderUrl,
        },
      };

      const requestConfig: AxiosRequestConfig =
        await this.craftAxiosRequestConfig(authToken);

      const response = await this.mailing.post(
        '/send',
        removeNil(emailData),
        requestConfig,
      );

      this.apiCallHelperService.checkRequestResponseCode(
        'error sending email',
        response,
      );
    } catch (error) {
      ErrorService.throwApiCallError(
        'notifyRecipientTradeOrderPaymentConfirmed',
        API_NAME,
        error,
      );
    }
  }

  /**
   * [notifyRecipientTradeOrderSettled]
   */
  async notifyRecipientTradeOrderSettled(
    tenantId: string,
    emailRecipient: User,
    issuer: User,
    seller: User,
    buyer: User,
    order: Order,
    token: Token,
    tokenAssetClass: string,
    authToken: string,
  ) {
    try {
      if (isE2eTestUser(buyer)) {
        return; // We don't want to send emails to fake users created as part of e2e tests
      }

      const appUrl = await this.craftAppUrl(tenantId);
      const orderUrl = `${appUrl}/order/${order[ActionKeys.ID]}`;
      const buyerName = this.getUserEmailFullName(buyer);
      const sellerName = this.getUserEmailFullName(seller);
      const issuerName = this.getUserEmailFullName(issuer);
      const tokenUnit = this.assetDataService.retrieveTokenUnit(
        token,
        tokenAssetClass,
      );
      const assetCurrency = retrieveTokenCurrency(token, tokenAssetClass);
      const assetCurrencyLabel = assetCurrency ? ` ${assetCurrency}` : '';
      const quantityNum = order[ActionKeys.QUANTITY];
      const totalPriceNum = order[ActionKeys.PRICE];
      const pricePerUnitNum = totalPriceNum / quantityNum;
      const pricePerUnit = `${pricePerUnitNum.toLocaleString('en', {
        maximumFractionDigits: 2,
        minimumFractionDigits: 2,
      })}`;
      const quantity = `${quantityNum.toLocaleString('en')}`;
      const amount = `${totalPriceNum.toLocaleString('en')}`;

      const {
        subject,
        fromEmail,
        fromName,
        messageTitle,
        message,
        buttonLabel,
        logo,
        color,
        messageFooter,
        poweredBy,
      } = await this.apiMetadataCallService.buildMailBody({
        tenantId,
        key: 'NOTIFY_RECIPIENT_TRADE_ORDER_SETTLED',
        elements: {
          buyerFirstName: buyer[UserKeys.FIRST_NAME],
          buyerName,
          sellerName,
          issuerName,
          assetName: token[TokenKeys.NAME],
          pricePerUnit,
          quantity,
          amount,
          assetCurrencyLabel,
          tokenUnit,
        },
      });

      const emailData = {
        toEmail: emailRecipient[UserKeys.EMAIL],
        toName: this.getUserEmailFullName(emailRecipient),
        fromEmail,
        fromName,
        subject,
        templateId: MAILJET_TEMPLATE_ID,
        variables: {
          logo,
          color,
          messageFooter,
          poweredBy,
          messageTitle,
          message,
          buttonLabel,
          buttonHref: orderUrl,
        },
      };

      const requestConfig: AxiosRequestConfig =
        await this.craftAxiosRequestConfig(authToken);

      const response = await this.mailing.post(
        '/send',
        removeNil(emailData),
        requestConfig,
      );

      this.apiCallHelperService.checkRequestResponseCode(
        'error sending email',
        response,
      );
    } catch (error) {
      ErrorService.throwApiCallError(
        'notifyRecipientTradeOrderSettled',
        API_NAME,
        error,
      );
    }
  }

  /**
   * [notifySenderTradeOrderSettled]
   */
  async notifySenderTradeOrderSettled(
    tenantId: string,
    seller: User,
    buyer: User,
    order: Order,
    token: Token,
    authToken: string,
  ) {
    try {
      if (isE2eTestUser(seller)) {
        return; // We don't want to send emails to fake users created as part of e2e tests
      }

      const appUrl = await this.craftAppUrl(tenantId);
      const orderUrl = `${appUrl}/order/${order[ActionKeys.ID]}`;
      const buyerName = this.getUserEmailFullName(buyer);

      const {
        subject,
        fromEmail,
        fromName,
        messageTitle,
        message,
        buttonLabel,
        logo,
        color,
        messageFooter,
        poweredBy,
      } = await this.apiMetadataCallService.buildMailBody({
        tenantId,
        key: 'NOTIFY_SENDER_TRADE_ORDER_SETTLED',
        elements: {
          sellerFirstName: seller[UserKeys.FIRST_NAME],
          buyerName,
          assetName: token[TokenKeys.NAME],
          quantity: `${order[ActionKeys.QUANTITY]}`,
        },
      });

      const emailData = {
        toEmail: seller[UserKeys.EMAIL],
        toName: this.getUserEmailFullName(seller),
        fromEmail,
        fromName,
        subject,
        templateId: MAILJET_TEMPLATE_ID,
        variables: {
          logo,
          color,
          messageFooter,
          poweredBy,
          messageTitle,
          message,
          buttonLabel,
          buttonHref: orderUrl,
        },
      };

      const requestConfig: AxiosRequestConfig =
        await this.craftAxiosRequestConfig(authToken);

      const response = await this.mailing.post(
        '/send',
        removeNil(emailData),
        requestConfig,
      );

      this.apiCallHelperService.checkRequestResponseCode(
        'error sending email',
        response,
      );
    } catch (error) {
      ErrorService.throwApiCallError(
        'notifySenderTradeOrderSettled',
        API_NAME,
        error,
      );
    }
  }

  /**
   * [notifySenderSubmittedTradeOrderRejected]
   */
  async notifySenderSubmittedTradeOrderRejected(
    tenantId: string,
    issuer: User,
    seller: User,
    order: Order,
    token: Token,
    authToken: string,
  ) {
    try {
      if (isE2eTestUser(seller)) {
        return; // We don't want to send emails to fake users created as part of e2e tests
      }

      const appUrl = await this.craftAppUrl(tenantId);
      const orderUrl = `${appUrl}/order/${order[ActionKeys.ID]}`;
      const issuerName = this.getUserEmailFullName(issuer);

      const {
        subject,
        fromEmail,
        fromName,
        messageTitle,
        message,
        buttonLabel,
        logo,
        color,
        messageFooter,
        poweredBy,
      } = await this.apiMetadataCallService.buildMailBody({
        tenantId,
        key: 'NOTIFY_SENDER_SUBMITTED_TRADE_ORDER_REJECTED',
        elements: {
          sellerFirstName: seller[UserKeys.FIRST_NAME],
          issuerName,
          assetName: token[TokenKeys.NAME],
          quantity: `${order[ActionKeys.QUANTITY]}`,
        },
      });

      const emailData = {
        toEmail: seller[UserKeys.EMAIL],
        toName: this.getUserEmailFullName(seller),
        fromEmail,
        fromName,
        subject,
        templateId: MAILJET_TEMPLATE_ID,
        variables: {
          logo,
          color,
          messageFooter,
          poweredBy,
          messageTitle,
          message,
          buttonLabel,
          buttonHref: orderUrl,
        },
      };

      const requestConfig: AxiosRequestConfig =
        await this.craftAxiosRequestConfig(authToken);

      const response = await this.mailing.post(
        '/send',
        removeNil(emailData),
        requestConfig,
      );

      this.apiCallHelperService.checkRequestResponseCode(
        'error sending email',
        response,
      );
    } catch (error) {
      ErrorService.throwApiCallError(
        'notifySenderSubmittedTradeOrderRejected',
        API_NAME,
        error,
      );
    }
  }

  /**
   * [notifySenderApprovedTradeOrderRejected]
   */
  async notifySenderApprovedTradeOrderRejected(
    tenantId: string,
    seller: User,
    buyer: User,
    order: Order,
    token: Token,
    authToken: string,
  ) {
    try {
      if (isE2eTestUser(seller)) {
        return; // We don't want to send emails to fake users created as part of e2e tests
      }

      const appUrl = await this.craftAppUrl(tenantId);
      const orderUrl = `${appUrl}/order/${order[ActionKeys.ID]}`;
      const buyerName = this.getUserEmailFullName(buyer);
      const sellerName = this.getUserEmailFullName(seller);

      const {
        subject,
        fromEmail,
        fromName,
        messageTitle,
        message,
        buttonLabel,
        logo,
        color,
        messageFooter,
        poweredBy,
      } = await this.apiMetadataCallService.buildMailBody({
        tenantId,
        key: 'NOTIFY_SENDER_APPROVED_TRADE_ORDER_REJECTED',
        elements: {
          sellerFirstName: seller[UserKeys.FIRST_NAME],
          buyerName,
          sellerName,
          assetName: token[TokenKeys.NAME],
          quantity: `${order[ActionKeys.QUANTITY]}`,
        },
      });

      const emailData = {
        toEmail: seller[UserKeys.EMAIL],
        toName: sellerName,
        fromEmail,
        fromName,
        subject,
        templateId: MAILJET_TEMPLATE_ID,
        variables: {
          logo,
          color,
          messageFooter,
          poweredBy,
          messageTitle,
          message,
          buttonLabel,
          buttonHref: orderUrl,
        },
      };

      const requestConfig: AxiosRequestConfig =
        await this.craftAxiosRequestConfig(authToken);

      const response = await this.mailing.post(
        '/send',
        removeNil(emailData),
        requestConfig,
      );

      this.apiCallHelperService.checkRequestResponseCode(
        'error sending email',
        response,
      );
    } catch (error) {
      ErrorService.throwApiCallError(
        'notifySenderApprovedTradeOrderRejected',
        API_NAME,
        error,
      );
    }
  }

  /**
   * [notifyRecipientApprovedTradeOrderRejected]
   */
  async notifyRecipientApprovedTradeOrderRejected(
    tenantId: string,
    seller: User,
    buyer: User,
    order: Order,
    token: Token,
    tokenAssetClass,
    comment: string,
    authToken: string,
  ) {
    try {
      if (isE2eTestUser(buyer)) {
        return; // We don't want to send emails to fake users created as part of e2e tests
      }

      const appUrl = await this.craftAppUrl(tenantId);
      const orderUrl = `${appUrl}/order/${order[ActionKeys.ID]}`;
      const buyerName = this.getUserEmailFullName(buyer);
      const sellerName = this.getUserEmailFullName(seller);
      const buyerFirstName = buyer[UserKeys.FIRST_NAME];
      const assetName = token[TokenKeys.NAME];
      const quantityNum = order[ActionKeys.QUANTITY];
      const totalPriceNum = order[ActionKeys.PRICE];
      const pricePerUnitNum = totalPriceNum / quantityNum;
      const quantity = `${quantityNum.toLocaleString('en')}`;
      let pricePerUnit = `${pricePerUnitNum.toLocaleString('en', {
        maximumFractionDigits: 2,
        minimumFractionDigits: 2,
      })}`;
      let amount = `${totalPriceNum.toLocaleString('en')}`;
      if (order[OrderKeys.DATA]?.[OrderKeys.DATA__ENABLE_NEGOTIATION]) {
        pricePerUnit = `${
          order[OrderKeys.DATA]?.[OrderKeys.DATA__NEGOTIATIONS]?.[0]
            ? order[OrderKeys.DATA]?.[OrderKeys.DATA__NEGOTIATIONS]?.[0]?.[
                'pricePerUnit'
              ].toLocaleString('en')
            : 'Undecided'
        }`;
        amount = `${
          order[OrderKeys.DATA]?.[OrderKeys.DATA__NEGOTIATIONS]?.[0]
            ? (
                order[OrderKeys.DATA]?.[OrderKeys.DATA__NEGOTIATIONS]?.[0]?.[
                  'pricePerUnit'
                ] * order[ActionKeys.QUANTITY]
              ).toLocaleString('en')
            : 'Undecided'
        }`;
      }
      const assetCurrency = retrieveTokenCurrency(token, tokenAssetClass);
      const assetCurrencyLabel = assetCurrency ? ` ${assetCurrency}` : '';
      const tokenUnit = this.assetDataService.retrieveTokenUnit(
        token,
        tokenAssetClass,
      );

      const {
        subject,
        fromEmail,
        fromName,
        messageTitle,
        message,
        buttonLabel,
        logo,
        color,
        messageFooter,
        poweredBy,
      } = await this.apiMetadataCallService.buildMailBody({
        tenantId,
        key: 'NOTIFY_RECIPIENT_APPROVED_TRADE_ORDER_REJECTED',
        elements: {
          buyerFirstName,
          buyerName,
          sellerName,
          assetName,
          quantity,
          amount,
          pricePerUnit,
          assetCurrencyLabel,
          tokenUnit,
          comment: comment ?? 'N/A', // This cannot be an empty string, metadata-api will throw error
        },
      });

      const emailData = {
        toEmail: buyer[UserKeys.EMAIL],
        toName: buyerName,
        fromEmail,
        fromName,
        subject,
        templateId: MAILJET_TEMPLATE_ID,
        variables: {
          logo,
          color,
          messageFooter,
          poweredBy,
          messageTitle,
          message,
          buttonLabel,
          buttonHref: orderUrl,
        },
      };

      const requestConfig: AxiosRequestConfig =
        await this.craftAxiosRequestConfig(authToken);

      const response = await this.mailing.post(
        '/send',
        removeNil(emailData),
        requestConfig,
      );

      this.apiCallHelperService.checkRequestResponseCode(
        'error sending email',
        response,
      );
    } catch (error) {
      ErrorService.throwApiCallError(
        'notifyRecipientApprovedTradeOrderRejected',
        API_NAME,
        error,
      );
    }
  }

  /**
   * [notifyIssuerSubmittedTradeOrderRejected]
   */
  async notifyIssuerSubmittedTradeOrderRejected(
    tenantId: string,
    issuer: User,
    seller: User,
    buyer: User,
    order: Order,
    token: Token,
    authToken: string,
  ) {
    try {
      if (isE2eTestUser(issuer)) {
        return; // We don't want to send emails to fake users created as part of e2e tests
      }

      const appUrl = await this.craftAppUrl(tenantId);
      const orderUrl = `${appUrl}/order/${order[ActionKeys.ID]}`;
      const buyerName = this.getUserEmailFullName(buyer);
      const sellerName = this.getUserEmailFullName(seller);

      const {
        subject,
        fromEmail,
        fromName,
        messageTitle,
        message,
        buttonLabel,
        logo,
        color,
        messageFooter,
        poweredBy,
      } = await this.apiMetadataCallService.buildMailBody({
        tenantId,
        key: 'NOTIFY_ISSUER_APPROVED_TRADE_ORDER_REJECTED',
        elements: {
          issuerFirstName: issuer[UserKeys.FIRST_NAME],
          buyerName,
          sellerName,
          assetName: token[TokenKeys.NAME],
          quantity: `${order[ActionKeys.QUANTITY]}`,
        },
      });

      const emailData = {
        toEmail: issuer[UserKeys.EMAIL],
        toName: this.getUserEmailFullName(issuer),
        fromEmail,
        fromName,
        subject,
        templateId: MAILJET_TEMPLATE_ID,
        variables: {
          logo,
          color,
          messageFooter,
          poweredBy,
          messageTitle,
          message,
          buttonLabel,
          buttonHref: orderUrl,
        },
      };

      const requestConfig: AxiosRequestConfig =
        await this.craftAxiosRequestConfig(authToken);

      const response = await this.mailing.post(
        '/send',
        removeNil(emailData),
        requestConfig,
      );

      this.apiCallHelperService.checkRequestResponseCode(
        'error sending email',
        response,
      );
    } catch (error) {
      ErrorService.throwApiCallError(
        'notifyIssuerSubmittedTradeOrderRejected',
        API_NAME,
        error,
      );
    }
  }

  /**
   * [notifySenderNegotiationLaunched]
   */
  async notifySenderNegotiationLaunched(
    tenantId: string,
    seller: User,
    buyer: User,
    order: Order,
    token: Token,
    tokenAssetClass: string,
    authToken: string,
  ) {
    try {
      if (isE2eTestUser(seller)) {
        return; // We don't want to send emails to fake users created as part of e2e tests
      }

      const appUrl = await this.craftAppUrl(tenantId);
      const orderUrl = `${appUrl}/order/${order[ActionKeys.ID]}`;
      const buyerName = this.getUserEmailFullName(buyer);
      const sellerName = this.getUserEmailFullName(seller);
      const sellerFirstName = `${seller[UserKeys.FIRST_NAME]}`;
      const assetName = token[TokenKeys.NAME];
      const quantityNum = order[ActionKeys.QUANTITY];
      const totalPriceNum = order[ActionKeys.PRICE];
      const quantity = `${quantityNum.toLocaleString('en')}`;
      const amount = `${totalPriceNum.toLocaleString('en')}`;
      const pricePerUnit = `${
        order[OrderKeys.DATA]?.[OrderKeys.DATA__NEGOTIATIONS]?.[0]?.[
          'pricePerUnit'
        ] &&
        order[OrderKeys.DATA]?.[OrderKeys.DATA__NEGOTIATIONS]?.[0]?.[
          'pricePerUnit'
        ] !== 0
          ? order[OrderKeys.DATA][OrderKeys.DATA__NEGOTIATIONS]?.[0]?.[
              'pricePerUnit'
            ].toLocaleString('en')
          : 'Undecided'
      }`;
      const assetCurrency = retrieveTokenCurrency(token, tokenAssetClass);
      const assetCurrencyLabel = assetCurrency ? ` ${assetCurrency}` : '';
      const tokenUnit = this.assetDataService.retrieveTokenUnit(
        token,
        tokenAssetClass,
      );

      const withOrWithout =
        order[OrderKeys.DATA]?.[OrderKeys.DATA__NEGOTIATION_HOLD_REQUESTED] ===
        true
          ? 'with'
          : 'without';

      const {
        subject,
        fromEmail,
        fromName,
        messageTitle,
        message,
        buttonLabel,
        logo,
        color,
        messageFooter,
        poweredBy,
      } = await this.apiMetadataCallService.buildMailBody({
        tenantId,
        key: 'NOTIFY_SENDER_NON_BINDING_ENQUIRY_SUBMITTED',
        elements: {
          sellerFirstName,
          buyerName,
          sellerName,
          assetName,
          quantity,
          amount,
          pricePerUnit,
          tokenUnit,
          assetCurrencyLabel,
          withOrWithout,
        },
      });

      const emailData = {
        toEmail: seller[UserKeys.EMAIL],
        toName: this.getUserEmailFullName(seller),
        fromEmail,
        fromName,
        subject,
        templateId: MAILJET_TEMPLATE_ID,
        variables: {
          logo,
          color,
          messageFooter,
          poweredBy,
          messageTitle,
          message,
          buttonLabel,
          buttonHref: orderUrl,
        },
      };

      const requestConfig: AxiosRequestConfig =
        await this.craftAxiosRequestConfig(authToken);

      const response = await this.mailing.post(
        '/send',
        removeNil(emailData),
        requestConfig,
      );

      this.apiCallHelperService.checkRequestResponseCode(
        'error sending email',
        response,
      );
    } catch (error) {
      ErrorService.throwApiCallError(
        'notifySenderNegotiationLaunched',
        API_NAME,
        error,
      );
    }
  }

  /**
   * [notifyRecipientNegotiationHoldGranted]
   */
  async notifyRecipientNegotiationHoldGranted(
    tenantId: string,
    seller: User,
    buyer: User,
    order: Order,
    token: Token,
    tokenAssetClass: string,
    authToken: string,
  ) {
    try {
      if (isE2eTestUser(buyer)) {
        return; // We don't want to send emails to fake users created as part of e2e tests
      }

      const appUrl = await this.craftAppUrl(tenantId);
      const orderUrl = `${appUrl}/order/${order[ActionKeys.ID]}`;
      const buyerName = this.getUserEmailFullName(buyer);
      const sellerName = this.getUserEmailFullName(seller);
      const buyerFirstName = buyer[UserKeys.FIRST_NAME];
      const assetCurrency = retrieveTokenCurrency(token, tokenAssetClass);
      const assetCurrencyLabel = assetCurrency ? ` ${assetCurrency}` : '';
      const assetName = token[TokenKeys.NAME];
      const quantityNum = order[ActionKeys.QUANTITY];
      const totalPriceNum = order[ActionKeys.PRICE];
      const pricePerUnitNum = totalPriceNum / quantityNum;
      const pricePerUnit = `${pricePerUnitNum.toLocaleString('en', {
        maximumFractionDigits: 2,
        minimumFractionDigits: 2,
      })}`;
      const quantity = `${quantityNum.toLocaleString('en')}`;
      const amount = `${totalPriceNum.toLocaleString('en')}`;
      const tokenUnit = this.assetDataService.retrieveTokenUnit(
        token,
        tokenAssetClass,
      );

      const {
        subject,
        fromEmail,
        fromName,
        messageTitle,
        message,
        buttonLabel,
        logo,
        color,
        messageFooter,
        poweredBy,
      } = await this.apiMetadataCallService.buildMailBody({
        tenantId,
        key: 'NOTIFY_RECIPIENT_NON_BINDING_ENQUIRY_HOLD_GRANTED',
        elements: {
          buyerFirstName,
          buyerName,
          sellerName,
          assetName,
          quantity,
          pricePerUnit,
          amount,
          assetCurrencyLabel,
          tokenUnit,
        },
      });

      const emailData = {
        toEmail: buyer[UserKeys.EMAIL],
        toName: this.getUserEmailFullName(buyer),
        fromEmail,
        fromName,
        subject,
        templateId: MAILJET_TEMPLATE_ID,
        variables: {
          logo,
          color,
          messageFooter,
          poweredBy,
          messageTitle,
          message,
          buttonLabel,
          buttonHref: orderUrl,
        },
      };

      const requestConfig: AxiosRequestConfig =
        await this.craftAxiosRequestConfig(authToken);

      const response = await this.mailing.post(
        '/send',
        removeNil(emailData),
        requestConfig,
      );

      this.apiCallHelperService.checkRequestResponseCode(
        'error sending email',
        response,
      );
    } catch (error) {
      ErrorService.throwApiCallError(
        'notifyRecipientNegotiationHoldGranted',
        API_NAME,
        error,
      );
    }
  }

  /**
   * [notifyRecipientNegotiationUpdated]
   */
  async notifyRecipientNegotiationUpdated(
    tenantId: string,
    seller: User,
    buyer: User,
    order: Order,
    token: Token,
    tokenAssetClass: string,
    authToken: string,
  ) {
    try {
      if (isE2eTestUser(buyer)) {
        return; // We don't want to send emails to fake users created as part of e2e tests
      }

      const appUrl = await this.craftAppUrl(tenantId);
      const orderUrl = `${appUrl}/order/${order[ActionKeys.ID]}`;
      const buyerName = this.getUserEmailFullName(buyer);
      const buyerFirstName = buyer[UserKeys.FIRST_NAME];
      const sellerName = this.getUserEmailFullName(seller);

      const assetCurrency = retrieveTokenCurrency(token, tokenAssetClass);
      const assetCurrencyLabel = assetCurrency ? ` ${assetCurrency}` : '';
      const assetName = token[TokenKeys.NAME];
      const quantity = `${order[ActionKeys.QUANTITY].toLocaleString('en')}`;
      const pricePerUnit = `${order[OrderKeys.DATA]?.[
        OrderKeys.DATA__NEGOTIATIONS
      ]?.[0]?.['pricePerUnit'].toLocaleString('en')}`;
      const amount = `${(
        order[ActionKeys.QUANTITY] *
        order[OrderKeys.DATA]?.[OrderKeys.DATA__NEGOTIATIONS]?.[0]?.[
          'pricePerUnit'
        ]
      ).toLocaleString('en')}`;
      const tokenUnit = this.assetDataService.retrieveTokenUnit(
        token,
        tokenAssetClass,
      );

      const {
        subject,
        fromEmail,
        fromName,
        messageTitle,
        message,
        buttonLabel,
        logo,
        color,
        messageFooter,
        poweredBy,
      } = await this.apiMetadataCallService.buildMailBody({
        tenantId,
        key: 'NOTIFY_RECIPIENT_NON_BINDING_ENQUIRY_UPDATED',
        elements: {
          buyerFirstName,
          buyerName,
          sellerName,
          assetName,
          quantity,
          pricePerUnit,
          amount,
          assetCurrencyLabel,
          tokenUnit,
        },
      });

      const emailData = {
        toEmail: buyer[UserKeys.EMAIL],
        toName: this.getUserEmailFullName(buyer),
        fromEmail,
        fromName,
        subject,
        templateId: MAILJET_TEMPLATE_ID,
        variables: {
          logo,
          color,
          messageFooter,
          poweredBy,
          messageTitle,
          message,
          buttonLabel,
          buttonHref: orderUrl,
        },
      };

      const requestConfig: AxiosRequestConfig =
        await this.craftAxiosRequestConfig(authToken);

      const response = await this.mailing.post(
        '/send',
        removeNil(emailData),
        requestConfig,
      );

      this.apiCallHelperService.checkRequestResponseCode(
        'error sending email',
        response,
      );
    } catch (error) {
      ErrorService.throwApiCallError(
        'notifyRecipientNegotiationUpdated',
        API_NAME,
        error,
      );
    }
  }

  /**
   * [notifySenderTradeOrderAccepted]
   */
  async notifySenderTradeOrderAccepted(
    tenantId: string,
    seller: User,
    buyer: User,
    order: Order,
    token: Token,
    tokenAssetClass: string,
    authToken: string,
  ) {
    try {
      if (isE2eTestUser(seller)) {
        return; // We don't want to send emails to fake users created as part of e2e tests
      }

      const appUrl = await this.craftAppUrl(tenantId);
      const orderUrl = `${appUrl}/order/${order[ActionKeys.ID]}`;
      const buyerName = this.getUserEmailFullName(buyer);
      const sellerName = this.getUserEmailFullName(seller);
      const sellerFirstName = `${seller[UserKeys.FIRST_NAME]}`;
      const assetName = token[TokenKeys.NAME];
      const quantityNum = order[ActionKeys.QUANTITY];
      const totalPriceNum = order[ActionKeys.PRICE];
      const pricePerUnitNum = totalPriceNum / quantityNum;
      const pricePerUnit = `${pricePerUnitNum.toLocaleString('en', {
        maximumFractionDigits: 2,
        minimumFractionDigits: 2,
      })}`;
      const amount = `${totalPriceNum.toLocaleString('en')}`;
      const quantityOrAmount = `${quantityNum.toLocaleString('en')}`;
      const assetCurrency = retrieveTokenCurrency(token, tokenAssetClass);
      const assetCurrencyLabel = assetCurrency ? ` ${assetCurrency}` : '';
      const tokenUnit = this.assetDataService.retrieveTokenUnit(
        token,
        tokenAssetClass,
      );

      const {
        subject,
        fromEmail,
        fromName,
        messageTitle,
        message,
        buttonLabel,
        logo,
        color,
        messageFooter,
        poweredBy,
      } = await this.apiMetadataCallService.buildMailBody({
        tenantId,
        key: 'NOTIFY_SENDER_TRADE_ORDER_ACCEPTED',
        elements: {
          sellerFirstName,
          buyerName,
          sellerName,
          assetName,
          quantityOrAmount,
          pricePerUnit,
          amount,
          assetCurrencyLabel,
          tokenUnit,
        },
      });

      const emailData = {
        toEmail: `${seller[UserKeys.EMAIL]}`,
        toName: this.getUserEmailFullName(seller),
        fromEmail,
        fromName,
        subject,
        templateId: MAILJET_TEMPLATE_ID,
        variables: {
          logo,
          color,
          messageFooter,
          poweredBy,
          messageTitle,
          message,
          buttonLabel,
          buttonHref: orderUrl,
        },
      };

      const requestConfig: AxiosRequestConfig =
        await this.craftAxiosRequestConfig(authToken);

      const response = await this.mailing.post(
        '/send',
        removeNil(emailData),
        requestConfig,
      );

      this.apiCallHelperService.checkRequestResponseCode(
        'error sending email',
        response,
      );
    } catch (error) {
      ErrorService.throwApiCallError(
        'notifySenderTradeOrderAccepted',
        API_NAME,
        error,
      );
    }
  }

  /**
   * [notifyRecipientNegotiationHoldRejected]
   */
  async notifyRecipientNegotiationHoldRejected(
    tenantId: string,
    seller: User,
    buyer: User,
    order: Order,
    token: Token,
    tokenAssetClass: string,
    comment: string,
    authToken: string,
  ) {
    try {
      if (isE2eTestUser(buyer)) {
        return; // We don't want to send emails to fake users created as part of e2e tests
      }

      const appUrl = await this.craftAppUrl(tenantId);
      const orderUrl = `${appUrl}/order/${order[ActionKeys.ID]}`;
      const buyerName = this.getUserEmailFullName(buyer);
      const buyerFirstName = buyer[UserKeys.FIRST_NAME];
      const sellerName = this.getUserEmailFullName(seller);
      const assetName = token[TokenKeys.NAME];
      const quantityNum = order[ActionKeys.QUANTITY];
      const totalPriceNum = order[ActionKeys.PRICE];
      const pricePerUnitNum = totalPriceNum / quantityNum;
      const pricePerUnit = `${pricePerUnitNum.toLocaleString('en', {
        maximumFractionDigits: 2,
        minimumFractionDigits: 2,
      })}`;
      const quantity = `${quantityNum.toLocaleString('en')}`;
      const amount = `${totalPriceNum.toLocaleString('en')}`;
      const tokenUnit = this.assetDataService.retrieveTokenUnit(
        token,
        tokenAssetClass,
      );
      const assetCurrency = retrieveTokenCurrency(token, tokenAssetClass);
      const assetCurrencyLabel = assetCurrency ? ` ${assetCurrency}` : '';

      const {
        subject,
        fromEmail,
        fromName,
        messageTitle,
        message,
        buttonLabel,
        logo,
        color,
        messageFooter,
        poweredBy,
      } = await this.apiMetadataCallService.buildMailBody({
        tenantId,
        key: 'NOTIFY_RECIPIENT_NON_BINDING_ENQUIRY_HOLD_REJECTED',
        elements: {
          buyerFirstName,
          buyerName,
          sellerName,
          assetName,
          quantity,
          pricePerUnit,
          amount,
          assetCurrencyLabel,
          tokenUnit,
          comment: comment ?? 'N/A', // This cannot be an empty string, metadata-api will throw error
        },
      });

      const emailData = {
        toEmail: `${buyer[UserKeys.EMAIL]}`,
        toName: this.getUserEmailFullName(buyer),
        fromEmail,
        fromName,
        subject,
        templateId: MAILJET_TEMPLATE_ID,
        variables: {
          logo,
          color,
          messageFooter,
          poweredBy,
          messageTitle,
          message,
          buttonLabel,
          buttonHref: orderUrl,
        },
      };

      const requestConfig: AxiosRequestConfig =
        await this.craftAxiosRequestConfig(authToken);

      const response = await this.mailing.post(
        '/send',
        removeNil(emailData),
        requestConfig,
      );

      this.apiCallHelperService.checkRequestResponseCode(
        'error sending email',
        response,
      );
    } catch (error) {
      ErrorService.throwApiCallError(
        'notifyRecipientNegotiationHoldRejected',
        API_NAME,
        error,
      );
    }
  }

  /**
   * [Sends email to admin containing registration link to join the platform the first time]
   */
  async sendPlatformInviteAdminMail(
    tenantId: string,
    tenantName: string,
    admin: User,
    isUserInvited: boolean,
    authToken: string,
  ) {
    try {
      if (isE2eTestUser(admin)) {
        return; // We don't want to send emails to fake users created as part of e2e tests
      }

      let buttonHref;

      if (isUserInvited) {
        const appUrl = await this.craftAppUrl(tenantId);
        buttonHref = `${appUrl}/${admin[
          UserKeys.USER_TYPE
        ].toLowerCase()}/auth?email=${
          admin[UserKeys.EMAIL]
        }&screen_hint=signin`;
      } else {
        buttonHref = await this.craftRegistrationLink(
          tenantId,
          admin[UserKeys.EMAIL],
          admin[UserKeys.USER_TYPE],
          admin[UserKeys.FIRST_CONNECTION_CODE],
        );
      }

      const adminName = this.getUserEmailFullName(admin);

      const emailData = {
        toEmail: admin[UserKeys.EMAIL],
        toName: adminName,
        templateId: MAILJET_ADMIN_TEMPLATE_ID,
        variables: {
          adminName,
          buttonHref,
          tenantName,
        },
      };

      const requestConfig: AxiosRequestConfig =
        await this.craftAxiosRequestConfig(authToken);

      const response = await this.mailing.post(
        '/send',
        removeNil(emailData),
        requestConfig,
      );

      this.apiCallHelperService.checkRequestResponseCode(
        'error sending email',
        response,
      );
    } catch (error) {
      ErrorService.throwApiCallError(
        'sendPlatformInviteAdminMail',
        API_NAME,
        error,
      );
    }
  }

  /**
   * [Sends email to investor when issuer create corporate action]
   */
  async notifyInvestorEventCreated(
    tenantId: string,
    issuer: User,
    investors: Array<User>,
    token: Token,
    eventType: string,
    authToken: string,
  ) {
    try {
      const appUrl = await this.craftAppUrl(tenantId);
      const eventUrl = `${appUrl}/investment-products/${
        token[TokenKeys.TOKEN_ID]
      }`;
      const issuerName = this.getUserEmailFullName(issuer);

      investors.forEach(async (investor) => {
        if (isE2eTestUser(investor)) {
          return; // We don't want to send emails to fake users created as part of e2e tests
        }

        const {
          subject,
          fromEmail,
          fromName,
          messageTitle,
          message,
          buttonLabel,
          logo,
          color,
          messageFooter,
          poweredBy,
        } = await this.apiMetadataCallService.buildMailBody({
          tenantId,
          key: 'NOTIFY_INVESTOR_EVENT_CREATED',
          elements: {
            investorFirstName: investor[UserKeys.FIRST_NAME],
            issuerName,
            assetName: token[TokenKeys.NAME],
            eventType,
          },
        });

        const emailData = {
          toEmail: investor[UserKeys.EMAIL],
          toName: investor[UserKeys.FIRST_NAME],
          fromEmail,
          fromName,
          subject,
          templateId: MAILJET_TEMPLATE_ID,
          variables: {
            logo,
            color,
            messageFooter,
            poweredBy,
            messageTitle,
            message,
            buttonLabel,
            buttonHref: eventUrl,
          },
        };

        const requestConfig: AxiosRequestConfig =
          await this.craftAxiosRequestConfig(authToken);

        const response = await this.mailing.post(
          '/send',
          removeNil(emailData),
          requestConfig,
        );

        this.apiCallHelperService.checkRequestResponseCode(
          'error sending email',
          response,
        );
      });
    } catch (error) {
      ErrorService.throwApiCallError(
        'notifyInvestorEventCreated',
        API_NAME,
        error,
      );
    }
  }

  /**
   * [Sends email to investor when issuer settle corporate action]
   */
  async notifyInvestorEventSettled(
    tenantId: string,
    issuer: User,
    investors: Array<User>,
    eventType: string,
    token: Token,
    authToken: string,
  ) {
    try {
      const appUrl = await this.craftAppUrl(tenantId);
      const eventUrl = `${appUrl}/investment-products/${
        token[TokenKeys.TOKEN_ID]
      }`;
      const issuerName = this.getUserEmailFullName(issuer);

      investors.forEach(async (investor) => {
        if (isE2eTestUser(investor)) {
          return; // We don't want to send emails to fake users created as part of e2e tests
        }

        const {
          subject,
          fromEmail,
          fromName,
          messageTitle,
          message,
          buttonLabel,
          logo,
          color,
          messageFooter,
          poweredBy,
        } = await this.apiMetadataCallService.buildMailBody({
          tenantId,
          key: 'NOTIFY_INVESTOR_EVENT_SETTLED',
          elements: {
            investorFirstName: investor[UserKeys.FIRST_NAME],
            issuerName,
            assetName: token[TokenKeys.NAME],
            eventType,
          },
        });

        const emailData = {
          toEmail: issuer[UserKeys.EMAIL],
          toName: this.getUserEmailFullName(issuer),
          fromEmail,
          fromName,
          subject,
          templateId: MAILJET_TEMPLATE_ID,
          variables: {
            logo,
            color,
            messageFooter,
            poweredBy,
            messageTitle,
            message,
            buttonLabel,
            buttonHref: eventUrl,
          },
        };

        const requestConfig: AxiosRequestConfig =
          await this.craftAxiosRequestConfig(authToken);

        const response = await this.mailing.post(
          '/send',
          removeNil(emailData),
          requestConfig,
        );

        this.apiCallHelperService.checkRequestResponseCode(
          'error sending email',
          response,
        );
      });
    } catch (error) {
      ErrorService.throwApiCallError(
        'notifyInvestorEventSettled',
        API_NAME,
        error,
      );
    }
  }
  /**
   * [Sends email to investor when issuer cancel corporate action]
   */
  async notifyInvestorEventCanceled(
    tenantId: string,
    issuer: User,
    investors: Array<User>,
    eventType: string,
    token: Token,
    authToken: string,
  ) {
    try {
      const appUrl = await this.craftAppUrl(tenantId);
      const eventUrl = `${appUrl}/investment-products/${
        token[TokenKeys.TOKEN_ID]
      }`;
      const issuerName = this.getUserEmailFullName(issuer);

      investors.forEach(async (investor) => {
        if (isE2eTestUser(investor)) {
          return; // We don't want to send emails to fake users created as part of e2e tests
        }

        const {
          subject,
          fromEmail,
          fromName,
          messageTitle,
          message,
          buttonLabel,
          logo,
          color,
          messageFooter,
          poweredBy,
        } = await this.apiMetadataCallService.buildMailBody({
          tenantId,
          key: 'NOTIFY_INVESTOR_EVENT_CANCELED',
          elements: {
            investorFirstName: investor[UserKeys.FIRST_NAME],
            issuerName,
            assetName: token[TokenKeys.NAME],
            eventType,
          },
        });

        const emailData = {
          toEmail: issuer[UserKeys.EMAIL],
          toName: this.getUserEmailFullName(issuer),
          fromEmail,
          fromName,
          subject,
          templateId: MAILJET_TEMPLATE_ID,
          variables: {
            logo,
            color,
            messageFooter,
            poweredBy,
            messageTitle,
            message,
            buttonLabel,
            buttonHref: eventUrl,
          },
        };

        const requestConfig: AxiosRequestConfig =
          await this.craftAxiosRequestConfig(authToken);

        const response = await this.mailing.post(
          '/send',
          removeNil(emailData),
          requestConfig,
        );

        this.apiCallHelperService.checkRequestResponseCode(
          'error sending email',
          response,
        );
      });
    } catch (error) {
      ErrorService.throwApiCallError(
        'notifyInvestorEventCanceled',
        API_NAME,
        error,
      );
    }
  }

  /**
   * [notifyInvestorListingStatus]
   */
  async notifyInvestorListingStatus(
    tenantId: string,
    investor: User,
    offer: Offer,
    token: Token,
    listingStatus: ListingStatus,
    authToken: string,
  ) {
    try {
      if (isE2eTestUser(investor)) {
        return;
      }

      const appUrl = await this.craftAppUrl(tenantId);
      const portfolioUrl = `${appUrl}/portfolio`;

      const sellerFirstName = investor[UserKeys.FIRST_NAME];
      const marketplace = offer[OfferKeys.DATA][OfferKeys.DATA__MARKETPLACE];
      const quantityNum = offer[OfferKeys.QUANTITY];
      const quantityOrAmount = `${quantityNum.toLocaleString('en')}`;

      const assetName = token[TokenKeys.NAME];

      const toEmail = investor[UserKeys.EMAIL];
      const toName = this.getUserEmailFullName(investor);

      // Defining the key to build mail's body, according the ListingStatus on Marketplace
      let key;
      switch (listingStatus) {
        case ListingStatus.APPROVED:
          key = 'NOTIFY_SELLER_OFFER_APPROVED';
          break;
        case ListingStatus.PENDING:
          key = 'NOTIFY_SELLER_OFFER_PENDING';
          break;
        case ListingStatus.REJECTED:
          key = 'NOTIFY_SELLER_OFFER_REJECTED';
          break;
      }

      const {
        subject,
        fromEmail,
        fromName,
        messageTitle,
        message,
        buttonLabel,
        logo,
        color,
        messageFooter,
        poweredBy,
      } = await this.apiMetadataCallService.buildMailBody({
        tenantId,
        key,
        elements: {
          sellerFirstName,
          assetName,
          marketplace,
          quantityOrAmount,
        },
      });

      const emailData = {
        toEmail,
        toName,
        fromEmail,
        fromName,
        subject,
        templateId: MAILJET_TEMPLATE_ID,
        variables: {
          logo,
          color,
          messageFooter,
          poweredBy,
          messageTitle,
          message,
          buttonLabel,
          buttonHref: portfolioUrl,
        },
      };

      const requestConfig: AxiosRequestConfig =
        await this.craftAxiosRequestConfig(authToken);

      const response = await this.mailing.post(
        '/send',
        removeNil(emailData),
        requestConfig,
      );

      this.apiCallHelperService.checkRequestResponseCode(
        'error sending email',
        response,
      );
    } catch (error) {
      ErrorService.throwApiCallError(
        'notifyInvestorListingStatus',
        API_NAME,
        error,
      );
    }
  }

  /**
   * [Sends email to agent for successful pre creation of trade order]
   */
  async notifyAgentTradeOrderPrecreated(
    tenantId: string,
    agent: User,
    seller: User,
    token: Token,
    order: Action,
    authToken: string,
  ) {
    try {
      if (isE2eTestUser(agent)) {
        return; // We don't want to send emails to fake users created as part of e2e tests
      }

      const appUrl = await this.craftAppUrl(tenantId);
      const orderUrl = `${appUrl}/order/${order[ActionKeys.ID]}`;
      const agentFirstName = agent[UserKeys.FIRST_NAME];
      const sellerName = this.getUserEmailFullName(seller);

      const {
        subject,
        fromEmail,
        fromName,
        messageTitle,
        message,
        buttonLabel,
        logo,
        color,
        messageFooter,
        poweredBy,
      } = await this.apiMetadataCallService.buildMailBody({
        tenantId,
        key: 'NOTIFY_AGENT_TRADE_ORDER_PRE_CREATED',
        elements: {
          agentFirstName,
          sellerName,
          quantity: String(order[ActionKeys.QUANTITY]),
          assetName: token[TokenKeys.NAME],
        },
      });

      const emailData = {
        toEmail: agent[UserKeys.EMAIL],
        toName: agentFirstName,
        fromEmail,
        fromName,
        subject,
        templateId: MAILJET_TEMPLATE_ID,
        variables: {
          logo,
          color,
          messageFooter,
          poweredBy,
          messageTitle,
          message,
          buttonLabel,
          buttonHref: orderUrl,
        },
      };

      const requestConfig: AxiosRequestConfig =
        await this.craftAxiosRequestConfig(authToken);

      const response = await this.mailing.post(
        '/send',
        removeNil(emailData),
        requestConfig,
      );

      this.apiCallHelperService.checkRequestResponseCode(
        'error sending email',
        response,
      );
    } catch (error) {
      ErrorService.throwApiCallError(
        'sendIssuerOrderCreatedNotification',
        API_NAME,
        error,
      );
    }
  }

  /**
   * [Sends email to agent if seller doesn't have sufficient inventory]
   */
  async notifyAgentInsufficientInventory(
    tenantId: string,
    agent: User,
    seller: User,
    order: Action,
    token: Token,
    authToken: string,
  ) {
    try {
      if (isE2eTestUser(agent)) {
        return; // We don't want to send emails to fake users created as part of e2e tests
      }

      const appUrl = await this.craftAppUrl(tenantId);
      const orderUrl = `${appUrl}/order/${order[ActionKeys.ID]}`;
      const agentFirstName = agent[UserKeys.FIRST_NAME];
      const sellerName = this.getUserEmailFullName(seller);

      const {
        subject,
        fromEmail,
        fromName,
        messageTitle,
        message,
        buttonLabel,
        logo,
        color,
        messageFooter,
        poweredBy,
      } = await this.apiMetadataCallService.buildMailBody({
        tenantId,
        key: 'NOTIFY_AGENT_INSUFFICIENT_INVENTORY',
        elements: {
          agentFirstName,
          sellerName,
          quantity: String(order[ActionKeys.QUANTITY]),
          assetName: token[TokenKeys.NAME],
        },
      });

      const emailData = {
        toEmail: agent[UserKeys.EMAIL],
        toName: agentFirstName,
        fromEmail,
        fromName,
        subject,
        templateId: MAILJET_TEMPLATE_ID,
        variables: {
          logo,
          color,
          messageFooter,
          poweredBy,
          messageTitle,
          message,
          buttonLabel,
          buttonHref: orderUrl,
        },
      };

      const requestConfig: AxiosRequestConfig =
        await this.craftAxiosRequestConfig(authToken);

      const response = await this.mailing.post(
        '/send',
        removeNil(emailData),
        requestConfig,
      );

      this.apiCallHelperService.checkRequestResponseCode(
        'error sending email',
        response,
      );
    } catch (error) {
      ErrorService.throwApiCallError(
        'notifyAgentInsufficientInventory',
        API_NAME,
        error,
      );
    }
  }

  /**
   * [Sends email to agent if seller is not linked to the project]
   */
  async notifyAgentSellerNotLinkedToToken(
    tenantId: string,
    agent: User,
    seller: User,
    order: Order,
    token: Token,
    authToken: string,
  ) {
    try {
      if (isE2eTestUser(agent)) {
        return; // We don't want to send emails to fake users created as part of e2e tests
      }

      const appUrl = await this.craftAppUrl(tenantId);
      const orderUrl = `${appUrl}/order/${order[ActionKeys.ID]}`;
      const agentFirstName = agent[UserKeys.FIRST_NAME];
      const sellerName = this.getUserEmailFullName(seller);

      const {
        subject,
        fromEmail,
        fromName,
        messageTitle,
        message,
        buttonLabel,
        logo,
        color,
        messageFooter,
        poweredBy,
      } = await this.apiMetadataCallService.buildMailBody({
        tenantId,
        key: 'NOTIFY_AGENT_SELLER_NOT_LINKED_TO_TOKEN',
        elements: {
          agentFirstName,
          sellerName,
          assetName: token[TokenKeys.NAME],
        },
      });

      const emailData = {
        toEmail: agent[UserKeys.EMAIL],
        toName: agentFirstName,
        fromEmail,
        fromName,
        subject,
        templateId: MAILJET_TEMPLATE_ID,
        variables: {
          logo,
          color,
          messageFooter,
          poweredBy,
          messageTitle,
          message,
          buttonLabel,
          buttonHref: orderUrl,
        },
      };

      const requestConfig: AxiosRequestConfig =
        await this.craftAxiosRequestConfig(authToken);

      const response = await this.mailing.post(
        '/send',
        removeNil(emailData),
        requestConfig,
      );

      this.apiCallHelperService.checkRequestResponseCode(
        'error sending email',
        response,
      );
    } catch (error) {
      ErrorService.throwApiCallError(
        'notifyAgentSellerNotLinkedToToken',
        API_NAME,
        error,
      );
    }
  }
  /**
   * [Sends email to seller for new orders pre created by an agent]
   */
  async notifySellerTradeOrderPrecreated(
    tenantId: string,
    agent: User,
    seller: User,
    token: Token,
    order: Action,
    authToken: string,
  ) {
    try {
      if (isE2eTestUser(agent)) {
        return; // We don't want to send emails to fake users created as part of e2e tests
      }

      const appUrl = await this.craftAppUrl(tenantId);
      const orderUrl = `${appUrl}/order/${order[ActionKeys.ID]}`;
      const sellerFirstName = seller[UserKeys.FIRST_NAME];
      const agentName = this.getUserEmailFullName(agent);

      const {
        subject,
        fromEmail,
        fromName,
        messageTitle,
        message,
        buttonLabel,
        logo,
        color,
        messageFooter,
        poweredBy,
      } = await this.apiMetadataCallService.buildMailBody({
        tenantId,
        key: 'NOTIFY_SELLER_TRADE_ORDER_PRE_CREATED',
        elements: {
          sellerFirstName,
          agentName,
          quantity: String(order[ActionKeys.QUANTITY]),
          assetName: token[TokenKeys.NAME],
        },
      });

      const emailData = {
        toEmail: seller[UserKeys.EMAIL],
        toName: sellerFirstName,
        fromEmail,
        fromName,
        subject,
        templateId: MAILJET_TEMPLATE_ID,
        variables: {
          logo,
          color,
          messageFooter,
          poweredBy,
          messageTitle,
          message,
          buttonLabel,
          buttonHref: orderUrl,
        },
      };

      const requestConfig: AxiosRequestConfig =
        await this.craftAxiosRequestConfig(authToken);

      const response = await this.mailing.post(
        '/send',
        removeNil(emailData),
        requestConfig,
      );

      this.apiCallHelperService.checkRequestResponseCode(
        'error sending email',
        response,
      );
    } catch (error) {
      ErrorService.throwApiCallError(
        'notifySellerTradeOrderPrecreated',
        API_NAME,
        error,
      );
    }
  }

  /**
   * [Sends email to seller on successful approval of the pre created trade order]
   */
  async notifySellerPrecreatedTradeOrderApproved(
    tenantId: string,
    agent: User,
    seller: User,
    order: Order,
    token: Token,
    authToken: string,
  ) {
    try {
      if (isE2eTestUser(seller)) {
        return; // We don't want to send emails to fake users created as part of e2e tests
      }

      const appUrl = await this.craftAppUrl(tenantId);
      const orderUrl = `${appUrl}/order/${order[ActionKeys.ID]}`;
      const agentName = this.getUserEmailFullName(agent);
      const sellerFirstName = seller[UserKeys.FIRST_NAME];

      const {
        subject,
        fromEmail,
        fromName,
        messageTitle,
        message,
        buttonLabel,
        logo,
        color,
        messageFooter,
        poweredBy,
      } = await this.apiMetadataCallService.buildMailBody({
        tenantId,
        key: 'NOTIFY_SELLER_PRECREATED_ORDER_APPROVED',
        elements: {
          sellerFirstName,
          agentName,
          quantity: String(order[ActionKeys.QUANTITY]),
          assetName: token[TokenKeys.NAME],
        },
      });

      const emailData = {
        toEmail: seller[UserKeys.EMAIL],
        toName: sellerFirstName,
        fromEmail,
        fromName,
        subject,
        templateId: MAILJET_TEMPLATE_ID,
        variables: {
          logo,
          color,
          messageFooter,
          poweredBy,
          messageTitle,
          message,
          buttonLabel,
          buttonHref: orderUrl,
        },
      };

      const requestConfig: AxiosRequestConfig =
        await this.craftAxiosRequestConfig(authToken);

      const response = await this.mailing.post(
        '/send',
        removeNil(emailData),
        requestConfig,
      );

      this.apiCallHelperService.checkRequestResponseCode(
        'error sending email',
        response,
      );
    } catch (error) {
      ErrorService.throwApiCallError(
        'notifySellerPrecreatedTradeOrderApproved',
        API_NAME,
        error,
      );
    }
  }

  /**
   * [Sends email to agent after approval by the seller for order pre created by agent]
   */
  async notifyAgentTradeOrderApproved(
    tenantId: string,
    agent: User,
    seller: User,
    order: Order,
    token: Token,
    authToken: string,
  ) {
    try {
      if (isE2eTestUser(agent)) {
        return; // We don't want to send emails to fake users created as part of e2e tests
      }

      const appUrl = await this.craftAppUrl(tenantId);
      const orderUrl = `${appUrl}/order/${order[ActionKeys.ID]}`;
      const agentFirstName = agent[UserKeys.FIRST_NAME];
      const sellerName = this.getUserEmailFullName(seller);

      const {
        subject,
        fromEmail,
        fromName,
        messageTitle,
        message,
        buttonLabel,
        logo,
        color,
        messageFooter,
        poweredBy,
      } = await this.apiMetadataCallService.buildMailBody({
        tenantId,
        key: 'NOTIFY_AGENT_TRADE_ORDER_APPROVED',
        elements: {
          agentFirstName,
          sellerName,
          quantity: String(order[ActionKeys.QUANTITY]),
          assetName: token[TokenKeys.NAME],
        },
      });

      const emailData = {
        toEmail: agent[UserKeys.EMAIL],
        toName: agentFirstName,
        fromEmail,
        fromName,
        subject,
        templateId: MAILJET_TEMPLATE_ID,
        variables: {
          logo,
          color,
          messageFooter,
          poweredBy,
          messageTitle,
          message,
          buttonLabel,
          buttonHref: orderUrl,
        },
      };

      const requestConfig: AxiosRequestConfig =
        await this.craftAxiosRequestConfig(authToken);

      const response = await this.mailing.post(
        '/send',
        removeNil(emailData),
        requestConfig,
      );

      this.apiCallHelperService.checkRequestResponseCode(
        'error sending email',
        response,
      );
    } catch (error) {
      ErrorService.throwApiCallError(
        'notifyAgentTradeOrderApproved',
        API_NAME,
        error,
      );
    }
  }

  /**
   * [Sends email to buyer after approval by the seller for order pre created by agent]
   */
  async notifyBuyerPrecreatedOrderApproved(
    tenantId: string,
    agent: User,
    seller: User,
    buyer: User,
    order: Order,
    token: Token,
    authToken: string,
  ) {
    try {
      if (isE2eTestUser(agent)) {
        return; // We don't want to send emails to fake users created as part of e2e tests
      }

      const appUrl = await this.craftAppUrl(tenantId);
      const orderUrl = `${appUrl}/order/${order[ActionKeys.ID]}`;
      const agentName = this.getUserEmailFullName(agent);
      const buyerFirstName = buyer[UserKeys.FIRST_NAME];
      const sellerFirstName = seller[UserKeys.FIRST_NAME];

      const {
        subject,
        fromEmail,
        fromName,
        messageTitle,
        message,
        buttonLabel,
        logo,
        color,
        messageFooter,
        poweredBy,
      } = await this.apiMetadataCallService.buildMailBody({
        tenantId,
        key: 'NOTIFY_BUYER_TRADE_ORDER_APPROVED',
        elements: {
          buyerFirstName,
          sellerFirstName,
          agentName,
          quantity: String(order[ActionKeys.QUANTITY]),
          assetName: token[TokenKeys.NAME],
        },
      });

      const emailData = {
        toEmail: buyer[UserKeys.EMAIL],
        toName: buyerFirstName,
        fromEmail,
        fromName,
        subject,
        templateId: MAILJET_TEMPLATE_ID,
        variables: {
          logo,
          color,
          messageFooter,
          poweredBy,
          messageTitle,
          message,
          buttonLabel,
          buttonHref: orderUrl,
        },
      };

      const requestConfig: AxiosRequestConfig =
        await this.craftAxiosRequestConfig(authToken);

      const response = await this.mailing.post(
        '/send',
        removeNil(emailData),
        requestConfig,
      );

      this.apiCallHelperService.checkRequestResponseCode(
        'error sending email',
        response,
      );
    } catch (error) {
      ErrorService.throwApiCallError(
        'notifyBuyerPrecreatedOrderApproved',
        API_NAME,
        error,
      );
    }
  }

  /**
   * [Sends email to agent after acceptance by the buyer for order pre created by agent]
   */
  async notifyAgentTradeOrderAccepted(
    tenantId: string,
    agent: any,
    buyer: User,
    order: Order,
    token: Token,
    authToken: string,
  ) {
    try {
      if (isE2eTestUser(agent)) {
        return; // We don't want to send emails to fake users created as part of e2e tests
      }

      const appUrl = await this.craftAppUrl(tenantId);
      const orderUrl = `${appUrl}/order/${order[ActionKeys.ID]}`;
      const agentFirstName = agent[UserKeys.FIRST_NAME];
      const buyerName = this.getUserEmailFullName(buyer);

      const {
        subject,
        fromEmail,
        fromName,
        messageTitle,
        message,
        buttonLabel,
        logo,
        color,
        messageFooter,
        poweredBy,
      } = await this.apiMetadataCallService.buildMailBody({
        tenantId,
        key: 'NOTIFY_AGENT_TRADE_ORDER_ACCEPTED',
        elements: {
          agentFirstName,
          buyerName,
          quantity: String(order[ActionKeys.QUANTITY]),
          assetName: token[TokenKeys.NAME],
        },
      });

      const emailData = {
        toEmail: agent[UserKeys.EMAIL],
        toName: agentFirstName,
        fromEmail,
        fromName,
        subject,
        templateId: MAILJET_TEMPLATE_ID,
        variables: {
          logo,
          color,
          messageFooter,
          poweredBy,
          messageTitle,
          message,
          buttonLabel,
          buttonHref: orderUrl,
        },
      };

      const requestConfig: AxiosRequestConfig =
        await this.craftAxiosRequestConfig(authToken);

      const response = await this.mailing.post(
        '/send',
        removeNil(emailData),
        requestConfig,
      );

      this.apiCallHelperService.checkRequestResponseCode(
        'error sending email',
        response,
      );
    } catch (error) {
      ErrorService.throwApiCallError(
        'notifyAgentTradeOrderAccepted',
        API_NAME,
        error,
      );
    }
  }

  /**
   * [Sends email to agent after seller cancels/rejects the pre created order]
   */
  async notifyAgentTradeOrderCancelled(
    tenantId: string,
    agent: User,
    seller: User,
    token: Token,
    order: Order,
    authToken: string,
  ) {
    try {
      if (isE2eTestUser(agent)) {
        return; // We don't want to send emails to fake users created as part of e2e tests
      }

      const appUrl = await this.craftAppUrl(tenantId);
      const orderUrl = `${appUrl}/order/${order[ActionKeys.ID]}`;
      const agentFirstName = agent[UserKeys.FIRST_NAME];
      const sellerName = this.getUserEmailFullName(seller);

      const {
        subject,
        fromEmail,
        fromName,
        messageTitle,
        message,
        buttonLabel,
        logo,
        color,
        messageFooter,
        poweredBy,
      } = await this.apiMetadataCallService.buildMailBody({
        tenantId,
        key: 'NOTIFY_AGENT_TRADE_ORDER_CANCELLED',
        elements: {
          agentFirstName,
          sellerName,
          quantity: String(order[ActionKeys.QUANTITY]),
          assetName: token[TokenKeys.NAME],
        },
      });

      const emailData = {
        toEmail: agent[UserKeys.EMAIL],
        toName: agentFirstName,
        fromEmail,
        fromName,
        subject,
        templateId: MAILJET_TEMPLATE_ID,
        variables: {
          logo,
          color,
          messageFooter,
          poweredBy,
          messageTitle,
          message,
          buttonLabel,
          buttonHref: orderUrl,
        },
      };

      const requestConfig: AxiosRequestConfig =
        await this.craftAxiosRequestConfig(authToken);

      const response = await this.mailing.post(
        '/send',
        removeNil(emailData),
        requestConfig,
      );

      this.apiCallHelperService.checkRequestResponseCode(
        'error sending email',
        response,
      );
    } catch (error) {
      ErrorService.throwApiCallError(
        'notifyAgentTradeOrderCancelled',
        API_NAME,
        error,
      );
    }
  }

  /**
   * [Sends email to seller after agent cancels the pre created order]
   */
  async notifySellerTradeOrderCancelled(
    tenantId: string,
    agent: User,
    seller: User,
    token: Token,
    order: Order,
    authToken: string,
  ) {
    try {
      if (isE2eTestUser(agent)) {
        return; // We don't want to send emails to fake users created as part of e2e tests
      }

      const appUrl = await this.craftAppUrl(tenantId);
      const orderUrl = `${appUrl}/order/${order[ActionKeys.ID]}`;
      const sellerFirstName = seller[UserKeys.FIRST_NAME];
      const agentName = this.getUserEmailFullName(agent);

      const {
        subject,
        fromEmail,
        fromName,
        messageTitle,
        message,
        buttonLabel,
        logo,
        color,
        messageFooter,
        poweredBy,
      } = await this.apiMetadataCallService.buildMailBody({
        tenantId,
        key: 'NOTIFY_SELLER_TRADE_ORDER_CANCELLED',
        elements: {
          sellerFirstName,
          agentName,
          quantity: String(order[ActionKeys.QUANTITY]),
          assetName: token[TokenKeys.NAME],
        },
      });

      const emailData = {
        toEmail: seller[UserKeys.EMAIL],
        toName: sellerFirstName,
        fromEmail,
        fromName,
        subject,
        templateId: MAILJET_TEMPLATE_ID,
        variables: {
          logo,
          color,
          messageFooter,
          poweredBy,
          messageTitle,
          message,
          buttonLabel,
          buttonHref: orderUrl,
        },
      };

      const requestConfig: AxiosRequestConfig =
        await this.craftAxiosRequestConfig(authToken);

      const response = await this.mailing.post(
        '/send',
        removeNil(emailData),
        requestConfig,
      );

      this.apiCallHelperService.checkRequestResponseCode(
        'error sending email',
        response,
      );
    } catch (error) {
      ErrorService.throwApiCallError(
        'notifySellerTradeOrderCancelled',
        API_NAME,
        error,
      );
    }
  }

  /**
   * [Sends email to agent after buyer rejects the approved order]
   */
  async notifyAgentApprovedTradeOrderRejected(
    tenantId: string,
    agent: User,
    buyer: User,
    order: Order,
    token: Token,
    authToken: string,
  ) {
    try {
      if (isE2eTestUser(agent)) {
        return; // We don't want to send emails to fake users created as part of e2e tests
      }

      const appUrl = await this.craftAppUrl(tenantId);
      const orderUrl = `${appUrl}/order/${order[ActionKeys.ID]}`;
      const agentFirstName = agent[UserKeys.FIRST_NAME];
      const buyerName = this.getUserEmailFullName(buyer);

      const {
        subject,
        fromEmail,
        fromName,
        messageTitle,
        message,
        buttonLabel,
        logo,
        color,
        messageFooter,
        poweredBy,
      } = await this.apiMetadataCallService.buildMailBody({
        tenantId,
        key: 'NOTIFY_AGENT_APPROVED_TRADE_ORDER_REJECTED',
        elements: {
          agentFirstName,
          buyerName,
          quantity: String(order[ActionKeys.QUANTITY]),
          assetName: token[TokenKeys.NAME],
        },
      });

      const emailData = {
        toEmail: agent[UserKeys.EMAIL],
        toName: agentFirstName,
        fromEmail,
        fromName,
        subject,
        templateId: MAILJET_TEMPLATE_ID,
        variables: {
          logo,
          color,
          messageFooter,
          poweredBy,
          messageTitle,
          message,
          buttonLabel,
          buttonHref: orderUrl,
        },
      };

      const requestConfig: AxiosRequestConfig =
        await this.craftAxiosRequestConfig(authToken);

      const response = await this.mailing.post(
        '/send',
        removeNil(emailData),
        requestConfig,
      );

      this.apiCallHelperService.checkRequestResponseCode(
        'error sending email',
        response,
      );
    } catch (error) {
      ErrorService.throwApiCallError(
        'notifyAgentApprovedTradeOrderRejected',
        API_NAME,
        error,
      );
    }
  }
}
