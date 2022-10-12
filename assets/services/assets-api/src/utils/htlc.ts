import ErrorService from 'src/utils/errorService';

import crypto from 'crypto';
import { keys as HTLCKeys, HTLC } from 'src/types/htlc';

// Encryption/decryption

const algorithm = 'aes-256-ctr';

if (!process.env.HTLC_SECRET_ENCRYPTION_KEY) {
  throw new Error('missing env variable: HTLC_SECRET_ENCRYPTION_KEY');
} else if (process.env.HTLC_SECRET_ENCRYPTION_KEY.length !== 32) {
  throw new Error(
    'invalid length for key HTLC_SECRET_ENCRYPTION_KEY: shall be 32 characters long',
  );
}
const htlcSecretEncryptionKey = process.env.HTLC_SECRET_ENCRYPTION_KEY; // key must be 32 characters long

const userIdToIv = (userId): Buffer => {
  const ivString = userId.replace(/-/g, '');

  if (ivString.length !== 32) {
    throw new Error(
      `invalid length for userId: ${ivString.length} instead of expected 32`,
    );
  }
  const iv = Buffer.from(ivString, 'hex');
  return iv;
};

export const encrypt = (text, userId): string => {
  const cipher = crypto.createCipheriv(
    algorithm,
    htlcSecretEncryptionKey,
    userIdToIv(userId),
  );

  const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);

  return encrypted.toString('hex');
};

export const decrypt = (hash, userId): string => {
  const decipher = crypto.createDecipheriv(
    algorithm,
    htlcSecretEncryptionKey,
    userIdToIv(userId),
  );

  const decrpyted = Buffer.concat([
    decipher.update(Buffer.from(hash, 'hex')),
    decipher.final(),
  ]);

  return decrpyted.toString();
};

// HTLC

const bufToStr = (b) => '0x' + b.toString('hex');

const strToBuf = (s) => Buffer.from(s.substr(2), 'hex');

const random32 = () => crypto.randomBytes(32);

const sha256 = (x) => crypto.createHash('sha256').update(x).digest();

export const newHTLC = (): HTLC => {
  // user with ID "userId" will be the only one capable to decrypt the HTLC secret
  const secretBuf = random32();
  const hashBuf = sha256(secretBuf);
  const secret = bufToStr(secretBuf);
  const hash = bufToStr(hashBuf);

  return {
    [HTLCKeys.SECRET]: secret,
    [HTLCKeys.SECRET_HASH]: hash,
  };
};

export const newEncryptedHTLC = (userId: string): HTLC => {
  const htlc: HTLC = newHTLC();
  return {
    [HTLCKeys.OWNER]: userId, // user with ID "userId" will be the only one capable to decrypt the HTLC secret
    [HTLCKeys.SECRET_ENCRYPTED]: encrypt(htlc[HTLCKeys.SECRET], userId),
    [HTLCKeys.SECRET_HASH]: htlc[HTLCKeys.SECRET_HASH],
  };
};

export const checkSecretForHash = (secret: string, hash: string) => {
  try {
    const secretBuf = strToBuf(secret);
    const hashBuf = sha256(secretBuf);

    if (bufToStr(hashBuf) !== hash) {
      ErrorService.throwError(`secret provided for hash ${hash} is not valid`);
    }
  } catch (error) {
    ErrorService.logAndThrowFunctionError(
      error,
      'checking secret for hash',
      'checkSecretForHash',
      false,
      500,
    );
  }
};

export const decryptHTLC = (htlc: HTLC, userId: string): HTLC => {
  try {
    if (userId !== htlc[HTLCKeys.OWNER]) {
      ErrorService.throwError(
        `invalid userId (${userId}): only the owner of the HTLC secret (account who createed it), ${
          htlc[HTLCKeys.OWNER]
        }, is allowed to decrypt it`,
      );
    }

    if (!htlc[HTLCKeys.SECRET_ENCRYPTED]) {
      ErrorService.throwError(
        "invalid HTLC: doesn't contain an encrypted secret",
      );
    }
    if (!htlc[HTLCKeys.SECRET_HASH]) {
      ErrorService.throwError("invalid HTLC: doesn't contain a secret hash");
    }

    const decryptedSecret: string = decrypt(
      htlc[HTLCKeys.SECRET_ENCRYPTED],
      userId,
    );

    checkSecretForHash(decryptedSecret, htlc[HTLCKeys.SECRET_HASH]);

    return {
      ...htlc,
      [HTLCKeys.SECRET]: decryptedSecret,
    };
  } catch (error) {
    ErrorService.logAndThrowFunctionError(
      error,
      'decrypting HTLC secret',
      'decryptHTLC',
      false,
      500,
    );
  }
};
