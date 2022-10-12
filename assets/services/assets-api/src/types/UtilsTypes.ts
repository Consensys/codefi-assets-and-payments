export interface IPoll<T> {
  fn: (arg: any) => Promise<T>;
  fnArg: any;
  validate: (result: T) => boolean;
  interval: number;
  maxAttempts: number;
}
