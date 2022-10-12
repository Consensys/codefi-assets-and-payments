const validator = (input) => (req, res, next) => {
  if (!req.query[input]) {
    res.status(400);
    res.json({
      status: 'error',
      message: `missing argument '${input}'`,
    });
    return;
  }
  next();
};

export const validateContractInput = validator('contractName');
export const validateContractAddressInput = validator('contractAddress');
