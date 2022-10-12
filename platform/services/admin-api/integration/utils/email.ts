import util from 'util'
// eslint-disable-next-line @typescript-eslint/no-var-requires
const fs = require('fs')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { google } = require('googleapis')

interface IMessage {
  id: string
  snippet: string
  labelIds: string[]
  internalDate: number
  url: string
}

// Instruction about google api auth and how to restore the token
// https://developers.google.com/gmail/api/quickstart/nodejs
const fileRead = util.promisify(fs.readFile)
const TOKEN_PATH = 'token.json'

export class Email {
  msgs: IMessage[] = []
  type: string
  subject: string

  constructor(type: string, subject: string) {
    this.type = type
    this.subject = subject
  }

  /* Create an OAuth2 client with the given credentials, and then execute the
   * given callback function.
   * @param {Object} credentials The authorization client credentials.
   * @param {function} callback The callback to call with the authorized client.
   */
  async authorizeOnGmail(credentials) {
    // eslint-disable-next-line @typescript-eslint/camelcase
    const { client_secret, client_id, redirect_uris } = credentials.installed
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0])
    // Check if we have previously stored a token.
    const token = await fileRead(TOKEN_PATH).catch(err => {
      throw new Error('Token not valid anymore')
    })
    // return getNewToken(oAuth2Client, callback)
    oAuth2Client.setCredentials(JSON.parse(token))
    return oAuth2Client
  }

  async readCredentials() {
    return fileRead('./credentials.json').catch(err => {
      console.log('Error loading client secret file:' + err)
    })
  }

  async isMessageFound(auth, subject, type, email: string): Promise<boolean> {
    const gmail = google.gmail({ version: 'v1', auth })
    const res = await gmail.users.messages
      .list({ userId: 'me', maxResults: 50, labelIds: ['UNREAD', 'INBOX'], q: `subject:"${subject}" to:"${email}"` })
      .catch(err => {
        console.log('The Gmail list API returned this error: ' + err)
      })
    let messages
    if (res) { messages = res.data.messages }
    console.log(`Found: ${messages.length} email messages to be filtered.`)
    if (messages && messages.length > 0) {
      const messageFound = await this.filterMsg(messages, gmail, type)
      return !!messageFound
    }
  }

  async retrieveEmailMessageUrl(auth, subject, type, email): Promise<string> {
    const gmail = google.gmail({ version: 'v1', auth })
    const res = await gmail.users.messages
      .list({ userId: 'me', labelIds: ['UNREAD', 'INBOX'], maxResults: 50, q: `subject:"${subject}" to: ${email}` })
      .catch(err => {
        console.log('The Gmail list API returned this error: ' + err)
      })
    let messages
    if (res) { messages = res.data.messages }
    console.log(`Found: ${messages.length} email messages to be filtered.`)
    if (messages && messages.length > 0) {
      const messageFound = (await this.filterMsg(messages, gmail, type)) as string
      return messageFound
    }
    return undefined
  }

  async filterMsg(
    messages: any,
    gmail: any,
    type: string
  ): Promise<string | boolean> {
    const getMessage = params => {
      return new Promise((resolve, reject) => {
        gmail.users.messages.get(params, (error, response) => {
          if (error) {
            reject(error)
            return
          }
          resolve(response.data)
        })
      })
    }

    for (const message of messages) {
      const res: any = await getMessage({ userId: 'me', id: message.id })
      if (res.snippet.includes(`${type}`)) {
        return res.snippet
      }
    }
    return false
  }

  // async filterContainMsg(messages: any, gmail: any, filter: string, parameter: string): Promise<boolean> {
  //   for (const message of messages) {
  //     const res = await gmail.users.messages.get({ userId: 'me', id: message.id }).catch(err => {
  //       console.log(`The Gmail Get API returned this error: ${err}`)
  //     })

  //     if (
  //       res.data.labelIds.includes('UNREAD') &&
  //       filter &&
  //       res.data.snippet.includes(`${filter}`) &&
  //       res.data.snippet.includes(`${parameter}`)
  //     ) {
  //       return true
  //     }
  //   }
  //   return false
  // }

  async getResetPasswordUrl(email: string): Promise<string> {
    const credentials = await this.readCredentials()
    const oauth2Auth = await this.authorizeOnGmail(JSON.parse(credentials))
    const messageUrl = await this.retrieveEmailMessageUrl(oauth2Auth, this.subject, this.type, email)
    return messageUrl
  }

  async isEmailFound(email: string): Promise<boolean> {
    const oauth2Auth = await this.authorizeOnGmail(JSON.parse(await this.readCredentials()))
    const messageFound = await this.isMessageFound(oauth2Auth, this.subject, this.type, email)
    return messageFound
  }

  // async deleteEmail() {
  //   const credentials = await this.readCredentials()
  //   // Provide auth
  //   const oauth2Auth = await this.authorizeOnGmail(JSON.parse(credentials))

  //   // Delete email
  //   const gmail = google.gmail('v1')

  //   if (this.msgs.length) {
  //     const promises = this.msgs.map(m => {
  //       // Rate limiter, required as max concurrent gmail deletes is 10
  //       // https://developers.google.com/gmail/api/v1/reference/quota
  //       return limit(() =>
  //         gmail.users.messages.delete({ userId: 'me', id: m.id }).catch(err => {
  //           console.log('The Gmail delete API returned this error: ' + err)
  //         })
  //       )
  //     })

  //     await Promise.all(promises)
  //     this.msgs.length = 0
  //   }
  // }

  async isEmailReceived(email: string): Promise<boolean> {
    const found = await this.isEmailFound(email)
    return new Promise<boolean>((resolve, reject) => {
      if (found) resolve(true)
      reject(false)
    })
  }

  // async isEmailWithContentReceived(content: string, parameter: string) {
  //   const found = await this.isEmailFound(content, true, parameter)
  //   return new Promise<boolean>((resolve, reject) => {
  //     if (found) resolve(true)
  //     reject(false)
  //   })
  // }
}
