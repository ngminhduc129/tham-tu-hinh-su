import { useState, type ReactNode } from 'react'
import {
  Badge,
  Button,
  Callout,
  Card,
  Modal,
  ProgressBar,
  SectionHeading,
} from '../components'
import { useGame } from '../GameContext'
import { answerLabel } from '../../domain/lookups'
import { formatDateInterval } from '../../domain/legalVersion'
import {
  REVIEW_STATUS_LABELS,
  fieldLabel,
  formatCitation,
  formatExplanationBody,
  formatSourceRef,
  pathBadgeLabel,
  pathCategoryLabel,
} from '../labels'
import type { ExpectationResult } from '../../domain/types'

function targetLabel(
  fieldId: string,
  targetId: string,
  lookups: ReturnType<typeof useGame>['lookups'],
  fieldScope: string | undefined,
): string {
  if (fieldScope === 'evidence') return lookups.evidence.get(targetId)?.title ?? targetId
  if (fieldScope === 'hypothesis') return lookups.hypotheses.get(targetId)?.label ?? targetId
  if (fieldScope === 'proof_row') return lookups.proofRows.get(targetId)?.proposition ?? targetId
  if (fieldScope === 'charge_element') return lookups.elements.get(targetId)?.label ?? targetId
  if (fieldScope === 'circumstance') return lookups.circumstances.get(targetId)?.label ?? targetId
  if (fieldScope === 'conclusion') return lookups.conclusions.get(targetId)?.label ?? targetId
  if (fieldScope === 'person_conduct') {
    const [personId, conductId] = targetId.split(':')
    const characterName = lookups.characters.get(personId) ?? personId
    const eventName = conductId === 'conduct_01' ? 'hành vi ngày 31/05/2024' : conductId
    return `${characterName} · ${eventName}`
  }
  if (fieldId === 'legal_basis') return lookups.conclusions.get(targetId)?.label ?? targetId
  return targetId
}

function ExpectationRow({
  expectation,
  fieldScope,
}: {
  expectation: ExpectationResult
  fieldScope: string | undefined
}) {
  const { lookups } = useGame()
  const [open, setOpen] = useState(false)
  const explanation = lookups.explanations.get(expectation.explanationId)
  const field = lookups.fields.get(expectation.fieldId)

  return (
    <li className={`expectation ${expectation.met ? 'expectation--met' : 'expectation--missed'}`}>
      <div className="expectation__head">
        <span className="expectation__mark" aria-hidden="true">
          {expectation.met ? '✓' : '○'}
        </span>
        <div className="expectation__title">
          <strong>{fieldLabel(expectation.fieldId)}</strong>
          <span className="muted small">
            {' '}
            · {targetLabel(expectation.fieldId, expectation.targetId, lookups, fieldScope)}
          </span>
        </div>
        <Badge tone={expectation.met ? 'success' : 'warn'}>
          {expectation.met ? 'Đạt' : 'Chưa đạt'}
        </Badge>
      </div>

      <dl className="expectation__values">
        <div>
          <dt>Bạn chọn</dt>
          <dd>
            {expectation.actual.length === 0
              ? 'Chưa trả lời'
              : answerLabel(lookups, expectation.fieldId, expectation.actual)}
          </dd>
        </div>
        <div>
          <dt>Được chấp nhận</dt>
          <dd>
            {expectation.accepted.length === 0
              ? 'Không chọn giá trị nào'
              : answerLabel(lookups, expectation.fieldId, expectation.accepted)}
            {field?.value_type === 'multi_select' && (
              <span className="muted small"> (đúng toàn bộ tập giá trị)</span>
            )}
          </dd>
        </div>
      </dl>

      {explanation && (
        <div className="expectation__explain">
          <button
            type="button"
            className="link-button"
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? 'Ẩn giải thích' : 'Vì sao?'}
          </button>
          {open && (
            <div className="explanation-box">
              <p className="explanation-box__title">{explanation.title}</p>
              <p>{formatExplanationBody(explanation.body, explanation.id)}</p>
            </div>
          )}
        </div>
      )}
    </li>
  )
}

function ScoreOverview({ children }: { children: ReactNode }) {
  return <div className="feedback-overview">{children}</div>
}

export function FeedbackScreen() {
  const { caseFile, session, dispatch, navigate, lookups } = useGame()
  const [reopenOpen, setReopenOpen] = useState(false)
  const score = session.score

  if (!score) {
    return (
      <div className="screen">
        <SectionHeading
          eyebrow="Giai đoạn 6 · Phản hồi"
          title="Chưa có kết quả"
          description={<p>Bạn cần nộp bài trước khi xem phản hồi chi tiết.</p>}
        />
        <Button
          variant="primary"
          onClick={() => navigate(`case/${caseFile.metadata.id}/submission`)}
        >
          Đi tới phần kết luận
        </Button>
      </div>
    )
  }

  const blocking = score.consistency.filter(
    (result) => result.status === 'fail' && result.severity === 'blocking',
  )
  const failing = score.consistency.filter((result) => result.status === 'fail')
  const metCount = score.criteria.reduce(
    (sum, criterion) => sum + criterion.expectations.filter((item) => item.met).length,
    0,
  )
  const expectationCount = score.criteria.reduce(
    (sum, criterion) => sum + criterion.expectations.length,
    0,
  )
  const alternatives = caseFile.answer_paths.filter((path) => path.id !== score.pathId)
  const referencedProvisions = caseFile.references.legal_basis_ids
    .map((id) => lookups.provisions.get(id))
    .filter((item): item is NonNullable<typeof item> => Boolean(item))

  return (
    <div className="screen">
      <SectionHeading
        eyebrow="Giai đoạn 6 · Phản hồi"
        title={score.total === null ? 'Chẩn đoán câu trả lời' : 'Kết quả phiên học'}
        description={
          <p>
            Phản hồi đi theo chuỗi dữ kiện → suy luận → dấu hiệu → căn cứ. Điểm do cấu hình rubric
            quyết định; phần giải thích chỉ giúp bạn xem lại lập luận.
          </p>
        }
        actions={
          <Badge tone={score.total === null ? 'warn' : 'success'}>
            {score.total === null ? 'Không tạo điểm cuối' : `Điểm ${score.total}/100`}
          </Badge>
        }
      />

      <Card className="feedback-summary">
        <ScoreOverview>
          <div>
            <p className="muted small">Điểm năng lực</p>
            <p className="score-number">
              {score.total === null ? '—' : score.total}
              <span className="score-number__max">/100</span>
            </p>
            <p className="muted small">
              Nộp lúc{' '}
              {new Date(session.submittedAt ?? score.scoredAt).toLocaleString('vi-VN')}
            </p>
          </div>
          <div>
            <p className="muted small">Đường đáp án</p>
            <p className="feedback-path">{score.pathLabel ?? 'Không khớp đường đáp án'}</p>
            <p className="muted small">
              {score.pathId
                ? pathCategoryLabel(score.pathId, score.pathLabel)
                : (score.blocking
                    ? 'Bị chặn bởi quy tắc nhất quán'
                    : 'Cấu hình hồ sơ chưa nhận diện tổ hợp này')}
            </p>
          </div>
          <div>
            <p className="muted small">Mức đạt kỳ vọng</p>
            <p className="feedback-path">
              {score.total === null ? '—' : `${metCount}/${expectationCount}`}
            </p>
            <p className="muted small">Làm tròn một lần ở tổng; gợi ý không trừ điểm.</p>
          </div>
        </ScoreOverview>
      </Card>

      {score.blocking && (
        <Callout tone="danger" title="Câu trả lời mâu thuẫn — không chấm điểm">
          <p>
            Quy tắc nhất quán chạy trước khi so khớp đường đáp án. Hãy sửa các mục dưới đây rồi nộp
            lại:
          </p>
          <ul className="tight-list">
            {blocking.map((result) => (
              <li key={result.ruleId}>{result.message}</li>
            ))}
          </ul>
          <div className="inline-actions">
            <Button
              variant="primary"
              onClick={() => navigate(`case/${caseFile.metadata.id}/analysis`)}
            >
              Quay lại phần phân tích
            </Button>
            <Button
              variant="secondary"
              onClick={() => navigate(`case/${caseFile.metadata.id}/submission`)}
            >
              Tới phần kết luận
            </Button>
          </div>
        </Callout>
      )}

      {score.unmatched && (
        <Callout tone="warn" title="Tổ hợp câu trả lời chưa khớp đường đáp án nào">
          <p>
            Câu trả lời không vi phạm quy tắc nhất quán chặn nộp bài, nhưng không khớp một đường đáp án đã cấu
            hình. Hệ thống không gán điểm kết luận tùy tiện; các thanh dưới đây chỉ là chẩn đoán
            từng tiêu chí để bạn xem lại.
          </p>
          <p className="small">
            Gợi ý: kiểm tra lại việc đánh giá từng dấu hiệu bắt buộc, định danh được chọn, kết luận
            và căn cứ tương ứng. Đường “chưa đủ dữ kiện/căn cứ” yêu cầu không chọn định danh và
            không gắn căn cứ buộc tội.
          </p>
        </Callout>
      )}

      <div className="feedback-grid">
        <div className="stack">
          <Card>
            <h3>Kết quả theo tiêu chí</h3>
            {score.total === null ? (
              <div className="stack">
                {score.diagnostics.map((item) => (
                  <ProgressBar
                    key={item.criterionId}
                    label={item.label}
                    value={item.metWeight}
                    total={item.totalWeight}
                  />
                ))}
                <p className="muted small">
                  Đây là tỷ lệ trọng số kỳ vọng đạt trên toàn bộ hồ sơ, không phải điểm cuối của
                  một đường đáp án.
                </p>
              </div>
            ) : (
              <div className="stack">
                {score.criteria.map((criterion) => (
                  <div key={criterion.criterionId} className="criterion">
                    <div className="criterion__head">
                      <strong>{criterion.label}</strong>
                      <span>
                        {Math.round((criterion.earned / criterion.max) * 100)}% ·{' '}
                        {criterion.earned.toFixed(1)}/{criterion.max} điểm
                      </span>
                    </div>
                    <div
                      className="criterion__track"
                      role="img"
                      aria-label={`${criterion.label}: ${criterion.earned.toFixed(
                        1,
                      )} trên ${criterion.max} điểm`}
                    >
                      <span
                        className="criterion__fill"
                        style={{
                          width: `${Math.max(
                            0,
                            Math.min(100, (criterion.earned / criterion.max) * 100),
                          )}%`,
                        }}
                      />
                    </div>
                    <ul className="expectation-list">
                      {criterion.expectations.map((expectation) => (
                        <ExpectationRow
                          key={expectation.expectationId}
                          expectation={expectation}
                          fieldScope={lookups.fields.get(expectation.fieldId)?.scope}
                        />
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {score.total !== null && (
            <Card>
              <h3>Tổng hợp</h3>
              <div className="feedback-split">
                <div>
                  <Badge tone="success">Làm tốt</Badge>
                  <ul className="tight-list">
                    {score.criteria.flatMap((criterion) =>
                      criterion.expectations
                        .filter((expectation) => expectation.met)
                        .map((expectation) => (
                          <li key={`met-${expectation.expectationId}`}>
                            {fieldLabel(expectation.fieldId)} ·{' '}
                            {targetLabel(
                              expectation.fieldId,
                              expectation.targetId,
                              lookups,
                              lookups.fields.get(expectation.fieldId)?.scope,
                            )}
                          </li>
                        )),
                    )}
                    {metCount === 0 && <li>Chưa có kỳ vọng nào đạt.</li>}
                  </ul>
                </div>
                <div>
                  <Badge tone="warn">Cần xem lại</Badge>
                  <ul className="tight-list">
                    {score.criteria.flatMap((criterion) =>
                      criterion.expectations
                        .filter((expectation) => !expectation.met)
                        .map((expectation) => (
                          <li key={`miss-${expectation.expectationId}`}>
                            {fieldLabel(expectation.fieldId)} ·{' '}
                            {targetLabel(
                              expectation.fieldId,
                              expectation.targetId,
                              lookups,
                              lookups.fields.get(expectation.fieldId)?.scope,
                            )}
                          </li>
                        )),
                    )}
                    {metCount === expectationCount && <li>Không còn mục chưa đạt.</li>}
                  </ul>
                </div>
              </div>
            </Card>
          )}

          {failing.length > 0 && !score.blocking && (
            <Callout tone="warn" title="Quy tắc nhất quán chưa đạt">
              <ul className="tight-list">
                {failing.map((result) => (
                  <li key={result.ruleId}>{result.message}</li>
                ))}
              </ul>
            </Callout>
          )}
        </div>

        <aside className="stack">
          <Card>
            <h3>Đường đáp án thay thế</h3>
            <p className="muted small">
              Hồ sơ có thể chấp nhận nhiều kết luận khác nhau, nhưng mỗi đường là một tổ hợp nhất
              quán đã được cấu hình.
            </p>
            <ul className="path-list">
              {alternatives.map((path) => (
                <li key={path.id}>
                  <div className="chip-row">
                    <strong>{path.label ?? path.id}</strong>
                    <Badge tone="neutral">
                      {pathBadgeLabel(path.id)}
                    </Badge>
                  </div>
                  {path.description && <p className="small muted">{path.description}</p>}
                </li>
              ))}
              {alternatives.length === 0 && <li className="muted">Hồ sơ chỉ có một đường đáp án.</li>}
            </ul>
          </Card>

          <Card>
            <h3>Căn cứ được hồ sơ tham chiếu</h3>
            <ul className="law-list">
              {referencedProvisions.map((provision) => (
                <li key={provision.id}>
                  <div className="chip-row">
                    <Badge tone="warn">
                      {REVIEW_STATUS_LABELS[provision.review_status] ?? provision.review_status}
                    </Badge>
                    <span className="small font-medium">{formatCitation(provision.citation, provision.id)}</span>
                  </div>
                  <p className="small">{formatCitation(provision.citation, provision.id)}</p>
                  <p className="muted small">
                    Hiệu lực: {formatDateInterval(provision.effective_from, provision.effective_to)}
                  </p>
                  <p className="muted small">Nguồn: {formatSourceRef(provision.source_ref)}</p>
                </li>
              ))}
              {referencedProvisions.length === 0 && (
                <li className="muted">Hồ sơ không tham chiếu điều khoản cụ thể.</li>
              )}
            </ul>
          </Card>

          <Card>
            <h3>Đọc thêm</h3>
            <ul className="tight-list">
              {caseFile.explanations.slice(0, 3).map((explanation) => (
                <li key={explanation.id}>
                  <strong>{explanation.title ?? explanation.id}</strong>
                  <p className="small muted">{formatExplanationBody(explanation.body, explanation.id)}</p>
                </li>
              ))}
            </ul>
            <Button
              variant="secondary"
              className="full-width"
              onClick={() => navigate(`case/${caseFile.metadata.id}/notebook`)}
            >
              Mở sổ tay thuật ngữ
            </Button>
          </Card>
        </aside>
      </div>

      <div className="screen-actions">
        <Button onClick={() => navigate('')} variant="ghost">
          Về trang chủ
        </Button>
        <Button
          variant="secondary"
          onClick={() => navigate(`case/${caseFile.metadata.id}/submission`)}
        >
          Xem lại câu trả lời
        </Button>
        <Button variant="primary" onClick={() => setReopenOpen(true)}>
          Mở lại để sửa
        </Button>
      </div>

      <Callout tone="info" title="Giới hạn của phản hồi">
        Tình huống và phản hồi phục vụ học tập; không phải tư vấn pháp lý cho vụ việc thực tế. Hồ sơ
        này đang ở trạng thái nháp, chưa được thẩm định pháp lý.
      </Callout>

      <Modal
        open={reopenOpen}
        title="Mở lại bài đã nộp?"
        onClose={() => setReopenOpen(false)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setReopenOpen(false)}>
              Giữ kết quả
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                dispatch({ type: 'REOPEN' })
                setReopenOpen(false)
                navigate(`case/${caseFile.metadata.id}/submission`)
              }}
            >
              Mở lại và sửa câu trả lời
            </Button>
          </>
        }
      >
        <p>
          Kết quả đã nộp sẽ bị xóa khỏi phiên hiện tại để bạn sửa câu trả lời. Bạn sẽ cần nộp lại để
          nhận kết quả mới.
        </p>
        <p className="muted small">
          Nếu chỉ muốn xem lại, hãy chọn “Giữ kết quả”. Sổ tay và ghi chú cá nhân không bị ảnh
          hưởng.
        </p>
      </Modal>

    </div>
  )
}
