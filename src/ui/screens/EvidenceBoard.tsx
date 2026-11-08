import { useState } from 'react'
import { Badge, Button, Card, HintPanel, ProgressBar, SectionHeading } from '../components'
import { useGame } from '../GameContext'
import { answerLabel } from '../../domain/lookups'
import { getValues } from '../../domain/answers'
import {
  evidenceProgress,
  evidenceState,
  isEvidenceDiscovered,
  lockedReason,
} from '../../domain/evidence'
import { EvidenceAssessmentFields, EvidenceDetail } from '../evidence-detail'
import { NoteField } from '../components'
import { EVIDENCE_STATE_LABELS, EVIDENCE_TYPE_LABELS } from '../labels'

export function EvidenceBoardScreen() {
  const { caseFile, session, dispatch, navigate, readOnly, lookups } = useGame()
  const [issueFilter, setIssueFilter] = useState<string>('all')

  const progress = evidenceProgress(session, caseFile.evidence)

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
        eyebrow="Giai đoạn 2 · Khám phá & Đánh giá chứng cứ"
        title="Khám phá hồ sơ & Đánh giá chứng cứ"
        description={
          <p>
            Mở tài liệu, đọc nguồn và thẩm định chứng cứ theo bốn lớp riêng biệt: Nguồn &amp; tính toàn
            vẹn, quy trình thu thập, độ tin cậy, và mức liên quan.
          </p>
        }
        actions={
          <Button
            variant="secondary"
            onClick={() => navigate(`case/${caseFile.metadata.id}/brief`)}
          >
            ← Tóm tắt hồ sơ
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
              const rule = evidence.discovery ?? { kind: 'always' as const }
              const isCheck = rule.kind === 'check'
              const locked = lockedReason(
                evidence,
                session,
                (id) => lookups.evidence.get(id)?.title ?? id,
              )
              const fields = caseFile.answer_fields.filter(
                (field) => field.scope === 'evidence' && field.target_ids.includes(evidence.id),
              )
              const missing = fields.flatMap((field) =>
                field.target_ids
                  .filter((targetId) => getValues(session.answers, field.id, targetId).length === 0)
                  .map((targetId) => ({ field, targetId })),
              )
              return (
                <Card
                  key={evidence.id}
                  className={`evidence-card evidence-card--${state}`}
                  as="article"
                >
                  <div id={`evidence-${evidence.id}`} className="anchor-target" />
                  <div className="evidence-card__head">
                    <div>
                      <div className="chip-row">
                        <Badge tone="neutral">
                          {EVIDENCE_TYPE_LABELS[evidence.type ?? ''] ?? 'Tài liệu'}
                        </Badge>
                        <Badge
                          tone={
                            state === 'viewed' || state === 'requested'
                              ? 'success'
                              : state === 'available'
                                ? 'accent'
                                : 'neutral'
                          }
                        >
                          {EVIDENCE_STATE_LABELS[state]}
                        </Badge>
                        <Badge tone={fields.length > 0 ? 'warn' : 'neutral'}>
                          {fields.length > 0 ? 'Trọng tâm chấm điểm' : 'Không chấm điểm'}
                        </Badge>
                        {(evidence.issue_ids ?? []).map((issueId) => (
                          <span key={issueId} className="chip">
                            {String(lookups.issues.get(issueId)?.label ?? issueId)}
                          </span>
                        ))}
                      </div>
                      <h3>{evidence.title ?? evidence.id}</h3>
                      <p className="muted">{evidence.summary}</p>
                    </div>
                    {fields.length > 0 && discovered && (
                      <span className="muted small">
                        {fields.reduce((sum, field) => sum + field.target_ids.length, 0) - missing.length}/
                        {fields.reduce((sum, field) => sum + field.target_ids.length, 0)} mục
                      </span>
                    )}
                  </div>

                  {!discovered ? (
                    <div className="evidence-card__locked">
                      <p className="muted">
                        {locked ?? 'Tài liệu chưa được mở trong phiên này.'}
                      </p>
                      {state === 'available' && (
                        <Button
                          variant="primary"
                          disabled={readOnly}
                          onClick={() =>
                            dispatch(
                              isCheck
                                ? { type: 'REQUEST_CHECK', evidenceId: evidence.id }
                                : { type: 'VIEW_EVIDENCE', evidenceId: evidence.id },
                            )
                          }
                        >
                          {isCheck && rule.kind === 'check' ? rule.label : 'Đọc tài liệu'}
                        </Button>
                      )}
                    </div>
                  ) : (
                    <>
                      <EvidenceDetail evidence={evidence} />

                      {fields.length > 0 ? (
                        <div className="evidence-assessment-section">
                          <h4 style={{ margin: '1.25rem 0 0.5rem', fontSize: '1rem', color: 'var(--text-strong)' }}>
                            Thẩm định chứng cứ theo bốn lớp
                          </h4>
                          <EvidenceAssessmentFields evidenceId={evidence.id} />
                        </div>
                      ) : (
                        <p className="muted small" style={{ marginTop: '0.75rem' }}>
                          Tài liệu này không có mục đánh giá bắt buộc. Nội dung dùng làm căn cứ cho
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
            <h3>Tiến độ khám phá</h3>
            <ProgressBar
              value={progress.discovered}
              total={progress.total}
              label="Tài liệu đã mở"
            />
            <p className="muted small">
              {progress.total - progress.discovered > 0
                ? `Còn ${progress.total - progress.discovered} tài liệu có thể mở hoặc trích xuất.`
                : 'Bạn đã mở toàn bộ tài liệu của hồ sơ.'}
            </p>
          </Card>

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
              người rà soát xác định.
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

      <div className="screen-actions">
        <Button
          variant="secondary"
          onClick={() => navigate(`case/${caseFile.metadata.id}/brief`)}
        >
          ← Tóm tắt hồ sơ
        </Button>
        <Button
          variant="primary"
          onClick={() => navigate(`case/${caseFile.metadata.id}/hypotheses`)}
        >
          Sang phần Giả thuyết →
        </Button>
      </div>
    </div>
  )
}
