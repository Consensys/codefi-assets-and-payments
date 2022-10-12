import { Injectable } from '@nestjs/common'
import { NestJSPinoLogger } from '@codefi-assets-and-payments/observability'
import { InjectRepository } from '@nestjs/typeorm'
import { DataFieldsOnly, UserId } from '../data/entities/types'
import { Repository } from 'typeorm'
import { ReportResultEntity } from '../data/entities/ReportResultEntity'

@Injectable()
export default class ReportResultDataAccess {
  constructor(
    private readonly logger: NestJSPinoLogger,
    @InjectRepository(ReportResultEntity)
    private readonly reportResultRepository: Repository<ReportResultEntity>,
  ) {}

  async getAllReportsForUser(userId: UserId): Promise<ReportResultEntity[]> {
    return this.reportResultRepository.find({
      where: { userId: 'userId as string ' },
    })
  }

  async create(
    user: DataFieldsOnly<ReportResultEntity>,
  ): Promise<ReportResultEntity> {
    return this.reportResultRepository.save(user)
  }
}
