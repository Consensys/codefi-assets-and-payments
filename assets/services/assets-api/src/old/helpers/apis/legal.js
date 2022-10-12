import axios from 'axios';
import traceAllFunctionExports from 'src/old/lib/traceAllFunctionExports';
import winston from 'src/old/config/logger';

import Helpers from 'src/old/helpers/helper';

// Config
const LEGAL_API = process.env.LEGAL_API;
const DOCUSIGN_ID = process.env.DEFAULT_DOCUSIGN_ID;
const API_NAME = '[Api-Legal]';

/**
 * Create a new template
 * @param  {Object} data Contains the new template file and the template name
 * used to build the template
 * @param  {Object} params Contains the caller id
 */
export const createNewTemplate = async (data, headers) => {
  try {
    const response = await axios
      .create()
      .post(`${LEGAL_API}/templates?userId=${DOCUSIGN_ID}`, data, { headers });

    Helpers.checkRequestResponseFormat(
      {},
      'creating legal agreement template in legal DB',
      response,
    );

    return response.data;
  } catch (error) {
    winston.handleError('createNewTemplate', API_NAME, error);
  }
};

/**
 * Retrieve the templates of a user
 * @param  {Object} params Contains the DocuSign id of the user and the array
 * of DocuSign ids used in order to filter the templates
 */
export const getUserTemplates = async (params) => {
  try {
    const response = await axios.create().get(`${LEGAL_API}/templates`, {
      params,
    });

    Helpers.checkRequestResponseFormat(
      {},
      'retrieving legal agreement templates in legal DB',
      response,
    );

    return response.data;
  } catch (error) {
    winston.handleError('getUserTemplates', API_NAME, error);
  }
};

/**
 * Create an envelope from a template and arguments
 * @param  {Object} data   Contains the template DocuSign id and other arguments
 * used to build the envelope
 * @param  {Object} params Contains the DocuSign id of the user
 */
export const createEnvelopeFromTemplate = async (data, params) => {
  try {
    const response = await axios
      .create()
      .post(`${LEGAL_API}/envelopes`, data, { params });

    Helpers.checkRequestResponseFormat(
      {},
      'creating legal agreement envelope in legal DB',
      response,
    );

    return response.data;
  } catch (error) {
    winston.handleError('createEnvelopeFromTemplate', API_NAME, error);
  }
};

/**
 * Generate the url of the embedded signing ceremony
 * @param  {String} envelopeId The DocuSign id of the envelope
 * @param  {Object} data       Contains the returnUrl parameter
 * @param  {Object} params     Contains the DocuSign id of the user
 */
export const generateSigningUrl = async (envelopeId, data, params) => {
  try {
    const response = await axios
      .create()
      .post(`${LEGAL_API}/envelopes/${envelopeId}/url`, data, { params });

    Helpers.checkRequestResponseFormat(
      {},
      'generating URL for legal agreement envelope',
      response,
    );

    return response.data;
  } catch (error) {
    winston.handleError('generateSigningUrl', API_NAME, error);
  }
};

/**
 * Retrieve the status of an envelope
 * @param  {String} envelopeId The DocuSign id of the envelope
 * @param  {Object} params Contains the DocuSign id of the user
 */
export const getEnvelopeStatusById = async (envelopeId, params) => {
  try {
    const response = await axios
      .create()
      .get(`${LEGAL_API}/envelopes/${envelopeId}`, { params });

    Helpers.checkRequestResponseFormat(
      {},
      'retrieving status of legal agreement envelope',
      response,
    );

    if (!response.data.status) {
      throw new Error('missing envelope status in response');
    }

    return response.data.status;
  } catch (error) {
    winston.handleError('getEnvelopeStatusById', API_NAME, error);
  }
};

/**
 * Retrieve the pdf of an envelope
 * @param  {String} envelopeId The DocuSign id of the envelope
 * @param  {Object} params     Contains the DocuSign id of the user
 */
export const getEnvelopePdfById = async (envelopeId, params) => {
  try {
    const response = await axios
      .create()
      .get(`${LEGAL_API}/envelopes/${envelopeId}/pdf`, {
        params,
        responseType: 'arraybuffer',
      });

    Helpers.checkRequestResponseFormat(
      {},
      'retrieving PDF version of legal agreement envelope',
      response,
    );

    return response.data;
  } catch (error) {
    winston.handleError('getEnvelopePdfById', API_NAME, error);
  }
};

export default traceAllFunctionExports({
  createEnvelopeFromTemplate,
  generateSigningUrl,
  getEnvelopePdfById,
  getEnvelopeStatusById,
  getUserTemplates,
  createNewTemplate,
});
