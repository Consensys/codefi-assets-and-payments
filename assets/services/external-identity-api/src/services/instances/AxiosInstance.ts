import { Injectable } from '@nestjs/common'
import axios, { AxiosStatic } from 'axios'

@Injectable()
export class AxiosInstance {
  private axiosInstance

  constructor() {
    this.axiosInstance = axios
  }

  instance(): AxiosStatic {
    return this.axiosInstance
  }
}
