import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { NestJSPinoLogger } from '@codefi-assets-and-payments/observability';
import { ApiBody, ApiQuery, ApiTags } from '@nestjs/swagger';

import { JoiValidationPipe } from 'src/validation/JoiValidationPipe';
import { reviewsSchema } from './reviewsSchema';
import { ReviewRequest } from './ReviewRequest';
import { ReviewService } from './ReviewService';
import { ReviewModel } from './ReviewModel';
import { IdentityDto } from '../identity.dto';
import { identitySchema } from '../identitySchema';

@Controller('reviews')
@ApiTags('reviews')
export class ReviewController {
  constructor(
    private readonly logger: NestJSPinoLogger,
    private readonly reviewService: ReviewService,
  ) {
    logger.setContext(ReviewController.name);
  }

  @Post()
  @ApiQuery({ name: 'tenantId', required: true })
  @ApiBody({ type: [ReviewRequest] })
  create(
    @Query(new JoiValidationPipe(identitySchema)) identityQuery: IdentityDto,
    @Body(new JoiValidationPipe(reviewsSchema, 'POST'))
    reviews: ReviewRequest[],
  ) {
    this.logger.info(reviews);
    return this.reviewService.create(identityQuery.tenantId, reviews);
  }

  @Get()
  @ApiQuery({ name: 'tenantId', required: true })
  @ApiQuery({ name: 'reviewId', required: false })
  @ApiQuery({
    name: 'objectId',
    required: false,
    description: 'templateId or elementInstanceId',
  })
  @ApiQuery({
    name: 'entityId',
    required: false,
    description: 'issuerId or tokenId',
  })
  @ApiQuery({ name: 'investorId', required: false })
  findAll(
    @Query(new JoiValidationPipe(identitySchema)) identityQuery: IdentityDto,
    @Query('reviewId') reviewId: string = null,
    @Query('objectId') objectId: string = null,
    @Query('entityId') entityId: string = null,
    @Query('entityClass') entityClass: string = null,
    @Query('investorId') investorId: string = null,
  ): Promise<ReviewModel[]> {
    this.logger.info({
      reviewId,
      objectId,
      entityId,
    });
    return this.reviewService.find(
      identityQuery.tenantId,
      reviewId,
      objectId,
      entityId,
      entityClass,
      investorId,
    );
  }

  @Put()
  @ApiQuery({ name: 'tenantId', required: true })
  update(
    @Query(new JoiValidationPipe(identitySchema)) identityQuery: IdentityDto,
    @Body(new JoiValidationPipe(reviewsSchema, 'PUT'))
    reviews: ReviewRequest[],
  ): Promise<ReviewModel[]> {
    return this.reviewService.update(identityQuery.tenantId, reviews);
  }

  @Delete(':id')
  @ApiQuery({ name: 'tenantId', required: true })
  delete(
    @Query(new JoiValidationPipe(identitySchema)) identityQuery: IdentityDto,
    @Param('id') id: string,
  ): Promise<{ message: string }> {
    return this.reviewService.remove(identityQuery.tenantId, id);
  }
}
