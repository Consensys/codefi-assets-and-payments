import { TestingModule } from '@nestjs/testing';
import { v4 as uuidv4 } from 'uuid';
import { TopSection } from 'src/models/TopSection';
import { ElementModel } from 'src/modules/ElementModule/ElementModel';
import { TemplateModel } from 'src/modules/TemplateModule/TemplateModel';
import request from 'supertest';
import { elementCreateRequestMock } from 'test/mocks/ElementMocks';
import {
  templateCreateRequestMock,
  templateUpdateRequestMock,
} from 'test/mocks/TemplateMocks';
import { getServer } from 'test/testServer';
import { allTemplates } from '../../src/db/init/index';
import { addElementToDb, addTemplateToDb, removeFromDb } from 'test/dbHelpers';

describe('templates', () => {
  const defaultUrl = '/templates';
  const tenantId = 'fakeTenantId';
  let app: request.SuperTest<request.Test>;
  let module: TestingModule;
  let templateModel: typeof TemplateModel;
  let elementModel: typeof ElementModel;

  beforeAll(async () => {
    const { superTestApp, moduleRef } = getServer();
    app = superTestApp;
    module = moduleRef;

    templateModel = module.get('TemplateModelRepository');
    elementModel = module.get('ElementModelRepository');
  });

  describe('GET /templates', () => {
    it('Returns all templates', async () => {
      const resp = await app
        .get(`${defaultUrl}?tenantId=${tenantId}`)
        .expect(200);

      resp.body.forEach((template) => {
        const seedTemplate = allTemplates.find((t) => template.name === t.name);

        expect(template).toEqual(expect.objectContaining(seedTemplate));
      });
    });

    it('Returns template filtered by name', async () => {
      const initialName = allTemplates[0].name;
      const resp = await app
        .get(`${defaultUrl}?tenantId=${tenantId}&name=${initialName}`)
        .expect(200);

      expect(resp.body[0]).toEqual(expect.objectContaining(allTemplates[0]));
    });

    it('Returns template filtered by id', async () => {
      const template = await templateModel.findOne({});
      const resp = await app
        .get(`${defaultUrl}?tenantId=${tenantId}&templateId=${template.id}`)
        .expect(200);

      const templateObject = template.toJSON() as any;

      expect(resp.body[0]).toEqual(
        expect.objectContaining({
          ...templateObject,
          createdAt: new Date(templateObject.createdAt).toISOString(),
          updatedAt: new Date(templateObject.updatedAt).toISOString(),
        }),
      );
    });

    it('Returns template filtered by issuerId', async () => {
      const issuerId = 'Codefi Assets';
      const template = await templateModel.findOne({
        where: { issuerId },
      });
      const resp = await app
        .get(`${defaultUrl}?tenantId=${tenantId}&issuerId=${issuerId}`)
        .expect(200);

      const templateObject = template.toJSON() as any;

      expect(resp.body[0]).toEqual(
        expect.objectContaining({
          ...templateObject,
          createdAt: new Date(templateObject.createdAt).toISOString(),
          updatedAt: new Date(templateObject.updatedAt).toISOString(),
        }),
      );
    });
  });

  describe('POST /templates', () => {
    beforeEach(async () => {
      await removeFromDb(templateModel, tenantId);
    });

    afterAll(async () => {
      await removeFromDb(templateModel, tenantId);
    });

    it('Successfully creates a template', async () => {
      const resp = await app
        .post(`${defaultUrl}?tenantId=${tenantId}`)
        .send(templateCreateRequestMock)
        .expect(201);

      expect(resp.body).toHaveLength(2);
      expect(resp.body[0]).toEqual(
        expect.objectContaining(templateCreateRequestMock),
      );
      expect(resp.body[1]).toBe(true);
    });

    describe('With invalid topSection element', () => {
      const commonInput = {
        label: {
          en: 'Fake input',
          fr: 'Fake input',
        },
        relatedElements: ['this-does-not-exist-but-it-does-not-matter'],
      };

      afterEach(async () => {
        await elementModel.destroy({
          where: { tenantId },
        });
      });

      it('Fails to create a template if element does not exist', async () => {
        const fakeSection: TopSection = {
          label: { en: 'Fake Element', fr: 'Element faux' },
          key: 'fakeElementSection',
          sections: [
            {
              key: 'test',
              label: { en: 'Part 1', fr: 'Partie 1' },
              elements: ['this_element_does_not_exist'],
            },
          ],
        };

        const resp = await app
          .post(`${defaultUrl}?tenantId=${tenantId}`)
          .send({
            ...templateCreateRequestMock,
            topSections: [
              ...templateCreateRequestMock.topSections,
              fakeSection,
            ],
          })
          .expect(400);

        expect(resp.body).toEqual({
          status: 400,
          error: `Invalid topSections input: element with key ${fakeSection.sections[0].elements[0]} does not exist`,
        });
      });

      it('Fails to create a template if element that has a related element that does not exist', async () => {
        const elementWithInputsWithInvalidRelatedElements = {
          ...elementCreateRequestMock,
          inputs: [
            {
              ...commonInput,
              relatedElements: ['this_element_does_not_exist'],
            },
          ],
          tenantId,
        };

        await addElementToDb(
          elementModel,
          elementWithInputsWithInvalidRelatedElements,
        );

        const fakeSection: TopSection = {
          label: { en: 'Fake Element', fr: 'Element faux' },
          key: 'fakeElementSection',
          sections: [
            {
              key: 'test',
              label: { en: 'Part 1', fr: 'Partie 1' },
              elements: [elementCreateRequestMock.key],
            },
          ],
        };

        const resp = await app
          .post(`${defaultUrl}?tenantId=${tenantId}`)
          .send({
            ...templateCreateRequestMock,
            topSections: [
              ...templateCreateRequestMock.topSections,
              fakeSection,
            ],
          })
          .expect(400);

        expect(resp.body).toEqual({
          status: 400,
          error: `Invalid topSections input: relatedElements with keys [${elementWithInputsWithInvalidRelatedElements.inputs[0].relatedElements.join(
            ',',
          )}] does not exist`,
        });
      });

      it('Fails to create a template if element has two related elements but one does not exist', async () => {
        const elementWithInputsWithInvalidRelatedElements = {
          ...elementCreateRequestMock,
          inputs: [
            {
              ...commonInput,
              relatedElements: [
                'this_element_does_not_exist',
                'title_address_identification',
              ],
            },
          ],
          tenantId,
        };

        await addElementToDb(
          elementModel,
          elementWithInputsWithInvalidRelatedElements,
        );

        const fakeSection: TopSection = {
          label: { en: 'Fake Element', fr: 'Element faux' },
          key: 'fakeElementSection',
          sections: [
            {
              key: 'test',
              label: { en: 'Part 1', fr: 'Partie 1' },
              elements: [elementCreateRequestMock.key],
            },
          ],
        };

        const resp = await app
          .post(`${defaultUrl}?tenantId=${tenantId}`)
          .send({
            ...templateCreateRequestMock,
            topSections: [
              ...templateCreateRequestMock.topSections,
              fakeSection,
            ],
          })
          .expect(400);

        expect(resp.body).toEqual({
          status: 400,
          error: `Invalid topSections input: relatedItem with key ${elementWithInputsWithInvalidRelatedElements.inputs[0].relatedElements[0]} does not exist`,
        });
      });

      it('Fails to create a template if element has a related element with status different from conditional|optional', async () => {
        const elementWithInputsWithInvalidRelatedElements = {
          ...elementCreateRequestMock,
          inputs: [
            {
              ...commonInput,
              relatedElements: ['lastName_personalInformation_identification'],
            },
          ],
          tenantId,
        };

        await addElementToDb(
          elementModel,
          elementWithInputsWithInvalidRelatedElements,
        );

        const fakeSection: TopSection = {
          label: { en: 'Fake Element', fr: 'Element faux' },
          key: 'fakeElementSection',
          sections: [
            {
              key: 'test',
              label: { en: 'Part 1', fr: 'Partie 1' },
              elements: [elementCreateRequestMock.key],
            },
          ],
        };

        const resp = await app
          .post(`${defaultUrl}?tenantId=${tenantId}`)
          .send({
            ...templateCreateRequestMock,
            topSections: [
              ...templateCreateRequestMock.topSections,
              fakeSection,
            ],
          })
          .expect(400);

        expect(resp.body).toEqual({
          status: 400,
          error: `Invalid topSections input: status of relatedItem with key ${elementWithInputsWithInvalidRelatedElements.inputs[0].relatedElements} shall either be conditional or optional`,
        });
      });

      it('Fails to create a template with a topSection element that has a related element with related elements', async () => {
        const elementWithOptionalStatusAndRelatedElements = {
          ...elementCreateRequestMock,
          key: 'elementWithOptionalStatusAndRelatedElements-KEY',
          status: 'conditional',
          inputs: [
            { ...commonInput, relatedElements: ['this-does-not-exist'] },
          ],
          tenantId,
        };

        const elementWithInputsWithInvalidRelatedElements = {
          ...elementCreateRequestMock,
          inputs: [
            {
              ...commonInput,
              relatedElements: [
                elementWithOptionalStatusAndRelatedElements.key,
              ],
            },
          ],
          tenantId,
        };
        await Promise.all([
          addElementToDb(
            elementModel,
            elementWithOptionalStatusAndRelatedElements,
          ),
          addElementToDb(
            elementModel,
            elementWithInputsWithInvalidRelatedElements,
          ),
        ]);

        const fakeSection: TopSection = {
          label: { en: 'Fake Element', fr: 'Element faux' },
          key: 'fakeElementSection',
          sections: [
            {
              key: 'test',
              label: { en: 'Part 1', fr: 'Partie 1' },
              elements: [elementCreateRequestMock.key],
            },
          ],
        };

        const resp = await app
          .post(`${defaultUrl}?tenantId=${tenantId}`)
          .send({
            ...templateCreateRequestMock,
            topSections: [
              ...templateCreateRequestMock.topSections,
              fakeSection,
            ],
          })
          .expect(400);

        expect(resp.body).toEqual({
          status: 400,
          error: `Invalid topSections input: relatedItem with key ${elementWithInputsWithInvalidRelatedElements.inputs[0].relatedElements} shall not have related items in order to avoid recursion errors`,
        });
      });
    });

    it('Fails to create a template if topSection is missing', async () => {
      const { topSections, ...createRequestWithoutTopSections } =
        templateCreateRequestMock;

      const resp = await app
        .post(`${defaultUrl}?tenantId=${tenantId}`)
        .send(createRequestWithoutTopSections)
        .expect(422);

      expect(resp.body).toEqual({
        message: 'Validation error',
        statusCode: 422,
        error: ['"topSections" is required'],
      });
    });

    it('Fails to create a template if topSection is missing key', async () => {
      const fakeSection = {
        label: { en: 'Fake Element', fr: 'Element faux' },
        sections: [
          {
            key: 'test',
            label: { en: 'Part 1', fr: 'Partie 1' },
            elements: ['this_element_does_not_exist'],
          },
        ],
      };

      const resp = await app
        .post(`${defaultUrl}?tenantId=${tenantId}`)
        .send({
          ...templateCreateRequestMock,
          topSections: [fakeSection],
        })
        .expect(422);

      expect(resp.body).toEqual({
        message: 'Validation error',
        statusCode: 422,
        error: ['"topSections[0].key" is required'],
      });
    });
  });

  describe('PUT /templates/:id', () => {
    let templateId;
    beforeEach(async () => {
      await removeFromDb(templateModel, tenantId);
      const [templateCreated] = await addTemplateToDb(templateModel, {
        ...templateCreateRequestMock,
        tenantId,
      });

      templateId = templateCreated.id;
    });

    afterAll(async () => {
      await removeFromDb(templateModel, tenantId);
    });

    it('Successfully updates a template', async () => {
      const resp = await app
        .put(`${defaultUrl}/${templateId}?tenantId=${tenantId}`)
        .send(templateUpdateRequestMock)
        .expect(200);

      expect(resp.body).toEqual(
        expect.objectContaining(templateUpdateRequestMock),
      );
    });

    describe('With invalid topSection element', () => {
      const commonInput = {
        label: {
          en: 'Fake input',
          fr: 'Fake input',
        },
        relatedElements: ['this-does-not-exist-but-it-does-not-matter'],
      };

      afterEach(async () => {
        await removeFromDb(elementModel, tenantId);
      });

      it('Fails to update a template if element does not exist', async () => {
        const fakeSection: TopSection = {
          label: { en: 'Fake Element', fr: 'Element faux' },
          key: 'fakeElementSection',
          sections: [
            {
              key: 'test',
              label: { en: 'Part 1', fr: 'Partie 1' },
              elements: ['this_element_does_not_exist'],
            },
          ],
        };

        const resp = await app
          .put(`${defaultUrl}/${templateId}?tenantId=${tenantId}`)
          .send({
            ...templateUpdateRequestMock,
            topSections: [
              ...templateUpdateRequestMock.topSections,
              fakeSection,
            ],
          })
          .expect(400);

        expect(resp.body).toEqual({
          status: 400,
          error: `Invalid topSections input: element with key ${fakeSection.sections[0].elements[0]} does not exist`,
        });
      });

      it('Fails to update a template if element that has a related element that does not exist', async () => {
        const elementWithInputsWithInvalidRelatedElements = {
          ...elementCreateRequestMock,
          tenantId,
          inputs: [
            {
              ...commonInput,
              relatedElements: ['this_element_does_not_exist'],
            },
          ],
        };

        await addElementToDb(
          elementModel,
          elementWithInputsWithInvalidRelatedElements,
        );

        const fakeSection: TopSection = {
          label: { en: 'Fake Element', fr: 'Element faux' },
          key: 'fakeElementSection',
          sections: [
            {
              key: 'test',
              label: { en: 'Part 1', fr: 'Partie 1' },
              elements: [elementCreateRequestMock.key],
            },
          ],
        };

        const resp = await app
          .put(`${defaultUrl}/${templateId}?tenantId=${tenantId}`)
          .send({
            ...templateUpdateRequestMock,
            topSections: [
              ...templateUpdateRequestMock.topSections,
              fakeSection,
            ],
          })
          .expect(400);

        expect(resp.body).toEqual({
          status: 400,
          error: `Invalid topSections input: relatedElements with keys [${elementWithInputsWithInvalidRelatedElements.inputs[0].relatedElements.join(
            ',',
          )}] does not exist`,
        });
      });

      it('Fails to update a template if element has two related elements but one does not exist', async () => {
        const elementWithInputsWithInvalidRelatedElements = {
          ...elementCreateRequestMock,
          tenantId,
          inputs: [
            {
              ...commonInput,
              relatedElements: [
                'this_element_does_not_exist',
                'lastName_personalInformation_identification',
              ],
            },
          ],
        };

        await addElementToDb(
          elementModel,
          elementWithInputsWithInvalidRelatedElements,
        );

        const fakeSection: TopSection = {
          label: { en: 'Fake Element', fr: 'Element faux' },
          key: 'fakeElementSection',
          sections: [
            {
              key: 'test',
              label: { en: 'Part 1', fr: 'Partie 1' },
              elements: [elementCreateRequestMock.key],
            },
          ],
        };

        const resp = await app
          .put(`${defaultUrl}/${templateId}?tenantId=${tenantId}`)
          .send({
            ...templateUpdateRequestMock,
            topSections: [
              ...templateUpdateRequestMock.topSections,
              fakeSection,
            ],
          })
          .expect(400);

        expect(resp.body).toEqual({
          status: 400,
          error: `Invalid topSections input: relatedItem with key ${elementWithInputsWithInvalidRelatedElements.inputs[0].relatedElements[0]} does not exist`,
        });
      });

      it('Fails to update a template if element has a related element with status different from conditional|optional', async () => {
        const elementWithInputsWithInvalidRelatedElements = {
          ...elementCreateRequestMock,
          tenantId,
          inputs: [
            {
              ...commonInput,
              relatedElements: ['lastName_personalInformation_identification'],
            },
          ],
        };

        await addElementToDb(
          elementModel,
          elementWithInputsWithInvalidRelatedElements,
        );

        const fakeSection: TopSection = {
          label: { en: 'Fake Element', fr: 'Element faux' },
          key: 'fakeElementSection',
          sections: [
            {
              key: 'test',
              label: { en: 'Part 1', fr: 'Partie 1' },
              elements: [elementCreateRequestMock.key],
            },
          ],
        };

        const resp = await app
          .put(`${defaultUrl}/${templateId}?tenantId=${tenantId}`)
          .send({
            ...templateUpdateRequestMock,
            topSections: [
              ...templateUpdateRequestMock.topSections,
              fakeSection,
            ],
          })
          .expect(400);

        expect(resp.body).toEqual({
          status: 400,
          error: `Invalid topSections input: status of relatedItem with key ${elementWithInputsWithInvalidRelatedElements.inputs[0].relatedElements} shall either be conditional or optional`,
        });
      });

      it('Fails to update a template with a topSection element that has a related element with related elements', async () => {
        const elementWithOptionalStatusAndRelatedElements = {
          ...elementCreateRequestMock,
          key: 'elementWithOptionalStatusAndRelatedElements-KEY',
          status: 'conditional',
          inputs: [
            { ...commonInput, relatedElements: ['this-does-not-exist'] },
          ],
          tenantId,
        };

        const elementWithInputsWithInvalidRelatedElements = {
          ...elementCreateRequestMock,
          inputs: [
            {
              ...commonInput,
              relatedElements: [
                elementWithOptionalStatusAndRelatedElements.key,
              ],
            },
          ],
          tenantId,
        };
        await Promise.all([
          addElementToDb(
            elementModel,
            elementWithOptionalStatusAndRelatedElements,
          ),
          addElementToDb(
            elementModel,
            elementWithInputsWithInvalidRelatedElements,
          ),
        ]);

        const fakeSection: TopSection = {
          label: { en: 'Fake Element', fr: 'Element faux' },
          key: 'fakeElementSection',
          sections: [
            {
              key: 'test',
              label: { en: 'Part 1', fr: 'Partie 1' },
              elements: [elementCreateRequestMock.key],
            },
          ],
        };

        const resp = await app
          .put(`${defaultUrl}/${templateId}?tenantId=${tenantId}`)
          .send({
            ...templateUpdateRequestMock,
            topSections: [
              ...templateUpdateRequestMock.topSections,
              fakeSection,
            ],
          })
          .expect(400);

        expect(resp.body).toEqual({
          status: 400,
          error: `Invalid topSections input: relatedItem with key ${elementWithInputsWithInvalidRelatedElements.inputs[0].relatedElements} shall not have related items in order to avoid recursion errors`,
        });
      });
    });

    it('Fails to update a template if topSection is missing', async () => {
      const { topSections, ...updateRequestWithoutTopSections } =
        templateUpdateRequestMock;

      const resp = await app
        .put(`${defaultUrl}/${templateId}?tenantId=${tenantId}`)
        .send(updateRequestWithoutTopSections)
        .expect(422);

      expect(resp.body).toEqual({
        message: 'Validation error',
        statusCode: 422,
        error: ['"topSections" is required'],
      });
    });

    it('Fails to update a template if topSection is missing key', async () => {
      const fakeSection = {
        label: { en: 'Fake Element', fr: 'Element faux' },
        sections: [
          {
            key: 'test',
            label: { en: 'Part 1', fr: 'Partie 1' },
            elements: ['this_element_does_not_exist'],
          },
        ],
      };

      const resp = await app
        .put(`${defaultUrl}/${templateId}?tenantId=${tenantId}`)
        .send({
          ...templateUpdateRequestMock,
          topSections: [fakeSection],
        })
        .expect(422);

      expect(resp.body).toEqual({
        message: 'Validation error',
        statusCode: 422,
        error: ['"topSections[0].key" is required'],
      });
    });

    it('Fails to update a template if template does not exist', async () => {
      const fakeTemplateId = uuidv4();
      const resp = await app
        .put(`${defaultUrl}/${fakeTemplateId}?tenantId=${tenantId}`)
        .send(templateUpdateRequestMock)
        .expect(400);

      expect(resp.body).toEqual({
        status: 400,
        error: `Unable to find the template with id=${fakeTemplateId}`,
      });
    });

    it('Fails to update a template name if another template already has the same name', async () => {
      const usedName = allTemplates[0].name;

      const resp = await app
        .put(`${defaultUrl}/${templateId}?tenantId=${tenantId}`)
        .send({ ...templateUpdateRequestMock, name: usedName })
        .expect(400);

      expect(resp.body).toEqual({
        status: 400,
        error: `Unable to update the template name into ${usedName}, since another template with this name already exists`,
      });
    });
  });

  describe('DELETE /templates/:id', () => {
    let templateId;
    beforeEach(async () => {
      await removeFromDb(templateModel, tenantId);
      const [templateCreated] = await addTemplateToDb(templateModel, {
        ...templateCreateRequestMock,
        tenantId,
      });

      templateId = templateCreated.id;
    });

    afterAll(async () => {
      await removeFromDb(templateModel, tenantId);
    });

    it('Successfully deletes a template by id', async () => {
      const resp = await app
        .delete(`${defaultUrl}/${templateId}?tenantId=${tenantId}`)
        .expect(200);

      expect(resp.body).toEqual({
        message: '1 deleted template(s).',
      });
    });

    it('Fails to delete a template if tenantId is not sent', async () => {
      const resp = await app.delete(`${defaultUrl}/${templateId}`).expect(422);

      expect(resp.body).toEqual({
        message: 'Validation error',
        statusCode: 422,
        error: ['"tenantId" is required'],
      });
    });

    it('Fails to delete a template if template does not exist', async () => {
      const fakeTemplateId = uuidv4();
      const resp = await app
        .delete(`${defaultUrl}/${fakeTemplateId}?tenantId=${tenantId}`)
        .expect(400);

      expect(resp.body).toEqual({
        status: 400,
        error: `Unable to find the template with id=${fakeTemplateId}`,
      });
    });
  });
});
