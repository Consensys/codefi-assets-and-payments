import fs from 'fs';
import { AssetElementsDto } from '../src/model/dto/AssetElementsDto';
import { validateSync } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { AssetTemplatesDto } from 'src/model/dto/AssetTemplatesDto';

const elementsFolder = __dirname + '/../src/configurations/assets/elements';
const templatesFolder = __dirname + '/../src/configurations/assets/templates';

const validateElementsJsonFiles = () => {
  try {
    console.log('Checking elements configurations');
    const elementsFilenames = fs.readdirSync(elementsFolder);
    const allLocalElements: Element[] = [];
    for (const filename of elementsFilenames) {
      const data = fs.readFileSync(`${elementsFolder}/${filename}`, 'utf8');
      const fileElements: Element[] = JSON.parse(data);
      allLocalElements.push(...fileElements);
    }

    for (const element of allLocalElements) {
      const errors = validateSync(plainToClass(AssetElementsDto, element));
      if (errors.length > 0) {
        console.error(errors);
        throw new Error('Failed to validate Asset Elements');
      }
    }

    console.log('Elements validated successfully without errors');
  } catch (error) {
    console.error(error);
    console.error('Failed to validate');
  }
};

const validateTemplatesJsonFiles = () => {
  try {
    console.log('Checking templates configurations');
    const templatesFilenames = fs.readdirSync(templatesFolder);
    for (const filename of templatesFilenames) {
      const data = fs.readFileSync(`${templatesFolder}/${filename}`, 'utf8');
      const template = JSON.parse(data);

      const errors = validateSync(plainToClass(AssetTemplatesDto, template));

      if (errors.length > 0) {
        console.error(errors);
        throw new Error('Failed to validate Asset Templates');
      }
    }

    console.log('Templates validated successfully without errors');
  } catch (error) {
    console.error(error);
    console.error('Failed to validate');
  }
};

validateElementsJsonFiles();
validateTemplatesJsonFiles();
