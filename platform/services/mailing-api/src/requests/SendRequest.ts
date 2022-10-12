export class SendRequest {
  templateId: number
  toEmail: string
  toName: string
  fromEmail: string
  fromName: string
  subject: string
  variables: Record<string, string>
  options: Record<string, any>
  sandboxMode: boolean
}
