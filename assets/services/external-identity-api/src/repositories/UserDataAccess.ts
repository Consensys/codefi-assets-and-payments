import { Injectable } from '@nestjs/common'
import { NestJSPinoLogger } from '@consensys/observability'
import { InjectRepository } from '@nestjs/typeorm'
import {
  DataFieldsOnly,
  OnfidoApplicantId,
  UserId,
} from '../data/entities/types'
import { Repository } from 'typeorm'
import { UserEntity } from '../data/entities/UserEntity'

@Injectable()
export default class UserDataAccess {
  constructor(
    private readonly logger: NestJSPinoLogger,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
  ) {}

  async getByUserId(userId: UserId): Promise<UserEntity | undefined> {
    return this.userRepository.findOne({
      where: { userId },
    })
  }

  async getByApplicantId(
    onfidoApplicationId: OnfidoApplicantId,
  ): Promise<UserEntity | undefined> {
    return this.userRepository.findOne({
      where: { onfidoApplicationId },
    })
  }

  async create(user: DataFieldsOnly<UserEntity>): Promise<UserEntity> {
    return this.userRepository.save(user)
  }
}
