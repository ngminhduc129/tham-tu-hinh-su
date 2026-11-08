import { useState } from 'react'
import {
  Button,
  Callout,
  Card,
  Modal,
  MultiChoice,
  NoteField,
  SectionHeading,
  SingleChoice,
} from '../components'
import { useGame } from '../GameContext'
import { getSingle, getValues } from '../../domain/answers'
import { blockingFailures, evaluateConsistency } from '../../domain/matching'
import { scoreSubmission } from '../../domain/scoring'
import { createSession } from '../../state/reducer'
import { FIELD_HINTS, PROVISION_LABELS, fieldLabel, formatCitation } from '../labels'
import type { ScoreResult } from '../../domain/types'

interface ChecklistItem {
  id: string
  label: string
  done: boolean
  detail: string
}

export function SubmissionScreen() {
  const { caseFile, session, dispatch, navigate, readOnly, lookups } = useGame()
  const [dialog, setDialog] = useState<'submit' | 'reset' | null>(null)
  const [preview, setPreview] = useState<ScoreResult | null>(null)

  const chargeField = caseFile.answer_fields.find((field) => field.id === 'selected_charge')
  const conclusionField = caseFile.answer_fields.find((field) => field.id === 'conclusion')
  const legalBasisField = caseFile.answer_fields.find((field) => field.id === 'legal_basis')
  const personConductTarget = chargeField?.target_ids[0] ?? ''

  const selectedCharge = chargeField
    ? getSingle(session.answers, chargeField.id, personConductTarget)
    : null
  const selectedConclusion = conclusionField
    ? getSingle(session.answers, conclusionField.id, personConductTarget)
    : null
  const legalBasisValues =
    legalBasisField && selectedConclusion
      ? getValues(session.answers, legalBasisField.id, selectedConclusion)
      : []

  const evidenceFields = caseFile.answer_fields.filter((field) => field.scope === 'evidence')
  const totalEvidenceTargets = evidenceFields.reduce(
    (sum, field) => sum + field.target_ids.length,
    0,
  )
  const answeredEvidenceTargets = evidenceFields.reduce(
    (sum, field) =>
      sum +
      field.target_ids.filter(
        (targetId) => getValues(session.answers, field.id, targetId).length > 0,
      ).length,
    0,
  )

  const hypothesesLinked = caseFile.hypotheses.every(
    (hypothesis) =>
      getValues(session.answers, 'hypothesis_support', hypothesis.id).length > 0 &&
      getValues(session.answers, 'hypothesis_challenge', hypothesis.id).length > 0,
  )
  const proofDone = caseFile.proof_matrix.every(
    (row) => getValues(session.answers, 'proof_assessment', row.id).length > 0,
  )
  const elementsDone = caseFile.charge_elements.every(
    (element) => getValues(session.answers, 'element_status', element.id).length > 0,
  )
  const circumstancesDone = caseFile.circumstances.every(
    (circumstance) =>
      getValues(session.answers, 'circumstance_status', circumstance.id).length > 0,
  )
  const basisDone =
    selectedConclusion === 'conclusion_insufficient'
      ? true
      : Boolean(selectedConclusion) && legalBasisValues.length > 0

  const checklist: ChecklistItem[] = [
    {
      id: 'evidence',
      label: 'Đánh giá chứng cứ trọng tâm',
      done: totalEvidenceTargets > 0 && answeredEvidenceTargets === totalEvidenceTargets,
      detail: `${answeredEvidenceTargets}/${totalEvidenceTargets} mục`,
    },
    {
      id: 'hypotheses',
      label: 'Gắn chứng cứ cho cả hai giả thuyết',
      done: hypothesesLinked,
      detail: hypothesesLinked ? 'Đã gắn đủ' : 'Còn giả thuyết chưa gắn đủ ủng hộ/phản bác',
    },
    {
      id: 'proof',
      label: 'Đánh giá ma trận chứng minh',
      done: proofDone,
      detail: `${caseFile.proof_matrix.length} mệnh đề`,
    },
    {
      id: 'elements',
      label: 'Đánh giá dấu hiệu cấu thành',
      done: elementsDone,
      detail: `${caseFile.charge_elements.length} dấu hiệu`,
    },
    {
      id: 'circumstance',
      label: 'Đánh giá tình tiết hồ sơ yêu cầu',
      done: circumstancesDone,
      detail: `${caseFile.circumstances.length} tình tiết`,
    },
    {
      id: 'conclusion',
      label: 'Chọn kết luận cho người và hành vi',
      done: Boolean(selectedConclusion),
      detail: selectedConclusion ? 'Đã chọn' : 'Chưa chọn',
    },
    {
      id: 'basis',
      label: 'Ghi căn cứ cho kết luận',
      done: basisDone,
      detail:
        selectedConclusion === 'conclusion_insufficient'
          ? 'Nhánh chưa đủ dữ kiện không yêu cầu căn cứ'
          : legalBasisValues.length > 0
            ? 'Đã chọn căn cứ'
            : 'Chưa chọn căn cứ',
    },
  ]

  const criticalWarnings: string[] = []
  for (const issueId of caseFile.critical_issue_ids ?? []) {
    const issue = lookups.issues.get(issueId)
    if (!issue) continue
    const missingFields = (issue.answer_field_ids ?? []).filter((fieldId) => {
      const field = caseFile.answer_fields.find((item) => item.id === fieldId)
      if (!field) return false
      return !field.target_ids.some(
        (targetId) => getValues(session.answers, field.id, targetId).length > 0,
      )
    })
    if (missingFields.length > 0) {
      criticalWarnings.push(
        `Vấn đề trọng tâm “${String(issue.label ?? issue.id)}” còn thiếu: ${missingFields
          .map((fieldId) => fieldLabel(fieldId))
          .join(', ')}.`,
      )
    }
  }

  const consistency = evaluateConsistency(caseFile, session.answers)
  const blocking = blockingFailures(consistency)
  const failingMajor = consistency.filter(
    (result) => result.status === 'fail' && result.severity === 'major',
  )

  const openSubmit = () => {
    setPreview(scoreSubmission(caseFile, session.answers))
    setDialog('submit')
  }

  const confirmSubmit = () => {
    if (!preview) return
    dispatch({ type: 'SUBMIT', score: preview })
    setDialog(null)
    navigate(`case/${caseFile.metadata.id}/feedback`)
  }

  const resetSession = () => {
    dispatch({ type: 'RESET', session: createSession(caseFile) })
    setDialog(null)
    navigate(`case/${caseFile.metadata.id}/brief`)
  }

  if (readOnly && session.score) {
    return (
      <div className="screen">
        <SectionHeading
          eyebrow="Giai đoạn 5 · Kết luận"
          title="Bạn đã nộp bài"
          description={<p>Kết quả được lưu cùng phiên bản hồ sơ và bộ văn bản luật tại thời điểm nộp.</p>}
        />
        <Card>
          <div className="submitted-summary">
            <div>
              <p className="muted small">Điểm năng lực</p>
              <p className="score-number">
                {session.score.total === null ? '—' : session.score.total}
                <span className="score-number__max">/100</span>
              </p>
            </div>
            <div>
              <p className="muted small">Đường đáp án</p>
              <p>{session.score.pathLabel ?? 'Không khớp đường đáp án'}</p>
              <p className="muted small">
                Nộp lúc {new Date(session.submittedAt ?? session.updatedAt).toLocaleString('vi-VN')}
              </p>
            </div>
          </div>
          <div className="screen-actions">
            <Button
              variant="primary"
              onClick={() => navigate(`case/${caseFile.metadata.id}/feedback`)}
            >
              Xem phản hồi chi tiết
            </Button>
            <Button variant="secondary" onClick={() => setDialog('reset')}>
              Làm lại từ đầu
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                dispatch({ type: 'REOPEN' })
              }}
            >
              Mở lại để sửa câu trả lời
            </Button>
          </div>
        </Card>
        <Modal
          open={dialog === 'reset'}
          title="Làm lại từ đầu?"
          onClose={() => setDialog(null)}
          footer={
            <>
              <Button variant="ghost" onClick={() => setDialog(null)}>
                Giữ kết quả
              </Button>
              <Button variant="danger" onClick={resetSession}>
                Xóa câu trả lời và làm lại
              </Button>
            </>
          }
        >
          <p>
            Toàn bộ câu trả lời và ghi chú của phiên này sẽ bị xóa khỏi thiết bị. Kết quả đã nộp
            không thể khôi phục sau thao tác này.
          </p>
        </Modal>
      </div>
    )
  }

  return (
    <div className="screen">
      <SectionHeading
        eyebrow="Giai đoạn 5 · Kết luận"
        title="Chọn kết luận và căn cứ"
        description={
          <p>
            Kết luận phải gắn với người, hành vi và dấu hiệu. Nếu hồ sơ chưa đủ, chọn “chưa đủ dữ
            kiện/căn cứ” thay vì đoán định danh.
          </p>
        }
      />

      <div className="two-column two-column--aside">
        <div className="stack">
          <Card>
            <h3>Định danh và kết luận</h3>
            {chargeField && (
              <SingleChoice
                name={`${chargeField.id}:${personConductTarget}`}
                legend={fieldLabel(chargeField.id)}
                hint={FIELD_HINTS[chargeField.id]}
                options={chargeField.options}
                value={selectedCharge}
                allowClear
                readOnly={readOnly}
                onChange={(value) =>
                  dispatch({
                    type: 'SET_ANSWER',
                    fieldId: chargeField.id,
                    targetId: personConductTarget,
                    value,
                  })
                }
              />
            )}
            {conclusionField && (
              <SingleChoice
                name={`${conclusionField.id}:${personConductTarget}`}
                legend={fieldLabel(conclusionField.id)}
                hint={FIELD_HINTS[conclusionField.id]}
                options={conclusionField.options}
                value={selectedConclusion}
                allowClear
                readOnly={readOnly}
                onChange={(value) =>
                  dispatch({
                    type: 'SET_ANSWER',
                    fieldId: conclusionField.id,
                    targetId: personConductTarget,
                    value,
                  })
                }
              />
            )}
          </Card>

          <Card>
            <h3>Căn cứ pháp luật</h3>
            {!selectedConclusion && (
              <p className="muted">Chọn kết luận trước để ghi căn cứ tương ứng.</p>
            )}
            {legalBasisField && selectedConclusion && (
              <MultiChoice
                legend={fieldLabel(legalBasisField.id)}
                hint={FIELD_HINTS[legalBasisField.id]}
                options={legalBasisField.options.map((opt) => ({
                  ...opt,
                  label: PROVISION_LABELS[opt.id] ?? formatCitation(opt.label, opt.id),
                }))}
                values={legalBasisValues}
                readOnly={readOnly}
                onToggle={(value) =>
                  dispatch({
                    type: 'TOGGLE_MULTI',
                    fieldId: legalBasisField.id,
                    targetId: selectedConclusion,
                    value,
                  })
                }
              />
            )}
            <Callout tone="warn" title="Căn cứ trong bản nháp">
              <p>
                Mọi căn cứ trong hồ sơ đang ở trạng thái chưa xác minh và chưa có ngày hiệu lực. Việc
                chọn căn cứ chỉ là bài tập đối chiếu thư viện hồ sơ, không phải kết luận áp dụng luật.
              </p>
            </Callout>
          </Card>

          <Card>
            <NoteField
              label="Giải thích ngắn cho kết luận (không chấm điểm)"
              hint="Nêu chuỗi dữ kiện → suy luận → dấu hiệu → căn cứ. Nội dung chỉ lưu trên thiết bị và không được đánh giá tự động."
              value={session.notes['conclusion:explanation'] ?? ''}
              readOnly={readOnly}
              rows={4}
              placeholder="Ví dụ: Nhật ký ra vào chỉ chứng minh thời điểm quẹt thẻ; khoảng trống máy quay không chứng minh hành vi. Vì vậy…"
              onChange={(value) =>
                dispatch({ type: 'SET_NOTE', key: 'conclusion:explanation', value })
              }
            />
          </Card>

          {criticalWarnings.length > 0 && (
            <Callout tone="warn" title="Còn vấn đề trọng tâm chưa trả lời">
              <ul className="tight-list">
                {criticalWarnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
              <p>Bạn vẫn có thể nộp, nhưng phần thiếu sẽ được phản hồi riêng.</p>
            </Callout>
          )}

          {blocking.length > 0 && (
            <Callout tone="danger" title="Không thể chấm điểm do câu trả lời mâu thuẫn">
              <ul className="tight-list">
                {blocking.map((result) => (
                  <li key={result.ruleId}>{result.message}</li>
                ))}
              </ul>
              <p>
                Hãy quay lại phần phân tích hoặc kết luận để sửa. Hệ thống không gán điểm tùy tiện
                khi còn mâu thuẫn chặn nộp bài.
              </p>
            </Callout>
          )}

          {failingMajor.length > 0 && (
            <Callout tone="warn" title="Câu trả lời cần xem lại">
              <ul className="tight-list">
                {failingMajor.map((result) => (
                  <li key={result.ruleId}>{result.message}</li>
                ))}
              </ul>
            </Callout>
          )}

          <div className="screen-actions">
            <Button
              variant="secondary"
              onClick={() => navigate(`case/${caseFile.metadata.id}/analysis`)}
            >
              ← Quay lại phân tích
            </Button>
            <Button variant="primary" disabled={blocking.length > 0} onClick={openSubmit}>
              Nộp bài
            </Button>
          </div>
        </div>

        <aside className="stack">
          <Card>
            <h3>Kiểm tra trước khi nộp</h3>
            <ul className="checklist">
              {checklist.map((item) => (
                <li key={item.id} className={item.done ? 'checklist__item--done' : ''}>
                  <span className="checklist__mark" aria-hidden="true">
                    {item.done ? '✓' : '○'}
                  </span>
                  <span>
                    <strong>{item.label}</strong>
                    <span className="muted small"> — {item.detail}</span>
                    <span className="sr-only">{item.done ? 'Đã hoàn thành' : 'Chưa hoàn thành'}</span>
                  </span>
                </li>
              ))}
            </ul>
            <p className="muted small">
              Không bắt buộc hoàn thành 100%. Hồ sơ chưa đầy đủ vẫn có thể nộp và sẽ nhận phản hồi
              riêng về phần thiếu.
            </p>
          </Card>

          <Card>
            <h3>Tóm tắt lựa chọn</h3>
            <dl className="meta-list meta-list--compact">
              <div>
                <dt>Định danh</dt>
                <dd>{selectedCharge ? lookups.charges.get(selectedCharge)?.display_label ?? selectedCharge : 'Không chọn'}</dd>
              </div>
              <div>
                <dt>Kết luận</dt>
                <dd>
                  {selectedConclusion
                    ? lookups.conclusions.get(selectedConclusion)?.label ?? selectedConclusion
                    : 'Chưa chọn'}
                </dd>
              </div>
              <div>
                <dt>Căn cứ</dt>
                <dd>
                  {legalBasisValues.length === 0
                    ? 'Không chọn'
                    : legalBasisValues
                        .map((id) => lookups.provisions.get(id)?.citation ?? id)
                        .join('; ')}
                </dd>
              </div>
            </dl>
          </Card>

          <Callout tone="info" title="Cách chấm">
            <p>
              Điểm theo 7 tiêu chí, tối đa 100. Điểm từng tiêu chí = điểm tối đa × tỷ lệ trọng số kỳ
              vọng đạt. Làm tròn một lần ở tổng. Thời gian và gợi ý không trừ điểm.
            </p>
          </Callout>
        </aside>
      </div>

      <Modal
        open={dialog === 'submit'}
        title="Nộp bài và chấm điểm?"
        onClose={() => setDialog(null)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setDialog(null)}>
              Xem lại câu trả lời
            </Button>
            <Button variant="primary" onClick={confirmSubmit}>
              {preview?.total === null ? 'Nộp và xem chẩn đoán' : 'Nộp bài'}
            </Button>
          </>
        }
      >
        <p>
          Bạn sẽ không thể sửa câu trả lời cho đến khi chọn “Mở lại”. Kết quả được lưu cùng phiên
          bản hồ sơ {session.caseVersion} và bộ văn bản luật {session.lawBundleId || 'chưa phân giải'}.
        </p>
        {criticalWarnings.length > 0 && (
          <Callout tone="warn" title="Còn mục trọng tâm chưa trả lời">
            <ul className="tight-list">
              {criticalWarnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          </Callout>
        )}
        {preview?.blocking && (
          <Callout tone="danger" title="Có mâu thuẫn chặn nộp bài">
            <p>Không thể chấm điểm cho đến khi sửa các mâu thuẫn đã liệt kê.</p>
          </Callout>
        )}
        {preview && !preview.blocking && preview.unmatched && (
          <Callout tone="warn" title="Không khớp đường đáp án nào">
            <p>
              Tổ hợp câu trả lời hiện tại không khớp cấu hình đường đáp án đã duyệt. Hệ thống sẽ không
              tạo điểm cuối và chỉ hiển thị chẩn đoán từng tiêu chí để bạn xem lại.
            </p>
          </Callout>
        )}
        {preview && !preview.blocking && !preview.unmatched && (
          <p>
            Điểm dự kiến: <strong>{preview.total}/100</strong> · đường đáp án:{' '}
            <strong>{preview.pathLabel}</strong>
          </p>
        )}
      </Modal>

      <Modal
        open={dialog === 'reset'}
        title="Làm lại từ đầu?"
        onClose={() => setDialog(null)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setDialog(null)}>
              Giữ câu trả lời
            </Button>
            <Button variant="danger" onClick={resetSession}>
              Xóa và làm lại
            </Button>
          </>
        }
      >
        <p>Toàn bộ câu trả lời, ghi chú và tiến độ khám phá của phiên này sẽ bị xóa.</p>
      </Modal>
    </div>
  )
}
