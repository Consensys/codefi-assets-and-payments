import { Injectable } from '@nestjs/common';

import {
  createTemplate,
  retrieveEnvelopeStatusById,
  retrieveEnvelopePdfById,
  generateUrl,
  createEnvelope,
} from 'src/old/controllers/legal';

@Injectable()
export class LegalService {
  async createTemplate(user, templateName, file) {
    return createTemplate(user, templateName, file);
  }

  async createEnvelope(user, docusignId, envelopeArgs) {
    return createEnvelope(user, docusignId, envelopeArgs);
  }

  async generateUrl(user, envelopeId, docusignId, returnUrl, userId, callerId) {
    return generateUrl(
      user,
      envelopeId,
      docusignId,
      returnUrl,
      userId,
      callerId,
    );
  }

  async retrieveEnvelopeStatusById(
    user,
    envelopeId,
    docusignId,
    userId,
    callerId,
  ) {
    return retrieveEnvelopeStatusById(
      user,
      envelopeId,
      docusignId,
      userId,
      callerId,
    );
  }

  async retrieveEnvelopePdfById(user, envelopeId, docusignId) {
    return retrieveEnvelopePdfById(user, envelopeId, docusignId);
  }
}
