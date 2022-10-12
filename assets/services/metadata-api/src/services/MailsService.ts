import {
  Injectable,
  HttpException,
  HttpStatus,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { NestJSPinoLogger } from '@codefi-assets-and-payments/observability';
import { v4 as uuidv4 } from 'uuid';
import { validateSync } from 'class-validator';
import fs from 'fs';
import _ from 'lodash';

import { prettify, areDatabaseObjectsEqual } from 'src/utils/common';
import { MailDto, InitMailsDto, MailBuildDto } from 'src/model/dto/MailDto';
import { Mail, MailVariables } from 'src/model/MailEntity';
import { plainToClass } from 'class-transformer';
import { ConfigsService } from './ConfigsService';
import { DEFAULT_TENANT_ID } from 'src/utils/constants';

const mailsDirectory = __dirname + '/../configurations/mails';
const regex = new RegExp(/\{{(.+?)\}}/g);

@Injectable()
export class MailsService implements OnModuleInit {
  constructor(
    private readonly logger: NestJSPinoLogger,
    private configService: ConfigsService,
    @InjectRepository(Mail)
    private readonly mailRepository: Repository<Mail>,
    @InjectRepository(MailVariables)
    private readonly mailVariablesRepository: Repository<MailVariables>,
  ) {}

  async onModuleInit() {
    this.logger.info('Import default mails');
    const files = fs.readdirSync(mailsDirectory);
    for (const file of files)
      try {
        const parsedMails: InitMailsDto[] = JSON.parse(
          fs.readFileSync(`${mailsDirectory}/${file}`, 'utf8'),
        );
        for (const mail of parsedMails) {
          this.logger.debug({
            mail,
            message: `======> verifying mail with key {${mail.key}} <======`,
          });
          await this.upsertMail(mail);
        }
      } catch (e) {
        this.logger.error(
          `failed to parse mails from file ${file}: ${e.message}`,
        );
      }
  }

  private async upsertMail(mailDto: InitMailsDto) {
    const errors = validateSync(plainToClass(InitMailsDto, mailDto));
    const { variables, ...mail } = mailDto;
    if (errors.length > 0) {
      this.logger.error(errors);
    } else {
      await this.checkMailTemplatingLanguage(mailDto, variables);
      const match = await this.findOne(mail.tenantId, mail.key);
      try {
        if (!match) {
          const mailVariables = await this.mailVariablesRepository.findOne({
            where: { key: mailDto.key },
          });
          if (!mailVariables) {
            await this.mailVariablesRepository.save({
              key: mail.key,
              variables,
            });
          }
          await this.create(mail, true, false);
        } else {
          if (!_.isEqual(match.variables.variables.sort(), variables.sort())) {
            this.logger.debug({
              message: `======> mail variables with key {${mail.key}} will be updated <======`,
              old: match.variables,
              new: variables,
            });
            this.mailVariablesRepository.save({
              key: match.key,
              variables,
            });
          }
          if (!areDatabaseObjectsEqual(_.omit(match, 'variables'), mail)) {
            this.logger.debug({
              message: `======> mail with key {${mail.key}} will be updated <======`,
              mail,
            });
            await this.update(mail, true);
          }
        }
      } catch (error) {
        this.logger.error(error);
      }
    }
  }

  async checkMailTemplatingLanguage(
    { key, message, messageTitle, subject }: MailDto,
    variables: string[],
  ): Promise<void> {
    this.logger.debug({
      message: 'checking mail templating language',
      obj: { key, message, messageTitle, subject, variables },
    });
    // check if valid subject
    await this.checkAndCollectVariables(key, subject, variables, 'subject');

    // check if valid message
    await this.checkAndCollectVariables(key, message, variables, 'message');

    // check if valid messageTitle
    if (messageTitle) {
      await this.checkAndCollectVariables(
        key,
        messageTitle,
        variables,
        'messageTitle',
      );
    }
  }

  checkAndCollectVariables(
    key: string,
    text: string,
    variables: string[],
    label: string,
  ): Promise<string[][]> {
    return new Promise((resolve, reject) => {
      const collectedVariables: string[][] = [];
      let currentVar: RegExpExecArray | null;
      while (null !== (currentVar = regex.exec(text))) {
        if (variables.indexOf(currentVar[1]) === -1) {
          const error = `mail with key=${key} is invalid, [${label}] is using an invalid variable (${currentVar[1]}), valid variables are ${variables}`;
          this.logger.error(error);
          reject(error);
        }
        collectedVariables.push(currentVar);
      }
      resolve(collectedVariables);
    });
  }

  async create(
    mail: MailDto,
    bypassDefaultTenantCheck: boolean,
    upsert: boolean,
  ): Promise<Mail> {
    const { tenantId, key, subject, messageTitle, message, buttonLabel } = mail;

    if (!tenantId) {
      const error = 'tenantId cannot be undefined';
      this.logger.error(error);
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error,
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    if (!bypassDefaultTenantCheck && tenantId === DEFAULT_TENANT_ID) {
      const error = 'default mails cannot be created using the API';
      this.logger.error(error);
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error,
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    if (!key) {
      const error = 'key cannot be undefined';
      this.logger.error(error);
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error,
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    const sameMail = await this.mailRepository.findOne({
      where: {
        tenantId,
        key,
      },
    });

    if (sameMail && !upsert) {
      const error = `Mail with tenantId=${tenantId} and key=${key} already exists`;
      this.logger.error(error);
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error,
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    const mailVariables = await this.mailVariablesRepository.findOne({
      where: {
        key,
      },
    });
    if (!mailVariables) {
      const error = `invalid key ${key}`;
      this.logger.error(error);
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error,
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      const newMail = {
        id: sameMail?.id || uuidv4(),
        tenantId,
        key,
        subject,
        messageTitle,
        message,
        buttonLabel,
        variables: mailVariables,
      };
      await this.checkMailTemplatingLanguage(newMail, mailVariables.variables);
      return this.mailRepository.save(newMail);
    } catch (error) {
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

  async find(tenantId: string, key?: string): Promise<Array<Mail>> {
    const defaultTenantMails = await this.mailRepository.find({
      where: key
        ? [
            {
              tenantId,
              key,
            },
          ]
        : [
            {
              tenantId,
            },
          ],
    });
    if (key) {
      if (defaultTenantMails.length > 0) {
        return defaultTenantMails;
      }
      return this.mailRepository.find({
        where: {
          tenantId: DEFAULT_TENANT_ID,
          key,
        },
      });
    }
    const variables = await this.mailVariablesRepository.find();
    if (defaultTenantMails.length === variables.length) {
      return defaultTenantMails;
    } else {
      const foundKeys = defaultTenantMails.map(({ key }) => key);
      const missingKeys = variables
        .filter((v) => foundKeys.indexOf(v.key) === -1)
        .map(({ key }) => key);

      const defaultMissingKeysMails = await this.mailRepository.find({
        where: {
          tenantId: DEFAULT_TENANT_ID,
          key: In(missingKeys),
        },
      });
      return [...defaultTenantMails, ...defaultMissingKeysMails];
    }
  }

  findOne(tenantId: string, key: string): Promise<Mail | null> {
    return this.mailRepository.findOne({
      where: {
        tenantId,
        key,
      },
    });
  }

  async update(
    { tenantId, key, subject, messageTitle, message, buttonLabel }: MailDto,
    bypassDefaultTenantCheck = false,
  ): Promise<Mail> {
    if (!tenantId) {
      const error = 'tenantId cannot be undefined';
      this.logger.error(error);
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error,
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    if (!bypassDefaultTenantCheck && tenantId === DEFAULT_TENANT_ID) {
      const error = 'default mails cannot be updated using the API';
      this.logger.error(error);
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error,
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    if (!key) {
      const error = 'key cannot be undefined';
      this.logger.error(error);
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error,
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    const targetMail = await this.findOne(tenantId, key);

    // If it exists, update it
    if (targetMail) {
      try {
        const newData = {
          id: targetMail.id,
          tenantId,
          key,
          subject,
          messageTitle,
          message,
          buttonLabel,
        };
        await this.checkMailTemplatingLanguage(
          newData,
          targetMail.variables.variables,
        );

        const updatedMail = await this.mailRepository.save(newData);
        this.logger.info(`Updated mail: ${prettify(updatedMail)}`);
        return updatedMail;
      } catch (error) {
        this.logger.error(error);
        throw new HttpException(
          {
            status: HttpStatus.BAD_REQUEST,
            error,
          },
          HttpStatus.BAD_REQUEST,
        );
      }
    } else {
      const error = `Unable to find the mail with tenantId=${tenantId} and key=${key}`;
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

  async delete(tenantId: string, key: string): Promise<{ message: string }> {
    if (!tenantId) {
      const error = 'tenantId cannot be undefined';
      this.logger.error(error);
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error,
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    if (tenantId === DEFAULT_TENANT_ID) {
      const error = 'default mails cannot be deleted using the API';
      this.logger.error(error);
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error,
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    if (!key) {
      const error = 'key cannot be undefined';
      this.logger.error(error);
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error,
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    const { affected } = await this.mailRepository.delete({ tenantId, key });
    if (affected && affected > 0) {
      const message = 'mail deleted.';
      this.logger.info(message);
      return { message };
    } else {
      const error = `Unable to find the mail with tenantId=${tenantId} and key=${key}.`;
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

  async build({ key, tenantId, elements }: MailBuildDto) {
    if (!tenantId) {
      const error = 'tenantId cannot be undefined';
      this.logger.error(error);
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error,
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    if (!key) {
      const error = 'key cannot be undefined';
      this.logger.error(error);
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error,
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    let mail: Mail | null;
    // retrieve custom tenant mail
    mail = await this.findOne(tenantId, key);
    if (!mail) {
      // retreive default mail
      mail = await this.findOne(DEFAULT_TENANT_ID, key);

      if (!mail) {
        const error = `Unable to find the mail with tenantId=${tenantId} and key=${key}`;
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

    // check of all variables are provided
    for (const variable of mail.variables.variables) {
      if (!elements[variable]) {
        const error = `missing variable ${variable}`;
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

    let [config] = await this.configService.find(tenantId);
    if (!config) {
      [config] = await this.configService.find(DEFAULT_TENANT_ID);
    }

    const { mailLogo: logo, mailColor, mainColor, data } = config;

    const subject = await this.replaceVariables(
      mail.key,
      mail.subject,
      mail.variables.variables,
      'subject',
      elements,
    );

    const message = await this.replaceVariables(
      mail.key,
      mail.message,
      mail.variables.variables,
      'message',
      elements,
    );

    const messageTitle = await this.replaceVariables(
      mail.key,
      mail.messageTitle,
      mail.variables.variables,
      'messageTitle',
      elements,
    );

    return {
      logo,
      color: mailColor || mainColor,
      subject,
      message,
      messageTitle,
      buttonLabel: mail.buttonLabel,
      messageFooter: data?.mail?.messageFooter ?? true,
      poweredBy: data?.mail?.poweredBy ?? true,
      fromEmail: data?.mail?.fromEmail,
      fromName: data?.mail?.fromName,
    };
  }

  async replaceVariables(
    key: string,
    text: string,
    variables: string[],
    label: string,
    elements: Record<string, string>,
  ) {
    if (!text) {
      return undefined;
    }
    const subjectCollectedVariables = await this.checkAndCollectVariables(
      key,
      text,
      variables,
      label,
    );
    return subjectCollectedVariables.reduce(
      (vars, currentVar) =>
        vars.replace(currentVar[0], elements[currentVar[1]] || ''),
      text,
    );
  }
}
