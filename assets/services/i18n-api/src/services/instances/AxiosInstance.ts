import { Injectable } from '@nestjs/common'
import axios from 'axios'

@Injectable()
export class AxiosInstance {
  private axiosInstance

  constructor() {
    this.axiosInstance = axios
  }

  instance() {
    return this.axiosInstance
  }
}
