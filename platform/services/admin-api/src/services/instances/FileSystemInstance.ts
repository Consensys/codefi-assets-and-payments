import * as fs from 'fs'
import { Injectable } from '@nestjs/common'

@Injectable()
export class FileSystemInstance {
  private fsInstance

  constructor() {
    this.fsInstance = fs
  }

  instance() {
    return this.fsInstance
  }
}
