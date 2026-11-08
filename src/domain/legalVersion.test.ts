import { describe, expect, it } from 'vitest'
import { checkLawResolution } from './legalVersion'
import { cloneCase, fixtureCase } from './test-helpers'

describe('phân giải phiên bản luật', () => {
  it('báo invalid khi law_resolution còn unresolved', () => {
    const caseFile = fixtureCase()
    const checks = checkLawResolution(caseFile)
    expect(checks).toHaveLength(1)
    expect(checks[0].status).toBe('invalid')
    expect(checks[0].messages.join(' ')).toContain('Chưa phân giải')
  })

  it('báo ok khi bundle/provision được duyệt và hiệu lực bao phủ ngày hành vi', () => {
    const caseFile = cloneCase(fixtureCase())
    const event = caseFile.temporal_context.conduct_events[0]
    event.law_resolution.status = 'resolved'
    event.law_resolution.bundle_id = 'law_bundle_v1'
    event.law_resolution.review_id = 'review_law_01'
    const provision = caseFile.law_bundles[0].provisions[0]
    provision.review_status = 'approved'
    provision.effective_from = '2024-01-01'
    provision.effective_to = null

    const checks = checkLawResolution(caseFile)
    expect(checks[0].status).toBe('ok')
    expect(checks[0].messages).toEqual([])
  })

  it('báo crosses khi khoảng ngày hành vi nằm ngoài hiệu lực provision', () => {
    const caseFile = cloneCase(fixtureCase())
    const event = caseFile.temporal_context.conduct_events[0]
    event.law_resolution.status = 'resolved'
    event.law_resolution.bundle_id = 'law_bundle_v1'
    event.law_resolution.review_id = 'review_law_01'
    const provision = caseFile.law_bundles[0].provisions[0]
    provision.review_status = 'approved'
    provision.effective_from = '2024-05-01'
    provision.effective_to = '2024-05-15'

    const checks = checkLawResolution(caseFile)
    expect(checks[0].status).toBe('crosses')
  })

  it('báo incomplete khi thiếu ngày hiệu lực để đối chiếu', () => {
    const caseFile = cloneCase(fixtureCase())
    const event = caseFile.temporal_context.conduct_events[0]
    event.law_resolution.status = 'resolved'
    event.law_resolution.bundle_id = 'law_bundle_v1'
    event.law_resolution.review_id = 'review_law_01'
    const provision = caseFile.law_bundles[0].provisions[0]
    provision.review_status = 'approved'
    provision.effective_from = null
    provision.effective_to = null

    const checks = checkLawResolution(caseFile)
    expect(checks[0].status).toBe('incomplete')
  })

  it('báo ok khi crosses_version có hai segment phủ kín ngày hành vi', () => {
    const caseFile = cloneCase(fixtureCase())
    const event = caseFile.temporal_context.conduct_events[0]
    const provision = caseFile.law_bundles[0].provisions[0]
    provision.review_status = 'approved'
    provision.effective_from = '2024-01-01'
    provision.effective_to = null
    caseFile.law_bundles.push({
      id: 'law_bundle_v2',
      version: 'v2',
      jurisdiction: 'VN',
      provisions: [
        {
          id: 'provision_v2_01',
          citation: 'Điều kiểm thử v2',
          effective_from: '2024-06-01',
          effective_to: null,
          source_ref: 'test',
          review_status: 'approved',
        },
      ],
    })
    event.law_resolution = {
      status: 'crosses_version',
      bundle_id: null,
      review_id: 'review_cross_01',
      segments: [
        { start_date: '2024-05-01', end_date: '2024-05-31', bundle_id: 'law_bundle_v1' },
        { start_date: '2024-06-01', end_date: '2024-06-30', bundle_id: 'law_bundle_v2' },
      ],
    }

    const checks = checkLawResolution(caseFile)
    expect(checks[0].status).toBe('ok')
    expect(checks[0].segments).toHaveLength(2)
  })

  it('báo invalid khi crosses_version chỉ có một segment', () => {
    const caseFile = cloneCase(fixtureCase())
    const event = caseFile.temporal_context.conduct_events[0]
    event.law_resolution = {
      status: 'crosses_version',
      bundle_id: null,
      review_id: null,
      segments: [
        { start_date: '2024-05-01', end_date: '2024-05-31', bundle_id: 'law_bundle_v1' },
      ],
    }

    const checks = checkLawResolution(caseFile)
    expect(checks[0].status).toBe('invalid')
    expect(checks[0].messages.join(' ')).toContain('ít nhất hai đoạn hiệu lực')
  })

  it('báo crosses khi các segment có khoảng trống không phủ ngày hành vi', () => {
    const caseFile = cloneCase(fixtureCase())
    const event = caseFile.temporal_context.conduct_events[0]
    event.law_resolution = {
      status: 'crosses_version',
      bundle_id: null,
      review_id: null,
      segments: [
        { start_date: '2024-05-01', end_date: '2024-05-30', bundle_id: 'law_bundle_v1' },
        { start_date: '2024-06-01', end_date: '2024-06-30', bundle_id: 'law_bundle_v1' },
      ],
    }

    const checks = checkLawResolution(caseFile)
    expect(checks[0].status).toBe('crosses')
    expect(checks[0].messages.join(' ')).toContain('khoảng trống')
  })

  it('báo invalid khi hai segment chồng lấn', () => {
    const caseFile = cloneCase(fixtureCase())
    const event = caseFile.temporal_context.conduct_events[0]
    event.law_resolution = {
      status: 'crosses_version',
      bundle_id: null,
      review_id: null,
      segments: [
        { start_date: '2024-05-01', end_date: '2024-05-31', bundle_id: 'law_bundle_v1' },
        { start_date: '2024-05-31', end_date: '2024-06-30', bundle_id: 'law_bundle_v1' },
      ],
    }

    const checks = checkLawResolution(caseFile)
    expect(checks[0].status).toBe('invalid')
    expect(checks[0].messages.join(' ')).toContain('chồng lấn')
  })

  it('báo invalid khi resolved nhưng vẫn khai báo segments', () => {
    const caseFile = cloneCase(fixtureCase())
    const event = caseFile.temporal_context.conduct_events[0]
    event.law_resolution = {
      status: 'resolved',
      bundle_id: 'law_bundle_v1',
      review_id: 'review_law_01',
      segments: [
        { start_date: '2024-05-01', end_date: '2024-05-31', bundle_id: 'law_bundle_v1' },
      ],
    }

    const checks = checkLawResolution(caseFile)
    expect(checks[0].status).toBe('invalid')
    expect(checks[0].messages.join(' ')).toContain('đã phân giải')
  })

  it('báo incomplete khi provision chưa được duyệt', () => {
    const caseFile = cloneCase(fixtureCase())
    const event = caseFile.temporal_context.conduct_events[0]
    event.law_resolution.status = 'resolved'
    event.law_resolution.bundle_id = 'law_bundle_v1'
    event.law_resolution.review_id = 'review_law_01'
    const provision = caseFile.law_bundles[0].provisions[0]
    provision.review_status = 'in_review'
    provision.effective_from = '2024-01-01'
    provision.effective_to = null

    const checks = checkLawResolution(caseFile)
    expect(checks[0].status).toBe('incomplete')
    expect(checks[0].messages.join(' ')).toContain('chưa được duyệt')
  })
})
