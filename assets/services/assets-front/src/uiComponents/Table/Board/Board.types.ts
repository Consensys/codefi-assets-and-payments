export interface IColumnData {
  [key: string]: Array<{
    id: string;
    content: any;
  }>;
}

export interface IColumnOptions {
  [key: string]: {
    color: string;
    lightColor: string;
    title: string;
    noBorder?: boolean;
  };
}
