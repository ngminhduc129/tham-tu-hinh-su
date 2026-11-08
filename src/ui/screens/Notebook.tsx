import { useMemo, useState } from 'react'
import { outcomeCatalog } from '../../domain/load'
import { formatDateInterval } from '../../domain/legalVersion'
import { REVIEW_STATUS_LABELS, formatCitation, formatSourceRef } from '../labels'
import { Badge, Button, Callout, Card, SectionHeading } from '../components'
import { useGame } from '../GameContext'

export function NotebookScreen() {
  const { caseFile, navigate, lookups } = useGame()
  const [query, setQuery] = useState('')
  const normalized = query.trim().toLowerCase()
  const matches = (text: string) => normalized === '' || text.toLowerCase().includes(normalized)

  const referencedProvisions = useMemo(
    () => new Set(caseFile.references.legal_basis_ids),
    [caseFile.references.legal_basis_ids],
  )

  const glossary = (caseFile.glossary ?? []).filter(
    (entry) => matches(entry.term) || matches(entry.definition),
  )
  const provisions = caseFile.law_bundles.flatMap((bundle) =>
    bundle.provisions
      .filter((provision) => matches(provision.citation) || matches(provision.source_ref))
      .map((provision) => ({ bundle, provision })),
  )
  const outcomes = outcomeCatalog.outcomes.filter(
    (outcome) =>
      caseFile.metadata.learning_outcome_ids.includes(outcome.id) &&
      (matches(outcome.label) || matches(outcome.description)),
  )

  return (
    <div className="screen">
      <SectionHeading
        eyebrow="Tra cứu trong phiên"
        title="Sổ tay thuật ngữ và nguồn pháp lý"
        description={
          <p>
            Các thuật ngữ, điều khoản và mục tiêu học tập xuất hiện trong hồ sơ. Nội dung pháp lý
            trong bản nháp chỉ để luyện đối chiếu, chưa được thẩm định.
          </p>
        }
        actions={
          <Button variant="ghost" onClick={() => navigate(`case/${caseFile.metadata.id}/brief`)}>
            ← Về giới thiệu
          </Button>
        }
      />

      <div className="notebook-toolbar">
        <label className="field">
          <span className="field__legend">Tìm trong sổ tay</span>
          <input
            type="search"
            className="input"
            value={query}
            placeholder="Ví dụ: nguồn, giới hạn, dấu hiệu…"
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <p className="muted small">
          {glossary.length} thuật ngữ · {provisions.length} điều khoản · {outcomes.length} mục tiêu
        </p>
      </div>

      <div className="two-column">
        <div className="stack">
          <Card>
            <h3>Thuật ngữ</h3>
            <dl className="glossary">
              {glossary.map((entry) => (
                <div key={entry.id} className="glossary__entry">
                  <dt>{entry.term}</dt>
                  <dd>
                    {entry.definition}
                    {(entry.legal_basis_ids ?? []).length > 0 && (
                      <p className="muted small">
                        Liên hệ:{' '}
                        {(entry.legal_basis_ids ?? [])
                          .map((id) => formatCitation(lookups.provisions.get(id)?.citation, id))
                          .join('; ')}
                      </p>
                    )}
                  </dd>
                </div>
              ))}
              {glossary.length === 0 && (
                <p className="muted">Không có thuật ngữ khớp từ khóa tìm kiếm.</p>
              )}
            </dl>
          </Card>

          <Card>
            <h3>Điều khoản và nguồn được tham chiếu</h3>
            <ul className="law-list">
              {provisions.map(({ bundle, provision }) => (
                <li key={provision.id}>
                  <div className="chip-row">
                    <Badge tone="warn">
                      {REVIEW_STATUS_LABELS[provision.review_status] ?? provision.review_status}
                    </Badge>
                    <Badge tone="neutral">{bundle.version === 'placeholder-0.1.0' ? 'Bản chưa xác minh' : bundle.version}</Badge>
                    {referencedProvisions.has(provision.id) && (
                      <Badge tone="accent">Hồ sơ tham chiếu</Badge>
                    )}
                  </div>
                  <p>{formatCitation(provision.citation, provision.id)}</p>
                  <dl className="meta-list meta-list--compact">
                    <div>
                      <dt>Hiệu lực</dt>
                      <dd>
                        {formatDateInterval(provision.effective_from, provision.effective_to)}
                      </dd>
                    </div>
                    <div>
                      <dt>Nguồn</dt>
                      <dd>{formatSourceRef(provision.source_ref)}</dd>
                    </div>
                    <div>
                      <dt>Bộ quy định</dt>
                      <dd>
                        {bundle.id === 'law_bundle_v1' ? 'Bộ quy định pháp luật (BLHS & BLTTHS 2015)' : bundle.id} · {bundle.jurisdiction === 'VN' ? 'Việt Nam' : bundle.jurisdiction}
                      </dd>
                    </div>
                  </dl>
                </li>
              ))}
              {provisions.length === 0 && (
                <li className="muted">Không có điều khoản khớp từ khóa tìm kiếm.</li>
              )}
            </ul>
          </Card>
        </div>

        <aside className="stack">
          <Callout tone="warn" title="Nguồn pháp lý chưa xác minh">
            <p>
              Toàn bộ điều khoản trong hồ sơ nháp đang ở trạng thái chưa rà soát hoặc chưa có ngày
              hiệu lực. Không dùng nội dung này như tư vấn pháp lý hoặc trích dẫn chính thức.
            </p>
          </Callout>

          <Card>
            <h3>Mục tiêu học tập của hồ sơ</h3>
            <ul className="outcome-list">
              {outcomes.map((outcome) => (
                <li key={outcome.id}>
                  <strong>{outcome.label}</strong>
                  <p className="small muted">{outcome.description}</p>
                  <span className="mono small muted">{outcome.id}</span>
                </li>
              ))}
              {outcomes.length === 0 && (
                <li className="muted">Không có mục tiêu khớp từ khóa tìm kiếm.</li>
              )}
            </ul>
          </Card>

          <Card>
            <h3>Ghi chú cá nhân</h3>
            <p className="muted small">
              Ghi chú được nhập trong lúc chơi chỉ lưu trên thiết bị này, không gửi đi và không được
              chấm điểm. Bạn có thể xuất toàn bộ phiên ở phần Dữ liệu và cài đặt.
            </p>
            <Button variant="secondary" onClick={() => navigate('settings')}>
              Mở cài đặt dữ liệu
            </Button>
          </Card>
        </aside>
      </div>
    </div>
  )
}
