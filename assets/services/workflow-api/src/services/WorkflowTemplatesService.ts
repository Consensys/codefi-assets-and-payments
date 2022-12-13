import { NestJSPinoLogger } from '@consensys/observability'
import {
  Injectable,
  OnModuleInit,
  HttpException,
  HttpStatus,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'

import { allWorkflows } from '../constants/workflowTemplates'
import { WorkflowTemplate } from '../models/WorkflowTemplateEntity'
import { WorkflowTemplateDto } from '../models/dto/WorkflowTemplateDto'
import { checkTenantId, requireTenantId } from '../utils/tenant'
import { DEFAULT_TENANT_ID } from '../utils/constants'

@Injectable()
export class WorkflowTemplatesService implements OnModuleInit {
  constructor(
    private logger: NestJSPinoLogger,
    @InjectRepository(WorkflowTemplate)
    private workflowTemplateRepository: Repository<WorkflowTemplate>,
  ) {}

  async onModuleInit() {
    await Promise.all(
      allWorkflows.map(
        async (workflow) => await this.upsert(DEFAULT_TENANT_ID, workflow),
      ),
    )
  }

  async upsert(
    tenantId: string,
    workflow: WorkflowTemplateDto,
  ): Promise<WorkflowTemplate> {
    const fetchedWorkflows: WorkflowTemplate[] = await this.find(
      tenantId,
      undefined,
      'name',
      workflow.name,
    )
    if (fetchedWorkflows.length === 1) {
      this.logger.info('One workflow has been fetched. We will update it.', {
        context: fetchedWorkflows[0],
      })
      return await this.update(
        tenantId,
        fetchedWorkflows[0].id,
        workflow,
        false,
      )
    } else if (fetchedWorkflows.length === 0) {
      this.logger.info('No workflow fetched. We will push the following one.', {
        context: workflow,
      })
      return await this.create(tenantId, workflow, false)
    } else {
      this.logger.error(
        `Shall never happen: the workflow is already present 2 or more times in the table. This number should be either 0 or 1.`,
        { name: workflow.name, length: fetchedWorkflows.length },
      )
    }
  }

  async create(
    tenantId: string,
    template: WorkflowTemplateDto,
    isHTTPRequest: boolean,
  ): Promise<WorkflowTemplate> {
    // Check if inputs are valid
    await this.checkValidInputs(
      tenantId,
      undefined,
      template.name,
      isHTTPRequest,
    )

    const createdTemplate: WorkflowTemplate =
      await this.workflowTemplateRepository.save({
        ...template,
        tenantId,
      })
    return createdTemplate
  }

  async find(
    tenantId: string,
    id: number,
    field: string,
    value: string,
  ): Promise<WorkflowTemplate[]> {
    if (id) {
      return await this.workflowTemplateRepository.find({
        where: [
          { tenantId, id },
          { tenantId: DEFAULT_TENANT_ID, id },
        ],
        order: { createdAt: 'DESC' },
      })
    } else if (field && value) {
      return await this.workflowTemplateRepository.find({
        where: [
          { tenantId, [field]: value },
          { tenantId: DEFAULT_TENANT_ID, [field]: value },
        ],
        order: { createdAt: 'DESC' },
      })
    } else {
      return await this.workflowTemplateRepository.find({
        where: [{ tenantId }, { tenantId: DEFAULT_TENANT_ID }],
        order: { createdAt: 'DESC' },
      })
    }
  }

  async findOne(
    tenantId: string,
    id: number,
    field: string,
    value: string,
  ): Promise<WorkflowTemplate> {
    const templatesList: WorkflowTemplate[] = await this.find(
      tenantId,
      id,
      field,
      value,
    )
    return templatesList.length > 0 ? templatesList[0] : undefined
  }

  async update(
    tenantId: string,
    id: number,
    template: WorkflowTemplateDto,
    isHTTPRequest: boolean,
  ): Promise<WorkflowTemplate> {
    // Find the template
    const targetTemplate: WorkflowTemplate =
      await this.workflowTemplateRepository.findOne({ where: { id } })

    // If it exists, update it
    if (targetTemplate) {
      // Test if workflow template belongs to the expected tenant
      checkTenantId(tenantId, targetTemplate.tenantId)

      // Check if inputs are valid
      await this.checkValidInputs(tenantId, id, template.name, isHTTPRequest)

      try {
        const updatedTemplate: WorkflowTemplate =
          await this.workflowTemplateRepository.save({ ...template, id })
        return updatedTemplate
      } catch (error) {
        this.logger.error(error)
        throw new HttpException(
          {
            status: HttpStatus.BAD_REQUEST,
            error,
          },
          HttpStatus.BAD_REQUEST,
        )
      }
    } else {
      const error = `Unable to find the template with id=${id}`
      this.logger.error(error)
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error,
        },
        HttpStatus.BAD_REQUEST,
      )
    }
  }

  async delete(tenantId: string, id: number): Promise<{ message: string }> {
    // Find the template
    const targetTemplate: WorkflowTemplate =
      await this.workflowTemplateRepository.findOne({ where: { id } })

    if (targetTemplate) {
      // Test if workflow template belongs to the expected tenant
      checkTenantId(tenantId, targetTemplate.tenantId)

      const { affected } = await this.workflowTemplateRepository.delete(id)
      if (affected > 0) {
        const message = `${affected} deleted workflowTemplate(s).`
        this.logger.info(message)
        return { message }
      } else {
        const error = `Unable to delete the workflowTemplate with id=${id}`
        this.logger.error(error)
        throw new HttpException(
          {
            status: HttpStatus.NOT_FOUND,
            error,
          },
          HttpStatus.NOT_FOUND,
        )
      }
    } else {
      const error = `Unable to find the workflowTemplate with id=${id}`
      this.logger.error(error)
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error,
        },
        HttpStatus.BAD_REQUEST,
      )
    }
  }

  async deleteByTenant(tenantId: string): Promise<{ [key: string]: number }> {
    requireTenantId(tenantId)

    const { affected } = await this.workflowTemplateRepository.delete({
      tenantId,
    })

    const message = `${affected} deleted workflowTemplate(s).`
    this.logger.info(message)
    return { deletedWorkflowTemplatesTotal: affected }
  }

  async nextStateBatch(
    tenantId: string,
    workflowName: string,
    transitionName: string,
    fromStates: string[],
    role: string,
  ): Promise<string[]> {
    const templates = await this.find(tenantId, undefined, 'name', workflowName)
    let template
    if (templates.length === 1) {
      template = templates[0]
    } else {
      throw new Error(
        `Name of workflow templates should be unique. We currently have ${templates.length} workflow templates with the name ${workflowName}.`,
      )
    }

    return fromStates.map((fromState: string) => {
      return this.determineNextState(template, transitionName, fromState, role)
    })
  }

  async nextState(
    tenantId: string,
    workflowName: string,
    transitionName: string,
    fromState: string,
    role: string,
  ): Promise<string> {
    const templates = await this.find(tenantId, undefined, 'name', workflowName)
    let template
    if (templates.length === 1) {
      template = templates[0]
    } else {
      throw new Error(
        `Name of workflow templates should be unique. We currently have ${templates.length} workflow templates with the name ${workflowName}.`,
      )
    }
    return this.determineNextState(template, transitionName, fromState, role)
  }

  determineNextState(
    template: WorkflowTemplate,
    transitionName: string,
    fromState: string,
    role: string,
  ): string {
    const result = template.transitionTemplates.filter(
      (tmpl) =>
        transitionName === tmpl.name &&
        fromState === tmpl.fromState &&
        role === tmpl.role,
    )
    if (result.length === 1) {
      return result[0].toState
    } else if (result.length > 1) {
      const error = `impossible to determine the next state: more than 1 valid state transitions were found (${result.length}) for initial state ${fromState}, role ${role} and transitionName ${transitionName}`
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error,
        },
        HttpStatus.BAD_REQUEST,
      )
    } else {
      const error = `impossible to determine the next state: no valid state transition was found for initial state ${fromState}, role ${role} and transitionName ${transitionName}`
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error,
        },
        HttpStatus.BAD_REQUEST,
      )
    }
  }

  async checkValidInputs(
    tenantId: string,
    objectId,
    name,
    isHTTPRequest,
  ): Promise<boolean> {
    const templatesWithSameName: Array<WorkflowTemplate> = await this.find(
      tenantId,
      undefined,
      'name',
      name,
    )

    let problem: boolean
    if (objectId) {
      // If 'objectId', then it means it is an object update
      if (templatesWithSameName.length > 1) {
        problem = true
      } else if (templatesWithSameName.length === 1) {
        if (templatesWithSameName[0].id !== objectId) {
          problem = true
        } else {
          problem = false
        }
      } else {
        problem = false
      }
    } else {
      // If not 'objectId', then it means it is an object creation
      if (templatesWithSameName.length > 0) {
        problem = true
      } else {
        problem = false
      }
    }

    if (problem) {
      if (isHTTPRequest) {
        const error = `Template with name: ${name} already exists, please choose another name`
        this.logger.error(error)
        throw new HttpException(
          {
            status: HttpStatus.BAD_REQUEST,
            error,
          },
          HttpStatus.BAD_REQUEST,
        )
      } else {
        return false
      }
    } else {
      return true
    }
  }
}
