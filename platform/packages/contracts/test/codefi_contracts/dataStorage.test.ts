declare const contract
declare const artifacts
declare const web3

import { expectEvent, expectRevert } from '@openzeppelin/test-helpers'
import { expect } from 'chai'

const DataStorage = artifacts.require('DataStorage')

const utils = web3.utils
const abiEncode = (...args) => web3.eth.abi.encodeParameter(...args)
const getTimestamp = async (tx: any) => {
  const { timestamp } = await web3.eth.getBlock(tx.receipt.blockNumber)
  return timestamp
}

enum Type {
  UNSET = 0,
  OBJECT = 1,
  STRING = 2,
  UINT = 3,
  BYTES32 = 4,
  ADDRESS = 5,
  BOOL = 6,
}

contract('DataStorage', async (accounts: string[]) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_, owner, anyone] = accounts
  let storage: any
  let checkMetadata: (id: string, type: Type, tx: any) => Promise<void>

  beforeEach(async function () {
    storage = await DataStorage.new()

    checkMetadata = async (id: string, type: Type, tx: any) => {
      const storedType = await storage.methods['getType(string)'].call(id)
      expect(storedType.toNumber()).to.equal(type)

      const timestamp = await getTimestamp(tx)
      const metadata = await storage.getMetadata.call(id)
      expect(metadata.owner).to.equal(owner)
      expect(metadata.lastUpdatedAt).to.equal(timestamp.toString())
    }
  })

  it('should store a string', async () => {
    const id = utils.randomHex(32)
    const value = 'asdsadkfjhnlaskdjlaskdvmsadvoie238491!@$@#!%@#%#@t&!&%!@#*()'

    const tx = await storage.storeString(id, value, { from: owner })
    expectEvent(tx, 'StringStored', { sender: owner, id, value })

    const stored = await storage.methods['getString(string)'].call(id)
    expect(stored).to.equal(value)

    await checkMetadata(id, Type.STRING, tx)
  })

  it('should update a string', async () => {
    const id = utils.randomHex(32)
    const value = 'asdsadkfjhnlaskdjlaskdvmsadvoie238491!@$@#!%@#%#@t&!&%!@#*()'
    const updated = 'updated'

    await storage.storeString(id, value, { from: owner })
    const tx = await storage.storeString(id, updated, { from: owner })
    expectEvent(tx, 'StringStored', { sender: owner, id, value: updated })

    const stored = await storage.methods['getString(string)'].call(id)
    expect(stored).to.equal(updated)

    await checkMetadata(id, Type.STRING, tx)
  })

  it('should store a json', async () => {
    const id = utils.randomHex(32)
    const value = '{ "a": "b"}'
    const meta = 'meta'

    const tx = await storage.storeJson(id, value, meta, { from: owner })
    expectEvent(tx, 'JsonStored', {
      sender: owner,
      id,
      value,
      valueMetadata: meta,
    })

    const stored = await storage.methods['getString(string)'].call(id)
    expect(stored).to.equal(value)

    await checkMetadata(id, Type.STRING, tx)
  })

  it('should update a json', async () => {
    const id = utils.randomHex(32)
    const value = '{ "a": "c"}'
    const updated = 'updated'
    const meta = 'meta'

    await storage.storeJson(id, value, meta, { from: owner })
    const tx = await storage.storeJson(id, updated, meta, { from: owner })
    expectEvent(tx, 'JsonStored', {
      sender: owner,
      id,
      value: updated,
      valueMetadata: meta,
    })

    const stored = await storage.methods['getString(string)'].call(id)
    expect(stored).to.equal(updated)

    await checkMetadata(id, Type.STRING, tx)
  })

  it('should store a uint256', async () => {
    const id = utils.randomHex(32)
    const value = 1294835235

    const tx = await storage.storeUint256(id, value, { from: owner })
    expectEvent(tx, 'UintStored', {
      sender: owner,
      id,
      value: value.toString(),
    })

    const stored = await storage.methods['getUint256(string)'].call(id)
    expect(stored.toString()).to.equal(value.toString())

    await checkMetadata(id, Type.UINT, tx)
  })

  it('should update a uint256', async () => {
    const id = utils.randomHex(32)
    const value = 1294835235
    const updated = 123

    await storage.storeUint256(id, value, { from: owner })
    const tx = await storage.storeUint256(id, updated, { from: owner })
    expectEvent(tx, 'UintStored', {
      sender: owner,
      id,
      value: updated.toString(),
    })

    const stored = await storage.methods['getUint256(string)'].call(id)
    expect(stored.toString()).to.equal(updated.toString())

    await checkMetadata(id, Type.UINT, tx)
  })

  it('should store a bool', async () => {
    const id = utils.randomHex(32)
    const value = true

    const tx = await storage.storeBool(id, value, { from: owner })
    expectEvent(tx, 'BoolStored', { sender: owner, id, value })

    const stored = await storage.methods['getBool(string)'].call(id)
    expect(stored).to.equal(value)

    await checkMetadata(id, Type.BOOL, tx)
  })

  it('should update a bool', async () => {
    const id = utils.randomHex(32)
    const value = true
    const updated = false

    await storage.storeBool(id, value, { from: owner })
    const tx = await storage.storeBool(id, updated, { from: owner })
    expectEvent(tx, 'BoolStored', { sender: owner, id, value: updated })

    const stored = await storage.methods['getBool(string)'].call(id)
    expect(stored).to.equal(updated)

    await checkMetadata(id, Type.BOOL, tx)
  })

  it('should store an address', async () => {
    const id = utils.randomHex(32)
    const value = utils.toChecksumAddress(utils.randomHex(20))

    const tx = await storage.storeAddress(id, value, { from: owner })
    expectEvent(tx, 'AddressStored', { sender: owner, id, value })

    const stored = await storage.methods['getAddress(string)'].call(id)
    expect(stored).to.equal(value)

    await checkMetadata(id, Type.ADDRESS, tx)
  })

  it('should update an address', async () => {
    const id = utils.randomHex(32)
    const value = utils.toChecksumAddress(utils.randomHex(20))
    const updated = utils.toChecksumAddress(utils.randomHex(20))

    await storage.storeAddress(id, value, { from: owner })
    const tx = await storage.storeAddress(id, updated, { from: owner })
    expectEvent(tx, 'AddressStored', { sender: owner, id, value: updated })

    const stored = await storage.methods['getAddress(string)'].call(id)
    expect(stored).to.equal(updated)

    await checkMetadata(id, Type.ADDRESS, tx)
  })

  it('should store a bytes32', async () => {
    const id = utils.randomHex(32)
    const value = utils.randomHex(32)

    const tx = await storage.storeBytes32(id, value, { from: owner })
    expectEvent(tx, 'Bytes32Stored', { sender: owner, id, value })

    const stored = await storage.methods['getBytes32(string)'].call(id)
    expect(stored).to.equal(value)

    await checkMetadata(id, Type.BYTES32, tx)
  })

  it('should update a bytes32', async () => {
    const id = utils.randomHex(32)
    const value = utils.randomHex(32)
    const updated = utils.randomHex(32)

    await storage.storeBytes32(id, value, { from: owner })
    const tx = await storage.storeBytes32(id, updated, { from: owner })
    expectEvent(tx, 'Bytes32Stored', { sender: owner, id, value: updated })

    const stored = await storage.methods['getBytes32(string)'].call(id)
    expect(stored).to.equal(updated)

    await checkMetadata(id, Type.BYTES32, tx)
  })

  it('should revert if overwriting a value by an account other than the owner of the value', async () => {
    const id = utils.randomHex(32)

    await storage.storeString(id, 'foo', { from: owner })
    await expectRevert(
      storage.storeString(id, 'bar', { from: anyone }),
      'Not allowed',
    )
  })

  it('should revert if overwriting a value with same id but different type by an account other than the owner of the value', async () => {
    const id = utils.randomHex(32)

    await storage.storeString(id, 'foo', { from: owner })
    await expectRevert(
      storage.storeUint256(id, 123, { from: anyone }),
      'Not allowed',
    )
  })

  it('should store an object', async () => {
    const objectId = utils.randomHex(32)
    const keys = Array.from({ length: 5 }, () => utils.randomHex(32))

    const types = [
      Type.STRING,
      Type.UINT,
      Type.BYTES32,
      Type.ADDRESS,
      Type.BOOL,
    ]

    const values = [
      'asdfhasdluih', // string
      1249857423, // uint256
      utils.randomHex(32), // bytes32
      utils.toChecksumAddress(utils.randomHex(20)), // address
      true, // bool
    ]

    const encodedValues = [
      abiEncode('string', values[0]),
      abiEncode('uint256', values[1]),
      abiEncode('bytes32', values[2]),
      abiEncode('address', values[3]),
      abiEncode('bool', values[4]),
    ]

    const tx = await storage.storeObject(objectId, keys, encodedValues, types, {
      from: owner,
    })

    expectEvent(tx, 'ObjectStored', {
      sender: owner,
      id: objectId,
    })

    const valueString = await storage.methods['getString(string,bytes32)'].call(
      objectId,
      keys[0],
    )

    expect(valueString).to.equal(values[0])

    const typeString = await storage.methods['getType(string,bytes32)'].call(
      objectId,
      keys[0],
    )

    expect(typeString.toNumber()).to.equal(Type.STRING)

    const valueUint = await storage.methods['getUint256(string,bytes32)'].call(
      objectId,
      keys[1],
    )

    expect(valueUint.toString()).to.equal(values[1].toString())

    const typeUint = await storage.methods['getType(string,bytes32)'].call(
      objectId,
      keys[1],
    )

    expect(typeUint.toNumber()).to.equal(Type.UINT)

    const valueBytes32 = await storage.methods[
      'getBytes32(string,bytes32)'
    ].call(objectId, keys[2])

    expect(valueBytes32).to.equal(values[2])

    const typeBytes32 = await storage.methods['getType(string,bytes32)'].call(
      objectId,
      keys[2],
    )

    expect(typeBytes32.toNumber()).to.equal(Type.BYTES32)

    const valueAddress = await storage.methods[
      'getAddress(string,bytes32)'
    ].call(objectId, keys[3])

    expect(valueAddress).to.equal(values[3])

    const typeAddress = await storage.methods['getType(string,bytes32)'].call(
      objectId,
      keys[3],
    )

    expect(typeAddress.toNumber()).to.equal(Type.ADDRESS)

    const valueBool = await storage.methods['getBool(string,bytes32)'].call(
      objectId,
      keys[4],
    )

    expect(valueBool).to.equal(values[4])

    const typeBool = await storage.methods['getType(string,bytes32)'].call(
      objectId,
      keys[4],
    )

    expect(typeBool.toNumber()).to.equal(Type.BOOL)

    await checkMetadata(objectId, Type.OBJECT, tx)
  })

  it('should revert if trying to create the same object more than once', async () => {
    const objectId = utils.randomHex(32)
    const keys = Array.from({ length: 5 }, () => utils.randomHex(32))

    const types = [
      Type.STRING,
      Type.UINT,
      Type.BYTES32,
      Type.ADDRESS,
      Type.BOOL,
    ]

    const values = [
      'asdfhasdluih', // string
      1249857423, // uint256
      utils.randomHex(32), // bytes32
      utils.toChecksumAddress(utils.randomHex(20)), // address
      true, // bool
    ]

    const encodedValues = [
      abiEncode('string', values[0]),
      abiEncode('uint256', values[1]),
      abiEncode('bytes32', values[2]),
      abiEncode('address', values[3]),
      abiEncode('bool', values[4]),
    ]

    await storage.storeObject(objectId, keys, encodedValues, types, {
      from: owner,
    })

    await expectRevert(
      storage.storeObject(objectId, keys, encodedValues, types, {
        from: owner,
      }),
      'Object already exists',
    )
  })

  it('should update an object', async () => {
    const objectId = utils.randomHex(32)
    const keys = Array.from({ length: 5 }, () => utils.randomHex(32))

    const types = [
      Type.STRING,
      Type.UINT,
      Type.BYTES32,
      Type.ADDRESS,
      Type.BOOL,
    ]

    const values = [
      'asdfhasdluih', // string
      1249857423, // uint256
      utils.randomHex(32), // bytes32
      utils.toChecksumAddress(utils.randomHex(20)), // address
      true, // bool
    ]

    const encodedValues = [
      abiEncode('string', values[0]),
      abiEncode('uint256', values[1]),
      abiEncode('bytes32', values[2]),
      abiEncode('address', values[3]),
      abiEncode('bool', values[4]),
    ]

    await storage.storeObject(objectId, keys, encodedValues, types, {
      from: owner,
    })

    const tx = await storage.updateObject(
      objectId,
      [keys[0]],
      [abiEncode('string', 'foo')],
      {
        from: owner,
      },
    )

    expectEvent(tx, 'ObjectUpdated', {
      sender: owner,
      id: objectId,
    })

    const stored = await storage.methods['getString(string,bytes32)'].call(
      objectId,
      keys[0],
    )

    expect(stored).to.equal('foo')

    await checkMetadata(objectId, Type.OBJECT, tx)
  })

  it('should revert if no keys or no values are passed to the updateObject function', async () => {
    const objectId = utils.randomHex(32)

    await expectRevert(
      storage.updateObject(objectId, [], [], {
        from: owner,
      }),
      'At least one key and value must be updated',
    )
  })

  it("should revert if updating an object that doesn't exist", async () => {
    const objectId = utils.randomHex(32)

    await expectRevert(
      storage.updateObject(
        objectId,
        [utils.randomHex(32)],
        [abiEncode('string', 'foo')],
        {
          from: owner,
        },
      ),
      "Object doesn't exist",
    )
  })

  it('should revert if trying to store an OBJECT inside an object', async () => {
    const objectId = utils.randomHex(32)
    const key = utils.randomHex(32)
    const type = Type.OBJECT
    const value = 'asohjcow!@$)128}cas'

    await expectRevert(
      storage.storeObject(
        objectId,
        [key],
        [abiEncode('string', value)],
        [type],
        {
          from: owner,
        },
      ),
      'Invalid type',
    )
  })

  it('should revert if trying to store an UNSET inside an object', async () => {
    const objectId = utils.randomHex(32)
    const key = utils.randomHex(32)
    const type = Type.UNSET
    const value = 'asohjcow!@$)128}cas'

    await expectRevert(
      storage.storeObject(
        objectId,
        [key],
        [abiEncode('string', value)],
        [type],
        {
          from: owner,
        },
      ),
      'Invalid type',
    )
  })

  it('should revert if trying to create object with different amount of keys/values/types', async () => {
    const objectId = utils.randomHex(32)
    const key = utils.randomHex(32)
    const type = Type.UNSET
    const value = 'asohjcow!@$)128}cas'

    await expectRevert(
      storage.storeObject(
        objectId,
        [key],
        [abiEncode('string', value)],
        [type, type],
        {
          from: owner,
        },
      ),
      'Keys, values and types must be the same length',
    )

    await expectRevert(
      storage.storeObject(
        objectId,
        [key, key],
        [abiEncode('string', value)],
        [type, type],
        {
          from: owner,
        },
      ),
      'Keys, values and types must be the same length',
    )

    await expectRevert(
      storage.storeObject(
        objectId,
        [key],
        [abiEncode('string', value), abiEncode('string', value)],
        [type],
        {
          from: owner,
        },
      ),
      'Keys, values and types must be the same length',
    )
  })

  it('should revert if trying to update an object with different amount of keys/values', async () => {
    const objectId = utils.randomHex(32)
    const key = utils.randomHex(32)
    const type = Type.STRING
    const value = 'asohjcow!@$)128}cas'

    await storage.storeObject(
      objectId,
      [key],
      [abiEncode('string', value)],
      [type],
      {
        from: owner,
      },
    )

    await expectRevert(
      storage.updateObject(objectId, [key, key], [abiEncode('string', value)], {
        from: owner,
      }),
      'Keys and values must be the same length',
    )
  })

  it('should revert if storing metadata for a root value with an id used by an object', async () => {
    const objectId = utils.randomHex(32)
    const key = utils.randomHex(32)
    const type = Type.STRING
    const value = 'asohjcow!@$)128}cas'

    await storage.storeObject(
      objectId,
      [key],
      [abiEncode('string', value)],
      [type],
      {
        from: owner,
      },
    )

    await expectRevert(storage.storeString(objectId, 'bad'), 'Not allowed')
    await expectRevert(
      storage.storeString(objectId, 'bad', { from: owner }),
      'Changing the type of an existing value',
    )
  })

  it('should revert if storing metadata for object with id used by a root value', async () => {
    const objectId = utils.randomHex(32)
    const key = utils.randomHex(32)
    const type = Type.STRING
    const value = 'asohjcow!@$)128}cas'

    await storage.storeString(objectId, 'test', { from: owner })

    await expectRevert(
      storage.storeObject(
        objectId,
        [key],
        [abiEncode('string', value)],
        [type],
        {
          from: owner,
        },
      ),
      'Changing the type of an existing value',
    )
  })

  it('should revert if storing root value using existing id and different type', async () => {
    const id = utils.randomHex(32)

    await storage.storeString(id, 'test', { from: owner })
    await expectRevert(
      storage.storeBytes32(id, utils.randomHex(32), { from: owner }),
      'Changing the type of an existing value',
    )
  })

  it('should revert if storing object field with id used by a root value', async () => {
    const objectId = 'test-id'
    const key = web3.utils.padLeft('0x01', 64)
    const type = Type.STRING
    const value = 'asohjcow!@$)128}cas'

    const fieldId = web3.utils.hexToUtf8(
      `${web3.utils.toHex(objectId)}${key.slice(2)}`,
    )

    await storage.storeString(fieldId, 'test', { from: owner })

    await expectRevert(
      storage.storeObject(
        objectId,
        [key],
        [abiEncode('string', value)],
        [type],
        {
          from: owner,
        },
      ),
      'Field id already being used by a root value',
    )
  })

  it('should revert if storing root value with id used by object field', async () => {
    const objectId = 'test-id'
    const key = web3.utils.padLeft('0x01', 64)
    const type = Type.STRING
    const value = 'asohjcow!@$)128}cas'

    await storage.storeObject(
      objectId,
      [key],
      [abiEncode('string', value)],
      [type],
      {
        from: owner,
      },
    )

    const fieldId = web3.utils.hexToUtf8(
      `${web3.utils.toHex(objectId)}${key.slice(2)}`,
    )

    await expectRevert(
      storage.storeString(fieldId, 'test', { from: owner }),
      'Id already used for object field',
    )
  })
})
