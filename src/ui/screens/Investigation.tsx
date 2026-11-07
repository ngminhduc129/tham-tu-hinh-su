import { Badge, Button, Callout, Card, HintPanel, ProgressBar, SectionHeading } from '../components'
import { useGame } from '../GameContext'
import { evidenceProgress, evidenceState, isEvidenceDiscovered, lockedReason } from '../../domain/evidence'
import { EvidenceDetail } from '../evidence-detail'
import { EVIDENCE_STATE_LABELS, EVIDENCE_TYPE_LABELS } from '../labels'

export function InvestigationScreen() {
  const { caseFile, session, dispatch, navigate, readOnly } = useGame()
  const progress = evidenceProgress(session, caseFile.evidence)
  const scoredEvidenceIds = new Set(
    caseFile.answer_fields
      .filter((field) => field.scope === 'evidence')
      .flatMap((field) => field.target_ids),
  )

  return (
    <div className="screen">
      <SectionHeading
        eyebrow="Giai đoạn 2 · Khám phá"
        title="Khu khám phá tài liệu"
        description={
          <p>
            Mở tài liệu, đọc nguồn và giới hạn của nó. Một số tài liệu cần bạn yêu cầu trích xuất
            trước khi xem. Bạn không bắt buộc phải mở toàn bộ hồ sơ.
          </p>
        }
        actions={
          <Button variant="secondary" onClick={() => navigate(`case/${caseFile.metadata.id}/evidence`)}>
            Sang bảng chứng cứ
          </Button>
        }
      />

      <div className="two-column two-column--aside">
        <div className="stack">
          {caseFile.evidence.map((evidence) => {
            const state = evidenceState(evidence, session)
            const discovered = isEvidenceDiscovered(state)
            const rule = evidence.discovery ?? { kind: 'always' as const }
            const locked = lockedReason(evidence, session)
            const isScored = scoredEvidenceIds.has(evidence.id)
            const isCheck = rule.kind === 'check'
            return (
              <Card key={evidence.id} className={`evidence-card evidence-card--${state}`}>
                <div className="evidence-card__head">
                  <div>
                    <div className="chip-row">
                      <Badge tone="neutral">{EVIDENCE_TYPE_LABELS[evidence.type ?? ''] ?? 'Tài liệu'}</Badge>
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
                      {isScored && <Badge tone="warn">Trọng tâm chấm điểm</Badge>}
                    </div>
                    <h3>{evidence.title ?? evidence.id}</h3>
                    <p className="muted">{evidence.summary}</p>
                  </div>
                </div>

                {discovered ? (
                  <>
                    <EvidenceDetail evidence={evidence} />
                    <div className="evidence-card__actions">
                      {isScored ? (
                        <Button
                          variant="secondary"
                          onClick={() => navigate(`case/${caseFile.metadata.id}/evidence#${evidence.id}`)}
                        >
                          Đánh giá chứng cứ
                        </Button>
                      ) : (
                        <p className="muted small">
                          Tài liệu này không có mục đánh giá bắt buộc; dùng nội dung cho phần giả
                          thuyết và phân tích.
                        </p>
                      )}
                    </div>
                  </>
                ) : (
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
                )}
              </Card>
            )
          })}
        </div>

        <aside className="stack">
          <Card>
            <h3>Tiến độ khám phá</h3>
            <ProgressBar
              value={progress.discovered}
              total={progress.total}
              label="Tài liệu đã mở hoặc yêu cầu kiểm tra"
            />
            <p className="muted small">
              Tiến độ chỉ để tham khảo. Không yêu cầu mở toàn bộ tài liệu trước khi nộp.
            </p>
            <Button
              variant="secondary"
              className="full-width"
              onClick={() => navigate(`case/${caseFile.metadata.id}/evidence`)}
            >
              Đi tới bảng chứng cứ
            </Button>
          </Card>

          <Card>
            <h3>Vấn đề trọng tâm</h3>
            <ul className="issue-list">
              {(caseFile.issues ?? []).map((issue) => (
                <li key={issue.id}>
                  <div className="chip-row">
                    <strong>{String(issue.label ?? issue.id)}</strong>
                    {issue.critical && <Badge tone="warn">Trọng tâm</Badge>}
                  </div>
                  {issue.description && <p className="small muted">{String(issue.description)}</p>}
                </li>
              ))}
            </ul>
          </Card>

          <HintPanel />
        </aside>
      </div>

      <Callout tone="info" title="Nhắc lại về chứng cứ">
        <p>
          Một tài liệu không tự chứng minh sự kiện. Khi đánh giá, hãy tách nguồn/tính toàn vẹn, quy
          trình thu thập, độ tin cậy và mức liên quan. Engine không tự loại bỏ chứng cứ vì có khiếm
          khuyết thủ tục.
        </p>
      </Callout>
    </div>
  )
}
