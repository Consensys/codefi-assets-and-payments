import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NestJSPinoLogger } from '@codefi-assets-and-payments/observability';
import { v4 as uuidv4 } from 'uuid';
import { validateSync, ValidationError } from 'class-validator';
import { plainToClass } from 'class-transformer';
import _ from 'lodash';

import {
  prettify,
  removeEmpty,
  areDatabaseObjectsEqual,
} from 'src/utils/common';
import {
  AssetElementsDto,
  FetchAssetElementQuery,
} from 'src/model/dto/AssetElementsDto';
import { AssetElement } from 'src/model/AssetElementEntity';
import { DEFAULT_TENANT_ID } from 'src/utils/constants';
import { requireTenantId, checkTenantId } from 'src/utils/tenant';

interface IAssetElementsMap {
  [key: string]: AssetElement;
}

@Injectable()
export class AssetElementsService {
  constructor(
    private readonly logger: NestJSPinoLogger,
    @InjectRepository(AssetElement)
    private assetElementsRepository: Repository<AssetElement>,
  ) {}

  async upsertElements(
    tenantId: string,
    elements: Array<AssetElementsDto>,
    isHTTPRequest = true,
  ): Promise<
    | {
        updatedElements: Array<AssetElement>;
        createdElements: Array<AssetElement>;
      }
    | undefined
  > {
    const allDbElements: Array<AssetElement> = await this.find({
      tenantId,
      id: undefined,
      key: undefined,
    });

    // check for keys uniqueness
    const group = _.groupBy(elements, 'key');
    for (const [key, value] of Object.entries(group)) {
      if (value.length > 1) {
        const erroreMessage = `Duplicate key: ${key}`;
        this.logger.error(erroreMessage);
        if (isHTTPRequest) {
          throw new HttpException(
            {
              status: HttpStatus.BAD_REQUEST,
              error: erroreMessage,
            },
            HttpStatus.BAD_REQUEST,
          );
        } else {
          return;
        }
      }
    }

    const allDbElementsMap: IAssetElementsMap = allDbElements.reduce(
      (map, currentDbElement: AssetElement) => ({
        ...map,
        [currentDbElement.key]: currentDbElement,
      }),
      {},
    );
    let allErrors: ValidationError[] = [];
    let updatedElements: AssetElement[] = [],
      createdElements: AssetElement[] = [];

    for (const element of elements) {
      const errors = validateSync(plainToClass(AssetElementsDto, element));
      if (errors.length > 0) {
        allErrors = [...allErrors, ...errors];
      } else {
        const elementToCreate = {
          ...element,
        };
        if (!element.tenantId) {
          elementToCreate.tenantId = tenantId;
        }

        const matchingDbElement = allDbElementsMap[element.key];
        if (!matchingDbElement) {
          const newElement = await this.create(elementToCreate, isHTTPRequest);
          if (newElement) createdElements = [...createdElements, newElement];
        } else {
          if (tenantId !== matchingDbElement.tenantId) {
            const error = `Element with key: ${element.key} already exists for tenant ${matchingDbElement.tenantId}, please choose another key`;
            this.logger.error(error);
            if (isHTTPRequest) {
              throw new HttpException(
                {
                  status: HttpStatus.BAD_REQUEST,
                  error: allErrors,
                },
                HttpStatus.BAD_REQUEST,
              );
            } else {
              return;
            }
          } else if (
            !areDatabaseObjectsEqual(matchingDbElement, elementToCreate)
          ) {
            const updatedElement = await this.update(
              matchingDbElement.id,
              elementToCreate,
              isHTTPRequest,
            );
            updatedElements = [...updatedElements, updatedElement];
          }
        }
      }
    }

    if (allErrors.length > 0) {
      this.logger.error(allErrors);
      if (isHTTPRequest) {
        throw new HttpException(
          {
            status: HttpStatus.BAD_REQUEST,
            error: allErrors,
          },
          HttpStatus.BAD_REQUEST,
        );
      } else {
        return;
      }
    } else {
      return {
        createdElements,
        updatedElements,
      };
    }
  }

  async create(
    {
      tenantId,
      key,
      map,
      type,
      status,
      label,
      size,
      maxLength,
      sublabel,
      placeholder,
      rightTag,
      leftTag,
      multiline,
      fileAccept,
      name,
      fillLine,
      inputs,
      options,
      updatable,
      hidden,
      defaultValue,
    }: AssetElementsDto,
    isHTTPRequest = true,
  ): Promise<AssetElement | undefined> {
    requireTenantId(tenantId);

    // Check if inputs are valid
    if (
      !(await this.checkValidInputs(tenantId, undefined, key, isHTTPRequest))
    ) {
      return;
    }

    try {
      return await this.assetElementsRepository.save({
        id: uuidv4(),
        tenantId,
        key,
        map,
        type,
        status,
        label,
        sublabel,
        placeholder,
        rightTag,
        leftTag,
        size,
        maxLength,
        multiline,
        fileAccept,
        name,
        fillLine,
        inputs,
        options,
        updatable,
        hidden,
        defaultValue,
      });
    } catch (error) {
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

  find({
    tenantId,
    id,
    key,
  }: FetchAssetElementQuery): Promise<Array<AssetElement>> {
    requireTenantId(tenantId);

    if (id) {
      return this.assetElementsRepository.find({
        where: [
          { tenantId, id },
          { tenantId: DEFAULT_TENANT_ID, id },
        ],
        order: { createdAt: 'DESC' },
      });
    } else if (key) {
      return this.assetElementsRepository.find({
        where: [
          { tenantId, key },
          { tenantId: DEFAULT_TENANT_ID, key },
        ],
        order: { createdAt: 'DESC' },
      });
    } else {
      return this.assetElementsRepository.find({
        where: [{ tenantId }, { tenantId: DEFAULT_TENANT_ID }],
        order: { createdAt: 'DESC' },
      });
    }
  }

  async update(
    id: string,
    {
      tenantId,
      key,
      map,
      type,
      status,
      label,
      sublabel,
      placeholder,
      rightTag,
      leftTag,
      size,
      maxLength,
      multiline,
      fileAccept,
      name,
      fillLine,
      inputs,
      options,
      updatable,
    }: AssetElementsDto,
    isHTTPRequest = true,
  ): Promise<AssetElement> {
    requireTenantId(tenantId);

    // Find the asset element
    const targetElement = await this.assetElementsRepository.findOne({
      where: { id },
    });

    // Test if asset element belongs to the expected tenant
    if (targetElement) checkTenantId(tenantId, targetElement.tenantId);

    // If it exists, update it
    if (targetElement) {
      // Check if inputs are valid
      await this.checkValidInputs(tenantId, id, key, true);

      try {
        const updatedElement = await this.assetElementsRepository.save({
          ...targetElement,
          ...removeEmpty({
            key,
            map,
            type,
            status,
            label,
            sublabel,
            placeholder,
            rightTag,
            leftTag,
            size,
            maxLength,
            multiline,
            fileAccept,
            name,
            fillLine,
            inputs,
            options,
            updatable,
          }),
        });
        this.logger.info(`Updated assetElement: ${prettify(updatedElement)}`);
        return updatedElement;
      } catch (error) {
        this.logger.error(error);
        if (isHTTPRequest)
          throw new HttpException(
            {
              status: HttpStatus.BAD_REQUEST,
              error,
            },
            HttpStatus.BAD_REQUEST,
          );
        throw error;
      }
    } else {
      const error = `Unable to find the assetElement with id=${id}`;
      this.logger.error(error);
      if (isHTTPRequest)
        throw new HttpException(
          {
            status: HttpStatus.BAD_REQUEST,
            error,
          },
          HttpStatus.BAD_REQUEST,
        );
      throw new Error(error);
    }
  }

  async delete(tenantId: string, id: string): Promise<{ message: string }> {
    requireTenantId(tenantId);

    // Find the asset element
    const targetElement = await this.assetElementsRepository.findOne({
      where: { id },
    });

    // Test if asset element belongs to the expected tenant
    if (targetElement) checkTenantId(tenantId, targetElement.tenantId);

    const { affected } = await this.assetElementsRepository.delete(id);
    if (affected && affected > 0) {
      const message = `${affected} deleted assetElement(s).`;
      this.logger.info(message);
      return { message };
    } else {
      const error = `Unable to find the assetElement with id=${id}`;
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

    const { affected } = await this.assetElementsRepository.delete({
      tenantId,
    });

    const message = `${affected} deleted assetElement(s).`;
    this.logger.info(message);
    return { deletedAssetElementsTotal: affected || 0 };
  }

  async checkValidInputs(
    tenantId,
    objectId,
    key,
    isHTTPRequest,
  ): Promise<boolean> {
    const elementsWithSameKey: Array<AssetElement> = await this.find({
      tenantId,
      id: undefined,
      key,
    });

    let problem: boolean;
    if (objectId) {
      // If 'objectId', then it means it is an object update
      if (elementsWithSameKey.length > 1) {
        problem = true;
      } else if (elementsWithSameKey.length === 1) {
        if (elementsWithSameKey[0].id !== objectId) {
          problem = true;
        } else {
          problem = false;
        }
      } else {
        problem = false;
      }
    } else {
      // If not 'objectId', then it means it is an object creation
      if (elementsWithSameKey.length > 0) {
        problem = true;
      } else {
        problem = false;
      }
    }

    if (problem) {
      if (isHTTPRequest) {
        const error = `Element with key: ${key} already exists, please choose another key`;
        this.logger.error(error);
        throw new HttpException(
          {
            status: HttpStatus.BAD_REQUEST,
            error,
          },
          HttpStatus.BAD_REQUEST,
        );
      } else {
        return false;
      }
    } else {
      return true;
    }
  }
}
