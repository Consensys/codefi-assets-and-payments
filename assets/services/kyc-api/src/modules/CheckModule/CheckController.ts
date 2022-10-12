import { Controller, Get, Query } from '@nestjs/common';
import { NestJSPinoLogger } from '@codefi-assets-and-payments/observability';

import { CheckService } from './CheckService';
import { ApiQuery, ApiTags } from '@nestjs/swagger';
import { KycGranularity } from 'src/utils/constants/enum';
import { IdentityDto } from '../identity.dto';
import { identitySchema } from '../identitySchema';
import { JoiValidationPipe } from 'src/validation/JoiValidationPipe';

@Controller('')
@ApiTags('check')
export class CheckController {
  constructor(
    private readonly logger: NestJSPinoLogger,
    private readonly checkService: CheckService,
  ) {
    logger.setContext(CheckController.name);
  }

  @Get('/completion/check')
  @ApiQuery({ name: 'tenantId', required: true })
  kycCompletionCheck(
    @Query(new JoiValidationPipe(identitySchema)) identityQuery: IdentityDto,
    @Query('userId') userId: string,
    @Query('templateId') templateId: string,
    @Query('entityId') entityId: string,
    @Query('entityClass') entityClass: string,
    @Query('topSectionKeys') topSectionKeys: string,
  ) {
    this.logger.info({
      userId,
      entityId,
      templateId,
      topSectionKeys,
    });
    const topSectionKeysList = topSectionKeys
      ? JSON.parse(topSectionKeys)
      : undefined;
    return this.checkService.kycCompletionCheck(
      identityQuery.tenantId,
      userId,
      entityId,
      entityClass,
      templateId,
      topSectionKeysList,
    );
  }

  @Get('/validation/check')
  @ApiQuery({ name: 'tenantId', required: true })
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'userIds', required: false })
  @ApiQuery({ name: 'entityId', required: true })
  @ApiQuery({ name: 'templateId', required: true })
  @ApiQuery({ name: 'topSectionKeys', required: false })
  @ApiQuery({ name: 'usersTopSectionKeys', required: false })
  @ApiQuery({
    name: 'granularity',
    required: true,
    enum: [
      KycGranularity.ELEMENT_ONLY,
      KycGranularity.TEMPLATE_ONLY,
      KycGranularity.TEMPLATE_AND_ELEMENT,
      KycGranularity.TEMPLATE_OR_ELEMENT,
    ],
  })
  kycValidationCheck(
    @Query(new JoiValidationPipe(identitySchema)) identityQuery: IdentityDto,
    @Query('userId') userId: string,
    @Query('userIds') userIds: string,
    @Query('entityId') entityId: string,
    @Query('entityClass') entityClass: string,
    @Query('templateId') templateId: string,
    @Query('topSectionKeys') topSectionKeys: string,
    @Query('topSectionKeysByUserId') topSectionKeysByUserId: string,
    @Query('granularity') granularity: KycGranularity,
  ) {
    this.logger.info({
      userId,
      userIds,
      entityId,
      templateId,
      topSectionKeys,
      topSectionKeysByUserId,
      granularity,
    });

    const userIdsList: string[] =
      userIds && JSON.parse(userIds) && Array.isArray(JSON.parse(userIds))
        ? JSON.parse(userIds)
        : undefined;

    const topSectionKeysList =
      topSectionKeys &&
      JSON.parse(topSectionKeys) &&
      Array.isArray(JSON.parse(topSectionKeys))
        ? JSON.parse(topSectionKeys)
        : undefined;

    const topSectionKeysByUserIdList =
      topSectionKeysByUserId && JSON.parse(topSectionKeysByUserId)
        ? JSON.parse(topSectionKeysByUserId)
        : undefined;

    return userIdsList
      ? this.checkService.kycValidationCheckBatch(
          identityQuery.tenantId,
          userIdsList,
          entityId,
          entityClass,
          templateId,
          topSectionKeysByUserIdList,
          granularity,
        )
      : this.checkService.kycValidationCheck(
          identityQuery.tenantId,
          userId,
          entityId,
          entityClass,
          templateId,
          topSectionKeysList,
          granularity,
        );
  }
}
