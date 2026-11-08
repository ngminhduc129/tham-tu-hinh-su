import { manifest } from '../../domain/load'
import { SESSION_SCHEMA_VERSION, sessionKey, type StoredSession } from '../../state/persistence'
import { Badge, Button, Callout, Card, SectionHeading } from '../components'
import { useGame } from '../GameContext'
import { STAGES } from '../../domain/types'

const heroWatermark = new URL('../../assets/illustrations/hellokitty_1.png', import.meta.url).href

interface CaseProgress {
  label: string
  target: string
}

function savedProgress(caseId: string, caseVersion: string): CaseProgress | null {
  try {
    const raw = window.localStorage.getItem(sessionKey(caseId))
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<StoredSession>
    if (parsed.sessionSchemaVersion !== SESSION_SCHEMA_VERSION) return null
    const saved = parsed.session
    if (!saved || saved.caseVersion !== caseVersion) return null

    const submitted = saved.status === 'submitted'
    const hasProgress =
      submitted ||
      saved.viewedEvidenceIds.length > 0 ||
      Object.keys(saved.answers).length > 0
    if (!hasProgress) return null

    return submitted
      ? { label: 'Xem lại kết quả', target: 'feedback' }
      : { label: 'Tiếp tục phiên học', target: saved.currentStage }
  } catch {
    return null
  }
}

export function HomeScreen() {
  const { caseFile, session, navigate } = useGame()
  const hasProgress =
    session.status === 'submitted' ||
    session.viewedEvidenceIds.length > 0 ||
    Object.keys(session.answers).length > 0

  const submitted = session.status === 'submitted'
  const startLabel = submitted ? 'Xem lại kết quả' : hasProgress ? 'Tiếp tục phiên học' : 'Bắt đầu hồ sơ'
  const target = submitted ? 'feedback' : hasProgress ? session.currentStage : 'brief'

  return (
    <main className="home" id="main-content">
      <section className="hero">
        <div className="hero__copy">
          <p className="eyebrow">Trò chơi học tập pháp luật · Tiếng Việt</p>
          <h1>Thám tử Hình sự</h1>
          <p className="hero__lead">
            Đọc hồ sơ hư cấu, tách nguồn tài liệu khỏi sự kiện, đánh giá chứng cứ theo bốn lớp và bảo
            vệ kết luận bằng lập luận — không chỉ bằng một đáp án.
          </p>
          <div className="hero__actions">
            <Button
              variant="primary"
              className="hero__primary-action"
              onClick={() => navigate(`case/${caseFile.metadata.id}/${target}`)}
            >
              {startLabel}
            </Button>
            <Button variant="ghost" onClick={() => navigate('settings')}>
              Dữ liệu và cài đặt
            </Button>
          </div>
          <ul className="hero__facts" aria-label="Thông tin nhanh">
            <li>10–25 phút mỗi hồ sơ</li>
            <li>Không cần tài khoản</li>
            <li>Tiến độ lưu trên thiết bị</li>
          </ul>
        </div>
        <aside className="hero__panel" aria-label="Cách chơi">
          <p className="hero__panel-title">Một phiên học gồm</p>
          <div className="hero__panel-content">
            <ol className="timeline-list">
              {STAGES.filter((stage) => stage.id !== 'feedback').map((stage, index) => (
                <li key={stage.id}>
                  <span className="timeline-list__index" aria-hidden="true">
                    {index + 1}
                  </span>
                  <span>{stage.label}</span>
                </li>
              ))}
              <li>
                <span className="timeline-list__index" aria-hidden="true">
                  ✓
                </span>
                <span>Phản hồi theo từng tiêu chí</span>
              </li>
            </ol>
          </div>
          <img
            className="hero__watermark"
            src={heroWatermark}
            alt=""
            aria-hidden="true"
            width="721"
            height="1280"
            decoding="async"
          />
        </aside>
      </section>

      <section className="principles" aria-label="Nguyên tắc thiết kế">
        <Card className="principle">
          <h2>Lập luận trước đáp án</h2>
          <p>
            Bạn phải chỉ ra dữ kiện, chứng cứ và dấu hiệu được dùng. Chọn đúng nhãn cuối cùng mà không
            có lập luận sẽ không đạt điểm suy luận.
          </p>
        </Card>
        <Card className="principle">
          <h2>Không ép kết luận</h2>
          <p>
            “Chưa đủ dữ kiện/căn cứ” là một kết quả học tập hợp lệ. Hồ sơ luôn có nhánh cho tình huống
            hồ sơ còn khoảng trống.
          </p>
        </Card>
        <Card className="principle">
          <h2>Tách sự kiện khỏi đánh giá</h2>
          <p>
            Độ tin cậy, vấn đề thủ tục và sức hỗ trợ của chứng cứ được đánh giá riêng. Hệ thống không tự
            kết luận giá trị pháp lý của chứng cứ.
          </p>
        </Card>
      </section>

      <section className="case-library">
        <SectionHeading
          eyebrow="Thư viện hồ sơ"
          title="Hồ sơ khả dụng"
          description="Mỗi hồ sơ đi qua cùng quy trình kiểm duyệt trước khi được đưa vào thư viện. Hồ sơ mới chỉ hiển thị khi đã vượt qua bước kiểm tra cấu trúc và tham chiếu chéo."
        />
        {manifest.cases.map((entry) => {
          const isCurrent = entry.id === caseFile.metadata.id
          const progress = isCurrent
            ? { label: startLabel, target }
            : savedProgress(entry.id, entry.version)
          const cardLabel = progress?.label ?? 'Bắt đầu hồ sơ'
          const cardTarget = progress?.target ?? 'brief'

          return (
            <article className="case-card" key={entry.id}>
              <div className="case-card__head">
                <div>
                  <div className="chip-row">
                    <Badge tone="warn">Bản nháp — chưa thẩm định</Badge>
                    {isCurrent ? <Badge tone="accent">Đang mở</Badge> : null}
                    <Badge tone="neutral">{entry.difficulty}</Badge>
                    <Badge tone="accent">
                      {entry.durationMinutes[0]}–{entry.durationMinutes[1]} phút
                    </Badge>
                  </div>
                  <h2>{entry.title}</h2>
                  <p className="case-card__subtitle">{entry.subtitle}</p>
                </div>
                <div className="case-card__status">
                  <span className="muted small">Phiên bản</span>
                  <strong>{entry.version}</strong>
                  <span className="muted small">Hồ sơ + bộ văn bản luật</span>
                </div>
              </div>

              <p>{entry.summary}</p>

              <dl className="fact-grid">
                <div>
                  <dt>Vai trò mô phỏng</dt>
                  <dd>Học viên phân tích hồ sơ</dd>
                </div>
                <div>
                  <dt>Phạm vi</dt>
                  <dd>Hồ sơ hư cấu, một nhiệm vụ học tập</dd>
                </div>
                <div>
                  <dt>Thời điểm pháp luật</dt>
                  <dd>Chưa phân giải — chờ người rà soát</dd>
                </div>
                <div>
                  <dt>Căn cứ pháp luật</dt>
                  <dd>Chưa xác minh</dd>
                </div>
              </dl>

              <Callout tone="warn" title="Hồ sơ đang ở trạng thái nháp">
                {entry.notice} Bạn vẫn có thể chơi để kiểm chứng luồng học tập và hệ thống chấm điểm;
                kết quả không phải kết luận pháp lý và không được dùng như nội dung đã duyệt.
              </Callout>

              <div className="case-card__actions">
                <Button
                  variant="primary"
                  onClick={() => navigate(`case/${entry.id}/${cardTarget}`)}
                >
                  {cardLabel}
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => navigate(`case/${entry.id}/notebook`)}
                >
                  Xem sổ tay và thuật ngữ
                </Button>
              </div>
            </article>
          )
        })}
      </section>

      <section className="home__footer">
        <Callout tone="info" title="Giới hạn của sản phẩm">
          Tình huống và phản hồi phục vụ học tập; không phải tư vấn pháp lý cho vụ việc thực tế. Sản
          phẩm không mô phỏng đầy đủ thủ tục tố tụng Việt Nam và không tự động diễn giải luật.
        </Callout>
        <p className="muted small">
          Phiên bản ứng dụng {manifest.app.version} · lược đồ hồ sơ {manifest.app.schemaVersion} · dữ
          liệu lưu cục bộ trên trình duyệt.
        </p>
      </section>
    </main>
  )
}
