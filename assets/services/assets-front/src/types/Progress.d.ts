export interface IProgress {
  key: string;
  label: { [key: string]: string };
  started: boolean;
  complete: boolean;
  progress: string;
  rejected?: boolean;
}
