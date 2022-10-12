import {
  getUserTemplates,
  getEnvelopeStatusById,
  getEnvelopePdfById,
  generateSigningUrl,
  createEnvelopeFromTemplate,
  createNewTemplate,
} from 'src/old/helpers/apis/legal';
import FormData from 'form-data';
import { HttpException } from '@nestjs/common';

import { UserType } from 'src/types/user';
import { checkUserType } from 'src/utils/checks/userType';

/**
 * Create a new template
 * @param  {Object} req Contains:
 *  - in query: the DocuSign id of the user
 *  - in body: the new template template file and the template name
 * @param  {Object} res Response object
 * @return {Object}     The template id of the created template
 */
export const createTemplate = async (user, templateName, file) => {
  try {
    checkUserType(UserType.ISSUER, user);

    const _file = file;
    const _templateName = templateName;
    const formData = new FormData();

    formData.append('file', _file.buffer, {
      contentType: _file.mimetype,
      filename: _file.originalname,
      knownLength: _file.size,
    });

    formData.append('templateName', _templateName);

    const { templateId } = await createNewTemplate(
      formData,
      formData.getHeaders(),
    );

    return {
      template: {
        templateId: templateId,
        type: 'DocuSign',
      },
      message: `Legal agreement template ${templateId} created successfully`,
    };
  } catch (error) {
    throw new HttpException(
      {
        message: `createTemplate --> ${error}`,
        status: 500,
      },
      500,
    );
  }
};

/**
 * Retrieve the templates of an user [FIXME: NOT USED + DOESNT WORK]
 * @param  {Object} req Contains:
 *  - in query:  DocuSign id of the user and the array of DocuSign ids used in
 *  order to filter the templates
 * @param  {Object} res Response object
 * @return {Array}      Array of template objects
 */
export const retrieveUserTemplates = async (query) => {
  try {
    // FIXME: IAM middleware to be added
    const templates = await getUserTemplates(query);

    //FIXME: Response format to be adapted
    return templates;
  } catch (error) {
    throw new HttpException(
      {
        message: `retrieveUserTemplates --> ${error}`,
        status: 500,
      },
      500,
    );
  }
};

/**
 * Create an envelope from a template and arguments
 * @param  {Object} req Contains:
 *  - in query: the DocuSign id of the user
 *  - in body: the DocuSign template id and the other envelope arguments
 * @param  {Object} res Response object
 * @return {Object}     The DocuSign id of the created envelope
 */
export const createEnvelope = async (user, docusignId, envelopeArgs) => {
  try {
    checkUserType(UserType.INVESTOR, user);

    const query = {
      userId: docusignId,
    };

    const body = {
      envelopeArgs,
    };

    const { envelopeId } = await createEnvelopeFromTemplate(body, query);
    return {
      envelope: {
        envelopeId,
      },
      message: `Legal agreement envelope ${envelopeId} created successfully`,
    };
  } catch (error) {
    throw new HttpException(
      {
        message: `createEnvelope --> ${error}`,
        status: 500,
      },
      500,
    );
  }
};

/**
 * Generate the url of the embedded signing ceremony
 * @param  {Object} req Contains:
 *  - in query: the DocuSign id of the user
 *  - in params: the DocuSign id of the envelope
 *  - in body: the returnUrl parameter
 * @param  {Object} res Response object
 * @return {Object}     The generated Url
 */
export const generateUrl = async (
  user,
  envelopeId,
  docusignId,
  returnUrl,
  userId,
  callerId,
) => {
  try {
    checkUserType(UserType.INVESTOR, user);

    const query = {
      userId: docusignId,
    };

    const body = {
      returnUrl,
    };

    const { url } = await generateSigningUrl(
      envelopeId,
      body,
      query,
      userId,
      callerId,
    );
    return {
      envelope: {
        envelopeId,
        url,
      },
      message: `URL for legal agreement envelope ${envelopeId} created successfully`,
    };
  } catch (error) {
    throw new HttpException(
      {
        message: `generateUrl --> ${error}`,
        status: 500,
      },
      500,
    );
  }
};

/**
 * Retrieve the status of an envelope
 * @param  {Object} req Contains:
 *  - in query: the DocuSign id of the user
 *  - in params: the DocuSign id of the envelope
 * @param  {Object} res Response object
 * @return {Object}      Status of the envelope
 */
export const retrieveEnvelopeStatusById = async (
  user,
  envelopeId,
  docusignId,
  userId,
  callerId,
) => {
  try {
    checkUserType(UserType.INVESTOR, user);

    const query = {
      userId: docusignId,
    };

    const status = await getEnvelopeStatusById(
      envelopeId,
      query,
      userId,
      callerId,
    );
    return {
      envelope: {
        envelopeId,
        status,
      },
      message: `Status of legal agreement envelope ${envelopeId} retrieved successfully`,
    };
  } catch (error) {
    throw new HttpException(
      {
        message: `retrieveEnvelopeById --> ${error}`,
        status: 500,
      },
      500,
    );
  }
};

/**
 * Retrieve the pdf of an envelope
 * @param  {Object} req Contains:
 *  - in query: the DocuSign id of the user
 *  - in params: the DocuSign id of the envelope
 * @param  {Object} res Response object
 * @return {Buffer}     Pdf of the envelope
 */
export const retrieveEnvelopePdfById = async (user, envelopeId, docusignId) => {
  try {
    checkUserType(UserType.INVESTOR, user);

    const query = {
      userId: docusignId,
    };

    const pdfData = await getEnvelopePdfById(envelopeId, query);
    return {
      envelope: {
        envelopeId,
        pdfData,
      },
      message: `PDF version of legal agreement envelope ${envelopeId} retrieved successfully`,
    };
  } catch (error) {
    throw new HttpException(
      {
        message: `retrieveEnvelopeById --> ${error}`,
        status: 500,
      },
      500,
    );
  }
};
