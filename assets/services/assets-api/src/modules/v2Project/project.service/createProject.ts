import { Injectable } from '@nestjs/common';

import ErrorService from 'src/utils/errorService';

import { keys as UserKeys, User, UserType } from 'src/types/user';

import { WalletService } from 'src/modules/v2Wallet/wallet.service';
import { Wallet } from 'src/types/wallet';

import { LinkService } from 'src/modules/v2Link/link.service';

import { EntityType } from 'src/types/entity';
import { ApiMetadataCallService } from 'src/modules/v2ApiCall/api.call.service/metadata';

import { FunctionName } from 'src/types/smartContract';

import { ProjectEnum } from 'src/old/constants/enum';

import { keys as KycTemplateKeys } from 'src/types/kyc/template';

import { KYCTemplateService } from 'src/modules/v2KYCTemplate/kyc.template.service';
import { keys as ProjectKeys, Project } from 'src/types/project';
import { CreateProjectOutput } from '../project.dto';
import { ProjectHelperService } from '.';
import { ApiEntityCallService } from 'src/modules/v2ApiCall/api.call.service/entity';

@Injectable()
export class ProjectCreationService {
  constructor(
    private readonly kycTemplateService: KYCTemplateService,
    private readonly linkService: LinkService,
    private readonly walletService: WalletService,
    private readonly apiMetadataCallService: ApiMetadataCallService,
    private readonly apiEntityCallService: ApiEntityCallService,
    private readonly projectHelperService: ProjectHelperService,
  ) {}

  async createProject(
    tenantId: string,
    issuerId: string,
    typeFunctionUser: UserType,
    issuerWalletAddress: string,
    key: string,
    name: string,
    description: string,
    picture: Array<string>,
    bankAccount: any,
    kycTemplateId: string,
    data: any,
  ): Promise<CreateProjectOutput> {
    try {
      // ------------- Format all input data (beginning) -------------
      const _description: string =
        this.projectHelperService.retrieveProjectDescriptionIfValid(
          description,
        );

      // ------------- Format all input data (end) -------------

      // Fetch issuer, and notary (if there is a notary)
      const issuer: User = await this.apiEntityCallService.fetchEntity(
        tenantId,
        issuerId,
        true,
      );

      // Retrieve Wallet
      const issuerWallet: Wallet = this.walletService.extractWalletFromUser(
        issuer,
        issuerWalletAddress,
      );

      const _kycTemplateId = (
        await this.kycTemplateService.retrieveKycTemplateIfExistingOrRetrieveIssuerKycTemplate(
          tenantId,
          kycTemplateId,
          issuer,
        )
      )?.[KycTemplateKeys.TEMPLATE_ID];

      // Check if project with same "key" already exists
      const projects: Array<Project> =
        await this.apiMetadataCallService.retrieveProject(
          tenantId,
          ProjectEnum.key,
          key,
          false,
        );

      let newProject = true;
      let project: Project;
      if (projects.length !== 0) {
        newProject = false;
        project = projects[0];

        // Check if the caller is the issuer of the project
        const projectIssuer: User =
          await this.linkService.retrieveIssuerLinkedToEntity(
            tenantId,
            project[ProjectKeys.PROJECT_ID],
            EntityType.PROJECT,
          );

        if (projectIssuer[UserKeys.USER_ID] !== issuer[UserKeys.USER_ID]) {
          ErrorService.throwError(
            `project with key ${
              project[ProjectKeys.KEY]
            } already exists, but was created by another issuer (${
              projectIssuer[UserKeys.USER_ID]
            }): please provide a different key which has not already been used`,
          );
        }
      } else {
        // Create project in off-chain DB
        project = await this.apiMetadataCallService.createProjectInDB(
          tenantId,
          key,
          name,
          _description,
          picture,
          bankAccount,
          _kycTemplateId,
          data,
        );

        // Create link between issuer and project
        await this.linkService.createUserEntityLinkIfRequired(
          tenantId,
          typeFunctionUser,
          undefined, // idFunctionUser
          issuer,
          FunctionName.KYC_ADD_ISSUER,
          EntityType.PROJECT,
          project,
          undefined, // issuer
          undefined, // token
          undefined, // assetClassKey --> only for tokens
          issuerWallet,
        );
      }

      return {
        project: project,
        newProject: newProject,
        message: `Project ${
          project[ProjectKeys.PROJECT_ID]
        } created successfully`,
      };
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'creating project',
        'createProject',
        false,
        500,
      );
    }
  }
}
