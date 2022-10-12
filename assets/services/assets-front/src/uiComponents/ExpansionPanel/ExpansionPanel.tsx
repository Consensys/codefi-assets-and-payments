import React, { FC, ReactNode, useState } from 'react';

import './ExpansionPanelStyles.scss';
import { Card } from 'uiComponents/Card';

interface IProps {
  readonly id?: string;
  readonly label: string;
  readonly children: ReactNode;
}

const ExpansionPanel: FC<IProps> = ({ label, children, id }: IProps) => {
  const [open, setOpen] = useState(false);
  return (
    <Card id={id} className="uiComponent_expansionPanel">
      <div
        className={`expansionPanelSummary${open ? ' open' : ''}`}
        onClick={() => setOpen(!open)}
      >
        <span>{label}</span>
      </div>
      {open && <div className="expansionPanelDetails">{children}</div>}
    </Card>
  );
};

export default ExpansionPanel;
