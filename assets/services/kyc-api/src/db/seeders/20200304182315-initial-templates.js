'use strict';
const { allTemplates } = require('../init/index');

const {
  compareAndUpdateTemplates,
  decorateTime,
  prettify,
} = require('../helpers');

const targetTemplates = allTemplates;

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const [templates] = await queryInterface.sequelize.query(
      'SELECT * FROM "templates"',
    );
    const [elements] = await queryInterface.sequelize.query(
      'SELECT * FROM "elements"',
    );
    const currentTemplates = templates || [];

    const jsonModelAttributes = {
      topSections: {
        type: new Sequelize.ARRAY(new Sequelize.JSON()),
      },
      data: {
        type: new Sequelize.JSON(),
      },
    };

    const { templatesToCreate, templatesToUpdate } = compareAndUpdateTemplates(
      currentTemplates,
      targetTemplates,
      elements.map(({ key }) => key),
    );
    const ipToCreate = decorateTime(templatesToCreate, true);

    if (ipToCreate.length > 0) {
      console.log(
        prettify({
          message: 'Some templates need to be created:',
          ipToCreate,
        }),
      );
      await queryInterface.bulkInsert(
        'templates',
        ipToCreate,
        {},
        jsonModelAttributes,
      );
    }

    const ipToUpdate = decorateTime(templatesToUpdate);

    if (ipToUpdate.length > 0) {
      console.log(
        prettify({
          message: 'Some templates need to be updated:',
          ipToUpdate,
        }),
      );
      await Promise.all(
        ipToUpdate.map(({ id, ...template }) => {
          console.log(`Updating template with id: ${id}`);
          return queryInterface.bulkUpdate(
            'templates',
            template,
            { id },
            {},
            jsonModelAttributes,
          );
        }),
      );
    }
  },
  down: queryInterface => {
    return queryInterface.bulkDelete('templates', null, {});
  },
};
