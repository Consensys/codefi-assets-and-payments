import { ElementInstance } from './ElementInstance';

export interface UserElementInstance extends ElementInstance {
  status: string;
  reviewId: string;
  comment: string;
  validityDate?: Date;
  category?: string;
  riskProfile?: string;
}
