import { Badge, Button, Callout, Card, HintPanel, SectionHeading, SingleChoice } from '../components'
import { useGame } from '../GameContext'
import { getSingle } from '../../domain/answers'
import { evaluateConsistency } from '../../domain/matching'
import { computeAgeRange, formatAgeRange } from '../../domain/age'
import { checkLawResolution, formatDateInterval } from '../../domain/legalVersion'
import {
  CATEGORY_LABELS,
  ELEMENT_TYPE_LABELS,
  FIELD_HINTS,
  PRECISION_LABELS,
  REVIEW_STATUS_LABELS,
  fieldLabel,
  formatChargeLabel,
  formatCitation,
  formatLegalTest,
  formatSourceRef,
  provisionLabel,
  conductEventLabel,
} from '../labels'

export function AnalysisScreen() {
  const { caseFile, session, dispatch, readOnly, navigate, lookups } = useGame()
  const conductEvent = caseFile.temporal_context.conduct_events[0]
  const elementField = caseFile.answer_fields.find((field) => field.scope === 'charge_element')
  const circumstanceField = caseFile.answer_fields.find(
    (field) => field.scope === 'circumstance',
  )
  const lawChecks = checkLawResolution(caseFile)
  const consistency = evaluateConsistency(caseFile, session.answers)
  const failing = consistency.filter((result) => result.status === 'fail')
  const comparison = caseFile.charge_comparisons[0]
  const comparisonExplanation = comparison?.explanation_id
    ? lookups.explanations.get(comparison.explanation_id)
    : undefined
  const distinguishing = new Set(comparison?.distinguishing_element_ids ?? [])

  return (
    <div className="screen">
      <SectionHeading
        eyebrow="Giai đoạn 4 · Phân tích pháp lý"
        title="Ánh xạ dữ kiện vào từng dấu hiệu"
        description={
          <p>
            Đánh giá từng dấu hiệu cấu thành bằng dữ kiện riêng. Không suy dấu hiệu này từ dấu hiệu
            khác, và không tự chọn điều luật áp dụng.
          </p>
        }
      />

      <div className="two-column two-column--aside">
        <div className="stack">
          <Card>
            <h3>Căn cứ thời gian và phiên bản luật</h3>
            <div className="status-list">
              {lawChecks.map((check) => (
                <div key={check.conductEventId} className="status-row">
                  <div>
                    <strong>{conductEventLabel(check.conductEventId)}</strong>
                    <p className="muted small">
                      {formatDateInterval(
                        conductEvent?.date_interval.start_date ?? null,
                        conductEvent?.date_interval.end_date ?? null,
                      )}{' '}
                      · độ chính xác: {PRECISION_LABELS[conductEvent?.date_interval.precision ?? ''] ?? conductEvent?.date_interval.precision}
                    </p>
                  </div>
                  <Badge tone={check.status === 'ok' ? 'success' : 'warn'}>
                    {check.status === 'ok' ? 'Đã đối chiếu' : 'Chưa phân giải'}
                  </Badge>
                </div>
              ))}
              {lawChecks.map((check) =>
                check.segments.length > 0 ? (
                  <div key={`${check.conductEventId}-segments`}>
                    <p className="muted small">Các đoạn hiệu lực đã khai báo:</p>
                    <ul className="tight-list small">
                      {check.segments.map((segment, index) => (
                        <li key={`${segment.bundle_id}-${index}`}>
                          {formatDateInterval(segment.start_date, segment.end_date)} ·{' '}
                          {lookups.bundles.get(segment.bundle_id)?.version ?? segment.bundle_id}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null,
              )}
            </div>
            {lawChecks.some((check) => check.status !== 'ok') && (
              <Callout tone="warn" title="Không tự chọn luật">
                <p>
                  Hệ thống không chọn phiên bản luật thay bạn hay thay người rà soát. Hồ sơ đang chưa phân
                  giải thời điểm áp dụng, nên kết luận chỉ có giá trị học tập.
                </p>
              </Callout>
            )}
          </Card>

          {caseFile.candidate_charges.map((charge) => {
            const elements = caseFile.charge_elements.filter(
              (element) => element.charge_id === charge.id,
            )
            return (
              <Card key={charge.id} className="charge-card">
                <div className="chip-row">
                  <Badge tone="accent">Định danh</Badge>
                  {elements.map((element) => (
                    <Badge
                      key={element.id}
                      tone={distinguishing.has(element.id) ? 'warn' : 'neutral'}
                    >
                      {ELEMENT_TYPE_LABELS[element.element_type]}
                      {distinguishing.has(element.id) ? ' · phân biệt' : ''}
                    </Badge>
                  ))}
                </div>
                <h3>{formatChargeLabel(charge)}</h3>
                <p className="muted small">
                  Người: {lookups.characters.get(charge.person_id) ?? charge.person_id} · hành vi:{' '}
                  {charge.conduct_event_ids
                    .map((id) => (id === 'conduct_01' ? 'Khoảng 22:10 - 22:35 ngày 31/05/2024' : id))
                    .join(', ')}
                </p>
                <p className="small">
                  Căn cứ pháp luật:{' '}
                  {charge.legal_basis_ids.map((basisId) => (
                    <span key={basisId} className="source-chip">
                      {lookups.provisions.get(basisId)?.citation ?? provisionLabel(basisId)}
                    </span>
                  ))}
                </p>

                <div className="element-list">
                  {elements.map((element) => {
                    const facts = (element.fact_ids ?? [])
                      .map((factId) => lookups.facts.get(factId))
                      .filter((item): item is NonNullable<typeof item> => Boolean(item))
                    const evidence = (element.evidence_ids ?? [])
                      .map((evidenceId) => lookups.evidence.get(evidenceId))
                      .filter((item): item is NonNullable<typeof item> => Boolean(item))
                    return (
                      <article key={element.id} className="element">
                        <div className="chip-row">
                          <Badge tone={element.required ? 'warn' : 'neutral'}>
                            {element.required ? 'Bắt buộc' : 'Không bắt buộc'}
                          </Badge>
                          {distinguishing.has(element.id) && (
                            <Badge tone="accent">Dấu hiệu phân biệt</Badge>
                          )}
                        </div>
                        <h4>{element.label ?? element.id}</h4>
                        <p className="small muted">{formatLegalTest(element.id, element.legal_test)}</p>

                        <details className="disclosure">
                          <summary>Dữ kiện và chứng cứ liên quan</summary>
                          <ul className="tight-list small">
                            {facts.map((fact) => (
                              <li key={fact.id}>{fact.text}</li>
                            ))}
                            {evidence.map((item) => (
                              <li key={item.id}>
                                <em>{item.title}</em> — {item.summary}
                              </li>
                            ))}
                          </ul>
                        </details>

                        {elementField && (
                          <SingleChoice
                            name={`${elementField.id}:${element.id}`}
                            legend={fieldLabel(elementField.id)}
                            hint={FIELD_HINTS[elementField.id]}
                            options={elementField.options}
                            value={getSingle(session.answers, elementField.id, element.id)}
                            allowClear
                            readOnly={readOnly}
                            compact
                            onChange={(value) =>
                              dispatch({
                                type: 'SET_ANSWER',
                                fieldId: elementField.id,
                                targetId: element.id,
                                value,
                              })
                            }
                          />
                        )}
                      </article>
                    )
                  })}
                </div>
              </Card>
            )
          })}

          {comparisonExplanation && (
            <Callout tone="info" title={comparisonExplanation.title ?? 'So sánh định danh'}>
              <p>{comparisonExplanation.body}</p>
            </Callout>
          )}

          <Card>
            <h3>Tình tiết hồ sơ yêu cầu đánh giá</h3>
            {caseFile.circumstances.map((circumstance) => {
              const facts = (circumstance.fact_ids ?? [])
                .map((factId) => lookups.facts.get(factId))
                .filter((item): item is NonNullable<typeof item> => Boolean(item))
              return (
                <div key={circumstance.id} className="element">
                  <div className="chip-row">
                    <Badge tone="neutral">
                      {CATEGORY_LABELS[circumstance.category] ?? circumstance.category}
                    </Badge>
                    <Badge tone="warn">
                      {REVIEW_STATUS_LABELS[circumstance.review_status] ?? circumstance.review_status}
                    </Badge>
                  </div>
                  <h4>{circumstance.label ?? circumstance.id}</h4>
                  <ul className="tight-list small">
                    {facts.map((fact) => (
                      <li key={fact.id}>{fact.text}</li>
                    ))}
                  </ul>
                  {circumstanceField && (
                    <SingleChoice
                      name={`${circumstanceField.id}:${circumstance.id}`}
                      legend={fieldLabel(circumstanceField.id)}
                      hint={FIELD_HINTS[circumstanceField.id]}
                      options={circumstanceField.options}
                      value={getSingle(session.answers, circumstanceField.id, circumstance.id)}
                      allowClear
                      readOnly={readOnly}
                      compact
                      onChange={(value) =>
                        dispatch({
                          type: 'SET_ANSWER',
                          fieldId: circumstanceField.id,
                          targetId: circumstance.id,
                          value,
                        })
                      }
                    />
                  )}
                </div>
              )
            })}
          </Card>

          {failing.length > 0 && (
            <Callout tone="danger" title="Câu trả lời đang mâu thuẫn">
              <ul className="tight-list">
                {failing.map((result) => (
                  <li key={result.ruleId}>
                    {result.message}
                    {result.severity === 'blocking' && (
                      <strong> (chặn chấm điểm cho đến khi sửa)</strong>
                    )}
                  </li>
                ))}
              </ul>
            </Callout>
          )}

          <div className="screen-actions">
            <Button
              variant="secondary"
              onClick={() => navigate(`case/${caseFile.metadata.id}/hypotheses`)}
            >
              ← Quay lại giả thuyết
            </Button>
            <Button
              variant="primary"
              onClick={() => navigate(`case/${caseFile.metadata.id}/submission`)}
            >
              Đi tới kết luận
            </Button>
          </div>
        </div>

        <aside className="stack">
          <Card>
            <h3>Tuổi tại ngày hành vi</h3>
            <ul className="status-list">
              {caseFile.characters.map((character) => {
                const result = conductEvent
                  ? computeAgeRange(character.birth_date_interval, conductEvent.date_interval)
                  : { kind: 'unknown' as const, reason: 'Chưa có ngày hành vi.' }
                return (
                  <li key={character.id}>
                    <span>{character.display_name}</span>
                    <span className="small">{formatAgeRange(result)}</span>
                  </li>
                )
              })}
            </ul>
            <p className="muted small">
              Hệ thống không áp ngưỡng tuổi chịu trách nhiệm hình sự; ngưỡng và hệ quả thuộc quy tắc đã
              được người rà soát duyệt.
            </p>
          </Card>

          <Card>
            <h3>Thư viện luật của hồ sơ</h3>
            <ul className="law-list">
              {caseFile.references.legal_basis_ids.map((basisId) => {
                const provision = lookups.provisions.get(basisId)
                return (
                  <li key={basisId}>
                    <div className="chip-row">
                      <Badge tone="warn">
                        {REVIEW_STATUS_LABELS[provision?.review_status ?? 'not_reviewed']}
                      </Badge>
                      <span className="small font-medium">{formatCitation(provision?.citation, basisId)}</span>
                    </div>
                    <p className="small">{formatCitation(provision?.citation, basisId)}</p>
                    <p className="muted small">
                      Hiệu lực: {formatDateInterval(provision?.effective_from ?? null, provision?.effective_to ?? null)}
                    </p>
                    <p className="muted small">Nguồn: {formatSourceRef(provision?.source_ref)}</p>
                  </li>
                )
              })}
            </ul>
          </Card>

          <HintPanel />
        </aside>
      </div>
    </div>
  )
}
