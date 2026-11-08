import { useEffect, useMemo, useReducer, useState } from 'react'
import { loadCase, manifest } from './domain/load'
import { buildLookups } from './domain/lookups'
import { STAGES, type CaseFile, type GameSession, type Stage } from './domain/types'
import { createSession, gameReducer } from './state/reducer'
import {
  clearSession,
  loadSession,
  saveSession,
} from './state/persistence'
import { GameContext, type GameContextValue, type StorageIssue } from './ui/GameContext'
import { navigate as navigateRoute, useHashRoute, type Route } from './ui/router'
import { Badge, Button, Callout, Card, Stepper } from './ui/components'
import { HomeScreen } from './ui/screens/Home'
import { BriefScreen } from './ui/screens/Brief'
import { CaseFileScreen } from './ui/screens/CaseFile'
import { EvidenceBoardScreen } from './ui/screens/EvidenceBoard'
import { HypothesesScreen } from './ui/screens/Hypotheses'
import { ProofMatrixScreen } from './ui/screens/ProofMatrix'
import { AnalysisScreen } from './ui/screens/Analysis'
import { SubmissionScreen } from './ui/screens/Submission'
import { FeedbackScreen } from './ui/screens/Feedback'
import { NotebookScreen } from './ui/screens/Notebook'
import { SettingsScreen } from './ui/screens/Settings'

const STAGE_ROUTES = new Map<string, Stage>([
  ...STAGES.map((stage) => [stage.route, stage.id] as [string, Stage]),
  ['investigation', 'evidence'],
])

interface BootResult {
  session: GameSession
  issue: StorageIssue | null
}

function bootSession(caseFile: CaseFile): BootResult {
  try {
    const result = loadSession(
      window.localStorage,
      caseFile.metadata.id,
      caseFile.metadata.version,
    )
    if (result.status === 'ok') return { session: result.stored.session, issue: null }
    if (result.status === 'invalid') {
      return {
        session: createSession(caseFile),
        issue: { reason: result.reason, raw: result.raw, backupKey: result.backupKey },
      }
    }
  } catch {
    return {
      session: createSession(caseFile),
      issue: {
        reason:
          'Trình duyệt không cho phép truy cập bộ nhớ cục bộ, nên tiến độ sẽ không được lưu tự động trong phiên này.',
        raw: '',
        backupKey: null,
      },
    }
  }
  return { session: createSession(caseFile), issue: null }
}

function NotFoundScreen() {
  return (
    <main id="main-content" className="app-main">
      <Card>
        <h1>Không tìm thấy trang</h1>
        <p>Đường dẫn không tồn tại hoặc hồ sơ không có trong bản dựng này.</p>
        <Button variant="primary" onClick={() => navigateRoute('')}>
          Về trang chủ
        </Button>
      </Card>
    </main>
  )
}

function LoadErrorScreen({ errors }: { errors: string[] }) {
  return (
    <main id="main-content" className="app-main">
      <Card>
        <h1>Không tải được nội dung hồ sơ</h1>
        <p>
          Nội dung chưa qua kiểm tra hoặc tệp hồ sơ hoặc bộ văn bản luật bị thiếu. Ứng dụng không cố chấp nhận
          dữ liệu sai cấu trúc.
        </p>
        <Callout tone="danger" title="Chi tiết lỗi">
          <ul className="tight-list">
            {errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </Callout>
        <p className="muted small">
          Chạy <code>npm run lint:content</code> để xem lỗi cấu trúc và tham chiếu chéo.
        </p>
      </Card>
    </main>
  )
}

function CaseScreenRouter({
  route,
  caseFile,
}: {
  route: Extract<Route, { kind: 'case' }>
  caseFile: CaseFile
}) {
  const screen = route.screen
  if (screen === 'brief') return <BriefScreen />
  if (screen === 'casefile') return <CaseFileScreen />
  if (screen === 'investigation') return <EvidenceBoardScreen />
  if (screen === 'evidence') return <EvidenceBoardScreen />
  if (screen === 'hypotheses') return <HypothesesScreen />
  if (screen === 'analysis') return <AnalysisScreen />
  if (screen === 'proof') return <ProofMatrixScreen />
  if (screen === 'submission') return <SubmissionScreen />
  if (screen === 'feedback') return <FeedbackScreen />
  if (screen === 'notebook') return <NotebookScreen />
  return (
    <Card>
      <h1>Màn hình chưa hỗ trợ</h1>
      <p>
        Màn hình này chưa được nối trong bản dựng hiện tại của hồ sơ {caseFile.metadata.id}.
      </p>
    </Card>
  )
}

function GameShell({ caseFile, route }: { caseFile: CaseFile; route: Route }) {
  const [boot] = useState<BootResult>(() => bootSession(caseFile))
  const [session, dispatch] = useReducer(gameReducer, boot.session)
  const [storageIssue, setStorageIssue] = useState<StorageIssue | null>(boot.issue)
  const lookups = useMemo(() => buildLookups(caseFile), [caseFile])
  const readOnly = session.status === 'submitted'
  const appVersion = manifest.app.version
  const navigate = (path: string) => navigateRoute(path)

  useEffect(() => {
    if (storageIssue) return
    try {
      saveSession(window.localStorage, session, appVersion)
    } catch {
      // Không có localStorage: phiên vẫn chạy trong bộ nhớ, không chặn người học.
    }
  }, [session, storageIssue, appVersion])

  useEffect(() => {
    if (route.kind !== 'case') return
    const stage = STAGE_ROUTES.get(route.screen)
    if (!stage || session.currentStage === stage) return
    dispatch({ type: 'SET_STAGE', stage })
  }, [route, session.currentStage])

  const restartCase = () => {
    try {
      clearSession(window.localStorage, caseFile.metadata.id)
    } catch {
      // Bỏ qua: phiên mới vẫn hoạt động trong bộ nhớ.
    }
    setStorageIssue(null)
    dispatch({ type: 'RESET', session: createSession(caseFile) })
  }

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const saved = window.localStorage.getItem('theme')
      if (saved === 'dark' || saved === 'light') return saved
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
    } catch {
      return 'light'
    }
  })

  useEffect(() => {
    try {
      document.documentElement.setAttribute('data-theme', theme)
      if (theme === 'dark') {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
      window.localStorage.setItem('theme', theme)
    } catch {
      // Bỏ qua nếu không có localStorage
    }
  }, [theme])

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))
  }

  const contextValue: GameContextValue = {
    caseFile,
    lookups,
    session,
    dispatch,
    navigate,
    readOnly,
    appVersion,
    storageIssue,
    dismissStorageIssue: () => setStorageIssue(null),
    restartCase,
    theme,
    toggleTheme,
  }

  const caseMatches =
    route.kind !== 'case' || route.caseId === caseFile.metadata.id
  const isCaseRoute = route.kind === 'case' && caseMatches
  const needsSubmission =
    isCaseRoute && route.screen === 'feedback' && session.status !== 'submitted'

  return (
    <GameContext.Provider value={contextValue}>
      <a className="skip-link" href="#main-content">
        Bỏ qua điều hướng
      </a>

      <header className="app-header">
        <div className="app-header__inner">
          <button
            type="button"
            className="brand"
            onClick={() => navigate('')}
            aria-label="Thám tử Hình sự — về trang chủ"
          >
            <span className="brand__mark" aria-hidden="true">
              TH
            </span>
            <span className="brand__text">
              <span className="brand__name">Thám tử Hình sự</span>
              <span className="brand__tagline">Học phân tích hồ sơ</span>
            </span>
          </button>

          <div className="app-header__meta">
            <span className="case-chip" title="Hồ sơ vụ án đang mở">
              Vụ án {caseFile.metadata.id === 'case_001' ? '001' : caseFile.metadata.id} · bản {caseFile.metadata.version}
            </span>
            {session.status === 'submitted' && <Badge tone="success">Đã nộp bài</Badge>}
            <button
              type="button"
              className="theme-toggle-button"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
              title={theme === 'dark' ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
            >
              {theme === 'dark' ? '☀️ Sáng' : '🌙 Tối'}
            </button>
            <nav className="header-nav" aria-label="Điều hướng phụ">
              <button
                type="button"
                className="header-link"
                onClick={() => navigate(`case/${caseFile.metadata.id}/notebook`)}
              >
                Sổ tay
              </button>
              <button type="button" className="header-link" onClick={() => navigate('settings')}>
                Cài đặt
              </button>
            </nav>
          </div>
        </div>
      </header>

      {storageIssue && route.kind !== 'settings' && (
        <div className="app-banner">
          <Callout tone="danger" title="Bản lưu cục bộ không dùng được">
            <p>{storageIssue.reason}</p>
            <div className="inline-actions">
              <Button variant="secondary" onClick={() => navigate('settings')}>
                Xử lý trong cài đặt
              </Button>
              <Button variant="ghost" onClick={restartCase}>
                Bắt đầu phiên mới
              </Button>
            </div>
          </Callout>
        </div>
      )}

      {route.kind === 'home' && <HomeScreen />}

      {route.kind === 'settings' && (
        <main id="main-content" className="app-main">
          <SettingsScreen />
        </main>
      )}

      {isCaseRoute && (
        <main id="main-content" className="app-main">
          <Stepper />
          {needsSubmission ? (
            <Card className="guard-card">
              <h2>Chưa có kết quả để xem</h2>
              <p>
                Phản hồi chỉ mở sau khi bạn nộp bài. Câu trả lời hiện tại vẫn được giữ nguyên.
              </p>
              <Button
                variant="primary"
                onClick={() => navigate(`case/${caseFile.metadata.id}/submission`)}
              >
                Đi tới phần kết luận
              </Button>
            </Card>
          ) : (
            <>
              {session.status === 'submitted' && route.screen !== 'feedback' && (
                <Callout tone="info" title="Bài đã nộp">
                  <p>
                    Câu trả lời đang ở chế độ chỉ đọc. Mở phần phản hồi để xem kết quả, hoặc mở lại
                    bài nếu muốn sửa.
                  </p>
                  <div className="inline-actions">
                    <Button
                      variant="secondary"
                      onClick={() => navigate(`case/${caseFile.metadata.id}/feedback`)}
                    >
                      Xem phản hồi
                    </Button>
                  </div>
                </Callout>
              )}
              <CaseScreenRouter route={route} caseFile={caseFile} />
            </>
          )}
        </main>
      )}

      {route.kind === 'notfound' && <NotFoundScreen />}

      {route.kind === 'case' && !caseMatches && <NotFoundScreen />}

      <footer className="app-footer">
        <p>
          Tình huống và phản hồi phục vụ học tập; không phải tư vấn pháp lý cho vụ việc thực tế.
          Không mô phỏng đầy đủ thủ tục tố tụng Việt Nam.
        </p>
        <p className="muted small">
          {manifest.app.name} {appVersion} · dữ liệu lưu cục bộ · không dùng dữ liệu đo lường từ xa
        </p>
      </footer>
    </GameContext.Provider>
  )
}

export function App() {
  const route = useHashRoute()
  const loaded = useMemo(() => {
    const firstCase = manifest.cases[0]
    if (!firstCase) {
      return { ok: false as const, errors: ['Danh mục không có hồ sơ nào.'] }
    }
    return loadCase(firstCase.id)
  }, [])

  if (!loaded.ok) {
    return <LoadErrorScreen errors={loaded.errors} />
  }

  return <GameShell caseFile={loaded.caseFile} route={route} />
}
