import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NestJSPinoLogger } from '@consensys/observability';
import { v4 as uuidv4 } from 'uuid';

import { AssetCycleInstance } from 'src/model/AssetCycleInstanceEntity';
import {
  AssetCycleInstanceDto,
  FetchAssetCycleInstanceQuery,
} from 'src/model/dto/AssetCycleInstancesDto';
import { requireTenantId, checkTenantId } from 'src/utils/tenant';
import { removeEmpty, prettify } from 'src/utils/common';

@Injectable()
export class AssetCycleInstancesService {
  constructor(
    private readonly logger: NestJSPinoLogger,
    @InjectRepository(AssetCycleInstance)
    private assetCycleInstancesRepository: Repository<AssetCycleInstance>,
  ) {}

  async create({
    tenantId,
    assetInstanceId,
    assetInstanceClassKey,
    startDate,
    endDate,
    valuationDate,
    settlementDate,
    unpaidFlagDate,
    nav,
    status,
    type,
    data,
  }: AssetCycleInstanceDto): Promise<AssetCycleInstance> {
    requireTenantId(tenantId);

    // Check if inputs are valid
    await this.checkValidInputs(
      tenantId,
      undefined,
      assetInstanceId,
      assetInstanceClassKey,
      startDate,
      endDate,
      type,
    );

    return this.assetCycleInstancesRepository.save({
      id: uuidv4(),
      tenantId,
      assetInstanceId,
      assetInstanceClassKey,
      startDate,
      endDate,
      valuationDate,
      settlementDate,
      unpaidFlagDate,
      nav,
      status,
      type,
      data,
    });
  }

  find({
    tenantId,
    cycleId: id,
    assetId: assetInstanceId,
    assetClassKey: assetInstanceClassKey,
    type,
  }: FetchAssetCycleInstanceQuery): Promise<Array<AssetCycleInstance>> {
    requireTenantId(tenantId);

    if (id) {
      return this.assetCycleInstancesRepository.find({
        where: { tenantId, id },
        order: { createdAt: 'DESC' },
      });
    } else if (assetInstanceId && assetInstanceClassKey && type) {
      return this.assetCycleInstancesRepository.find({
        where: { tenantId, assetInstanceId, assetInstanceClassKey, type },
        order: { createdAt: 'DESC' },
      });
    } else if (assetInstanceId && assetInstanceClassKey) {
      return this.assetCycleInstancesRepository.find({
        where: { tenantId, assetInstanceId, assetInstanceClassKey },
        order: { createdAt: 'DESC' },
      });
    } else if (assetInstanceId && type) {
      return this.assetCycleInstancesRepository.find({
        where: { tenantId, assetInstanceId, type },
        order: { createdAt: 'DESC' },
      });
    } else if (assetInstanceId) {
      return this.assetCycleInstancesRepository.find({
        where: { tenantId, assetInstanceId },
        order: { createdAt: 'DESC' },
      });
    } else {
      return this.assetCycleInstancesRepository.find({
        where: [{ tenantId }],
        order: { createdAt: 'DESC' },
      });
    }
  }

  async update(
    cycleId: string,
    {
      tenantId,
      assetInstanceId,
      assetInstanceClassKey,
      startDate,
      endDate,
      valuationDate,
      settlementDate,
      unpaidFlagDate,
      nav,
      status,
      type,
      data,
    }: AssetCycleInstanceDto,
  ): Promise<AssetCycleInstance> {
    requireTenantId(tenantId);

    // Find the cycle
    const targetedCycle = await this.assetCycleInstancesRepository.findOne({
      where: { id: cycleId },
    });

    // If it exists, update it
    if (targetedCycle) {
      // Test if cycle belongs to the expected tenant
      if (targetedCycle) checkTenantId(tenantId, targetedCycle.tenantId);
      // Check if inputs are valid
      await this.checkValidInputs(
        tenantId,
        cycleId,
        assetInstanceId,
        assetInstanceClassKey,
        startDate,
        endDate,
        type,
      );

      const updatedCycle = await this.assetCycleInstancesRepository.save({
        ...targetedCycle,
        ...removeEmpty({
          assetInstanceId,
          assetInstanceClassKey,
          startDate,
          endDate,
          valuationDate,
          settlementDate,
          unpaidFlagDate,
          nav,
          status,
          type,
          data,
        }),
      });

      this.logger.info(`Updated assetCycleInstance: ${prettify(updatedCycle)}`);
      return updatedCycle;
    } else {
      const error = `Unable to find the assetCycleInstance with id=${cycleId}`;
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

  async delete(
    tenantId: string,
    cycleId: string,
  ): Promise<{ message: string }> {
    requireTenantId(tenantId);

    // Find the cycle
    const targetedCycle = await this.assetCycleInstancesRepository.findOne({
      where: {
        id: cycleId,
      },
    });

    // Test if cycle belongs to the expected tenant
    if (targetedCycle) checkTenantId(tenantId, targetedCycle.tenantId);

    const { affected } = await this.assetCycleInstancesRepository.delete(
      cycleId,
    );

    if (affected && affected > 0) {
      const message = `${affected} deleted assetCycleInstance(s).`;
      this.logger.info(message);
      return { message };
    } else {
      const error = `Unable to find the assetCycleInstance with id=${cycleId}`;
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

    const { affected } = await this.assetCycleInstancesRepository.delete({
      tenantId,
    });

    const message = `${affected} deleted assetCycleInstance(s).`;
    this.logger.info(message);
    return { deletedAssetCycleInstancesTotal: affected || 0 };
  }

  async checkValidInputs(
    tenantId,
    objectId,
    assetInstanceId,
    assetInstanceClassKey,
    startDate,
    endDate,
    type,
  ): Promise<boolean> {
    const cyclesWithSameDates: Array<AssetCycleInstance> =
      await this.assetCycleInstancesRepository.find({
        where: {
          tenantId,
          assetInstanceId,
          assetInstanceClassKey,
          startDate,
          endDate,
          type,
        },
        order: { createdAt: 'DESC' },
      });

    let problem: boolean;
    if (objectId) {
      // If 'objectId', then it means it is an object update
      if (cyclesWithSameDates.length > 1) {
        problem = true;
      } else if (cyclesWithSameDates.length === 1) {
        if (cyclesWithSameDates[0].id !== objectId) {
          problem = true;
        } else {
          problem = false;
        }
      } else {
        problem = false;
      }
    } else {
      // If not 'objectId', then it means it is an object creation
      if (cyclesWithSameDates.length > 0) {
        problem = true;
      } else {
        problem = false;
      }
    }

    if (problem) {
      const error =
        'Invalid Cycle inputs: cycle with same dates already exists';
      this.logger.error(error);
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error,
        },
        HttpStatus.BAD_REQUEST,
      );
    } else {
      return true;
    }
  }
}
