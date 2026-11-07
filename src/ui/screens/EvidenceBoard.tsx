import { useState } from 'react'
import { Badge, Button, Callout, Card, HintPanel, ProgressBar, SectionHeading } from '../components'
import { useGame } from '../GameContext'
import { answerLabel } from '../../domain/lookups'
import { getValues } from '../../domain/answers'
import { evidenceState, isEvidenceDiscovered } from '../../domain/evidence'
import { EvidenceAssessmentFields, EvidenceDetail } from '../evidence-detail'
import { NoteField } from '../components'

export function EvidenceBoardScreen() {
  const { caseFile, session, dispatch, navigate, readOnly, lookups } = useGame()
  const [issueFilter, setIssueFilter] = useState<string>('all')

  const evidenceFields = caseFile.answer_fields.filter((field) => field.scope === 'evidence')
  const totalTargets = evidenceFields.reduce((sum, field) => sum + field.target_ids.length, 0)
  const answeredTargets = evidenceFields.reduce((sum, field) => {
    return (
      sum +
      field.target_ids.filter((targetId) =>
        getValues(session.answers, field.id, targetId).length > 0,
      ).length
    )
  }, 0)

  const filtered = caseFile.evidence.filter((evidence) => {
    if (issueFilter === 'all') return true
    return (evidence.issue_ids ?? []).includes(issueFilter)
  })

  return (
    <div className="screen">
      <SectionHeading
        eyebrow="Giai đoạn 3 · Bảng chứng cứ"
        title="Đánh giá chứng cứ theo bốn lớp"
        description={
          <p>
            Với mỗi tài liệu trọng tâm, đánh giá riêng: nguồn và tính toàn vẹn, quy trình thu thập,
            độ tin cậy, và mức liên quan tới mệnh đề. Không gộp thành một nhãn “đáng tin/không đáng
            tin”.
          </p>
        }
        actions={
          <Button
            variant="secondary"
            onClick={() => navigate(`case/${caseFile.metadata.id}/investigation`)}
          >
            ← Quay lại khám phá
          </Button>
        }
      />

      <div className="two-column two-column--aside">
        <div>
          <div className="filter-bar" role="group" aria-label="Lọc chứng cứ theo vấn đề">
            <button
              type="button"
              className={`filter-chip ${issueFilter === 'all' ? 'filter-chip--active' : ''}`}
              onClick={() => setIssueFilter('all')}
            >
              Tất cả
            </button>
            {(caseFile.issues ?? []).map((issue) => (
              <button
                key={issue.id}
                type="button"
                className={`filter-chip ${issueFilter === issue.id ? 'filter-chip--active' : ''}`}
                onClick={() => setIssueFilter(issue.id)}
              >
                {String(issue.label ?? issue.id)}
              </button>
            ))}
          </div>

          <div className="stack">
            {filtered.map((evidence) => {
              const state = evidenceState(evidence, session)
              const discovered = isEvidenceDiscovered(state)
              const fields = caseFile.answer_fields.filter(
                (field) => field.scope === 'evidence' && field.target_ids.includes(evidence.id),
              )
              const missing = fields.flatMap((field) =>
                field.target_ids
                  .filter((targetId) => getValues(session.answers, field.id, targetId).length === 0)
                  .map((targetId) => ({ field, targetId })),
              )
              return (
                <Card key={evidence.id} className="evidence-card" as="article">
                  <div id={`evidence-${evidence.id}`} className="anchor-target" />
                  <div className="evidence-card__head">
                    <div>
                      <div className="chip-row">
                        <Badge tone={fields.length > 0 ? 'warn' : 'neutral'}>
                          {fields.length > 0 ? 'Có mục đánh giá' : 'Không chấm điểm'}
                        </Badge>
                        {(evidence.issue_ids ?? []).map((issueId) => (
                          <span key={issueId} className="chip">
                            {String(lookups.issues.get(issueId)?.label ?? issueId)}
                          </span>
                        ))}
                      </div>
                      <h3>{evidence.title ?? evidence.id}</h3>
                    </div>
                    {fields.length > 0 && (
                      <span className="muted small">
                        {fields.reduce((sum, field) => sum + field.target_ids.length, 0) - missing.length}/
                        {fields.reduce((sum, field) => sum + field.target_ids.length, 0)} mục
                      </span>
                    )}
                  </div>

                  {!discovered ? (
                    <Callout tone="info" title="Chưa mở tài liệu">
                      <p>Bạn cần mở tài liệu trong khu khám phá trước khi đánh giá.</p>
                      <Button
                        variant="secondary"
                        onClick={() => navigate(`case/${caseFile.metadata.id}/investigation`)}
                      >
                        Tới khu khám phá
                      </Button>
                    </Callout>
                  ) : (
                    <>
                      <details className="disclosure">
                        <summary>Xem nội dung, nguồn và giới hạn</summary>
                        <EvidenceDetail evidence={evidence} />
                      </details>

                      {fields.length > 0 ? (
                        <EvidenceAssessmentFields evidenceId={evidence.id} />
                      ) : (
                        <p className="muted small">
                          Tài liệu này không có mục đánh giá bắt buộc. Nội dung vẫn được dùng cho
                          phần giả thuyết và phân tích.
                        </p>
                      )}

                      <NoteField
                        label="Ghi chú cá nhân (không chấm điểm)"
                        hint="Chỉ lưu trên thiết bị này, không gửi đi và không được đánh giá."
                        value={session.notes[`evidence:${evidence.id}`] ?? ''}
                        readOnly={readOnly}
                        onChange={(value) =>
                          dispatch({ type: 'SET_NOTE', key: `evidence:${evidence.id}`, value })
                        }
                      />
                    </>
                  )}
                </Card>
              )
            })}
          </div>
        </div>

        <aside className="stack">
          <Card>
            <h3>Hoàn thành đánh giá</h3>
            <ProgressBar
              value={answeredTargets}
              total={totalTargets}
              label="Mục đánh giá chứng cứ đã trả lời"
            />
            <p className="muted small">
              Bạn có thể nộp dù còn thiếu, nhưng phản hồi sẽ chỉ rõ phần chưa đánh giá.
            </p>
          </Card>

          <Card>
            <h3>Bốn lớp đánh giá</h3>
            <ol className="tight-list">
              <li>Nguồn và tính toàn vẹn.</li>
              <li>Quy trình thu thập và khiếm khuyết thủ tục.</li>
              <li>Xác thực và độ tin cậy.</li>
              <li>Liên quan và sức hỗ trợ cho mệnh đề.</li>
            </ol>
            <p className="muted small">
              Đánh giá “có vấn đề thủ tục” không đồng nghĩa chứng cứ tự động bị loại bỏ. Hệ quả do
              reviewer xác định.
            </p>
          </Card>

          <Card>
            <h3>Tóm tắt câu trả lời</h3>
            <ul className="summary-list">
              {caseFile.evidence
                .filter((evidence) => isEvidenceDiscovered(evidenceState(evidence, session)))
                .filter((evidence) =>
                  caseFile.answer_fields.some(
                    (field) =>
                      field.scope === 'evidence' &&
                      field.target_ids.includes(evidence.id) &&
                      getValues(session.answers, field.id, evidence.id).length > 0,
                  ),
                )
                .map((evidence) => (
                  <li key={evidence.id}>
                    <strong>{evidence.title}</strong>
                    {caseFile.answer_fields
                      .filter(
                        (field) =>
                          field.scope === 'evidence' && field.target_ids.includes(evidence.id),
                      )
                      .map((field) => {
                        const values = getValues(session.answers, field.id, evidence.id)
                        if (values.length === 0) return null
                        return (
                          <span key={field.id} className="summary-line">
                            {answerLabel(lookups, field.id, values)}
                          </span>
                        )
                      })}
                  </li>
                ))}
            </ul>
            {(caseFile.issues ?? []).some((issue) => issue.critical) && (
              <p className="muted small">
                Các vấn đề trọng tâm được đánh dấu “Trọng tâm”. Bạn sẽ nhận cảnh báo trước khi nộp
                nếu còn thiếu.
              </p>
            )}
          </Card>

          <HintPanel />
        </aside>
      </div>
    </div>
  )
}
