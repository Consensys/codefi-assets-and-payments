export const issuance_notStarted = '__notStarted__';

export const issuance_locked = 'locked'; // FIXME: Deprecated
export const issuance_reserved = 'reserved'; // FIXME: Deprecated
export const issuance_issued = 'issued'; // FIXME: Deprecated

export const issuance_notarized = 'notarized'; // FIXME: Deprecated

export enum IssuanceWorkflow {
  NOT_STARTED = '__notStarted__',
  LOCKED = 'locked',
  RESERVED = 'reserved',
  ISSUED = 'issued',
  NOTARIZED = 'notarized',
}
