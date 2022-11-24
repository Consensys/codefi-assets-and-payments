import { craftRequestWithAuthHeaders } from '@consensys/auth'
import {
  entityIdMock,
  entityIdMock2,
  permissionMock,
  subjectMock,
  tenantIdMock,
  tenantIdMock2,
} from '../../test/mocks'
import {
  buildMetadataQuery,
  checkEntityMatchesRequest,
  checkTenantMatchesRequest,
} from './controller'

describe('Controller Utils', () => {
  describe('checkTenantMatchesRequest', () => {
    it('does not throw if requested tenant id matches token and permission missing', () => {
      const request = craftRequestWithAuthHeaders(
        tenantIdMock,
        undefined,
        subjectMock,
        [],
      )

      checkTenantMatchesRequest(request, tenantIdMock, permissionMock)
    })

    it('does not throw if requested tenant id does not match token and permission available', () => {
      const request = craftRequestWithAuthHeaders(
        tenantIdMock,
        undefined,
        subjectMock,
        [permissionMock],
      )

      checkTenantMatchesRequest(request, tenantIdMock2, permissionMock)
    })

    it.each([
      ['read_all:tenant', 'retrieve', 'retrieved'],
      ['update_all:tenant', 'update', 'updated'],
      ['delete_all:tenant', 'delete', 'deleted'],
    ])(
      'throws if requested tenant id does not match token and %s permission missing',
      (permission, action, actionPastTense) => {
        const request = craftRequestWithAuthHeaders(
          tenantIdMock,
          undefined,
          subjectMock,
          [],
        )

        expect(() =>
          checkTenantMatchesRequest(request, tenantIdMock2, permission),
        ).toThrowError(
          `User without '${permission}' permission can only ${action} his own tenant (tenantId1), tenant with id tenantId2 cannot be ${actionPastTense}`,
        )
      },
    )
  })

  describe('checkEntityMatchesRequest', () => {
    it('does not throw if requested entity id matches token and permission missing', () => {
      const request = craftRequestWithAuthHeaders(
        tenantIdMock,
        entityIdMock,
        subjectMock,
        [],
      )

      const result = checkEntityMatchesRequest(
        request,
        entityIdMock,
        permissionMock,
      )

      expect(result.tenantId).toEqual(tenantIdMock)
      expect(result.decodedToken).toEqual(expect.any(Object))
    })

    it('does not throw if requested entity id does not match token and permission available', () => {
      const request = craftRequestWithAuthHeaders(
        tenantIdMock,
        entityIdMock,
        subjectMock,
        [permissionMock],
      )

      const result = checkEntityMatchesRequest(
        request,
        entityIdMock2,
        permissionMock,
      )

      expect(result.tenantId).toEqual(tenantIdMock)
      expect(result.decodedToken).toEqual(expect.any(Object))
    })

    it.each([
      ['read_all:entity', 'retrieve', 'retrieved'],
      ['update_all:entity', 'update', 'updated'],
      ['delete_all:entity', 'delete', 'deleted'],
    ])(
      'throws if requested entity id does not match token and %s permission missing',
      (permission, action, actionPastTense) => {
        const request = craftRequestWithAuthHeaders(
          tenantIdMock,
          entityIdMock,
          subjectMock,
          [],
        )

        expect(() =>
          checkEntityMatchesRequest(request, entityIdMock2, permission),
        ).toThrowError(
          `User without '${permission}' permission can only ${action} his own entity (entityId1), entity with id entityId2 cannot be ${actionPastTense}`,
        )
      },
    )
  })

  describe('buildMetadataQuery', () => {
    it.each([
      [undefined, undefined, ''],
      [{}, undefined, 'metadata @> :metadata'],
      [{}, {}, 'metadata @> :metadata'],
      [{ value1: '1', value2: '2' }, undefined, 'metadata @> :metadata'],
      [undefined, { value: ['1', '2'] }, "metadata ->> 'value' IN (:...value)"],
      [
        undefined,
        { value1: ['1', '2'], value2: ['3', '4'] },
        "metadata ->> 'value1' IN (:...value1) AND metadata ->> 'value2' IN (:...value2)",
      ],
      [
        {},
        { value: ['1', '2'] },
        "metadata @> :metadata AND metadata ->> 'value' IN (:...value)",
      ],
    ])(
      'adds metadata conditions to one line',
      (metadata, metadataWithOptions, expected) => {
        const alias = 'metadata'

        const resultQuery = buildMetadataQuery(
          alias,
          metadata,
          metadataWithOptions,
        )

        expect(resultQuery).toEqual(expected)
      },
    )
  })
})
