import { Injectable, BadRequestException } from '@nestjs/common'
import {
  AddressRequest,
  ApplicantRequest,
  CheckRequest,
  IdNumberRequest,
  Onfido,
  Applicant,
  Region,
} from '@onfido/api'
import { NestJSPinoLogger } from '@consensys/observability'
import moment from 'moment'
import { UserPersonalInfo } from '../PersonalInformation'
import { ValidationErrors } from './InvalidPersonalInfoError'
import ReportResult from './ReportResult'
import { KYCResult, KYCScope } from '@consensys/messaging-events'
import { OnfidoKycResult } from './OnfidoKYCResult'
import ReportName from './ReportName'
import {
  OnfidoApplicantId,
  OnfidoCheckId,
  OnfidoReportId,
} from '../../data/entities/types'
import CheckResult from './CheckResult'
import { isNil } from '../../utils/utils'

// TODO: Add metrics and tracing
@Injectable()
export default class OnFidoClient {
  constructor(
    private readonly logger: NestJSPinoLogger,
    private defaultOnfidoClient: Onfido,
  ) {}

  getOnfidoClient(apiToken?: string): Onfido {
    if (!isNil(apiToken)) {
      return new Onfido({
        apiToken,
        region: Region.EU,
      })
    }
    return this.defaultOnfidoClient
  }

  // @Retry()
  // @MeterAndTrace('onfido.submit-verification')
  async createApplicant(
    userInfo: UserPersonalInfo,
    apiToken?: string,
  ): Promise<OnfidoApplicantId> {
    this.logger.info('Creating an OnFido applicant', {
      userInfo,
      apiToken,
    })
    const applicant = this.userToOnFidoApplicant(userInfo)

    try {
      const applicantData = await this.getOnfidoClient(
        apiToken,
      ).applicant.create(applicant)
      this.logger.info(
        {
          onFidoApplicant: applicantData,
        },
        'Created an OnFido applicant',
      )
      return applicantData.id as OnfidoApplicantId
    } catch (error) {
      this.handleError(error, 'Failed to create an OnFido applicant', {})
    }
  }

  private userToOnFidoApplicant(userInfo: UserPersonalInfo): ApplicantRequest {
    return {
      firstName: userInfo.firstName,
      lastName: userInfo.lastName,
      email: userInfo.email,
      dob: userInfo.dateOfBirth
        ? moment(userInfo.dateOfBirth).format('YYYY-MM-DD')
        : null,
      address: OnFidoClient.createAddresses(userInfo),
      idNumbers: OnFidoClient.createIdNumbers(userInfo),
    }
  }

  private static createAddresses(userInfo: UserPersonalInfo): AddressRequest {
    return {
      buildingName: userInfo.buildingName,
      buildingNumber: userInfo.buildingNumber,
      flatNumber: userInfo.flatNumber,
      street: userInfo.street,
      subStreet: userInfo.subStreet,
      town: userInfo.city,
      state: userInfo.state,
      postcode: userInfo.postalCode,
      country: userInfo.country,
    }
  }

  private static createIdNumbers(
    userInfo: UserPersonalInfo,
  ): IdNumberRequest[] {
    if (!userInfo.socialSecurityNumber) return []

    return [
      {
        type: 'ssn',
        value: userInfo.socialSecurityNumber,
      },
    ]
  }

  private static createOnFidoCheck(applicantId: string): CheckRequest {
    return {
      applicantId,
      reportNames: [
        // ReportName.IdentityEnhanced,
        // ReportName.WatchlistEnhanced,
        ReportName.FacialSimilarityPhoto,
        ReportName.FacialSimilarityVideo,
        ReportName.Document,
      ],
      asynchronous: true,
    }
  }

  async updateApplicant(
    applicantId: OnfidoApplicantId,
    userInfo: UserPersonalInfo,
    apiToken?: string,
  ): Promise<Applicant> {
    this.logger.info(
      {
        userInfo,
        apiToken,
        applicantId,
      },
      'Updating an OnFido applicant',
    )
    const applicant = this.userToOnFidoApplicant(userInfo)

    try {
      const applicantData = await this.getOnfidoClient(
        apiToken,
      ).applicant.update(applicantId, applicant)

      this.logger.info('Updated an OnFido applicant', {
        onFidoApplicant: applicantData,
      })
      return applicantData
    } catch (error) {
      this.handleError(error, 'Failed to update an OnFido applicant', {})
    }
  }

  async generateJwtToken(
    applicantId: string,
    apiToken?: string,
  ): Promise<string> {
    this.logger.info(
      {
        apiToken,
        applicantId,
      },
      'Generate onfido jwt token',
    )
    return this.getOnfidoClient(apiToken).sdkToken.generate({
      applicantId,
      // referrer: `*://${process.env.DOMAIN_NAME}/*`,
      referrer: `*://*/*`,
    })
  }

  async getReportStatus(reportId: OnfidoReportId): Promise<ReportResult> {
    try {
      const report = await this.defaultOnfidoClient.report.find(reportId)
      this.logger.info(
        {
          report,
        },
        'Fetched Onfido report by id',
      )
      return {
        reportId,
        checkId: report.checkId as OnfidoCheckId,
        scope: this.reportNameToScope(report.name),
        name: report.name,
        href: report.href,
        result: this.convertToKycResult(report.result),
      }
    } catch (error) {
      this.handleError(error, 'Failed to get report by id', { reportId })
    }
  }

  async getCheckStatus(checkId: OnfidoCheckId): Promise<CheckResult> {
    try {
      const check = await this.defaultOnfidoClient.check.find(checkId)
      this.logger.info(
        {
          check,
        },
        'Fetched Onfido check by id',
      )
      return {
        applicantId: check.applicantId as OnfidoApplicantId,
        result: this.convertToKycResult(check.result),
      }
    } catch (error) {
      this.handleError(error, 'Failed to get check by id', { checkId })
    }
  }

  // /**
  //  * Given the applicant ID and the variant type, initialize a check on OnFido.
  //  *
  //  * @param applicantId The applicant to create a check for.
  //  * @param variantType The optional variant type for the check
  //  * @returns the OnFido check ID that was generated.
  //  */
  // @Retry()
  // @MeterAndTrace('onfido.init-check-for-applicant')
  async initializeCheckForApplicantId(
    applicantId: string,
    apiToken?: string,
  ): Promise<string> {
    this.logger.info('Initializing check for OnFido applicant', {
      applicantId,
      apiToken,
    })

    // Generate check object
    const check = OnFidoClient.createOnFidoCheck(applicantId)

    try {
      const res: { id: string } = await this.getOnfidoClient(
        apiToken,
      ).check.create(check)

      const checkId = res.id

      this.logger.info(
        {
          applicantId,
          checkId,
        },
        'Check initialized for an applicant',
      )

      return checkId
    } catch (error) {
      this.handleError(error, 'Failed to initialize check for applicant', {
        applicantId,
      })
    }
  }

  private static extractErrors(fields: any): ValidationErrors {
    let errors: ValidationErrors = {}
    for (const [key, value] of Object.entries(fields)) {
      if (key === 'address') {
        errors = {
          ...errors,
          ...OnFidoClient.extractAddressErrors(fields.address),
        }
      } else if (key === 'id_numbers') {
        errors = {
          ...errors,
          ...OnFidoClient.extractIdErrors(fields.id_numbers),
        }
      } else {
        errors[key] = value as string[]
      }
    }

    return errors
  }

  private static extractAddressErrors(address: any): ValidationErrors {
    const firstAddress = address[0]

    const errors: ValidationErrors = {}
    for (const [key, value] of Object.entries(firstAddress)) {
      errors[key] = value as string[]
    }

    return errors
  }

  private static errorsToString(errors: ValidationErrors): string {
    let readableErrors = ''
    for (const [key, val] of Object.entries(errors)) {
      readableErrors += `${key} ${val} and `
    }
    readableErrors = readableErrors.substring(0, readableErrors.length - 5)
    return readableErrors
  }

  private static extractIdErrors(idNumbers: any): ValidationErrors {
    const idNumber = idNumbers[0]
    return {
      socialSecurityNumber: idNumber.value,
    }
  }

  private reportNameToScope(name: string): KYCScope {
    switch (name) {
      case ReportName.IdentityEnhanced:
        return KYCScope.Identity
      case ReportName.WatchlistEnhanced:
        return KYCScope.Identity
      case ReportName.FacialSimilarityPhoto:
        return KYCScope.Id
      case ReportName.FacialSimilarityVideo:
        return KYCScope.Id
      case ReportName.Document:
        return KYCScope.Id
      default:
        throw new Error(`Unexpected report name: "${name}"`)
    }
  }

  private convertToKycResult(status: string): KYCResult {
    if (status === OnfidoKycResult.Clear) {
      return KYCResult.Pass
    }
    return KYCResult.Fail
  }

  private handleError(error: any, errorMsg: string, params: object): never {
    this.logger.error(
      {
        ...params,
        error: error.message,
        stack: error.stack,
        onfidoResponse: error.responseBody,
      },
      errorMsg,
    )

    if (error?.responseBody?.error?.type === 'validation_error') {
      const errors = OnFidoClient.extractErrors(error.responseBody.error.fields)
      const readableErrors = OnFidoClient.errorsToString(errors)
      this.logger.error(readableErrors)
      throw new BadRequestException(readableErrors)
    }

    throw new Error(`${errorMsg}: ${error.message}`)
  }
}
