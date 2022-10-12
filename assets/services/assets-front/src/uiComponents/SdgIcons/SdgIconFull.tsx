import React from 'react';
import {
  AffordableAndCleanEnergyFull,
  CleanWaterAndSanitationFull,
  ClimateActionFull,
  DecentWorkAndEconomicGrowthFull,
  GenderEqualityFull,
  GoodHealthAndWellBeingFull,
  IndustryInnovationAndInfrastructureFull,
  LifeBelowWaterFull,
  LifeOnLandFull,
  NoPovertyFull,
  PartnershipToAchieveTheGoalFull,
  PeaceAndJusticeStrongInstitutionsFull,
  QualityEducationFull,
  ReducedInequalityFull,
  ResponsibleConsumptionAndProductionFull,
  SustainableCitiesAndCommunitiesFull,
  ZeroHungerFull,
} from 'uiComponents/Table/Icons/SdgIcons';

interface IProps {
  element: string;
}

export const SdgIconFull: React.FC<IProps> = ({
  element,
}: IProps): JSX.Element => {
  return (
    <>
      {element === 'NO_POVERTY' && <NoPovertyFull />}
      {element === 'ZERO_HUNGER' && <ZeroHungerFull />}
      {element === 'GOOD_HEALTH_AND_WELL_BEING' && (
        <GoodHealthAndWellBeingFull />
      )}
      {element === 'QUALITY_EDUCATION' && <QualityEducationFull />}
      {element === 'GENDER_EQUALITY' && <GenderEqualityFull />}
      {element === 'CLEAN_WATER_AND_SANITATION' && (
        <CleanWaterAndSanitationFull />
      )}
      {element === 'AFFORDABLE_AND_CLEAN_ENERGY' && (
        <AffordableAndCleanEnergyFull />
      )}
      {element === 'DECENT_WORK_AND_ECONOMIC_GROWTH' && (
        <DecentWorkAndEconomicGrowthFull />
      )}
      {element === 'INDUSTRY_INNOVATION_AND_INFRASTRUCTURE' && (
        <IndustryInnovationAndInfrastructureFull />
      )}
      {element === 'REDUCE_INEQUALITY' && <ReducedInequalityFull />}
      {element === 'SUSTAINABLE_CITIES_AND_COMMUNITIES' && (
        <SustainableCitiesAndCommunitiesFull />
      )}
      {element === 'RESPONSIBLE_CONSUMPTION_AND_PRODUCTION' && (
        <ResponsibleConsumptionAndProductionFull />
      )}
      {element === 'CLIMATE_ACTION' && <ClimateActionFull />}
      {element === 'LIFE_BELOW_WATER' && <LifeBelowWaterFull />}
      {element === 'LIFE_ON_LAND' && <LifeOnLandFull />}
      {element === 'PEACE_AND_JUSTICE_STRONG_INSTITUTIONS' && (
        <PeaceAndJusticeStrongInstitutionsFull />
      )}
      {element === 'PARTNERSHIP_TO_ACHIEVE_THE_GOAL' && (
        <PartnershipToAchieveTheGoalFull />
      )}
    </>
  );
};
