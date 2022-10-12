import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';

import { ElementModel } from './ElementModel';
import { ElementRequest } from './ElementRequest';
import { NestJSPinoLogger } from '@codefi-assets-and-payments/observability';

import { DEFAULT_TENANT_ID } from '../../utils/constants/constants';

@Injectable()
export class ElementService {
  constructor(
    @InjectModel(ElementModel)
    private readonly elementModel: typeof ElementModel,
    private readonly logger: NestJSPinoLogger,
  ) {}

  async create(tenantId: string, elements: ElementRequest[]) {
    return await Promise.all(
      elements.map(
        ({ key, type, status, label, placeholder, inputs = [], data = {} }) =>
          this.elementModel.findOrCreate({
            where: {
              tenantId,
              key,
            },
            defaults: {
              type,
              status,
              label,
              placeholder,
              inputs,
              data,
            },
          }),
      ),
    );
  }

  find(
    tenantId: string,
    elementId: string,
    key: string,
  ): Promise<ElementModel[]> {
    if (elementId) {
      return this.elementModel.findAll({
        where: {
          [Op.and]: [
            {
              [Op.or]: [{ tenantId }, { tenantId: DEFAULT_TENANT_ID }],
            },
            {
              id: elementId,
            },
          ],
        },
        order: [['createdAt', 'DESC']],
      });
    } else if (key) {
      return this.elementModel.findAll({
        where: {
          [Op.and]: [
            {
              [Op.or]: [{ tenantId }, { tenantId: DEFAULT_TENANT_ID }],
            },
            {
              key,
            },
          ],
        },
        order: [['createdAt', 'DESC']],
      });
    } else {
      return this.elementModel.findAll({
        where: {
          [Op.or]: [{ tenantId }, { tenantId: DEFAULT_TENANT_ID }],
        },
        order: [['createdAt', 'DESC']],
      });
    }
  }

  // [ tenantId === tenantId OR tenantId === DEFAULT_TENANT_ID ] AND KEY is included in keys

  async findAll(tenantId: string, keys: string[]): Promise<ElementModel[]> {
    return this.elementModel.findAll({
      where: {
        [Op.and]: [
          {
            [Op.or]: [{ tenantId }, { tenantId: DEFAULT_TENANT_ID }],
          },
          {
            key: {
              [Op.in]: keys,
            },
          },
        ],
      },
      order: [['createdAt', 'DESC']],
    });
  }

  async findOne(
    tenantId: string,
    elementId: string,
    key: string,
  ): Promise<ElementModel> {
    const elementsList: ElementModel[] = await this.find(
      tenantId,
      elementId,
      key,
    );

    return elementsList.length > 0 ? elementsList[0] : undefined;
  }

  async update(
    tenantId: string,
    elementId: string,
    request: ElementRequest,
  ): Promise<ElementRequest> {
    const { key, type, status, label, placeholder, inputs, data } = request;

    const targetedElement = await this.findOne(tenantId, elementId, undefined);
    if (!targetedElement) {
      const errorMessage = `Unable to find the element with id=${elementId}`;
      this.logger.error(errorMessage);
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: errorMessage,
        },
        400,
      );
    }

    if (key && key !== targetedElement.key) {
      const elementsWithSameKey: ElementModel[] = await this.find(
        tenantId,
        undefined,
        key,
      );

      if (elementsWithSameKey && elementsWithSameKey.length > 0) {
        const errorMessage = `Another element already exists with key=${key}`;
        this.logger.error(errorMessage);

        throw new HttpException(
          {
            status: HttpStatus.BAD_REQUEST,
            error: errorMessage,
          },
          400,
        );
      }
    }

    const updatedElement: ElementModel = await targetedElement.update({
      key,
      type,
      status,
      label,
      placeholder,
      inputs,
      data,
    });
    return updatedElement;
  }

  async remove(tenantId: string, elementId): Promise<{ message: string }> {
    const numberOfDestroyedRows = await this.elementModel.destroy({
      where: {
        id: elementId,
      },
    });
    if (numberOfDestroyedRows > 0) {
      const successMessage = `${numberOfDestroyedRows} deleted element(s).`;
      this.logger.trace(successMessage);
      return { message: successMessage };
    } else {
      const errorMessage = `Unable to find the element with id=${elementId}`;
      this.logger.error(errorMessage);
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: errorMessage,
        },
        400,
      );
    }
  }

  async removeByTenant(tenantId: string): Promise<{ [key: string]: number }> {
    const numberOfDestroyedRows = await this.elementModel.destroy({
      where: {
        tenantId,
      },
    });

    const message = `${numberOfDestroyedRows} deleted element(s).`;
    this.logger.trace(message);
    return { deletedElementsTotal: numberOfDestroyedRows };
  }
}
