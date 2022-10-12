import { Injectable } from '@nestjs/common';
import { NestJSPinoLogger } from '@codefi-assets-and-payments/observability';
import { ApiAdminCallService } from '../../v2ApiCall/api.call.service/admin';
import { User } from '../../../types/user';
import { getTenantRolesForUserType, rolesMatch } from 'src/utils/tenantRoles';
import { craftAuth0TenantId } from 'src/types/authentication';
import { ApiEntityCallService } from 'src/modules/v2ApiCall/api.call.service/entity';

interface Progress {
  completedTenants: number;
  totalTenants: number;
  completedUsers?: number;
  totalUsers?: number;
}

interface Error {
  tenantId: string;
  userEmail: string;
  message: string;
  raw: any;
}

interface Result {
  totalCount: number;
  skippedCount: number;
  updatedCount: number;
  errorCount: number;
  errors: Error[];
  dryRun: boolean;
  start: Date;
  finish?: Date;
  duration?: number;
}

@Injectable()
export class TenantRoleMigrationService {
  constructor(
    private readonly logger: NestJSPinoLogger,
    private readonly apiAdminCallService: ApiAdminCallService,
    private readonly apiEntityCallService: ApiEntityCallService,
  ) {}

  async migrate(dryRun: boolean): Promise<Result> {
    this.logger.info('Migrating tenant roles');

    const tenantIds = await this.getTenantIds();

    this.logger.debug(`Found ${tenantIds.length} tenants`);

    const result: Result = {
      totalCount: 0,
      skippedCount: 0,
      updatedCount: 0,
      errorCount: 0,
      errors: [],
      dryRun,
      start: new Date(),
    };

    for (const [tenantIdIndex, tenantId] of tenantIds.entries())
      await this.processTenant(tenantId, dryRun, result, {
        completedTenants: tenantIdIndex + 1,
        totalTenants: tenantIds.length,
      });

    result.errorCount = result.errors.length;

    result.totalCount =
      result.skippedCount + result.updatedCount + result.errorCount;

    result.finish = new Date();
    result.duration = result.finish.getTime() - result.start.getTime();

    this.logger.info(
      `Tenant role migration complete - Skipped: ${result.skippedCount} | Updated: ${result.updatedCount} | Errors: ${result.errorCount}`,
    );

    return result;
  }

  private async processTenant(
    tenantId: string,
    dryRun: boolean,
    result: Result,
    progress: Progress,
  ) {
    this.logger.debug(`Processing tenant: ${tenantId}`);

    const users: User[] = await this.apiEntityCallService.fetchEntities(
      tenantId,
      {}, // filter
      true, // includeWallets
    );

    this.logger.debug(`Found ${users.length} users for tenant: ${tenantId}`);

    for (const [userIndex, user] of users.entries())
      await this.processUser(user, tenantId, dryRun, result, {
        ...progress,
        completedUsers: userIndex + 1,
        totalUsers: users.length,
      });
  }

  private async processUser(
    user: User,
    tenantId: string,
    dryRun: boolean,
    result: Result,
    progress: Progress,
  ) {
    let auth0User;

    try {
      if (!user.authId) {
        this.logger.debug(`Skipped user as no Auth0 ID: ${user.email}`);
        result.skippedCount += 1;
        return;
      }

      auth0User = await this.apiAdminCallService.retrieveUsersInAuth0ById(
        tenantId,
        user.authId,
      );

      const tenantDataKey = craftAuth0TenantId(tenantId);
      const tenantData = auth0User.appMetadata?.[tenantDataKey] || {};
      const currentTenantRoles = tenantData.roles;
      const targetTenantRoles = getTenantRolesForUserType(user.userType);

      if (rolesMatch(currentTenantRoles, targetTenantRoles)) {
        this.logger.debug(`Skipped user as roles match: ${user.email}`);
        result.skippedCount += 1;
      } else {
        if (!dryRun) {
          await this.apiAdminCallService.updateUserInAuth0ById(
            user.tenantId,
            user.authId,
            user.id,
            targetTenantRoles,
          );
        }

        result.updatedCount += 1;

        this.logger.debug(`Updated user: ${user.email}`);
      }
    } catch (error) {
      result.errors.push({
        tenantId,
        userEmail: user.email,
        message: error.message,
        raw: error,
      });

      this.logger.debug(`Error processing user: ${user.email} - ${error}`);
    }

    this.progressLog(progress, result);
  }

  private async getTenantIds(): Promise<string[]> {
    return (await this.apiAdminCallService.listAllClientApplicationInAuth0())
      .map((client) => client.clientMetadata?.tenantId)
      .filter((tenantId) => !!tenantId);
  }

  private progressLog(progress: Progress, result: Result) {
    const percentageTenants = this.percentageComplete(
      progress.completedTenants,
      progress.totalTenants,
    );

    const percentageUsers = this.percentageComplete(
      progress.completedUsers,
      progress.totalUsers,
    );

    this.logger.debug(
      `${progress.completedTenants} / ${progress.totalTenants} Tenants - ${percentageTenants}% | ${progress.completedUsers} / ${progress.totalUsers} Users - ${percentageUsers}%\nUpdated: ${result.updatedCount} | Skipped: ${result.skippedCount} | Errors: ${result.errors.length}`,
    );
  }

  private percentageComplete(completed: number, total: number): string {
    return ((completed / total) * 100).toFixed(2);
  }
}
