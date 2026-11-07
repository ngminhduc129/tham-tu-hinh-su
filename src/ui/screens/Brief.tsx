import { Badge, Button, Callout, Card, SectionHeading } from '../components'
import { useGame } from '../GameContext'
import { checkLawResolution, formatDateInterval } from '../../domain/legalVersion'
import { PLAYER_ROLE_COPY } from '../labels'

export function BriefScreen() {
  const { caseFile, navigate } = useGame()
  const conductEvent = caseFile.temporal_context.conduct_events[0]
  const role = PLAYER_ROLE_COPY[caseFile.brief.player_role] ?? {
    title: caseFile.brief.player_role,
    body: '',
  }
  const lawChecks = checkLawResolution(caseFile)
  const unresolved = lawChecks.filter((check) => check.status !== 'ok')

  return (
    <div className="screen">
      <SectionHeading
        eyebrow="Giai đoạn 0 · Giới thiệu"
        title={caseFile.metadata.title}
        description={
          <p>
            Một phiên học mô phỏng, không phải vụ việc thật. Hãy đọc mục tiêu, vai trò và giới hạn
            trước khi mở hồ sơ.
          </p>
        }
        actions={<Badge tone="warn">Bản nháp — chưa thẩm định pháp lý</Badge>}
      />

      <Callout tone="warn" title="Cảnh báo nội dung và phạm vi">
        <p>
          Hồ sơ có mô tả tối giản một vụ mất tài sản hư cấu; không có chi tiết bạo lực. Tình huống và
          phản hồi phục vụ học tập; không phải tư vấn pháp lý cho vụ việc thực tế.
        </p>
      </Callout>

      <div className="brief-grid">
        <Card className="brief-main">
          <h3>Bối cảnh</h3>
          {caseFile.brief.narrative.split('\n\n').map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}

          <h3>Câu hỏi trọng tâm</h3>
          <p className="prompt-box">{caseFile.brief.task_prompt}</p>

          <h3>Thời điểm cần xem xét</h3>
          <p>
            {formatDateInterval(
              conductEvent?.date_interval.start_date ?? null,
              conductEvent?.date_interval.end_date ?? null,
            )}{' '}
            · độ chính xác: {conductEvent?.date_interval.precision ?? 'chưa xác định'}.
          </p>
          {unresolved.length > 0 && (
            <Callout tone="info" title="Chưa phân giải phiên bản luật">
              <p>
                Case đang khai báo thời điểm pháp luật ở trạng thái chưa phân giải. Bạn có thể chơi
                và học cách đối chiếu dữ kiện, nhưng kết luận không có hiệu lực pháp lý và không được
                publish cho đến khi reviewer xác nhận phiên bản luật.
              </p>
            </Callout>
          )}
        </Card>

        <aside className="brief-aside">
          <Card>
            <h3>Vai trò mô phỏng</h3>
            <p className="role-title">{role.title}</p>
            <p>{role.body}</p>
            <p className="muted small">
              Bạn không được gọi là người có thẩm quyền tố tụng thật. Các quyết định trong game không
              tương đương quyết định của cơ quan tiến hành tố tụng.
            </p>
          </Card>

          <Card>
            <h3>Thời điểm pháp luật</h3>
            <p className="muted small">{caseFile.metadata.legal_time_anchor_reason}</p>
            <ul className="status-list">
              {lawChecks.map((check) => (
                <li key={check.conductEventId}>
                  <span>{check.conductEventId}</span>
                  <Badge tone={check.status === 'ok' ? 'success' : 'warn'}>
                    {check.status === 'ok' ? 'Đã đối chiếu' : 'Chưa phân giải'}
                  </Badge>
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <h3>Bạn sẽ luyện</h3>
            <ul className="tight-list">
              <li>Phân biệt nguồn tài liệu với sự kiện cần chứng minh.</li>
              <li>Đánh giá chứng cứ theo bốn lớp riêng biệt.</li>
              <li>So sánh hai giả thuyết cạnh tranh.</li>
              <li>Ánh xạ dữ kiện vào từng dấu hiệu cấu thành.</li>
              <li>Chọn kết luận có thể bảo vệ bằng hồ sơ.</li>
            </ul>
          </Card>
        </aside>
      </div>

      <div className="screen-actions">
        <Button variant="secondary" onClick={() => navigate(`case/${caseFile.metadata.id}/casefile`)}>
          Xem hồ sơ chi tiết
        </Button>
        <Button variant="primary" onClick={() => navigate(`case/${caseFile.metadata.id}/investigation`)}>
          Bắt đầu khám phá
        </Button>
      </div>
    </div>
  )
}
