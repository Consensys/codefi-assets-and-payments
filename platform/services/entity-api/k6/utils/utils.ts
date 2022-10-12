import { RefinedResponse } from 'k6/http'

export const logResponseBody = (
  response: RefinedResponse<any>,
  tag: string,
) => {
  console.log(tag, JSON.stringify(JSON.parse(response.body as string), null, 4))
}
