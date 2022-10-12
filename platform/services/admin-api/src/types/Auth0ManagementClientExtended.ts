import { ManagementClient, ObjectWithId } from 'auth0'
// The Auth0 types are missing all the stuff relating to hooks but the library itself does support it

export enum TriggerId {
  credentialsExchange = 'credentials-exchange',
  preUserRegistration = 'pre-user-registration',
  postUserRegistration = 'post-user-registration',
  postChangePassword = 'post-change-password',
  sendPhoneMessage = 'send-phone-message',
}
export interface Hook {
  /**
   * The name of the hook.
   */
  name?: string
  /**
   * The hook's identifier.
   */
  id?: string

  /**
   * Execution stage of this rule. Can only be set when the rule is created
   */
  triggerId?: TriggerId
  /**
   * The code to be executed when the hook runs.
   */
  script?: string
  /**
   * `true` if the connection is enabled, `false` otherwise.
   */
  enabled?: boolean
  /**
   * Dependencies of this hook used by webtask server. No description in auth0 API
   */
  dependencies?: object
}

export interface ActionSupportedTrigger {
  id: string
  version: string
}

export interface ActionDependency {
  name: string
  version: string
}

export interface ActionSecret {
  name: string
  value: string
}

export interface ActionUpdateRequest {
  name: string
  code: string
  dependencies: ActionDependency[]
  runtime: string
  secrets: ActionSecret[]
}

export interface ActionTriggerBinding {
  ref: { type: string; value: string }
  display_name: string
}

export interface ActionCreateRequest extends ActionUpdateRequest {
  supported_triggers: ActionSupportedTrigger[]
}

export interface ActionDeployRequest {
  id: string
}

export interface ActionUpdateTriggerBindingRequest {
  bindings: ActionTriggerBinding[]
}

export interface ActionResponse extends ActionCreateRequest {
  id: string
}

export interface HookSecrets {
  [key: string]: string
}

export interface ActionsClient {
  getAll(): Promise<{ actions: ActionResponse[] }>
  create(request: ActionCreateRequest): Promise<ActionResponse>
  update(
    params: { id: string },
    request: ActionUpdateRequest,
  ): Promise<ActionResponse>
  deploy(request: ActionDeployRequest): Promise<void>
  updateTriggerBindings(
    params: { trigger_id: string },
    bindings: ActionUpdateTriggerBindingRequest,
  ): Promise<void>
}

export interface ManagementClientExtended extends ManagementClient {
  getHooks(): Promise<Hook[]>

  getHook(params: ObjectWithId): Promise<Hook>

  createHook(data: Hook): Promise<Hook>

  updateHook(params: ObjectWithId, data: Hook): Promise<Hook>

  deleteHook(params: ObjectWithId): Promise<void>

  getHookSecrets(params: ObjectWithId): Promise<HookSecrets>

  addHookSecrets(params: ObjectWithId, secrets: HookSecrets): Promise<void>

  updateHookSecrets(params: ObjectWithId, secrets: HookSecrets): Promise<void>

  removeHookSecrets(params: ObjectWithId, secretNames: string[])

  actions: ActionsClient
}
