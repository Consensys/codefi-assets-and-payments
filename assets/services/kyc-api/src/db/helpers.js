const uuidv4 = require('uuid').v4;

const prettify = obj => JSON.stringify(obj, null, 2);

/**
 * [This methods compares 2 database entries - generic fields are discarded in the process]
 */
const areDatabaseObjectsEqual = (obj1, obj2) => {
  const localObj1 = { ...obj1 };
  const localObj2 = { ...obj2 };

  delete localObj1.id;
  delete localObj1.createdAt;
  delete localObj1.updatedAt;

  delete localObj2.id;
  delete localObj2.createdAt;
  delete localObj2.updatedAt;

  return objectsAreSame(localObj1, localObj2);
};

function objectsAreSame(x, y) {
  var objectsAreSame = true;
  for (var propertyName in x) {
    if (JSON.stringify(x[propertyName]) !== JSON.stringify(y[propertyName])) {
      console.log(
        `Objects have different values for property: ${propertyName}`,
      );
      objectsAreSame = false;
      break;
    }
  }
  return objectsAreSame;
}

/**
 * [Generic method that adds time column accordingly before a database transaction - createdAt is only added for new rows]
 */
const decorateTime = (elements, create) =>
  elements.map(element => {
    if (create) {
      return {
        updatedAt: new Date(),
        createdAt: new Date(),
        ...element,
      };
    }
    return {
      updatedAt: new Date(),
      ...element,
    };
  });

/**
 * [Given a current and a target db state, this methods builds 2 lists (elements to create / elements to update) based on the diff]
 */
const compareAndUpdateElements = (currentElements, targetElements) => {
  const currentElementsKeys = currentElements.map(({ key }) => key);
  const elementsToCreate = [];
  const elementsToUpdate = [];
  targetElements.forEach(target => {
    const index = currentElementsKeys.indexOf(target.key);
    if (index < 0) {
      elementsToCreate.push({
        ...target,
        id: uuidv4(),
      });
    } else if (!areDatabaseObjectsEqual(target, currentElements[index])) {
      elementsToUpdate.push({
        ...target,
        id: currentElements[index].id,
      });
    }
  });
  return {
    elementsToCreate,
    elementsToUpdate,
  };
};

/**
 * [Given a current and a target db state, this methods builds 2 lists (templates to create / templates to update) based on the diff]
 */
const compareAndUpdateTemplates = (
  currentTemplates,
  targetTemplates,
  elements,
) => {
  const currentTemplatesNames = currentTemplates.map(({ name }) => name);
  const templatesToCreate = [];
  const templatesToUpdate = [];
  targetTemplates.forEach(target => {
    checkValidTemplate(target, elements);
    const index = currentTemplatesNames.indexOf(target.name);
    if (index < 0) {
      templatesToCreate.push({
        ...target,
        id: uuidv4(),
      });
    } else if (!areDatabaseObjectsEqual(target, currentTemplates[index])) {
      templatesToUpdate.push({
        ...target,
        id: currentTemplates[index].id,
      });
    }
  });
  return {
    templatesToCreate,
    templatesToUpdate,
  };
};

const checkValidTemplate = ({ topSections }, validElements) => {
  topSections.forEach(({ sections }) => {
    sections.forEach(({ elements }) => {
      elements.forEach(element => {
        if (validElements.indexOf(element) === -1) {
          throw new Error(`Element with key: ${element} not found`);
        }
      });
    });
  });
};

module.exports = {
  decorateTime,
  compareAndUpdateElements,
  compareAndUpdateTemplates,
  prettify,
};
