import { Injectable } from '@nestjs/common';

import ErrorService from 'src/utils/errorService';

import { ProjectEnum } from 'src/old/constants/enum';

import { keys as UserKeys, User, UserType } from 'src/types/user';

import { WalletService } from 'src/modules/v2Wallet/wallet.service';
import { UserHelperService } from 'src/modules/v2User/user.service';
import { keys as WalletKeys, Wallet } from 'src/types/wallet';
import { UserRetrievalService } from 'src/modules/v2User/user.service/retrieveUser';

import { Link } from 'src/types/workflow/workflowInstances/link';
import { EntityType } from 'src/types/entity';
import { LinkService } from 'src/modules/v2Link/link.service';
import { ApiMetadataCallService } from 'src/modules/v2ApiCall/api.call.service/metadata';
import { keys as ProjectKeys, Project } from 'src/types/project';
import { UserProjectData } from 'src/types/userEntityData';
import { ApiEntityCallService } from 'src/modules/v2ApiCall/api.call.service/entity';

@Injectable()
export class ProjectRetrievalService {
  constructor(
    private readonly userRetrievalService: UserRetrievalService,
    private readonly userHelperService: UserHelperService,
    private readonly linkService: LinkService,
    private readonly walletService: WalletService,
    private readonly apiMetadataCallService: ApiMetadataCallService,
    private readonly apiEntityCallService: ApiEntityCallService,
  ) {}

  /**
   * [Retrieve project]
   */
  retrieveProject = async (
    tenantId: string,
    projectId: string,
    withIssuer: boolean,
    withVehicles: boolean,
    withSingleUserDetail: boolean,
    user: User, // only relevant if 'withSingleUserDetail' === 'true'
  ): Promise<Project> => {
    try {
      const project: Project =
        await this.apiMetadataCallService.retrieveProject(
          tenantId,
          ProjectEnum.projectId,
          projectId,
          true,
        );

      // Append issuer
      if (withIssuer) {
        const issuer: User =
          await this.linkService.retrieveIssuerLinkedToEntity(
            tenantId,
            projectId,
            EntityType.PROJECT,
          );
        const issuerWallet: Wallet =
          this.walletService.extractWalletFromUserEntityLink(
            issuer,
            issuer[UserKeys.LINK],
          );

        project[ProjectKeys.ISSUER] = this.userHelperService.formatIssuer(
          issuer,
          issuerWallet[WalletKeys.WALLET_ADDRESS],
        );
      }

      // Append user's token-related data
      if (withSingleUserDetail) {
        const userRelatedData: UserProjectData =
          await this.userRetrievalService.retrieveUserProjectRelatedData(
            tenantId,
            user,
            project,
            withVehicles,
          );
        project[ProjectKeys.USER_RELATED_DATA] = userRelatedData;
      }

      return project;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieving project',
        'retrieveProject',
        false,
        500,
      );
    }
  };

  /**
   * [Retrieve project as an issuer]
   */
  retrieveProjectAsIssuer = async (
    tenantId: string,
    projectId: string,
    withVehicles: boolean,
  ): Promise<Project> => {
    try {
      const project: Project = await this.retrieveProject(
        tenantId,
        projectId,
        true, // withIssuer (even though no fully necessary, this allows the issuer to retrieve the address he's been using to deploy this token)
        withVehicles,
        false, // withSingleUserDetail (issuer is not supposed to hold tokens, so no need to return him his balances, token actions, etc.)
        undefined, // user (not required since 'withSingleUserDetail' === 'false')
      );

      return project;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieving project as an issuer',
        'retrieveProjectAsIssuer',
        false,
        500,
      );
    }
  };

  /**
   * [Retrieve project as an investor]
   */
  retrieveProjectAsInvestor = async (
    tenantId: string,
    projectId: string,
    withVehicles: boolean,
    investor: User,
  ): Promise<Project> => {
    try {
      const project: Project = await this.retrieveProject(
        tenantId,
        projectId,
        true, // withIssuer
        withVehicles,
        true, // withSingleUserDetail (investor needs to retrieve his own balances, token actions, etc.)
        investor,
      );
      return project;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieving project as an investor',
        'retrieveProjectAsInvestor',
        false,
        500,
      );
    }
  };

  /**
   * [Retrieve project, but only if user is linked to it]
   */
  retrieveProjectIfLinkedToUser = async (
    tenantId: string,
    userId: string,
    userType: UserType,
    projectId: string,
    withVehicles: boolean,
  ): Promise<Project> => {
    try {
      let project: Project;

      // Fetch user-project link
      const userProjectLinks: Array<Link> =
        await this.linkService.listAllUserEntityLinks(
          tenantId,
          userId,
          userType,
          projectId,
          EntityType.PROJECT,
          undefined, // assetClassKey
          false, // exhaustive list
          false, // strictList
        );

      // Verify the user is correctly linked to the project he wants to retrieve
      // "correctly linked" means link is unique and correctly typed
      this.linkService.checkLinkIsUnique(
        userProjectLinks,
        userType,
        userId,
        EntityType.PROJECT,
        projectId,
      );

      if (userType === UserType.ISSUER) {
        project = await this.retrieveProjectAsIssuer(
          tenantId,
          projectId,
          withVehicles,
        );
      } else if (userType === UserType.INVESTOR) {
        // In this case (investor), it is required to retrieve the user first
        // since we'll need to extract his wallet in order to retrieve his balances
        const user: User = await this.apiEntityCallService.fetchEntity(
          tenantId,
          userId,
          true,
        );
        project = await this.retrieveProjectAsInvestor(
          tenantId,
          projectId,
          withVehicles,
          user,
        );
      } else {
        ErrorService.throwError('invalid user type');
      }

      return project;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieving project if linked to user',
        'retrieveProjectIfLinkedToUser',
        false,
        500,
      );
    }
  };
}
