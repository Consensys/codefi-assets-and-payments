import emailTemplatesJson from '../src/configurations/mails/codefi.json';

interface MailTemplateObject {
  tenantId: string;
  key: string;
  variables: string[];
  subject: string;
  messageTitle: string;
  message: string;
  buttonLabel: string;
}

function getAllVariablesUsedInMessage(
  mailObject: MailTemplateObject,
): string[] {
  const variablesRegex = new RegExp(/(\{[\w\d]+\})/, 'g');
  const subjectMatches = mailObject.subject?.match(variablesRegex) ?? [];
  const messageTitleMatches =
    mailObject.messageTitle?.match(variablesRegex) ?? [];
  const messageMatches = mailObject.message?.match(variablesRegex) ?? [];
  const buttonLabelMatches =
    mailObject.buttonLabel?.match(variablesRegex) ?? [];
  return Array.from(
    new Set([
      ...subjectMatches,
      ...messageMatches,
      ...messageTitleMatches,
      ...buttonLabelMatches,
    ]),
  ).map((variable) => {
    //strip the brackets
    return variable.replace(/[{}]+/g, '');
  });
}

describe('Codefi Mail Template Test', () => {
  describe('Check for variables used in template but not in variables array', () => {
    test.each(emailTemplatesJson.map((entry) => [entry.key, entry]))(
      'If %s, has variables used in template but not in variables array.',
      (_, mailTemplateObject: MailTemplateObject) => {
        const templateVariablesUsed =
          getAllVariablesUsedInMessage(mailTemplateObject);
        templateVariablesUsed.forEach((variable) => {
          expect(mailTemplateObject.variables.indexOf(variable)).not.toEqual(
            -1,
          );
        });
      },
    );
  });

  describe('Check for duplicate keys', () => {
    test.each(emailTemplatesJson.map((entry) => [entry.key, entry]))(
      'If %s, has duplicate keys',
      (_, mailTemplateObject: MailTemplateObject) => {
        expect(
          mailTemplateObject.variables.length ===
            Array.from(new Set(mailTemplateObject.variables)).length,
        ).toEqual(true);
      },
    );
  });
});
