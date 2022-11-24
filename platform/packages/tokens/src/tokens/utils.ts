import { ApmService } from '@consensys/observability'

export const labelsWithApm = (
  labels: Record<string, any>,
  apmService: ApmService,
): Record<string, any> => {
  return {
    apmTraceParent: apmService.getCurrentTraceparent(),
    ...labels,
  }
}
