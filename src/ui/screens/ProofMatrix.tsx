import {
  Badge,
  Button,
  Callout,
  Card,
  NoteField,
  SectionHeading,
  SingleChoice,
} from '../components'
import { useGame } from '../GameContext'
import { getSingle } from '../../domain/answers'
import { FIELD_HINTS, RELATION_LABELS, fieldLabel } from '../labels'

export function ProofMatrixScreen() {
  const { caseFile, session, dispatch, readOnly, lookups, navigate } = useGame()
  const field = caseFile.answer_fields.find((item) => item.scope === 'proof_row')

  return (
    <div className="screen">
      <SectionHeading
        eyebrow="Giai đoạn 4 · Ma trận chứng minh"
        title="Đối chiếu mệnh đề với từng nguồn"
        description={
          <p>
            Mỗi hàng là một mệnh đề cần chứng minh. Xem nguồn nào ủng hộ, nguồn nào phản bác và giới
            hạn của từng liên kết trước khi đánh giá.
          </p>
        }
      />

      <div className="stack">
        {caseFile.proof_matrix.map((row) => (
          <Card key={row.id} className="proof-card">
            <div className="proof-card__head">
              <Badge tone="accent">Mệnh đề</Badge>
              <h3>{row.proposition}</h3>
            </div>

            <div className="chip-row">
              <span className="muted small">Dấu hiệu liên quan:</span>
              {row.charge_element_ids.map((elementId) => (
                <span key={elementId} className="chip">
                  {lookups.elements.get(elementId)?.label ?? elementId}
                </span>
              ))}
            </div>

            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th scope="col">Nguồn</th>
                    <th scope="col">Vai trò</th>
                    <th scope="col">Giới hạn</th>
                  </tr>
                </thead>
                <tbody>
                  {row.evidence_links.map((link) => (
                    <tr key={`${row.id}:${link.evidence_id}`}>
                      <th scope="row">
                        {lookups.evidence.get(link.evidence_id)?.title ?? link.evidence_id}
                      </th>
                      <td>
                        <span className={`tag tag--${link.relation}`}>
                          {RELATION_LABELS[link.relation] ?? link.relation}
                        </span>
                      </td>
                      <td>
                        {(link.limitation_ids ?? []).length === 0 ? (
                          <span className="muted">—</span>
                        ) : (
                          <ul className="tight-list small">
                            {(link.limitation_ids ?? []).map((limitationId) => (
                              <li key={limitationId}>
                                {lookups.limitations.get(limitationId)?.description ??
                                  limitationId}
                              </li>
                            ))}
                          </ul>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {field && (
              <SingleChoice
                name={`${field.id}:${row.id}`}
                legend={fieldLabel(field.id)}
                hint={FIELD_HINTS[field.id]}
                options={field.options}
                value={getSingle(session.answers, field.id, row.id)}
                allowClear
                readOnly={readOnly}
                onChange={(value) =>
                  dispatch({ type: 'SET_ANSWER', fieldId: field.id, targetId: row.id, value })
                }
              />
            )}

            <NoteField
              label="Ghi chú suy nghĩ (không chấm điểm)"
              value={session.notes[`proof:${row.id}`] ?? ''}
              readOnly={readOnly}
              rows={2}
              onChange={(value) =>
                dispatch({ type: 'SET_NOTE', key: `proof:${row.id}`, value })
              }
            />
          </Card>
        ))}
      </div>

      <Callout tone="info" title="Cách đọc ma trận">
        <p>
          “Có dữ kiện hỗ trợ” không đồng nghĩa “đã chứng minh”. Một hàng có nhiều nguồn nhưng các
          nguồn phụ thuộc nhau vẫn có thể chỉ là một dòng suy luận. Hãy ghi rõ giới hạn khi kết luận.
        </p>
      </Callout>

      <div className="screen-actions">
        <Button
          variant="secondary"
          onClick={() => navigate(`case/${caseFile.metadata.id}/hypotheses`)}
        >
          ← Quay lại giả thuyết
        </Button>
        <Button
          variant="primary"
          onClick={() => navigate(`case/${caseFile.metadata.id}/analysis`)}
        >
          Sang phân tích pháp lý
        </Button>
      </div>
    </div>
  )
}
