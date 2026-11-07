import { useRef, useState } from 'react'
import { manifest } from '../../domain/load'
import { checkLawResolution } from '../../domain/legalVersion'
import {
  clearAllSessions,
  exportSessionPayload,
  parseSessionImport,
  saveSession,
  SESSION_SCHEMA_VERSION,
} from '../../state/persistence'
import { REVIEW_STATUS_LABELS } from '../labels'
import { Badge, Button, Callout, Card, Modal, SectionHeading } from '../components'
import { useGame } from '../GameContext'
import { downloadText, timestampForFilename } from '../download'

export function SettingsScreen() {
  const {
    caseFile,
    session,
    dispatch,
    navigate,
    appVersion,
    storageIssue,
    dismissStorageIssue,
    restartCase,
  } = useGame()
  const inputRef = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState<{ tone: 'success' | 'danger'; text: string } | null>(null)
  const [resetOpen, setResetOpen] = useState(false)
  const [clearOpen, setClearOpen] = useState(false)

  const lawChecks = checkLawResolution(caseFile)

  const handleExport = () => {
    try {
      const stored = saveSession(window.localStorage, session, appVersion)
      downloadText(
        `phien-${caseFile.metadata.id}-${timestampForFilename()}.json`,
        exportSessionPayload(stored),
      )
      setMessage({ tone: 'success', text: 'Đã tạo tệp JSON chứa phiên chơi hiện tại.' })
    } catch {
      setMessage({
        tone: 'danger',
        text: 'Trình duyệt không cho phép tạo bản sao lưu cục bộ. Hãy kiểm tra quyền lưu dữ liệu của trang.',
      })
    }
  }

  const handleImport = async (file: File | null) => {
    if (!file) return
    try {
      const text = await file.text()
      const result = parseSessionImport(text, caseFile.metadata.id, caseFile.metadata.version)
      if (!result.ok) {
        setMessage({ tone: 'danger', text: `Không nhập được: ${result.error}` })
        return
      }
      dispatch({ type: 'IMPORT', session: result.stored.session })
      dismissStorageIssue()
      setMessage({
        tone: 'success',
        text: `Đã nhập phiên từ ${file.name}. Tiến độ tiếp tục được lưu trên thiết bị.`,
      })
    } catch {
      setMessage({ tone: 'danger', text: 'Không đọc được tệp đã chọn.' })
    } finally {
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const handleExportInvalid = () => {
    if (!storageIssue) return
    downloadText(
      `ban-luu-loi-${caseFile.metadata.id}-${timestampForFilename()}.json`,
      storageIssue.raw,
    )
    setMessage({ tone: 'success', text: 'Đã tải bản lưu lỗi để bạn kiểm tra hoặc lưu trữ.' })
  }

  const handleReset = () => {
    restartCase()
    setResetOpen(false)
    setMessage({ tone: 'success', text: 'Đã tạo phiên mới. Câu trả lời cũ đã được xóa.' })
    navigate(`case/${caseFile.metadata.id}/brief`)
  }

  const handleClearAll = () => {
    const removed = clearAllSessions(window.localStorage)
    restartCase()
    setClearOpen(false)
    setMessage({
      tone: 'success',
      text: `Đã xóa ${removed} bản ghi cục bộ và tạo phiên mới.`,
    })
  }

  return (
    <div className="screen">
      <SectionHeading
        eyebrow="Dữ liệu và cài đặt"
        title="Quản lý phiên chơi trên thiết bị"
        description={
          <p>
            Trò chơi không có tài khoản, không gửi dữ liệu lên máy chủ và không dùng telemetry. Tiến
            độ nằm trong localStorage của trình duyệt này.
          </p>
        }
        actions={
          <Button variant="ghost" onClick={() => navigate('')}>
            ← Về trang chủ
          </Button>
        }
      />

      {message && (
        <Callout
          tone={message.tone === 'success' ? 'success' : 'danger'}
          title={message.tone === 'success' ? 'Thành công' : 'Có lỗi'}
        >
          <p>{message.text}</p>
        </Callout>
      )}

      {storageIssue && (
        <Card className="storage-issue">
          <div className="chip-row">
            <Badge tone="danger">Bản lưu không dùng được</Badge>
            {storageIssue.backupKey && (
              <span className="mono small">Bản sao: {storageIssue.backupKey}</span>
            )}
          </div>
          <h3>Dữ liệu cũ vẫn được giữ, không tự ghi đè</h3>
          <p>{storageIssue.reason}</p>
          <p className="muted small">
            Ứng dụng đã tạo phiên mới để bạn tiếp tục. Bạn có thể tải bản lưu cũ để kiểm tra, hoặc
            xóa nó và bắt đầu lại.
          </p>
          <div className="inline-actions">
            {storageIssue.raw && (
              <Button variant="secondary" onClick={handleExportInvalid}>
                Tải bản lưu lỗi
              </Button>
            )}
            <Button
              variant="danger"
              onClick={() => {
                restartCase()
                setMessage({
                  tone: 'success',
                  text: 'Đã xóa bản lưu lỗi và bắt đầu phiên mới.',
                })
              }}
            >
              Xóa bản lưu lỗi
            </Button>
          </div>
        </Card>
      )}

      <div className="two-column">
        <div className="stack">
          <Card>
            <h3>Sao lưu và khôi phục</h3>
            <p className="small">
              Tệp xuất chứa toàn bộ câu trả lời, ghi chú, tiến độ mở tài liệu và kết quả đã nộp. Chỉ
              chia sẻ tệp nếu bạn muốn người khác xem phiên học của mình.
            </p>
            <div className="settings-actions">
              <Button variant="primary" onClick={handleExport}>
                Xuất phiên chơi (JSON)
              </Button>
              <Button variant="secondary" onClick={() => inputRef.current?.click()}>
                Nhập phiên từ tệp
              </Button>
              <input
                ref={inputRef}
                type="file"
                accept="application/json,.json"
                className="sr-only"
                aria-label="Chọn tệp phiên chơi để nhập"
                onChange={(event) => {
                  void handleImport(event.target.files?.[0] ?? null)
                }}
              />
            </div>
            <p className="muted small">
              Tệp nhập phải đúng case, đúng phiên bản case và đúng schema phiên chơi. Tệp không hợp
              lệ sẽ bị từ chối, không ghi đè dữ liệu hiện tại.
            </p>
          </Card>

          <Card>
            <h3>Đặt lại dữ liệu</h3>
            <p className="small">
              Các thao tác dưới đây xóa dữ liệu cục bộ và không thể hoàn tác nếu bạn chưa xuất tệp
              sao lưu.
            </p>
            <div className="settings-actions">
              <Button variant="secondary" onClick={() => setResetOpen(true)}>
                Làm lại case hiện tại
              </Button>
              <Button variant="danger" onClick={() => setClearOpen(true)}>
                Xóa toàn bộ dữ liệu trò chơi
              </Button>
            </div>
          </Card>

          <Card>
            <h3>Về sản phẩm</h3>
            <p>
              <strong>Thám tử Hình sự</strong> là trò chơi học tập phản biện về đọc hồ sơ, đánh giá
              chứng cứ và phân tích pháp lý trong tình huống hư cấu.
            </p>
            <Callout tone="info" title="Không phải tư vấn pháp lý">
              <p>
                Tình huống và phản hồi phục vụ học tập; không phải tư vấn pháp lý cho vụ việc thực
                tế. Sản phẩm không mô phỏng đầy đủ thủ tục tố tụng Việt Nam và không tự động diễn
                giải luật.
              </p>
            </Callout>
            <p className="muted small">
              Không có backend, không có tài khoản, không có telemetry. Dữ liệu chỉ tồn tại trong
              trình duyệt cho đến khi bạn xóa.
            </p>
          </Card>
        </div>

        <aside className="stack">
          <Card>
            <h3>Phiên bản</h3>
            <dl className="meta-list meta-list--compact">
              <div>
                <dt>Ứng dụng</dt>
                <dd>{manifest.app.version}</dd>
              </div>
              <div>
                <dt>Schema case</dt>
                <dd>{manifest.app.schemaVersion}</dd>
              </div>
              <div>
                <dt>Schema phiên chơi</dt>
                <dd>{SESSION_SCHEMA_VERSION}</dd>
              </div>
              <div>
                <dt>Case</dt>
                <dd>
                  {caseFile.metadata.id} · {caseFile.metadata.version}
                </dd>
              </div>
              <div>
                <dt>Trạng thái case</dt>
                <dd>
                  <Badge tone="warn">{caseFile.metadata.status}</Badge>
                </dd>
              </div>
            </dl>
          </Card>

          <Card>
            <h3>Thư viện luật của case</h3>
            <ul className="law-list">
              {caseFile.law_bundles.map((bundle) => (
                <li key={bundle.id}>
                  <strong>{bundle.id}</strong>
                  <p className="muted small">
                    {bundle.version} · {bundle.jurisdiction}
                  </p>
                  <ul className="tight-list small">
                    {bundle.provisions.map((provision) => (
                      <li key={provision.id}>
                        {provision.citation}
                        <br />
                        <Badge tone="warn">
                          {REVIEW_STATUS_LABELS[provision.review_status] ?? provision.review_status}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <h3>Trạng thái phân giải luật</h3>
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
            <p className="muted small">
              Kết quả học tập vẫn được lưu cùng phiên bản case và law bundle tại thời điểm nộp.
            </p>
          </Card>

          <Button
            variant="secondary"
            className="full-width"
            onClick={() => navigate(`case/${caseFile.metadata.id}/notebook`)}
          >
            Mở sổ tay thuật ngữ
          </Button>
        </aside>
      </div>

      <Modal
        open={resetOpen}
        title="Làm lại case hiện tại?"
        onClose={() => setResetOpen(false)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setResetOpen(false)}>
              Giữ phiên hiện tại
            </Button>
            <Button variant="danger" onClick={handleReset}>
              Xóa và tạo phiên mới
            </Button>
          </>
        }
      >
        <p>
          Toàn bộ câu trả lời, ghi chú, gợi ý đã mở và kết quả đã nộp của case này sẽ bị xóa khỏi
          thiết bị.
        </p>
      </Modal>

      <Modal
        open={clearOpen}
        title="Xóa toàn bộ dữ liệu trò chơi?"
        onClose={() => setClearOpen(false)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setClearOpen(false)}>
              Hủy
            </Button>
            <Button variant="danger" onClick={handleClearAll}>
              Xóa toàn bộ và bắt đầu lại
            </Button>
          </>
        }
      >
        <p>
          Thao tác này xóa mọi phiên chơi và bản sao lưu do trò chơi lưu trong trình duyệt này. Nếu
          muốn giữ tiến độ, hãy xuất tệp JSON trước.
        </p>
      </Modal>
    </div>
  )
}
