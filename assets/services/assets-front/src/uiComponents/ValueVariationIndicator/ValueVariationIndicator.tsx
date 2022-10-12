import React from 'react';
import CSS from 'csstype';

import Icon from 'uiComponents/Icon';
import { mdiTrendingUp, mdiTrendingDown, mdiTrendingNeutral } from '@mdi/js';
import { colors } from 'constants/styles';

import './ValueVariationIndicator.scss';

interface IProps {
  readonly className?: string;
  readonly style?: CSS.Properties;
  readonly variationLabelLeft?: string | number;
  readonly variationLabel?: string | number;
  readonly variation: number | 'up' | 'down' | 'neutral';
  readonly iconSize?: number;
}

export const ValueVariationIndicator: React.FC<IProps> = ({
  className,
  style,
  iconSize = 18,
  variation,
  variationLabel,
  variationLabelLeft,
}: IProps) => {
  let variationDirection = variation;

  if (typeof variationDirection === 'number') {
    if (variationDirection === 0) {
      variationDirection = 'neutral';
    } else if (variationDirection > 0) {
      variationDirection = 'up';
    } else {
      variationDirection = 'down';
    }
  }

  return (
    <div
      style={style || undefined}
      className={`_uiComponent_valueVariationIndicator ${variationDirection} ${
        className ? className : ''
      }`}
    >
      {variationLabelLeft && variationLabelLeft}

      {variationDirection === 'up' && (
        <Icon
          width={iconSize}
          icon={mdiTrendingUp}
          color={colors.successDark}
        />
      )}
      {variationDirection === 'down' && (
        <Icon
          width={iconSize}
          icon={mdiTrendingDown}
          color={colors.errorDark}
        />
      )}
      {variationDirection === 'neutral' && (
        <Icon width={iconSize} icon={mdiTrendingNeutral} color="#777" />
      )}

      {variationLabel && variationLabel}
    </div>
  );
};
