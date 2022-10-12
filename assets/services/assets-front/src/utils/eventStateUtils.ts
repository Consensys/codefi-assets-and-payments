export enum EventState {
  SCHEDULED = 'scheduled',
  SETTLED = 'settled',
  CANCELLED = 'cancelled',
  SETTLING = 'settling',
}

export const StyleSettling = {
  background: '#F0F8FF',
  color: '#1A5AFE',
  border: `0.5px solid #1A5AFE`,
  fontWeight: 500,
};

export const styleSettled = {
  background: '#E0FCF6',
  color: '#008055',
  border: `0.5px solid #008055`,
  fontWeight: 500,
};
