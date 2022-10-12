import React from 'react';

import './PropertiesStyles.scss';

export interface IProperty {
  label: string;
  optional?: boolean;
  type?: string;
  parameters?: Array<{
    label: string;
    type: string;
  }>;
  example?: string;
  comment?: string;
  title?: string;
  defaultValue?: string;
}

interface IProps {
  properties: Array<IProperty>;
  title?: string;
}

const Properties: React.FC<IProps> = ({
  properties,
  title = 'Properties',
}: IProps) => (
  <React.Fragment>
    <h3>{title}</h3>

    <div className="_route_stylesGuide_components_properties">
      {properties.map((property) => (
        <div key={property.label}>
          <h4>
            {property.label}
            {property.optional && <span>(optional)</span>}
          </h4>

          {property.parameters &&
            property.parameters.map((parameter, index) => (
              <div key={index}>
                <span>
                  <code>
                    <b>{parameter.label}</b>
                  </code>
                  <br />
                  (parameter)
                </span>
                <code>type: {parameter.type}</code>
              </div>
            ))}

          {property.type && (
            <div>
              <span>Type</span>
              <code>{property.type}</code>
            </div>
          )}

          {property.defaultValue && (
            <div>
              <span>Default value</span>
              <code>{property.defaultValue}</code>
            </div>
          )}

          {property.example && (
            <div>
              <span>Example</span>
              <code>{property.example}</code>
            </div>
          )}

          {property.comment && (
            <div>
              <span>Comment</span>
              <code>{property.comment}</code>
            </div>
          )}
        </div>
      ))}
    </div>
  </React.Fragment>
);

export default React.memo(Properties);
