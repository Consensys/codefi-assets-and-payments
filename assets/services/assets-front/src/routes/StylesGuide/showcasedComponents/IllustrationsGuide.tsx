import React from 'react';
import { Link } from 'react-router-dom';

import UndrawOnboarding from 'uiComponents/UndrawOnboarding';
import Example from '../components/Example';

const ButtonGuide: React.FC = () => {
  return (
    <div>
      <h2>Illustrations</h2>

      <p>
        We are using the illustration base from{' '}
        <Link
          to={{
            pathname: 'https://undraw.co/illustrations',
          }}
          target="_blank"
          rel="noopener noreferrer"
        >
          undraw
        </Link>
        . You can browse the list to find a good illustration for your needs.
      </p>

      <p>
        We never use the syntax{' '}
        <strong>
          <code>{"import Undraw from 'react-undraw';"}</code>
        </strong>{' '}
        or{' '}
        <strong>
          <code>{"import { UndrawCoding } from 'react-undraw';"}</code>
        </strong>{' '}
        as it would import the entire illustration base and make the application
        unusable. We always import the exact illustration wee need and use it as
        a component:{' '}
        <strong>
          <code>
            {`import UndrawOnboarding from 'uiComponents/UndrawOnboarding';

<UndrawOnboarding />`}
          </code>
        </strong>
      </p>

      <h3>Examples</h3>

      <Example
        code={`import UndrawOnboarding from 'uiComponents/UndrawOnboarding';

<UndrawOnboarding />`}
      >
        <UndrawOnboarding />
      </Example>
    </div>
  );
};

export default ButtonGuide;
