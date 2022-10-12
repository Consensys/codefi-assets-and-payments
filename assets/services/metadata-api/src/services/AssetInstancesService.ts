import {
  Injectable,
  HttpException,
  HttpStatus,
  forwardRef,
  Inject,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { NestJSPinoLogger } from '@codefi-assets-and-payments/observability';
import { v4 as uuidv4 } from 'uuid';
import _ from 'lodash';

import { areArraysOfSameLength, prettify, removeEmpty } from 'src/utils/common';
import {
  AssetInstancesDto,
  FetchAssetTemplateDataQuery,
  FetchAssetInstancesBatchQuery,
  FetchAssetInstancesQuery,
  FetchAssetTemplateDataBatchQuery,
  CheckAssetDataCompletionQuery,
  AssetInstanceElementInstance,
  CheckAssetDataValidityDto,
} from 'src/model/dto/AssetInstancesDto';
import {
  AssetTemplateTopSection,
  AssetTemplateSection,
} from 'src/model/dto/AssetTemplatesDto';
import { AssetInstance } from 'src/model/AssetInstanceEntity';
import { AssetElementsService } from './AssetElementsService';
import { AssetTemplatesService } from './AssetTemplatesService';
import { AssetElement } from 'src/model/AssetElementEntity';
import { checkTenantId, requireTenantId } from 'src/utils/tenant';
import { AssetTemplate } from 'src/model/AssetTemplateEntity';
import { AssetElementStatus, AssetElementType } from 'src/utils/constants';
import { TokensService } from './TokensService';
import { Token } from 'src/model/TokenEntity';

@Injectable()
export class AssetInstancesService {
  constructor(
    private readonly logger: NestJSPinoLogger,
    @InjectRepository(AssetInstance)
    private readonly assetInstancesRepository: Repository<AssetInstance>,
    private readonly assetElementsService: AssetElementsService,
    private readonly assetTemplatesService: AssetTemplatesService,
    @Inject(forwardRef(() => TokensService))
    private readonly tokensService: TokensService,
  ) {}

  private throwMissingTemplate(templateId: string) {
    const error = new Error(
      `Unable to find the assetTemplate with id=${templateId}`,
    );
    this.logger.error(error);
    throw new BadRequestException(error);
  }

  async create({
    tenantId,
    tokenId,
    templateId,
    issuerId,
    elementInstances,
    data,
  }: AssetInstancesDto): Promise<AssetInstance | undefined> {
    requireTenantId(tenantId);

    const token = await this.tokensService.findOne(tenantId, tokenId);

    if (!token) {
      const error = `Unable to find token with id ${tokenId}`;
      this.logger.error(error);
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error,
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    const template = await this.assetTemplatesService.findOne(
      tenantId,
      templateId,
    );
    if (!template) {
      const error = `Unable to find the assetTemplate with id ${templateId}`;
      this.logger.error(error);
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error,
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    // get all template elements
    const templateElements = template.topSections.reduce(
      (acc, topSection) => [
        ...acc,
        ...topSection.sections.reduce(
          (acc2, curr2) => [...acc2, ...curr2.elements],
          [],
        ),
      ],
      [],
    );

    const elements: Array<AssetElement> = await this.assetElementsService.find({
      tenantId,
      id: undefined,
      key: undefined,
    });

    const elementsMap: {
      [key: string]: AssetElement;
    } = elements.reduce(
      (map, currentDbElement: AssetElement) => ({
        ...map,
        [currentDbElement.key]: currentDbElement,
      }),
      {},
    );

    const assetInstance = await this.assetInstancesRepository.findOne({
      where: {
        tenantId,
        tokenId,
        templateId,
        issuerId,
      },
    });

    for (const elementInstance of elementInstances) {
      if (templateElements.indexOf(elementInstance.key) === -1) {
        const error = `Invalid element with key=${elementInstance.key}, not requested in the asset template`;
        this.logger.error(error);
        throw new HttpException(
          {
            status: HttpStatus.BAD_REQUEST,
            error,
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      const element = elementsMap[elementInstance.key];

      if (!element) {
        const error = `Shall never happen - Element doesn't exist anymore: ${elementInstance.key}`;
        this.logger.error(error);
        throw new HttpException(
          {
            status: HttpStatus.BAD_REQUEST,
            error,
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      const [valid, error] = this.verifyElementInstance(
        element,
        elementInstance,
        false,
      );
      if (!valid) {
        this.logger.error(error);
        throw new HttpException(
          {
            status: HttpStatus.BAD_REQUEST,
            error,
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      // if token is deployed check if element is updatable
      if (token.defaultDeployment) {
        const classExistsOnChain = token?.assetClasses?.includes(
          elementInstance.classKey,
        );
        if (classExistsOnChain && !element.updatable) {
          const error = `Element with key ${elementInstance.key} is not updatable`;
          this.logger.error(error);
          throw new HttpException(
            {
              status: HttpStatus.BAD_REQUEST,
              error,
            },
            HttpStatus.BAD_REQUEST,
          );
        }

        if (
          element.map === 'class_initialSubscription_cutoffDate' &&
          assetInstance
        ) {
          const targetAssetInstance = assetInstance.elementInstances.find(
            (e) => e.key === element.key,
          );
          if (!targetAssetInstance) {
            const error = `Shall never happen, No value found for element with key ${elementInstance.key}`;
            this.logger.error(error);
            throw new HttpException(
              {
                status: HttpStatus.BAD_REQUEST,
                error,
              },
              HttpStatus.BAD_REQUEST,
            );
          }
          if (
            new Date(targetAssetInstance.value[0]).getTime() >
            new Date(elementInstance.value[0]).getTime()
          ) {
            const error = `Cuttoff date already passed`;
            this.logger.error(error);
            throw new HttpException(
              {
                status: HttpStatus.BAD_REQUEST,
                error,
              },
              HttpStatus.BAD_REQUEST,
            );
          }
        }
      }
    }

    if (assetInstance) {
      return this.update(assetInstance.id, assetInstance, {
        tenantId,
        tokenId,
        templateId,
        issuerId,
        elementInstances,
        data,
      });
    }

    return this.assetInstancesRepository.save({
      id: uuidv4(),
      tenantId,
      tokenId,
      templateId,
      issuerId,
      elementInstances,
      data,
    });
  }

  async checkAssetDataValidity({
    tenantId,
    templateId,
    elementInstances,
  }: CheckAssetDataValidityDto): Promise<[boolean, string]> {
    requireTenantId(tenantId);

    const template = await this.assetTemplatesService.findOne(
      tenantId,
      templateId,
    );

    if (!template) {
      this.throwMissingTemplate(templateId);
      return [false, 'Not valid asset data'];
    }

    // get all template elements
    const templateElements = template.topSections.reduce(
      (acc, topSection) => [
        ...acc,
        ...topSection.sections.reduce(
          (acc2, curr2) => [...acc2, ...curr2.elements],
          [],
        ),
      ],
      [],
    );

    const elements: Array<AssetElement> = await this.assetElementsService.find({
      tenantId,
      id: undefined,
      key: undefined,
    });

    const elementsMap: {
      [key: string]: AssetElement;
    } = elements.reduce(
      (map, currentDbElement: AssetElement) => ({
        ...map,
        [currentDbElement.key]: currentDbElement,
      }),
      {},
    );

    for (const elementInstance of elementInstances) {
      if (templateElements.indexOf(elementInstance.key) === -1) {
        const error = `Invalid element with key=${elementInstance.key}, not requested in the asset template`;
        return [false, error];
      }

      const element = elementsMap[elementInstance.key];

      if (!element) {
        const error = `Shall never happen - Element doesn't exist anymore: ${elementInstance.key}`;
        return [false, error];
      }

      const [valid, error] = this.verifyElementInstance(
        element,
        elementInstance,
        false,
      );
      if (!valid) {
        return [valid, error];
      }
    }
    return [true, 'Valid asset data'];
  }

  async findBatch({
    tenantId,
    tokenIds,
  }: FetchAssetInstancesBatchQuery): Promise<Array<AssetInstance>> {
    requireTenantId(tenantId);

    if (tokenIds?.length < 1) {
      return Promise.resolve([]);
    } else {
      return this.assetInstancesRepository.find({
        where: {
          tenantId,
          tokenId: In(tokenIds),
        },
        order: { createdAt: 'DESC' },
      });
    }
  }

  async find({
    tenantId,
    id,
    tokenId,
    templateId,
    issuerId,
  }: FetchAssetInstancesQuery): Promise<Array<AssetInstance>> {
    requireTenantId(tenantId);

    if (id) {
      return this.assetInstancesRepository.find({
        where: [{ tenantId, id }],
        order: { createdAt: 'DESC' },
      });
    } else if (tokenId && issuerId && templateId) {
      return this.assetInstancesRepository.find({
        where: { tenantId, tokenId, issuerId, templateId },
        order: { createdAt: 'DESC' },
      });
    } else {
      return this.assetInstancesRepository.find({
        where: { tenantId },
        order: { createdAt: 'DESC' },
      });
    }
  }

  async findAssetTemplateDataBatch({
    tenantId,
    tokenIds,
    templateIds,
    issuerIds,
  }: FetchAssetTemplateDataBatchQuery) {
    requireTenantId(tenantId);
    if (!areArraysOfSameLength(tokenIds, templateIds, issuerIds)) {
      const error = `Invalid input: tokensIds(${tokenIds?.length}), templateIds(${templateIds?.length}) and issuerIds(${issuerIds?.length}) shall have the same length`;
      this.logger.error(error);
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error,
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    if (tokenIds?.length < 1) {
      return [];
    }

    // Fetch all asset templates in batch (and map them)
    const templates: Array<AssetTemplate> =
      await this.assetTemplatesService.findBatch({
        tenantId,
        ids: templateIds,
      });
    const temlatesMap: {
      [templateId: string]: AssetTemplate;
    } = templates.reduce(
      (obj, assetTemplate: AssetTemplate) => ({
        ...obj,
        [assetTemplate.id]: assetTemplate,
      }),
      {},
    );

    // Check all asset templates have been fetched properly
    let missingTemplateId = '';
    templates.map((template: AssetTemplate) => {
      if (!temlatesMap[template.id]) {
        missingTemplateId = template.id;
      }
    });
    if (missingTemplateId) {
      this.throwMissingTemplate(missingTemplateId);
    }

    // Fetch all asset elements in batch (and map them)
    const elements: Array<AssetElement> = await this.assetElementsService.find({
      tenantId,
      id: undefined,
      key: undefined,
    });
    const elementsMap: {
      [key: string]: AssetElement;
    } = elements.reduce(
      (map, currentDbElement: AssetElement) => ({
        ...map,
        [currentDbElement.key]: currentDbElement,
      }),
      {},
    );

    // Fetch all asset instances in batch (and map them)
    const assetInstances: Array<AssetInstance> = await this.findBatch({
      tenantId,
      tokenIds,
    });
    const assetInstancesMap: {
      [tokenId: string]: AssetInstance;
    } = assetInstances.reduce(
      (obj, assetInstance: AssetInstance) => ({
        ...obj,
        [assetInstance.tokenId]: assetInstance,
      }),
      {},
    );

    const responses: any = [];
    for (let index2 = 0; index2 < tokenIds.length; index2++) {
      const tokenId = tokenIds[index2];
      const templateId = templateIds[index2];
      const issuerId = issuerIds[index2];

      const template: AssetTemplate = temlatesMap[templateId];

      // Check all asset instances have been fetched properly (e.g. asset instances have correct templateId and issuerId)
      const assetInstance: AssetInstance = assetInstancesMap[tokenId];
      if (
        assetInstance.templateId !== templateId ||
        assetInstance.issuerId !== issuerId
      ) {
        const error = `Asset instance doens't fit with tokenId=${tokenId}, templateId=${templateId}, and issuerId=${issuerId}: ${JSON.stringify(
          assetInstance,
        )}`;
        this.logger.error(error);
        throw new HttpException(
          {
            status: HttpStatus.BAD_REQUEST,
            error,
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      // Add template data to response
      responses.push(
        this.fillAssetTemplateWithElementsAndElementInstances({
          template,
          elementsMap,
          assetInstance,
        }),
      );
    }

    return responses;
  }

  async findAssetTemplateData({
    tenantId,
    tokenId,
    templateId,
    issuerId,
  }: FetchAssetTemplateDataQuery) {
    requireTenantId(tenantId);

    const template = await this.assetTemplatesService.findOne(
      tenantId,
      templateId,
    );

    if (!template) {
      this.throwMissingTemplate(templateId);
      return;
    }

    const elements: Array<AssetElement> = await this.assetElementsService.find({
      tenantId,
      id: undefined,
      key: undefined,
    });

    const elementsMap: {
      [key: string]: AssetElement;
    } = elements.reduce(
      (map, currentDbElement: AssetElement) => ({
        ...map,
        [currentDbElement.key]: currentDbElement,
      }),
      {},
    );

    const assetInstance = await this.assetInstancesRepository.findOne({
      where: { tenantId, tokenId, issuerId, templateId },
      order: { createdAt: 'DESC' },
    });
    if (!assetInstance) return;

    return this.fillAssetTemplateWithElementsAndElementInstances({
      template,
      elementsMap,
      assetInstance,
    });
  }

  async checkAssetDataCompletion({
    tenantId,
    tokenId,
    templateId,
    issuerId,
  }: CheckAssetDataCompletionQuery) {
    requireTenantId(tenantId);

    const template = await this.assetTemplatesService.findOne(
      tenantId,
      templateId,
    );

    if (!template) {
      this.throwMissingTemplate(templateId);
      return;
    }

    const elements: Array<AssetElement> = await this.assetElementsService.find({
      tenantId,
      id: undefined,
      key: undefined,
    });

    const elementsMap: {
      [key: string]: AssetElement;
    } = elements.reduce(
      (map, currentDbElement: AssetElement) => ({
        ...map,
        [currentDbElement.key]: currentDbElement,
      }),
      {},
    );

    const assetInstance = await this.assetInstancesRepository.findOne({
      where: { tenantId, tokenId, issuerId, templateId },
      order: { createdAt: 'DESC' },
    });

    const assetElementsCheck: [boolean, string] =
      this.verifyAllTemplateElements(
        template,
        elementsMap,
        assetInstance?.elementInstances || [],
      );

    if (!assetElementsCheck || assetElementsCheck.length !== 2) {
      throw new Error(
        `assetDataCompletionCheck: Shall never happen - Invalid function response`,
      );
    } else if (!assetElementsCheck[0]) {
      return Promise.resolve([
        false,
        `Incomplete asset data completion check: ${assetElementsCheck[1]}`,
      ]);
    } else {
      return Promise.resolve([
        true,
        `Successful asset data completion check: All requested asset elements have been submitted`,
      ]);
    }
  }

  verifyAllTemplateElements(
    template: AssetTemplate,
    elementsMap: { [key: string]: AssetElement },
    elementInstances: AssetInstanceElementInstance[],
  ): [boolean, string] {
    for (const topSection of template.topSections) {
      for (const section of topSection.sections) {
        for (const elementKey of section.elements) {
          const elementInstance = elementInstances.find(
            (elementInstance) => elementInstance.key === elementKey,
          );
          const element = elementsMap[elementKey];

          if (!element) {
            return [
              false,
              `verifyAllTemplateElements: Shall never happen - Element doesn't exist anymore: ${elementKey}`,
            ];
          }

          const [valid, error] = this.verifyElementInstance(
            element,
            elementInstance,
            true,
          );
          if (!valid) {
            return [false, `verifyAllTemplateElements: ${error}`];
          }
        }
      }
    }
    return [true, 'Asset data is valid'];
  }

  verifyElementInstance(
    element: AssetElement,
    elementInstance: AssetInstanceElementInstance | undefined,
    shallExist: boolean,
  ): [boolean, string] {
    if (
      (!elementInstance || elementInstance.value.length === 0) &&
      element.status === AssetElementStatus.mandatory &&
      shallExist
    ) {
      return [
        false,
        `verifyElementInstance: Missing mandatory element: ${element.key}`,
      ];
    } else if (elementInstance && elementInstance.value.length > 0) {
      const elementValidityVerification: [boolean, string] =
        this.checkElementInstanceValue(element, elementInstance.value);

      if (
        !elementValidityVerification ||
        elementValidityVerification.length !== 2
      ) {
        return [
          false,
          `verifyElementInstance: Shall never happen - Invalid function response for element: ${elementInstance.key}`,
        ];
      }
      return elementValidityVerification;
    }
    return [true, 'verifyElementInstance: Element is valid'];
  }

  checkElementInstanceValue = (
    element: AssetElement,
    value: string[],
  ): [boolean, string] => {
    switch (element.type) {
      case AssetElementType.percentage: {
        if (!(value.length === 1 || value.length % 2 === 0)) {
          return [
            false,
            `Invalid data for element: ${element.key} expected an array of length 1 or even, got ${value.length}`,
          ];
        }
        break;
      }
      case AssetElementType.string:
      case AssetElementType.multistring:
      case AssetElementType.date:
      case AssetElementType.radio:
      case AssetElementType.time:
        if (value.length !== 1) {
          return [
            false,
            `Invalid data for element: ${element.key} expected 1 value, got ${value.length}`,
          ];
        }
        break;

      case AssetElementType.target: {
        const parsedValue = _.chunk(value, 4).map((data) => ({
          metric: data[0],
          unit: data[1],
          target: data[2],
          category: data[3],
        }));

        if (value.length % 4 !== 0) {
          return [
            false,
            `Invalid data for element: ${
              element.key
            } expected object with keys metric, unit, target and category, got ${Object.keys(
              parsedValue,
            )}`,
          ];
        }
        break;
      }

      case AssetElementType.perPercentage:
        if (!(value.length >= 2 && value.length <= 4)) {
          return [
            false,
            `Invalid data for element: ${element.key} expected at least 2 values and at most 4 values, got ${value.length}`,
          ];
        }
        break;

      case AssetElementType.feeWithType:
        if (value.length % 3 !== 0) {
          return [
            false,
            `Invalid data for element: ${element.key} expected 3 values, got ${value.length}`,
          ];
        }
        break;

      case AssetElementType.number: {
        const parsedValue = parseInt(value[0], 10);
        if (
          (typeof parsedValue !== 'number' && !Number.isNaN(parsedValue)) ||
          parsedValue < 0
        ) {
          return [
            false,
            `Invalid data for element: ${element.key} expected number greater then 0, got ${value[0]}`,
          ];
        }
        break;
      }

      case AssetElementType.document:
        if (value.length % 2 !== 0) {
          return [
            false,
            `Invalid data for element: ${element.key} expected even, got ${value.length}`,
          ];
        }
        break;

      case AssetElementType.docusign:
        if (value.length !== 3) {
          return [
            false,
            `Invalid data for element: ${element.key} expected 3 values, got ${value.length}`,
          ];
        }
        break;
      case AssetElementType.team:
        if (value.length % 6 !== 0) {
          return [
            false,
            `Invalid data for element: ${element.key} expected 6 values, got ${value.length}`,
          ];
        }
        break;
      case AssetElementType.bank:
      case AssetElementType.json: {
        try {
          JSON.parse(value[0]);
        } catch (error) {
          return [
            false,
            `Invalid data for element: ${element.key} expected json, got ${value}`,
          ];
        }
        break;
      }

      default:
    }
    return [true, 'Asset is validated at element level'];
  };

  getElementValue = (
    type: AssetElementType,
    value: string[] | undefined,
    multiline: boolean,
  ) => {
    if (!value || value.length === 0) {
      return null;
    }
    switch (type) {
      case AssetElementType.percentage:
        if (value.length === 1) {
          return value?.[0];
        } else if (value.length % 2 === 0) {
          return _.chunk(value, 2).map((d) => ({
            name: d[0],
            value: d[1],
          }));
        }
        return value;
      case AssetElementType.string:
      case AssetElementType.multistring:
      case AssetElementType.date:
      case AssetElementType.radio:
      case AssetElementType.time:
        return value?.[0];

      case AssetElementType.target:
        return _.chunk(value, 4).map((data) => ({
          metric: data[0],
          unit: data[1],
          target: data[2],
          category: data[3],
        }));

      case AssetElementType.perPercentage:
        return {
          rateValue: value[0] ? parseInt(value[0]) : undefined,
          rateFrequency: value[1],
          paymentDate: value[2],
          paymentHour: value[3],
        };

      case AssetElementType.feeWithType:
        const res: any = {};
        _.chunk(value, 3).forEach((data) => {
          switch (data[1]) {
            case 'ENTRY_FEE':
              res['acquiredEntryFees'] = data[2];
              break;
            case 'EXIT_FEE':
              res['acquiredExitFees'] = data[2];
              break;
            case 'MANAGEMENT_FEE':
              res['managementFees'] = data[2];
              break;
          }
        });
        return res;

      case AssetElementType.number:
        return value?.[0] ? parseInt(value[0]) : null;

      case AssetElementType.document:
        return multiline
          ? _.chunk(value, 2).map((data) => ({
              name: data?.[0],
              key: data?.[1],
            }))
          : {
              name: value?.[0],
              key: value?.[1],
            };

      case AssetElementType.docusign:
        return {
          name: value?.[0],
          key: value?.[1],
          url: value?.[2],
        };

      case AssetElementType.team:
        return _.chunk(value, 6).map((d) => ({
          name: d[0],
          role: d[1],
          url: d[2],
          bio: d[3],
          image: {
            name: d[4],
            key: d[5],
          },
        }));

      case AssetElementType.bank:
      case AssetElementType.json: {
        try {
          return JSON.parse(value[0]);
        } catch {
          return null;
        }
      }

      default:
        return value;
    }
  };

  async craftAssetData(
    tenantId: string | undefined,
    token: Token,
    templateId: string,
    issuerId: string | null,
  ) {
    if (!templateId || !token || !issuerId || !tenantId) {
      return null;
    }

    const template = await this.assetTemplatesService.findOne(
      tenantId,
      templateId,
    );

    if (!template) {
      this.throwMissingTemplate(templateId);
    }

    const elements: Array<AssetElement> = await this.assetElementsService.find({
      tenantId,
      id: undefined,
      key: undefined,
    });

    const allElements: {
      [key: string]: AssetElement;
    } = elements.reduce(
      (map, currentDbElement: AssetElement) => ({
        ...map,
        [currentDbElement.key]: currentDbElement,
      }),
      {},
    );

    const assetInstance = await this.assetInstancesRepository.findOne({
      where: { tenantId, tokenId: token.id, issuerId, templateId },
      order: { createdAt: 'DESC' },
    });

    const elementInstances = assetInstance?.elementInstances || [];
    if (!template) return null;
    return {
      type: template.type,
      category: template.category,
      ...template.topSections.reduce((topSectionsMap, topSection) => {
        const topSectionKey = topSection.key;
        if (topSectionKey === 'class') {
          const topSectionObject = _.chain(topSection.sections)
            .reduce((arr, curr) => {
              const v = curr.elements.reduce((elementsWithData, elementKey) => {
                const targetElementInstances =
                  elementInstances.filter(
                    (elementInstance) => elementInstance.key === elementKey,
                  ) || [];
                return [
                  ...elementsWithData,
                  ...targetElementInstances.map((targetElementInstance) => ({
                    ...targetElementInstance,
                    ...allElements[elementKey],
                  })),
                ];
              }, []);
              return [...arr, ...v];
            }, [])
            .groupBy('classKey')
            .mapValues((classElements, classKey) => {
              const craftedObject = classElements.reduce(
                (elementsMap: { [key: string]: any }, element) => {
                  try {
                    const elementValue = this.getElementValue(
                      element.type,
                      element.value,
                      element.multiline,
                    );
                    if (!element.map || !elementValue) {
                      return elementsMap;
                    }
                    const elementKey = element.map.split('_')[2];
                    const elementSectionKey = element.map.split('_')[1];
                    // set element in the correct section
                    if (elementKey === 'general') {
                      return {
                        ...elementsMap,
                        [elementSectionKey]: {
                          ...(elementsMap[elementSectionKey] || {}),
                          ...elementValue,
                        },
                      };
                    } else if (elementSectionKey === 'general') {
                      return {
                        ...elementsMap,
                        [elementKey]: elementValue,
                      };
                    }

                    return {
                      ...elementsMap,
                      [elementSectionKey]: {
                        ...(elementsMap[elementSectionKey] || {}),
                        [elementKey]: elementValue,
                      },
                    };
                  } catch {
                    return elementsMap;
                  }
                },
                {},
              );
              if (_.isEmpty(craftedObject)) {
                return {};
              }

              let key;
              if (classKey !== 'undefined') {
                key = classKey;
              } else {
                key =
                  craftedObject.name?.toLowerCase()?.replace(/\s/g, '_') ||
                  token.assetClasses?.[0] ||
                  'classic';
              }

              return {
                ...craftedObject,
                key,
              };
            })
            .values()
            .filter((v) => !_.isEmpty(v))
            .value();

          if (_.isEmpty(topSectionObject)) {
            return topSectionsMap;
          }

          return {
            ...topSectionsMap,
            [topSectionKey]: topSectionObject,
          };
        } else {
          const topSectionObject = _.chain(topSection.sections)
            .reduce(
              (arr, curr) => [
                ...arr,
                ...curr.elements.map((e) => ({
                  ...(elementInstances.find(
                    (elementInstance) => elementInstance.key === e,
                  ) || {}),
                  ...allElements[e],
                })),
              ],
              [],
            )
            .reduce((elementsMap: { [key: string]: any }, element) => {
              try {
                const elementValue = this.getElementValue(
                  element.type,
                  element.value,
                  element.multiline,
                );
                if (!element.map || !elementValue) {
                  return elementsMap;
                }
                const elementKey = element.map.split('_')[2];
                const elementSectionKey = element.map.split('_')[1];
                // set element in the correct section
                if (elementKey === 'general') {
                  return {
                    ...elementsMap,
                    [elementSectionKey]: {
                      ...(elementsMap[elementSectionKey] || {}),
                      ...elementValue,
                    },
                  };
                } else if (elementSectionKey === 'general') {
                  return {
                    ...elementsMap,
                    [elementKey]: elementValue,
                  };
                }

                return {
                  ...elementsMap,
                  [elementSectionKey]: {
                    ...(elementsMap[elementSectionKey] || {}),
                    [elementKey]: elementValue,
                  },
                };
              } catch {
                return elementsMap;
              }
            }, {})
            .value();

          if (_.isEmpty(topSectionObject)) {
            return topSectionsMap;
          }

          return {
            ...topSectionsMap,
            [topSectionKey]: topSectionObject,
          };
        }
      }, {}),
    };
  }

  /**
   * [Craft unique elementInstance key/classKey]
   * We introduced this function after facing the following issue: elementInstance of first class where overriding elementInstance of another class
   * Consequently we decided to append the classKey (when defined) in order to guarantee that the key is unique in the map
   */
  craftElementInstanceUniqueKey = (
    elementInstance: AssetInstanceElementInstance,
  ) => {
    if (elementInstance.classKey) {
      return elementInstance.key + elementInstance.classKey;
    } else return elementInstance.key;
  };

  private async update(
    id: string,
    targetAssetInstance: AssetInstancesDto,
    {
      tokenId,
      templateId,
      issuerId,
      elementInstances,
      data,
    }: AssetInstancesDto,
  ): Promise<AssetInstance> {
    const elementInstancesMap = elementInstances.reduce(
      (map, curr) => ({
        ...map,
        [this.craftElementInstanceUniqueKey(curr)]: curr,
      }),
      {},
    );
    const targetElementInstances = targetAssetInstance.elementInstances.filter(
      (e) => {
        return !elementInstancesMap[this.craftElementInstanceUniqueKey(e)];
      },
    );

    const newElementIntances = [...targetElementInstances, ...elementInstances];

    const updatedElementInstance = await this.assetInstancesRepository.save({
      ...targetAssetInstance,
      tokenId,
      templateId,
      issuerId,
      elementInstances: newElementIntances,
      ...removeEmpty({
        data,
      }),
    });
    this.logger.info(
      `Updated elementInstance: ${prettify(updatedElementInstance)}`,
    );
    return updatedElementInstance;
  }

  async delete(tenantId: string, id: string): Promise<{ message: string }> {
    requireTenantId(tenantId);

    // Find the project
    const targetAssetInstance = await this.assetInstancesRepository.findOne({
      where: { id },
    });

    // Test if project belongs to the expected tenant
    if (targetAssetInstance)
      checkTenantId(tenantId, targetAssetInstance.tenantId);

    const { affected } = await this.assetInstancesRepository.delete(id);
    if (affected && affected > 0) {
      const message = `${affected} deleted elementInstance(s).`;
      this.logger.info(message);
      return { message };
    } else {
      const error = `Unable to find the elementInstance with id=${id}`;
      this.logger.error(error);
      throw new HttpException(
        {
          status: HttpStatus.NOT_FOUND,
          error,
        },
        HttpStatus.NOT_FOUND,
      );
    }
  }

  async deleteByTenant(tenantId: string): Promise<{ [key: string]: number }> {
    requireTenantId(tenantId);

    const { affected } = await this.assetInstancesRepository.delete({
      tenantId,
    });

    const message = `${affected} deleted elementInstance(s).`;
    this.logger.info(message);
    return { deletedAssetInstancesTotal: affected || 0 };
  }

  fillAssetTemplateWithElementsAndElementInstances({
    template,
    elementsMap,
    assetInstance,
  }: {
    template: AssetTemplate;
    elementsMap: { [key: string]: AssetElement };
    assetInstance: AssetInstance;
  }) {
    const elementInstances = assetInstance?.elementInstances || [];
    return {
      ...template,
      topSections: template.topSections.map(
        (topSection: AssetTemplateTopSection) => {
          return {
            ...topSection,
            sections: topSection.sections.map(
              (section: AssetTemplateSection) => ({
                ...section,
                elements: section.elements.map((elementKey: string) => ({
                  ...elementsMap[elementKey],
                  data:
                    (
                      elementInstances.find(
                        (elementInstance) => elementInstance.key === elementKey,
                      ) || {}
                    ).value || [],
                })),
              }),
            ),
          };
        },
      ),
    };
  }
}
