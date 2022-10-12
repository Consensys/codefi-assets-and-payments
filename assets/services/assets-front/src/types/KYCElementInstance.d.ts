import { ReviewStatus } from 'routes/Issuer/AssetIssuance/elementsTypes';

export interface IKYCElementInstance {
  id: string;
  elementKey: string;
  userId: string;
  value: Array<string>;
  data: { [key: string]: string };
  createdAt: string;
  updatedAt: string;
  status: ReviewStatus;
  reviewId: string;
  comment: string;
  validityDate: Date;
}
