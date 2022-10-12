import { WhereOptions } from 'sequelize';
import { Model } from 'sequelize-typescript';
import { FindOrCreateOptions } from 'sequelize/types';
import { ElementInstance } from 'src/modules/ElementInstanceModule/ElementInstance';
import { ElementInstanceModel } from 'src/modules/ElementInstanceModule/ElementInstanceModel';
import { ElementModel } from 'src/modules/ElementModule/ElementModel';
import { ElementRequest } from 'src/modules/ElementModule/ElementRequest';
import { ReviewModel } from 'src/modules/ReviewModule/ReviewModel';
import { ReviewRequest } from 'src/modules/ReviewModule/ReviewRequest';
import { TemplateModel } from 'src/modules/TemplateModule/TemplateModel';
import { TemplateRequest } from 'src/modules/TemplateModule/TemplateRequest';
import { ReviewScope } from 'src/utils/constants/enum';

export const removeFromDb = async <T extends Model>(
  model: any,
  tenantId: string,
) => {
  await model.destroy({
    where: <WhereOptions>{ tenantId },
  });
};

const addToDb = async (model: any, query: FindOrCreateOptions) => {
  return model.findOrCreate(query);
};

export const addTemplateToDb = (
  templateModel: typeof TemplateModel,
  template: TemplateRequest & { tenantId: string },
) => {
  return addToDb(templateModel, {
    where: { tenantId: template.tenantId, name: template.name },
    defaults: {
      issuerId: template.issuerId,
      topSections: template.topSections,
      data: template.data,
    },
  });
};

export const addElementToDb = (
  elementModel: typeof ElementModel,
  element: ElementRequest & { tenantId: string },
) => {
  return addToDb(elementModel, {
    where: {
      tenantId: element.tenantId,
      key: element.key,
    },
    defaults: {
      type: element.type,
      status: element.status,
      label: element.label,
      placeholder: element.placeholder,
      inputs: element.inputs,
      data: element.data,
    },
  });
};

export const addElementInstanceToDb = (
  elementInstanceModel: typeof ElementInstanceModel,
  elementInstance: Omit<ElementInstance, 'id'>,
): PromiseLike<[ElementInstanceModel, boolean]> => {
  return addToDb(elementInstanceModel, {
    where: {
      tenantId: elementInstance.tenantId,
      elementKey: elementInstance.elementKey,
      userId: elementInstance.userId,
      value: elementInstance.value,
      data: elementInstance.data,
    },
  });
};

export const addReviewToDb = (
  reviewModel: typeof ReviewModel,
  review: ReviewRequest & { tenantId: string },
) => {
  const commonWhere = {
    tenantId: review.tenantId,
    objectId: review.objectId,
    entityId: review.entityId,
    entityClass: review.entityClass,
  };

  const commonDefaults = {
    status: review.status,
    data: review.data,
    entityType: review.entityType,
    validityDate: review.validityDate,
    comment: review.comment,
  };

  if (review.scope === ReviewScope.TEMPLATE) {
    return addToDb(reviewModel, {
      where: {
        ...commonWhere,
        investorId: review.investorId,
        scope: review.scope,
      },
      defaults: {
        ...commonDefaults,
        category: review.category,
        riskProfile: review.riskProfile,
      },
    });
  }

  return addToDb(reviewModel, {
    where: commonWhere,
    defaults: { ...commonDefaults, scope: review.scope },
  });
};
