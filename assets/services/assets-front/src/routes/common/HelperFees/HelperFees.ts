import { ClassData } from 'routes/Issuer/AssetIssuance/assetTypes';

export function CalculateFees(
  shareClass: ClassData,
  investorFee: number | undefined,
  totalAmountNoFees: number,
) {
  const customFees = shareClass.fees?.subscriptionCustomFeesValue || [];
  if (investorFee) {
    customFees.push({
      name: 'Fees',
      value: `${investorFee || ''} `,
    });
  }

  const formattedCustomFees = customFees.map(({ name, value }) => {
    return {
      name,
      value: totalAmountNoFees * (parseFloat(value) / 100),
    };
  });

  const totalCustomFees = formattedCustomFees.reduce(
    (acc, curr) => acc + curr.value,
    0,
  );
  const totalWithCustomFees = Number(totalAmountNoFees) + totalCustomFees;
  return { formattedCustomFees, totalWithCustomFees };
}

export default CalculateFees;
