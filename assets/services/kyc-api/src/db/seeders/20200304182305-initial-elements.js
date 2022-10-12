'use strict';
const { allElements } = require('../init/index');

const {
  compareAndUpdateElements,
  decorateTime,
  prettify,
} = require('../helpers');

const targetElements = allElements.reduce((acc, curr) => [...acc, ...curr], []);

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const [data] = await queryInterface.sequelize.query(
      'SELECT * FROM "elements"',
    );

    const jsonModelAttributes = {
      label: {
        type: new Sequelize.JSON(),
      },
      placeholder: {
        type: new Sequelize.JSON(),
      },
      inputs: {
        type: new Sequelize.ARRAY(new Sequelize.JSON()),
      },
      data: {
        type: new Sequelize.JSON(),
      },
    };

    const currentElements = data || [];

    const { elementsToCreate, elementsToUpdate } = compareAndUpdateElements(
      currentElements,
      targetElements,
    );
    const ipToCreate = decorateTime(elementsToCreate, true);

    if (ipToCreate.length > 0) {
      console.log(
        prettify({
          message: 'Some elements need to be created:',
          ipToCreate,
        }),
      );
      await queryInterface.bulkInsert(
        'elements',
        ipToCreate,
        {},
        jsonModelAttributes,
      );
    }

    const ipToUpdate = decorateTime(elementsToUpdate);

    if (ipToUpdate.length > 0) {
      console.log(
        prettify({
          message: 'Some elements need to be updated:',
          ipToUpdate,
        }),
      );
      await Promise.all(
        ipToUpdate.map(({ id, ...element }) => {
          console.log(`Updating element with id: ${id}`);
          return queryInterface.bulkUpdate(
            'elements',
            element,
            { id },
            {},
            jsonModelAttributes,
          );
        }),
      );
    }
  },
  down: (queryInterface) => {
    return queryInterface.bulkDelete('elements', null, {});
  },
};
