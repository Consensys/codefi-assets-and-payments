import React from 'react';
import Prism from 'prismjs';

import './ExampleStyles.scss';

interface IProps {
  code: string;
  language?: string;
  children: React.ReactNode;
}

const Example: React.FC<IProps> = ({
  children,
  code,
  language = 'html',
}: IProps) => {
  const transformedCode = Prism.highlight(
    code,
    Prism.languages[language],
    language,
  );

  return (
    <div className="_route_stylesGuide_components_example">
      <div>{children}</div>
      <pre>
        <code
          className={`language-${language}`}
          dangerouslySetInnerHTML={{ __html: transformedCode }}
        />
      </pre>
    </div>
  );
};

export default Example;
