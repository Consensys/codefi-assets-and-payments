import { Injectable } from '@nestjs/common';

import ErrorService from 'src/utils/errorService';

import {
  keys as KycTemplateKeys,
  KycTemplate,
  RawKycTemplate,
  RawKycTemplateSection,
  RawKycTemplateTopSection,
  KycTemplateSection,
  KycTemplateTopSection,
  NATURAL_PERSON_SECTION,
  LEGAL_PERSON_SECTION,
  DEFAULT_KYC_TEMPLATE_NAME,
} from 'src/types/kyc/template';
import {
  keys as KycElementKeys,
  KycElement,
  KycElementInstance,
  KycElementAndElementInstance,
  KycElementInput,
} from 'src/types/kyc/element';
import { keys as languageKeys } from 'src/types/languages';
import { ApiKycCallService } from 'src/modules/v2ApiCall/api.call.service/kyc';
import { TemplateEnum } from 'src/old/constants/enum';
import { CreateTemplateBodyInput } from '../kyc.template.dto';
import { keys as ConfigKeys, Config } from 'src/types/config';
import { keys as UserKeys, User } from 'src/types/user';

@Injectable()
export class KYCTemplateService {
  constructor(private readonly apiKycCallService: ApiKycCallService) {}

  /**
   * Retrieve list of KYC templates
   *
   * includeElements If set to true, the elements are also fetched and included in the template.
   */
  async listAllKycTemplates(
    tenantId: string,
    includeElements: boolean,
  ): Promise<Array<KycTemplate | RawKycTemplate>> {
    try {
      const kycTemplatesList: Array<RawKycTemplate> =
        await this.apiKycCallService.listAllKycTemplates(tenantId);

      if (!includeElements) {
        return kycTemplatesList;
      } else {
        const kycElementsList: Array<KycElement> =
          await this.apiKycCallService.listAllKycElements(tenantId);

        const updatedKycTemplatesList: Array<KycTemplate> =
          kycTemplatesList.map((kycTemplate: RawKycTemplate) => {
            return this.injectElementsAndElementInstancesInTemplate(
              kycTemplate,
              kycElementsList,
              {},
            );
          });
        return updatedKycTemplatesList;
      }
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'listing all KYC templates',
        'listAllKycTemplates',
        false,
        500,
      );
    }
  }

  /**
   * Retrieve KYC template
   *
   * includeElements: If set to true, the items are also fetched and included in the template.
   */
  async retrieveKycTemplate(
    tenantId: string,
    templateId: string,
    includeElements: boolean,
  ): Promise<KycTemplate | RawKycTemplate> {
    try {
      const rawKycTemplate: RawKycTemplate =
        await this.apiKycCallService.retrieveKycTemplate(
          tenantId,
          TemplateEnum.templateId,
          templateId,
          true,
        );

      if (!includeElements) {
        return rawKycTemplate;
      } else {
        const kycElementsList: Array<KycElement> =
          await this.apiKycCallService.listAllKycElements(tenantId);

        return this.injectElementsAndElementInstancesInTemplate(
          rawKycTemplate,
          kycElementsList,
          {},
        );
      }
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieving KYC template',
        'retrieveKycTemplate',
        false,
        500,
      );
    }
  }

  /**
   * [Retrieve default Codefi KYC template ID]
   */
  async retrieveDefaultCodefiKycTemplate(
    tenantId: string,
  ): Promise<RawKycTemplate> {
    try {
      const kycTemplateList: Array<RawKycTemplate> =
        await this.apiKycCallService.listAllKycTemplates(tenantId);

      const defaultKycTemplate: RawKycTemplate = kycTemplateList.find(
        (template: RawKycTemplate) =>
          template[KycTemplateKeys.NAME] === DEFAULT_KYC_TEMPLATE_NAME,
      );

      if (
        defaultKycTemplate &&
        defaultKycTemplate[KycTemplateKeys.TEMPLATE_ID]
      ) {
        return defaultKycTemplate;
      } else {
        ErrorService.throwError('missing default KYC template in KYC-API');
      }
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieving default Codefi KYC template',
        'retrieveDefaultCodefiKycTemplate',
        false,
        500,
      );
    }
  }

  /**
   * [Retrieve tenant KYC template ID]
   */
  async retrieveTenantKycTemplate(
    tenantId: string,
    config: Config,
  ): Promise<RawKycTemplate> {
    try {
      if (!config) {
        ErrorService.throwError('shall never happen: undefined config object');
      }

      if (!config?.[ConfigKeys.DATA]?.[ConfigKeys.DATA__KYC_TEMPLATE_ID]) {
        ErrorService.throwError(
          "shall never happen: no kycTemplateId defined in tenant's config.data",
        );
      }

      const kycTemplateId: string =
        config?.[ConfigKeys.DATA]?.[ConfigKeys.DATA__KYC_TEMPLATE_ID];

      const kycTemplate: RawKycTemplate = (await this.retrieveKycTemplate(
        tenantId,
        kycTemplateId,
        false, // includeElements
      )) as RawKycTemplate;

      return kycTemplate;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieving tenant KYC template',
        'retrieveTenantKycTemplate',
        false,
        500,
      );
    }
  }

  /**
   * [Retrieve issuer KYC template ID]
   */
  async retrieveIssuerKycTemplate(
    tenantId: string,
    issuer: User,
  ): Promise<RawKycTemplate> {
    try {
      if (!issuer) {
        ErrorService.throwError('shall never happen: undefined issuer object');
      }

      if (!issuer?.[UserKeys.DATA]?.[UserKeys.DATA__KYC_TEMPLATE_ID]) {
        ErrorService.throwError(
          "shall never happen: no kycTemplateId defined in issuer's data",
        );
      }

      const kycTemplateId: string =
        issuer?.[UserKeys.DATA]?.[UserKeys.DATA__KYC_TEMPLATE_ID];

      const kycTemplate: RawKycTemplate = (await this.retrieveKycTemplate(
        tenantId,
        kycTemplateId,
        false, // includeElements
      )) as RawKycTemplate;

      return kycTemplate;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieving issuer KYC template',
        'retrieveIssuerKycTemplate',
        false,
        500,
      );
    }
  }

  /**
   * [Retrieve KYC template if existing or retrieve default Codefi KYC template]
   */
  async retrieveKycTemplateIfExistingOrRetrieveDefaultCodefiKycTemplate(
    tenantId: string,
    kycTemplateId: string,
  ): Promise<RawKycTemplate> {
    try {
      let kycTemplate: RawKycTemplate;
      if (kycTemplateId) {
        // Check if 'kycTemplateId' is valid
        kycTemplate = (await this.retrieveKycTemplate(
          tenantId,
          kycTemplateId,
          false, // includeElements
        )) as RawKycTemplate;
      } else {
        kycTemplate = await this.retrieveDefaultCodefiKycTemplate(tenantId);
      }

      return kycTemplate;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieving KYC template if existing or retrieving default Codefi KYC template',
        'retrieveKycTemplateIfExistingOrRetrieveDefaultCodefiKycTemplate',
        false,
        500,
      );
    }
  }

  /**
   * [Retrieve KYC template if existing or retrieve tenant KYC template]
   */
  async retrieveKycTemplateIfExistingOrRetrieveTenantKycTemplate(
    tenantId: string,
    kycTemplateId: string,
    config: Config,
  ): Promise<RawKycTemplate> {
    try {
      let kycTemplate: RawKycTemplate;
      if (kycTemplateId) {
        // Check if 'kycTemplateId' is valid
        kycTemplate = (await this.retrieveKycTemplate(
          tenantId,
          kycTemplateId,
          false, // includeElements
        )) as RawKycTemplate;
      } else {
        kycTemplate = await this.retrieveTenantKycTemplate(tenantId, config);
      }

      return kycTemplate;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieving KYC template if existing or retrieving tenant KYC template',
        'retrieveKycTemplateIfExistingOrRetrieveDefaultTenantKycTemplate',
        false,
        500,
      );
    }
  }

  /**
   * [Retrieve KYC template if existing or retrieve issuer KYC template]
   */
  async retrieveKycTemplateIfExistingOrRetrieveIssuerKycTemplate(
    tenantId: string,
    kycTemplateId: string,
    issuer: User,
  ): Promise<RawKycTemplate> {
    try {
      let kycTemplate: RawKycTemplate;
      if (kycTemplateId) {
        // Check if 'kycTemplateId' is valid
        kycTemplate = (await this.retrieveKycTemplate(
          tenantId,
          kycTemplateId,
          false, // includeElements
        )) as RawKycTemplate;
      } else {
        kycTemplate = await this.retrieveIssuerKycTemplate(tenantId, issuer);
      }

      return kycTemplate;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieving KYC template if existing or retrieving issuer KYC template',
        'retrieveKycTemplateIfExistingOrRetrieveIssuerKycTemplate',
        false,
        500,
      );
    }
  }

  /**
   * Helper function to inject elements and elementInstances in KYC template
   */
  injectElementsAndElementInstancesInTemplate(
    kycTemplate: RawKycTemplate,
    kycElementsList: Array<KycElement>,
    kycElementInstancesMapping: {
      [elementKey: string]: KycElementInstance;
    },
  ): KycTemplate {
    try {
      const kycElementsMapping: {
        [elementKey: string]: KycElement;
      } = {};
      kycElementsList.map((element: KycElement) => {
        kycElementsMapping[element[KycElementKeys.ELEMENT_KEY]] = element;
      });

      const updatedTopsections: Array<KycTemplateTopSection> =
        kycTemplate.topSections.map((topSection: RawKycTemplateTopSection) => {
          const updatedSections: Array<KycTemplateSection> =
            topSection.sections.map((section: RawKycTemplateSection) => {
              const elementsAndElementInstances: Array<KycElementAndElementInstance> =
                section[KycTemplateKeys.SECTIONS__ELEMENTS].map(
                  (elementKey: string) => {
                    return {
                      [KycElementKeys.ELEMENT_AND_INSTANCE__NAME]: elementKey,
                      [KycElementKeys.ELEMENT_AND_INSTANCE__ELEMENT]:
                        kycElementsMapping[elementKey],
                      [KycElementKeys.ELEMENT_AND_INSTANCE__ELEMENT_INSTANCE]:
                        kycElementInstancesMapping[elementKey],
                      [KycElementKeys.ELEMENT_AND_INSTANCE__RELATED_ELEMENTS]:
                        this.injectElementsAndElementInstancesInRelatedElements(
                          elementKey,
                          kycElementsMapping,
                          kycElementInstancesMapping,
                        ),
                    };
                  },
                );

              return {
                ...section,
                [KycTemplateKeys.SECTIONS__ELEMENTS]:
                  elementsAndElementInstances,
              };
            });

          return {
            ...topSection,
            [KycTemplateKeys.TOP_SECTIONS__SECTIONS]: updatedSections,
          };
        });

      return {
        ...kycTemplate,
        [KycTemplateKeys.TOP_SECTIONS]: updatedTopsections,
      };
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'injecting elements and elementInstances in KYC template',
        'injectElementsAndElementInstancesInTemplate',
        false,
        500,
      );
    }
  }

  /**
   * Helper function to inject elements and elementInstances in array of related elements
   */
  injectElementsAndElementInstancesInRelatedElements(
    elementKey: string,
    kycElementsMapping: {
      [elementKey: string]: KycElement;
    },
    kycElementInstancesMapping: {
      [elementKey: string]: KycElementInstance;
    },
  ): Array<KycElementAndElementInstance> {
    try {
      const kycElement: KycElement = kycElementsMapping[elementKey];

      if (!kycElement) {
        ErrorService.throwError(
          `element with key ${elementKey} not found`,
          404,
        );
      }

      const relatedElementKeysList: Array<string> = [];
      const kycElementInputs =
        kycElement[KycElementKeys.ELEMENT_INPUTS] &&
        kycElement[KycElementKeys.ELEMENT_INPUTS].length
          ? kycElement[KycElementKeys.ELEMENT_INPUTS]
          : [];
      kycElementInputs.map((input: KycElementInput) => {
        if (
          input[KycElementKeys.ELEMENT_INPUT__RELATED_ELEMENTS] &&
          input[KycElementKeys.ELEMENT_INPUT__RELATED_ELEMENTS].length > 0
        ) {
          input[KycElementKeys.ELEMENT_INPUT__RELATED_ELEMENTS].map(
            (relatedElementKey: string) => {
              relatedElementKeysList.push(relatedElementKey);
            },
          );
        }
      });

      if (relatedElementKeysList && relatedElementKeysList.length > 0) {
        const relatedElementList: Array<KycElementAndElementInstance> = [];
        relatedElementKeysList.map((relatedElementKey: string) => {
          relatedElementList.push({
            [KycElementKeys.ELEMENT_AND_INSTANCE__NAME]: relatedElementKey,
            [KycElementKeys.ELEMENT_AND_INSTANCE__ELEMENT]:
              kycElementsMapping[relatedElementKey],
            [KycElementKeys.ELEMENT_AND_INSTANCE__ELEMENT_INSTANCE]:
              kycElementInstancesMapping[relatedElementKey],
            [KycElementKeys.ELEMENT_AND_INSTANCE__RELATED_ELEMENTS]:
              this.injectElementsAndElementInstancesInRelatedElements(
                relatedElementKey,
                kycElementsMapping,
                kycElementInstancesMapping,
              ),
          });
        });
        return relatedElementList;
      } else {
        return undefined;
      }
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'injecting elements and elementInstances in KYC related elements',
        'injectElementsAndElementInstancesInRelatedElements',
        false,
        500,
      );
    }
  }

  /**
   * Check KYC template's validity
   */
  async checkKycTemplateValidity(
    tenantId: string,
    kycTemplate: CreateTemplateBodyInput,
  ): Promise<boolean> {
    try {
      if (!kycTemplate[KycTemplateKeys.NAME]) {
        ErrorService.throwError(
          `KYC template shall have a ${KycTemplateKeys.NAME}`,
        );
      }
      if (!kycTemplate[KycTemplateKeys.TOP_SECTIONS]) {
        ErrorService.throwError(
          `KYC template shall have a ${KycTemplateKeys.TOP_SECTIONS}`,
        );
      }
      if (kycTemplate[KycTemplateKeys.TOP_SECTIONS].length < 2) {
        ErrorService.throwError(
          'KYC template shall have at least 2 top sections',
        );
      }

      const naturalSectionFound = kycTemplate[
        KycTemplateKeys.TOP_SECTIONS
      ].find((topSection: RawKycTemplateTopSection) => {
        return (
          topSection[KycTemplateKeys.TOP_SECTIONS__KEY] ===
          NATURAL_PERSON_SECTION
        );
      });
      if (!naturalSectionFound) {
        ErrorService.throwError(
          `KYC template shall contain a top section called ${NATURAL_PERSON_SECTION}`,
        );
      }

      const legalSectionFound = kycTemplate[KycTemplateKeys.TOP_SECTIONS].find(
        (topSection: RawKycTemplateTopSection) => {
          return (
            topSection[KycTemplateKeys.TOP_SECTIONS__KEY] ===
            LEGAL_PERSON_SECTION
          );
        },
      );
      if (!legalSectionFound) {
        ErrorService.throwError(
          `KYC template shall contain a top section called ${LEGAL_PERSON_SECTION}`,
        );
      }

      const kycElements: Array<KycElement> =
        await this.apiKycCallService.listAllKycElements(tenantId);

      for (
        let index = 0;
        index < kycTemplate[KycTemplateKeys.TOP_SECTIONS].length;
        index++
      ) {
        const topSection: RawKycTemplateTopSection =
          kycTemplate[KycTemplateKeys.TOP_SECTIONS][index];
        this.checkKycTopSectionValidity(topSection, kycElements);
      }

      return true;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'checking KYC template validity',
        'checkKycTemplateValidity',
        false,
        500,
      );
    }
  }

  /**
   * Check KYC top section's validity
   */
  checkKycTopSectionValidity(
    topSection: RawKycTemplateTopSection,
    kycElements: Array<KycElement>,
  ): boolean {
    try {
      if (!topSection[KycTemplateKeys.TOP_SECTIONS__KEY]) {
        ErrorService.throwError(
          `KYC top section shall have a ${KycTemplateKeys.TOP_SECTIONS__KEY}`,
        );
      }
      const topSectionName = `KYC top section with key ${
        topSection[KycTemplateKeys.TOP_SECTIONS__KEY]
      }`;

      if (!topSection[KycTemplateKeys.TOP_SECTIONS__LABEL]) {
        ErrorService.throwError(
          `${topSectionName} shall have a ${KycTemplateKeys.TOP_SECTIONS__LABEL}`,
        );
      } else {
        const label = topSection[KycTemplateKeys.TOP_SECTIONS__LABEL];
        if (!label[languageKeys.EN]) {
          ErrorService.throwError(
            `label of ${topSectionName} shall be translated in ${languageKeys.EN}`,
          );
        }
        if (!label[languageKeys.FR]) {
          ErrorService.throwError(
            `label of ${topSectionName} shall be translated in ${languageKeys.FR}`,
          );
        }
      }
      if (!topSection[KycTemplateKeys.TOP_SECTIONS__SECTIONS]) {
        ErrorService.throwError(
          `${topSectionName} shall have ${KycTemplateKeys.TOP_SECTIONS__SECTIONS}`,
        );
      }

      for (
        let index = 0;
        index < topSection[KycTemplateKeys.TOP_SECTIONS__SECTIONS].length;
        index++
      ) {
        const section: RawKycTemplateSection =
          topSection[KycTemplateKeys.TOP_SECTIONS__SECTIONS][index];
        this.checkKycSectionValidity(section, kycElements);
      }

      return true;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'checking KYC top section validity',
        'checkKycTopSectionValidity',
        false,
        500,
      );
    }
  }

  /**
   * Check KYC section's validity
   */
  checkKycSectionValidity(
    section: RawKycTemplateSection,
    kycElements: Array<KycElement>,
  ): boolean {
    try {
      if (!section[KycTemplateKeys.SECTIONS__KEY]) {
        ErrorService.throwError(
          `KYC section shall have a ${KycTemplateKeys.SECTIONS__KEY}`,
        );
      }
      const sectionName = `KYC section with key ${
        section[KycTemplateKeys.SECTIONS__KEY]
      }`;

      if (!section[KycTemplateKeys.SECTIONS__LABEL]) {
        ErrorService.throwError(
          `${sectionName} shall have a ${KycTemplateKeys.SECTIONS__LABEL}`,
        );
      } else {
        const label = section[KycTemplateKeys.SECTIONS__LABEL];
        if (!label[languageKeys.EN]) {
          ErrorService.throwError(
            `label of ${sectionName} shall be translated in ${languageKeys.EN}`,
          );
        }
        if (!label[languageKeys.FR]) {
          ErrorService.throwError(
            `label of ${sectionName} shall be translated in ${languageKeys.FR}`,
          );
        }
      }
      if (!section[KycTemplateKeys.SECTIONS__ELEMENTS]) {
        ErrorService.throwError(
          `${sectionName} shall have ${KycTemplateKeys.SECTIONS__ELEMENTS}`,
        );
      }

      for (
        let index = 0;
        index < section[KycTemplateKeys.SECTIONS__ELEMENTS].length;
        index++
      ) {
        const elementKey = section[KycTemplateKeys.SECTIONS__ELEMENTS][index];
        const foundElementKey = kycElements.find((element) => {
          return element[KycElementKeys.ELEMENT_KEY] === elementKey;
        });
        if (!foundElementKey) {
          ErrorService.throwError(
            `element with key ${elementKey} doesnt exist`,
          );
        }
      }

      return true;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'checking KYC section validity',
        'checkKycSectionValidity',
        false,
        500,
      );
    }
  }
}
