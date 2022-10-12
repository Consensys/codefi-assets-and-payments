export const getAllResultPaginated = async <T>(
  fn: (skip: number, limit: number) => Promise<Array<T>>,
  _page: number,
  _perPage: number,
) => {
  const res: Array<T> = []
  let resultCount = 1

  while (resultCount > 0) {
    const results = (await fn(_page, _perPage)) || []

    res.push(...results)
    resultCount = results.length
    _page++
  }
  return res
}
