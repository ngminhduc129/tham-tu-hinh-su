import { Badge, Button, Callout, Card, SectionHeading } from '../components'
import { useGame } from '../GameContext'
import { computeAgeRange, formatAgeRange } from '../../domain/age'
import { checkLawResolution, formatDateInterval } from '../../domain/legalVersion'
import { ROLE_LABELS, PRECISION_LABELS, EVIDENCE_TYPE_LABELS } from '../labels'

export function CaseFileScreen() {
  const { caseFile, lookups, navigate } = useGame()
  const conductEvent = caseFile.temporal_context.conduct_events[0]
  const lawChecks = checkLawResolution(caseFile)

  const sourceLabel = (id: string): string => {
    const evidence = lookups.evidence.get(id)
    if (evidence) return evidence.title ?? evidence.id
    const fact = lookups.facts.get(id)
    if (fact) return fact.text ?? fact.id
    return id
  }

  return (
    <div className="screen">
      <SectionHeading
        eyebrow="Giai đoạn 1 · Hồ sơ ban đầu"
        title="Hồ sơ và mốc thời gian"
        description={
          <p>
            Chỉ những dữ kiện có nguồn trong hồ sơ được liệt kê. Đánh giá, suy luận và kết luận nằm ở
            các giai đoạn sau.
          </p>
        }
        actions={
          <Button variant="ghost" onClick={() => navigate(`case/${caseFile.metadata.id}/brief`)}>
            ← Về giới thiệu
          </Button>
        }
      />

      <div className="two-column">
        <div>
          <Card>
            <h3>Dữ kiện được ghi nhận</h3>
            <ol className="fact-list">
              {caseFile.facts.map((fact) => (
                <li key={fact.id}>
                  <p>{fact.text}</p>
                  <p className="source-line">
                    <span className="muted small">Nguồn:</span>{' '}
                    {(fact.source_ids ?? []).map((sourceId) => (
                      <span key={sourceId} className="source-chip">
                        {sourceLabel(sourceId)}
                      </span>
                    ))}
                  </p>
                </li>
              ))}
            </ol>
            <p className="muted small">
              Một dữ kiện được ghi nhận vẫn có thể bị giới hạn bởi nguồn tạo ra nó. Xem phần giới hạn
              trong từng tài liệu.
            </p>
          </Card>

          <Card className="spaced">
            <h3>Nhân vật</h3>
            <div className="character-grid">
              {caseFile.characters.map((character) => {
                const age = conductEvent
                  ? computeAgeRange(character.birth_date_interval, conductEvent.date_interval)
                  : { kind: 'unknown' as const, reason: 'Chưa có ngày hành vi.' }
                return (
                  <article key={character.id} className="character">
                    <h4>{character.display_name}</h4>
                    <div className="chip-row">
                      {character.roles.map((role) => (
                        <span key={role} className="chip">
                          {ROLE_LABELS[role] ?? role}
                        </span>
                      ))}
                    </div>
                    {character.notes && <p className="small">{character.notes}</p>}
                    <dl className="meta-list meta-list--compact">
                      <div>
                        <dt>Ngày sinh (khoảng)</dt>
                        <dd>
                          {formatDateInterval(
                            character.birth_date_interval.start_date,
                            character.birth_date_interval.end_date,
                          )}{' '}
                          · {PRECISION_LABELS[character.birth_date_interval.precision] ?? character.birth_date_interval.precision}
                        </dd>
                      </div>
                      <div>
                        <dt>Tuổi tại ngày hành vi</dt>
                        <dd>{formatAgeRange(age)}</dd>
                      </div>
                    </dl>
                  </article>
                )
              })}
            </div>
            <Callout tone="info" title="Cách hệ thống xử lý tuổi">
              Hệ thống chỉ tính khoảng tuổi từ hai khoảng ngày đã ghi nguồn. Hệ thống không áp ngưỡng
              trách nhiệm hình sự; ngưỡng và hệ quả phải là quy tắc đã được người rà soát duyệt.
            </Callout>
          </Card>
        </div>

        <aside>
          <Card>
            <h3>Dòng thời gian</h3>
            <ol className="timeline">
              {caseFile.temporal_context.conduct_events.map((event) => {
                const check = lawChecks.find((item) => item.conductEventId === event.id)
                return (
                  <li key={event.id}>
                    <p className="timeline__date">
                      {formatDateInterval(event.date_interval.start_date, event.date_interval.end_date)}
                    </p>
                    <p className="font-medium">{event.id === 'conduct_01' ? 'Hành vi nghi vấn dịch chuyển tài sản trong ca đêm' : event.id}</p>
                    <Badge tone={check?.status === 'ok' ? 'success' : 'warn'}>
                      {check?.status === 'ok' ? 'Luật đã đối chiếu' : 'Luật chưa phân giải'}
                    </Badge>
                    {check && check.messages.length > 0 && (
                      <ul className="tight-list small">
                        {check.messages.map((message) => (
                          <li key={message}>{message}</li>
                        ))}
                      </ul>
                    )}
                  </li>
                )
              })}
            </ol>
          </Card>

          <Card className="spaced">
            <h3>Tài liệu trong hồ sơ</h3>
            <ul className="doc-list">
              {caseFile.evidence.map((item) => (
                <li key={item.id}>
                  <span>{item.title ?? item.id}</span>
                  <Badge tone="neutral">{EVIDENCE_TYPE_LABELS[item.type ?? ''] ?? item.type ?? 'Tài liệu'}</Badge>
                </li>
              ))}
            </ul>
            <Button
              variant="primary"
              onClick={() => navigate(`case/${caseFile.metadata.id}/evidence`)}
            >
              Mở khu chứng cứ
            </Button>
          </Card>
        </aside>
      </div>
    </div>
  )
}
