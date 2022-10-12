import React from 'react';
import {
  AffordableAndCleanEnergy,
  CleanWaterAndSanitation,
  ClimateAction,
  DecentWorkAndEconomicGrowth,
  GenderEquality,
  GoodHealthAndWellBeing,
  IndustryInnovationAndInfrastructure,
  LifeBelowWater,
  LifeOnLand,
  NoPoverty,
  PartnershipToAchieveTheGoal,
  PeaceAndJusticeStrongInstitutions,
  QualityEducation,
  ReducedInequality,
  ResponsibleConsumptionAndProduction,
  SustainableCitiesAndCommunities,
  ZeroHunger,
} from 'uiComponents/Table/Icons/SdgIcons';

interface IProps {
  element: string;
}

export const SdgIcon: React.FC<IProps> = ({ element }: IProps): JSX.Element => {
  return (
    <>
      {element === 'NO_POVERTY' && <NoPoverty />}
      {element === 'ZERO_HUNGER' && <ZeroHunger />}
      {element === 'GOOD_HEALTH_AND_WELL_BEING' && <GoodHealthAndWellBeing />}
      {element === 'QUALITY_EDUCATION' && <QualityEducation />}
      {element === 'GENDER_EQUALITY' && <GenderEquality />}
      {element === 'CLEAN_WATER_AND_SANITATION' && <CleanWaterAndSanitation />}
      {element === 'AFFORDABLE_AND_CLEAN_ENERGY' && (
        <AffordableAndCleanEnergy />
      )}
      {element === 'DECENT_WORK_AND_ECONOMIC_GROWTH' && (
        <DecentWorkAndEconomicGrowth />
      )}
      {element === 'INDUSTRY_INNOVATION_AND_INFRASTRUCTURE' && (
        <IndustryInnovationAndInfrastructure />
      )}
      {element === 'REDUCE_INEQUALITY' && <ReducedInequality />}
      {element === 'SUSTAINABLE_CITIES_AND_COMMUNITIES' && (
        <SustainableCitiesAndCommunities />
      )}
      {element === 'RESPONSIBLE_CONSUMPTION_AND_PRODUCTION' && (
        <ResponsibleConsumptionAndProduction />
      )}
      {element === 'CLIMATE_ACTION' && <ClimateAction />}
      {element === 'LIFE_BELOW_WATER' && <LifeBelowWater />}
      {element === 'LIFE_ON_LAND' && <LifeOnLand />}
      {element === 'PEACE_AND_JUSTICE_STRONG_INSTITUTIONS' && (
        <PeaceAndJusticeStrongInstitutions />
      )}
      {element === 'PARTNERSHIP_TO_ACHIEVE_THE_GOAL' && (
        <PartnershipToAchieveTheGoal />
      )}
    </>
  );
};
