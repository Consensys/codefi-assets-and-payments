import { UserPersonalInfo } from '../services/PersonalInformation'
import { UserEntity } from '../data/entities/UserEntity'
import { OnFidoKycObject } from '../controllers/OnFidoKycWebhookRequest'
import { KYCResult, KYCScope } from '@consensys/messaging-events/dist'
import ReportResult from '../services/onfido/ReportResult'
import CheckResult from '../services/onfido/CheckResult'
import {
  OnfidoApplicantId,
  OnfidoCheckId,
  OnfidoReportId,
  UserId,
} from '../data/entities/types'
import { ReportResultEntity } from '../data/entities/ReportResultEntity'

const testDate = new Date('1990-01-01')

export const userId = 'user-id' as UserId
export const applicantId = 'applicant-id' as OnfidoApplicantId
export const checkId = 'check-id' as OnfidoCheckId
export const reportId = 'report-id' as OnfidoReportId

export function userPersonalInformation(): UserPersonalInfo {
  return {
    userId,
    firstName: 'Joe',
    lastName: 'Doe',
    email: 'joe.doe@email.com',
    dateOfBirth: testDate,
    country: 'GBR',
    flatNumber: '42',
    buildingNumber: '5',
    buildingName: 'building-name',
    street: 'Caradon Hill',
    subStreet: 'Substreet',
    state: 'California',
    city: 'TYTHEGSTON',
    postalCode: 'CF32 3QD',
    socialSecurityNumber: 'ssn',
  }
}

export function user(): UserEntity {
  return {
    userId: userId,
    onfidoApplicationId: applicantId,
    createdAt: testDate,
    updatedAt: testDate,
  }
}

export function reportResultEntity(): ReportResultEntity {
  return {
    reportId,
    userId,
    checkId,
    name: 'report-name',
    href: 'href',
    completedAt: testDate,
    result: KYCResult.Pass,
    scope: KYCScope.Id,
    createdAt: testDate,
    updatedAt: testDate,
  }
}

export function onfidoKycObject(): OnFidoKycObject {
  return {
    id: 'onfido-object-id',
    href: 'href',
    completed_at_iso8601: testDate.toISOString(),
  }
}

export function reportResult(kycResult: KYCResult): ReportResult {
  return {
    reportId,
    checkId,
    scope: KYCScope.Id,
    name: 'report-name',
    href: 'href',
    result: kycResult,
  }
}

export function checkResult(kycResult: KYCResult): CheckResult {
  return {
    applicantId,
    result: kycResult,
  }
}
