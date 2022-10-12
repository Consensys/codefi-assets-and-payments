import React, { Fragment, ReactElement } from 'react';
import './Wizard.scss';
import { RightOutlined } from '@ant-design/icons';

interface IProps {
  className: string;
  steps: {
    label: string;
    component: ReactElement;
  }[];
  summary: ReactElement;
  activeStep: number;
}

export const Wizard: React.FC<IProps> = ({
  className,
  steps,
  summary,
  activeStep,
}: IProps) => {
  return (
    <div className={`wizard__wrapper ${className}`}>
      <div className={'wizard__breadcrumbs'}>
        <div className={'wizard__breadcrumbs__steps'}>
          {steps.map((step, i) => (
            <Fragment key={i}>
              <span className={activeStep === i ? 'active' : ''}>
                {step.label}
              </span>
              {i !== steps.length - 1 && (
                <RightOutlined className={'breadcrumb-separator'} />
              )}
            </Fragment>
          ))}
        </div>
      </div>
      <div className={'wizard__content'}>
        <div className={'wizard__content__active-step'}>
          <div className={'wizard__content__active-step__content'}>
            {steps[activeStep].component}
          </div>
        </div>
        <div className={'wizard__content__summary'}>
          <div className={'wizard__content__summary__content'}>{summary}</div>
        </div>
      </div>
    </div>
  );
};
