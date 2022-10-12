const fs = require('fs');

const { DEFAULT_TENANT_ID } = require('../../utils/constants/constants');

const elementsFolder = __dirname + '/elements';
const templatesFolder = __dirname + '/templates';

// get all elements files ('.json' files)
const elementsFiles = fs.readdirSync(elementsFolder);

let allElements = [];
elementsFiles.forEach(elementFile => {
  // Get json file
  const elements = JSON.parse(
    fs.readFileSync(elementsFolder + '/' + elementFile, 'utf8'),
  );
  const elementsWithTenantId = elements.map(element => {
    return {
      tenantId: DEFAULT_TENANT_ID,
      ...element,
    };
  });
  allElements.push(elementsWithTenantId);
});

// get all template files ('.json' files)
const templateFiles = fs.readdirSync(templatesFolder);

let allTemplates = [];
templateFiles.forEach(templateFile => {
  // Get json file
  const template = {
    tenantId: DEFAULT_TENANT_ID,
    ...JSON.parse(
      fs.readFileSync(templatesFolder + '/' + templateFile, 'utf8'),
    ),
  };
  allTemplates.push(template);
});


const initialSeedElements = allElements.reduce(
  (acc, curr) => [...acc, ...curr],
  [],
);

module.exports = {
  allElements,
  allTemplates,
  initialSeedElements
};
