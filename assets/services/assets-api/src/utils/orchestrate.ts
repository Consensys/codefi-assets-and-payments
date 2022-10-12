import traceAllFunctionExports from 'src/old/lib/traceAllFunctionExports';

/**
 * [Craft Orchestrate tenantId]
 * The tenantID used in Orchestrate is not the same one as the one used in Codefi Assets.
 * The tenantID used in Orchestrate shall include both:
 * - the codefi tenantId
 * - the codefi userId (to be renamed entityId after integration with Entity-Api)
 * Teh reason for this is that we don't want a user to be able to access another user's wallet.
 */
export const craftOrchestrateTenantId = (tenantId: string, userId: string) => {
  return `${tenantId}:${userId}`;
};

export default traceAllFunctionExports({
  craftOrchestrateTenantId,
});
