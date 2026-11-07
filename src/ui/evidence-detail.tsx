import type { EvidenceRecord } from '../domain/types'
import { useGame } from './GameContext'
import { getSingle } from '../domain/answers'
import { SingleChoice } from './components'
import { FIELD_HINTS, fieldLabel } from './labels'

export function EvidenceAssessmentFields({ evidenceId }: { evidenceId: string }) {
  const { caseFile, session, dispatch, readOnly } = useGame()
  const fields = caseFile.answer_fields.filter(
    (field) => field.scope === 'evidence' && field.target_ids.includes(evidenceId),
  )

  if (fields.length === 0) {
    return (
      <p className="muted small">
        Tài liệu này không có mục đánh giá bắt buộc trong cấu hình case. Bạn vẫn có thể đọc và dùng
        nội dung cho các phần sau.
      </p>
    )
  }

  return (
    <div className="assessment-grid">
      {fields.map((field) => (
        <SingleChoice
          key={field.id}
          name={`${field.id}:${evidenceId}`}
          legend={fieldLabel(field.id)}
          hint={FIELD_HINTS[field.id]}
          options={field.options}
          value={getSingle(session.answers, field.id, evidenceId)}
          allowClear
          readOnly={readOnly}
          compact
          onChange={(value) =>
            dispatch({ type: 'SET_ANSWER', fieldId: field.id, targetId: evidenceId, value })
          }
        />
      ))}
    </div>
  )
}

export function EvidenceDetail({
  evidence,
  showContent = true,
}: {
  evidence: EvidenceRecord
  showContent?: boolean
}) {
  const { lookups } = useGame()
  const defects = (evidence.procedural_defect_ids ?? [])
    .map((id) => lookups.defects.get(id))
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
  const limitations = (evidence.limitation_ids ?? [])
    .map((id) => lookups.limitations.get(id))
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
  const issues = (evidence.issue_ids ?? [])
    .map((id) => lookups.issues.get(id))
    .filter((item): item is NonNullable<typeof item> => Boolean(item))

  return (
    <div className="evidence-detail">
      {showContent && evidence.content && (
        <div className="evidence-detail__content">
          {evidence.content.split('\n\n').map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
      )}

      <dl className="meta-list">
        <div>
          <dt>Nguồn</dt>
          <dd>{evidence.source?.origin ?? 'Chưa ghi nguồn'}</dd>
        </div>
        {(evidence.source?.integrity_notes ?? []).length > 0 && (
          <div>
            <dt>Ghi chú toàn vẹn</dt>
            <dd>
              <ul className="tight-list">
                {(evidence.source?.integrity_notes ?? []).map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            </dd>
          </div>
        )}
        {defects.length > 0 && (
          <div>
            <dt>Vấn đề thủ tục cần nhận diện</dt>
            <dd>
              <ul className="tight-list">
                {defects.map((defect) => (
                  <li key={defect.id}>
                    <strong>{String(defect.step ?? defect.id)}:</strong>{' '}
                    {String(defect.observed_issue ?? '')}{' '}
                    {(defect.legal_basis_ids ?? []).map((basisId) => (
                      <span key={basisId} className="muted small">
                        [{lookups.provisions.get(basisId)?.citation ?? basisId}]
                      </span>
                    ))}
                  </li>
                ))}
              </ul>
            </dd>
          </div>
        )}
        {limitations.length > 0 && (
          <div>
            <dt>Giới hạn suy luận</dt>
            <dd>
              <ul className="tight-list">
                {limitations.map((limitation) => (
                  <li key={limitation.id}>{String(limitation.description ?? '')}</li>
                ))}
              </ul>
            </dd>
          </div>
        )}
        {issues.length > 0 && (
          <div>
            <dt>Vấn đề liên quan</dt>
            <dd className="chip-row">
              {issues.map((issue) => (
                <span key={issue.id} className="chip">
                  {String(issue.label ?? issue.id)}
                </span>
              ))}
            </dd>
          </div>
        )}
      </dl>
    </div>
  )
}
