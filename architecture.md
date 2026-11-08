# Thám tử Hình sự — Tài liệu kiến trúc

> Được tạo từ phân tích mã nguồn (React 19 + TypeScript + Vite 7, chỉ chạy trên trình duyệt)

---

## 1. Tổng quan cấp cao

### 1.1 Mục đích
Trò chơi lập luận pháp lý tiếng Việt chạy trên trình duyệt: người học đọc hồ sơ vụ án hình sự hư cấu, đánh giá chứng cứ qua bốn lớp, ánh xạ dữ kiện sang dấu hiệu định danh, so sánh các giả thuyết cạnh tranh và nộp kết luận có cấu trúc kèm căn cứ pháp lý. Không có máy chủ, không có tài khoản, không có dữ liệu đo lường từ xa — toàn bộ trạng thái nằm trong `localStorage`.

### 1.2 Công nghệ
| Lớp | Công nghệ |
|-------|------------|
| Khung giao diện | React 19 + TypeScript |
| Dựng | Vite 7 |
| Kiểm thử | Vitest (160 bài kiểm thử, 21 tệp) + Testing Library + happy-dom |
| Kiểm thử trình duyệt | Playwright (Chromium), đo tràn ngang và cỡ chữ ở 5 độ rộng |
| Kiểm tra hợp lệ | Ajv 2020 + ajv-formats (lược đồ JSON bản 2020-12) |
| Định tuyến | Bộ định tuyến hash tự viết (`#/case/<id>/<screen>`) |
| Trạng thái | `useReducer` + lưu trữ bằng `localStorage` |
| Giao diện | CSS tự viết (thuộc tính tuỳ chỉnh CSS, chủ đề sáng/tối) |
| Kiểu chữ | Source Serif 4, IBM Plex Sans, IBM Plex Mono — tự lưu qua `@fontsource` |
| Nội dung | JSON (hồ sơ, bộ văn bản luật, danh mục, mục tiêu học tập) |

### 1.3 Quyết định kiến trúc chính
- **Tách bộ văn bản luật khỏi hồ sơ** — nhiều hồ sơ có thể dùng chung một bộ văn bản luật (`src/content/laws/law_bundle_v1.json`)
- **Cú pháp nghiêm ngặt cho đường đáp án** — biểu thức `all`/`any`/`equals`/`contains`/`is_empty`; đường đáp án phải khớp đầy đủ
- **Quy tắc nhất quán chạy trước khi chấm điểm** — lỗi chặn = không có điểm, không nộp bài hợp lệ
- **Kiểm tra hai lớp** — Lớp 1: lược đồ Ajv (cấu trúc/tham chiếu); Lớp 2: bộ kiểm tra ngữ nghĩa (bất biến, chồng lấn đường đáp án, nội dung mồ côi)
- **Cổng xuất bản** — `metadata.status !== 'approved'` cùng 17 mục chặn xuất bản ngăn triển khai bản phát hành
- **Đánh phiên bản lược đồ** — 2.1.0 (tương thích ngược với 2.0.0); tệp hồ sơ mang `schema_version`

---

## 2. Cấu trúc dự án

```
src/
├── App.tsx                      # Khởi động, định tuyến, nhà cung cấp GameContext, khung ứng dụng
├── main.tsx                     # Điểm vào: nạp font tự lưu + gắn ứng dụng
├── styles.css                   # 2606 dòng: token thiết kế, kiểu chữ, thành phần, màn hình, thích ứng
├── content/
│   ├── manifest.json            # Danh mục hồ sơ, cờ chơi được/xuất bản được
│   ├── learning-outcomes.json   # Danh mục mục tiêu học tập toàn cục
│   ├── cases/case_001.json      # Hồ sơ nháp (lược đồ 2.0.0)
│   └── laws/law_bundle_v1.json  # Bộ văn bản luật tách riêng (điều khoản chưa rà soát)
├── domain/
│   ├── types.ts                 # 510 dòng: toàn bộ giao diện TypeScript
│   ├── load.ts                  # Nạp hồ sơ + ghép bộ văn bản luật + kiểm tra bằng Ajv
│   ├── validate.ts              # Kiểm tra lược đồ Ajv (Lớp 1)
│   ├── answers.ts               # Danh mục đáp án + so sánh chọn nhiều
│   ├── expr.ts                  # Kiểu biểu thức DSL (IdAtom, EmptyAtom, GroupExpr)
│   ├── matching.ts              # So khớp đường đáp án + đánh giá quy tắc nhất quán
│   ├── scoring.ts               # Tỷ lệ kỳ vọng có trọng số, làm tròn một lần ở 100
│   ├── evidence.ts              # Quy tắc mở khoá (always/viewed/check/unavailable)
│   ├── age.ts                   # Khoảng tuổi từ DateInterval (chưa rõ nếu thiếu dữ liệu)
│   ├── legalVersion.ts          # Phân giải luật nhiều đoạn hiệu lực (crosses/incomplete/ok)
│   ├── semantic.ts              # Lớp 2: bộ kiểm tra bất biến ngữ nghĩa
│   ├── lookups.ts               # Bản đồ chỉ mục cho giao diện (evidenceById, chargeById, v.v.)
│   ├── linter.ts                # Tham chiếu chéo + cổng xuất bản (chế độ nháp và xuất bản)
│   └── *.test.ts                # 21 tệp kiểm thử, 160 bài kiểm thử
├── state/
│   ├── reducer.ts               # GameAction + chuyển trạng thái phiên chơi
│   └── persistence.ts           # localStorage (phiên chơi + sao lưu + xuất/nhập)
├── ui/
│   ├── GameContext.tsx          # Ngữ cảnh React: caseFile, lookups, session, dispatch, navigate
│   ├── router.ts                # Bộ định tuyến hash (parseRoute, useHashRoute, navigate)
│   ├── components.tsx           # 409 dòng: Button, Badge, Card, Callout, Stepper, điều khiển biểu mẫu, Modal, HintPanel
│   ├── labels.ts                # 230 dòng: toàn bộ nhãn hiển thị, bộ định dạng, nhãn đường đáp án/danh mục
│   ├── evidence-detail.tsx      # EvidenceDetail + EvidenceAssessmentFields
│   ├── screens/                 # 12 màn hình (xem Mục 4)
│   └── *.test.tsx               # Kiểm thử giao diện bằng Testing Library
└── test/
    ├── setup.ts                 # Thiết lập Vitest
    ├── test-utils.tsx           # Hàm hỗ trợ hiển thị
    └── e2e-playthrough.test.ts  # Kiểm thử hành trình bộ giảm trạng thái
e2e/
└── typography.spec.ts           # Playwright: tràn ngang, cỡ chữ, font tiếng Việt
playwright.config.ts             # Cấu hình Playwright + máy chủ dev
```

---

## 3. Kiến trúc miền nghiệp vụ

### 3.1 Kiểu cốt lõi (`domain/types.ts`)

| Nhóm | Kiểu chính |
|----------|-----------|
| **Cấu trúc hồ sơ** | `CaseFile`, `CaseMetadata`, `CaseManifestEntry`, `Manifest` |
| **Bản ghi nội dung** | `EvidenceRecord`, `ProceduralDefect`, `EvidenceLimitation`, `Hypothesis`, `Issue`, `Hint`, `GlossaryEntry`, `Explanation`, `Character`, `Fact` |
| **Pháp lý** | `LawProvision`, `LawBundle`, `LawResolution`, `LawResolutionSegment`, `ConductEvent`, `Charge`, `ChargeElement`, `ChargeComparison`, `AgeRule`, `AgeCondition`, `Circumstance`, `Conclusion` |
| **Hệ thống đáp án** | `AnswerField`, `AnswerOption`, `ExpectedResponse`, `AnswerPath`, `ConsistencyRule`, `Criterion`, `PathSelection`, `Scoring`, `Review` |
| **Biểu thức DSL** | `IdAtom` (equals/not_equals/contains/not_contains), `EmptyAtom` (is_empty/is_not_empty), `GroupExpr` (all/any) |
| **Phiên chơi và chấm điểm** | `GameSession`, `Answers`, `ScoreResult`, `CriterionResult`, `ExpectationResult`, `ConsistencyResult`, `DiagnosticCriterionResult` |

### 3.2 Luồng dữ liệu: nạp hồ sơ (`domain/load.ts`)

```
manifest.cases[0] → getCaseEntry()
       ↓
RAW_CASES['case_001'] (JSON gốc chưa có law_bundles)
       ↓
metadata.law_bundle_ids → LAW_BUNDLES[bundleId] (từ law_bundle_v1.json)
       ↓
Ghép: { ...rawCase, law_bundles: bundles[] }
       ↓
validateCaseSchema() → Ajv (Lớp 1)
       ↓
Kiểm tra metadata.id/version khớp danh mục
       ↓
Trả về CaseFile (đã gắn law_bundles)
```

**Bất biến chính**: Hồ sơ trên đĩa không bao giờ chứa nội dung luật — bộ văn bản được ghép vào lúc nạp.

### 3.3 Hệ thống đáp án

- **Danh mục trước**: chỉ `answer_fields[]` khai báo trong hồ sơ mới lưu được câu trả lời
- **Dạng lưu**: `answers[fieldId][targetId] = string | string[]`
- **Không chấm văn bản tự do** — ghi chú cá nhân ở `session.notes` (không chấm điểm)
- **Chọn nhiều** = khớp đúng tập (`accepted_values[]` không phụ thuộc thứ tự)

### 3.4 So khớp đường đáp án và nhất quán (`domain/matching.ts`)

```
consistency_rules[] (đánh giá TRƯỚC)
       ↓
Nếu có lỗi chặn → ScoreResult { blocking: true, total: null, criteria: [] }
       ↓
Ngược lại: đánh giá answer_paths[] theo thứ tự (hoặc path_selection.priority)
       ↓
Mỗi path.match (biểu thức DSL) → phải thoả mãn đầy đủ
       ↓
Đường khớp đầu tiên thắng (hoặc path_selection.mode = 'priority'/'exclusive')
       ↓
Không đường nào khớp → ScoreResult { unmatched: true, total: null, diagnostics }
```

**Các kiểu biểu thức DSL**:
```typescript
// Nguyên tử
{ op: 'equals', fieldId, targetId, value }
{ op: 'contains', fieldId, targetId, value }
{ op: 'is_empty', fieldId, targetId }

// Nhóm
{ op: 'all', args: Expr[] }
{ op: 'any', args: Expr[] }
```

### 3.5 Chấm điểm (`domain/scoring.ts`)

```
Với mỗi tiêu chí trên đường đã khớp:
  earned = max_points × (Σ trọng số kỳ vọng đạt) / (Σ trọng số kỳ vọng áp dụng)

Tổng = round(Σ criterion.earned)  // làm tròn một lần ở cuối, kẹp trong [0, 100]
```

- `scoring.max_total_points = 100` (lược đồ 2.1.0)
- `partial_credit.weight_scope = 'within_criterion'` (trọng số chuẩn hoá theo từng tiêu chí)
- Gợi ý được ghi nhận trong `selectedHints[]` — **không trừ điểm**

### 3.6 Mở khoá chứng cứ (`domain/evidence.ts`)

| Quy tắc mở khoá | Hành vi |
|----------------|----------|
| `{ kind: 'always' }` | Đọc được ngay |
| `{ kind: 'viewed', evidence_ids[], mode: 'all'|'any' }` | Mở khoá sau khi xem chứng cứ phụ thuộc |
| `{ kind: 'check', label, requires_viewed[] }` | Phải xem các chứng cứ phụ thuộc, sau đó người dùng bấm nút yêu cầu kiểm tra |
| `{ kind: 'unavailable' }` | Không bao giờ mở được |

Chỉ theo dõi tiến độ — không chấm điểm.

### 3.7 Phân giải phiên bản luật (`domain/legalVersion.ts`)

| Trạng thái | Ý nghĩa |
|--------|---------|
| `ok` | Đã phân giải điều khoản, có ngày, nằm trong hiệu lực |
| `crosses_version` | Hành vi vắt qua nhiều phiên bản điều khoản → cần `segments[]` |
| `incomplete` | Thiếu ngày hiệu lực |
| `invalid` | Chưa phân giải, điều khoản chưa rà soát, cấu hình đoạn sai |

**Nhiều đoạn hiệu lực** (`lược đồ 2.1.0`): `conduct_event.law_resolution.segments[]` phải không chồng lấn, liền nhau, phủ kín khoảng thời gian hành vi, mỗi đoạn tham chiếu đúng bộ văn bản.

### 3.8 Bộ kiểm tra ngữ nghĩa Lớp 2 (`domain/semantic.ts`)

Kiểm tra các bất biến mà Ajv không thể diễn đạt:

| Kiểm tra | Mã |
|-------|------|
| Kỳ vọng duy nhất cho mỗi nhóm chấm | `sem_unique_expectation` |
| Có `max_total_points` + `weight_scope` | `sem_scoring_invariant` |
| Thứ tự chọn đường đáp án = hoán vị đầy đủ | `sem_path_selection_order` |
| Các đường loại trừ không chồng lấn | `sem_path_exclusive_overlap` |
| Tham chiếu trỏ tới điều khoản/bộ văn bản hợp lệ | `sem_reference_integrity` |
| Vấn đề nghiêm trọng ↔ critical_issue_ids khớp nhau | `sem_critical_issues` |
| Không có chu trình mở khoá chứng cứ | `sem_discovery_cycle` |
| Không có nội dung mồ côi (phần giải thích không dùng, v.v.) | `sem_explanation_unused` |
| Dấu hiệu bắt buộc có fact_ids | `sem_element_facts` |

---

## 4. Kiến trúc giao diện

### 4.1 Sơ đồ màn hình (12 màn hình)

| # | Màn hình | Định tuyến | Mục đích |
|---|--------|-------|---------|
| 1 | **HomeScreen** | `#/` | Chọn hồ sơ, hướng dẫn nhập môn, nguyên tắc |
| 2 | **BriefScreen** | `#/case/<id>/brief` | Tường thuật, yêu cầu nhiệm vụ, vai trò người chơi, trạng thái phân giải luật |
| 3 | **CaseFileScreen** | `#/case/<id>/casefile` | Dữ kiện (kèm nguồn), nhân vật (khoảng tuổi), dòng thời gian, danh sách tài liệu |
| 4 | **EvidenceBoardScreen** | `#/case/<id>/evidence` | **Không gian chứng cứ chính** — mở khoá, đánh giá 4 lớp, tiến độ |
| 5 | **InvestigationScreen** | `#/case/<id>/investigation` | Mở khoá chứng cứ rút gọn (không có giao diện đánh giá) |
| 6 | **HypothesesScreen** | `#/case/<id>/hypotheses` | Hai giả thuyết cạnh tranh; gắn chứng cứ làm ủng hộ/phản bác |
| 7 | **ProofMatrixScreen** | `#/case/<id>/proof` | Mệnh đề kèm liên kết chứng cứ (quan hệ, hạn chế); đánh giá chọn một |
| 8 | **AnalysisScreen** | `#/case/<id>/analysis` | Lập luận pháp lý: dấu hiệu định danh, phân giải luật, độ tuổi, tình tiết, cảnh báo nhất quán |
| 9 | **SubmissionScreen** | `#/case/<id>/submission` | Kết luận + định danh + căn cứ pháp lý; danh sách kiểm tra trước khi nộp; chặn nộp bài |
| 10 | **FeedbackScreen** | `#/case/<id>/feedback` | Phân tích điểm (tiêu chí + kỳ vọng), đường thay thế, điều khoản được tham chiếu |
| 11 | **NotebookScreen** | `#/case/<id>/notebook` | Bảng thuật ngữ tra cứu được, điều khoản, mục tiêu học tập, liên kết ghi chú cá nhân |
| 12 | **SettingsScreen** | `#/settings` | Chuyển chủ đề, xuất/nhập phiên chơi, đặt lại/xoá dữ liệu, thông tin phiên bản |

**Định tuyến dùng chung**: `#/case/<id>/evidence` và `#/case/<id>/investigation` đều hiển thị `EvidenceBoardScreen`.

### 4.2 Thư viện thành phần (`ui/components.tsx`)

| Thành phần | Biến thể | Thuộc tính chính | Khả năng tiếp cận |
|-----------|----------|-----------|---------------|
| `Button` | primary/secondary/ghost/danger | `variant`, `disabled`, `onClick` | Thẻ `<button>` gốc, focus-visible |
| `Badge` | neutral/accent/warn/danger/success | `tone`, `children` | Chỉ văn bản |
| `Card` | — | `children`, `className`, `as` (section/article/div) | Phân vùng ngữ nghĩa |
| `Callout` | info/warn/danger/success | `tone`, `title`, `children` | `role="alert"` cho mức nguy hiểm |
| `Stepper` | — | Tự động từ `STAGES` + `session` | `aria-label`, `aria-current="step"` |
| `SingleChoice` | — | `legend`, `hint`, `options[]`, `value`, `onChange`, `allowClear`, `readOnly`, `compact` | `<fieldset>` + `<legend>`, nút chọn một |
| `MultiChoice` | — | `legend`, `hint`, `options[]`, `values[]`, `onToggle`, `readOnly`, `compact` | `<fieldset>` + ô chọn |
| `NoteField` | — | `label`, `hint`, `value`, `onChange`, `readOnly`, `rows`, `placeholder` | `<textarea>` kèm nhãn |
| `Modal` | — | `open`, `title`, `onClose`, `children`, `footer` | `role="dialog"`, `aria-modal`, giữ tiêu điểm trong hộp, đóng bằng Escape |
| `HintPanel` | — | Tự động từ `caseFile.hints` + `session.selectedHints` | `<details>`, hiển thị dần |
| `ProgressBar` | — | `value`, `total`, `label` | `role="progressbar"`, aria-valuemin/max/now |
| `SectionHeading` | — | `eyebrow`, `title`, `description`, `actions` | `<header>`, h2 |
| `EmptyState` | — | `title`, `children` | Lớp bọc đơn giản |

### 4.3 Mẫu điều khiển biểu mẫu

Mọi thành phần biểu mẫu theo cùng một mẫu:
- **Lớp bọc trường**: `<fieldset class="field">` với `<legend class="field__legend">`
- **Gợi ý**: `<p class="field__hint" id="...-hint">` được tham chiếu qua `aria-describedby`
- **Lựa chọn**: `<label class="choice">` bọc `<input type="radio|checkbox">` gốc
- **Chỉ đọc**: `disabled` trên ô nhập + lớp `choice--readonly` (chỉ hiển thị)
- **Nút bỏ chọn**: thuộc tính `allowClear` hiển thị nút liên kết “Bỏ chọn”

### 4.4 Quản lý trạng thái

```
App.tsx
  └── loadCase() → CaseFile
  └── bootSession() → loadSession() hoặc createSession()
  └── useReducer(gameReducer, initialSession)
  └── GameContext.Provider { caseFile, lookups, session, dispatch, navigate, readOnly, ... }
```

**Các kiểu GameAction** (`state/reducer.ts`):
- `SET_STAGE`, `VIEW_EVIDENCE`, `REQUEST_CHECK`
- `SET_ANSWER`, `TOGGLE_MULTI`, `SET_NOTE`
- `USE_HINT`, `SUBMIT` (kèm ScoreResult), `REOPEN`, `RESET`, `IMPORT`
- `DISMISS_STORAGE_ISSUE`, `TOGGLE_THEME`

**Lưu trữ** (`state/persistence.ts`):
- Khoá: `ttths.session.v1.<caseId>`
- Sao lưu khi hỏng dữ liệu: `ttths.backup.v1.<caseId>.<timestamp>`
- Phiên bản lược đồ: `SESSION_SCHEMA_VERSION = 1`
- Xuất/Nhập: JSON với `caseId`, `caseVersion`, `sessionSchemaVersion`, `savedAt`
- Nhập kiểm tra: khớp caseId, khớp caseVersion, phiên bản lược đồ, trường bắt buộc

---

## 5. Định tuyến (`ui/router.ts`)

```typescript
type Route =
  | { kind: 'home' }
  | { kind: 'settings' }
  | { kind: 'case'; caseId: string; screen: string; anchor: string | null }
  | { kind: 'notfound' }

parseRoute(hash): Route
  '#/' → home
  '#/settings' → settings
  '#/case/<id>/<screen>#<anchor>' → case
  else → notfound

useHashRoute(): Route  // lắng nghe hashchange + popstate
navigate(path): void   // gán window.location.hash
```

**Hằng số màn hình** (`CASE_SCREENS`): `brief`, `casefile`, `investigation`, `evidence`, `hypotheses`, `analysis`, `proof`, `submission`, `feedback`, `notebook`

---

## 6. Hệ thống thiết kế (`styles.css`)

### 6.1 Token thiết kế (thuộc tính tuỳ chỉnh CSS)

```css
:root {
  /* Màu sắc */
  --bg: #f5f4ee;           --bg-deep: #ece9df;
  --surface: #ffffff;      --surface-alt: #fbfaf5;
  --ink: #1d2521;          --ink-soft: #414c46;
  --muted: #67716b;        --line: #dedbd0;      --line-strong: #c8c4b6;
  --accent: #1f5f4b;       --accent-strong: #163f32;  --accent-soft: #e7f0eb;
  --warn: #8a5a12;         --warn-soft: #fcf3e0;
  --danger: #8b2f2a;       --danger-soft: #fbeae7;
  --success: #1f6349;      --success-soft: #e8f4ee;
  --info: #2b5667;         --info-soft: #eaf2f5;

  /* Kiểu chữ — family */
  --font-display: "Source Serif 4 Variable", "Source Serif 4", Georgia, serif;
  --font-body: "IBM Plex Sans Variable", "IBM Plex Sans", "Segoe UI", system-ui, sans-serif;
  --font-mono: "IBM Plex Mono", "Cascadia Code", Consolas, monospace;

  /* Kiểu chữ — weight */
  --weight-regular: 400;  --weight-medium: 500;
  --weight-semibold: 600; --weight-bold: 700;

  /* Kiểu chữ — thang cỡ (rem, gốc 16px) */
  --text-display-xl: 3.5rem;   --text-display-lg: 3rem;
  --text-h1: 2.25rem;          --text-h2: 1.875rem;
  --text-h3: 1.5rem;           --text-h4: 1.25rem;
  --text-case-title: 1.75rem;  --text-doc-title: 1.375rem;
  --text-body-lg: 1.0625rem;   --text-body: 0.9375rem;
  --text-body-sm: 0.875rem;    --text-label: 0.8125rem;
  --text-caption: 0.75rem;     --text-micro: 0.6875rem;

  /* Kiểu chữ — line height & tracking */
  --leading-display: 1.12;  --leading-h1: 1.2;  --leading-h2: 1.25;
  --leading-h3: 1.3;        --leading-h4: 1.35;
  --leading-body: 1.65;     --leading-legal: 1.75;
  --leading-compact: 1.4;   --leading-table: 1.5;
  --tracking-display: -0.035em; --tracking-heading: -0.02em;
  --tracking-normal: 0;         --tracking-label: 0.06em;
  --tracking-mono: 0.01em;

  /* Khoảng cách / Bo góc / Đổ bóng */
  --radius: 14px;  --radius-sm: 9px;
  --shadow-sm: 0 1px 2px rgba(29,37,33,0.05);
  --shadow: 0 1px 2px rgba(29,37,33,0.04), 0 10px 28px rgba(29,37,33,0.055);
  --max-width: 1180px;
}
```

**Chế độ tối**: `[data-theme="dark"]` ghi đè toàn bộ màu + nền chuyển sắc.

**Kiểu chữ**: ba vai trò — display (Source Serif 4), interface (IBM Plex Sans), data (IBM Plex Mono). Ngưỡng cỡ chữ nhỏ nhất là 11px và chỉ dùng cho metadata. Chi tiết quy tắc, bảng mapping và kiểm chứng nằm ở `docs/typography.md`.

### 6.2 Thành phần bố cục cơ bản

| Lớp | Mục đích |
|-------|---------|
| `.app-main`, `.home` | Khung căn giữa, chiều rộng tối đa 1180px, đệm 1.5rem |
| `.screen` | Cột flex, khoảng cách 1.25rem |
| `.stack` | Cột flex, khoảng cách 1.1rem, chiều rộng tối thiểu 0 |
| `.two-column` | Lưới 1.65fr / 1fr, khoảng cách 1.35rem, căn đầu dòng |
| `.brief-grid` | Lưới 1.7fr / 1fr |
| `.principles` | Lưới 3 cột |

### 6.3 Điểm ngắt thích ứng

```css
@media (max-width: 1024px)  { .two-column { grid-template-columns: 1fr; } }
@media (max-width: 768px)   { .stepper { padding: 0.3rem; } /* thẻ xếp chồng */ }
@media (max-width: 480px)   { .hero { grid-template-columns: 1fr; } /* một cột */ }
@media (max-width: 360px)   { /* tối thiểu hỗ trợ: 360px */ }
```

- Vùng chạm: tối thiểu 44px (nút cao tối thiểu 42px, mục bước 38px)
- Cỡ chữ dùng `clamp()` để co giãn linh hoạt
- Không cuộn ngang ở 360px

### 6.4 Kiểu thành phần (lớp chính)

| Thành phần | Lớp gốc | Biến thể |
|---------|------------|----------|
| Button | `.button` | `--primary`, `--secondary`, `--ghost`, `--danger` |
| Badge | `.badge` | `--neutral`, `--accent`, `--warn`, `--danger`, `--success` |
| Card | `.card` | `.spaced`, `.guard-card` |
| Callout | `.callout` | `--info`, `--warn`, `--danger`, `--success` |
| Choice | `.choice` | `--checked`, `--readonly` |
| Progress | `.progress` | `__track`, `__fill` |
| Stepper | `.stepper` | `__item`, `__item--active`, `__index` |

---

## 7. Kiến trúc nội dung

### 7.1 Tệp hồ sơ (`src/content/cases/case_001.json`)

```json
{
  "schema_version": "2.0.0",
  "metadata": { "id": "case_001", "version": "draft-0.1.0", "status": "draft", ... },
  "brief": { "narrative": "...", "task_prompt": "...", "player_role": "learner_case_analyst" },
  "law_bundles": [],  // được điền khi nạp
  "temporal_context": { "conduct_events": [{ "id": "conduct_01", "date_interval": {...}, "law_resolution": {...} }] },
  "characters": [...],
  "facts": [...],
  "evidence": [...],
  "procedural_defects": [...],
  "evidence_limitations": [...],
  "hypotheses": [...],
  "proof_matrix": [...],
  "candidate_charges": [...],
  "charge_elements": [...],
  "charge_comparisons": [...],
  "age_rules": [...],
  "circumstances": [...],
  "conclusions": [...],
  "answer_fields": [...],
  "expected_responses": [...],
  "answer_paths": [...],
  "consistency_rules": [...],
  "criteria": [...],
  "scoring": { "max_total_points": 100, "path_weights": [...], "partial_credit": {...} },
  "path_selection": { "mode": "priority", "order": [...] },
  "review": { "status": "not_reviewed", "review_ids": [] },
  "explanations": [...],
  "references": { "legal_basis_ids": [...] },
  "issues": [...],
  "critical_issue_ids": [...],
  "hints": [...],
  "glossary": [...],
  "learning_outcomes": [...]
}
```

### 7.2 Bộ văn bản luật (`src/content/laws/law_bundle_v1.json`)

```json
{
  "id": "law_bundle_v1",
  "version": "placeholder-0.1.0",
  "jurisdiction": "VN",
  "provisions": [
    { "id": "provision_placeholder_01", "citation": "...", "effective_from": null, "effective_to": null, "source_ref": "[Reviewer...", "review_status": "not_reviewed" }
  ]
}
```

### 7.3 Danh mục (`src/content/manifest.json`)

```json
{
  "app": { "name": "Thám tử Hình sự", "version": "1.0.0", "schemaVersion": "2.1.0", "sessionSchemaVersion": 1, "platform": "web" },
  "cases": [
    { "id": "case_001", "version": "draft-0.1.0", "title": "...", "subtitle": "...", "summary": "...", "difficulty": "Nhập môn", "durationMinutes": [10, 20], "status": "draft", "review": "not_reviewed", "playable": true, "publishable": false, "lawBundleIds": ["law_bundle_v1"], "learningOutcomeIds": [...], "notice": "..." }
  ]
}
```

---

## 8. Kiểm tra và cổng chất lượng

### 8.1 Lớp 1: Kiểm tra lược đồ bằng Ajv (`domain/validate.ts`)

- Lược đồ JSON bản 2020-12 (`schemas/case.schema.json`)
- Kiểm tra: trường bắt buộc, kiểu dữ liệu, kiểu liệt kê, tham chiếu chéo (mã định danh), tính duy nhất của mảng
- Chạy khi nạp trong `loadCase()`

### 8.2 Lớp 2: Bộ kiểm tra ngữ nghĩa (`domain/semantic.ts`)

- 17 kiểm tra bất biến (xem Mục 3.8)
- Chạy qua `npm run lint:content` (chế độ nháp) hoặc `npm run lint:content -- --publish` (cổng xuất bản)

### 8.3 Trạng thái hiện tại

| Kiểm tra | Kết quả |
|-------|--------|
| `npm run lint:content` (nháp) | 0 lỗi, 7 cảnh báo, 1 thông tin |
| `npm run lint:content -- --publish` | **17 lỗi** (chặn xuất bản) |
| `npm test` | 160 bài kiểm thử đạt |
| `npm run build` | Đạt (bước dựng trước chạy kiểm tra nháp) |

**Các mục chặn xuất bản cho case_001**:
- `metadata.status` chưa `approved`/`published`
- `review.status` chưa `approved`, `review_ids` rỗng
- Điều khoản luật chưa rà soát, thiếu `effective_from`, không có nguồn chính thức
- Phân giải luật của `conduct_01` chưa hoàn tất
- Quy tắc tuổi chưa rà soát, chưa có điều kiện
- Khiếm khuyết thủ tục, tình tiết chưa rà soát
- Còn dấu hiệu chưa xác minh trong nội dung
- Phần giải thích không được dùng (`sem_explanation_unused`)

---

## 9. Chiến lược kiểm thử

### 9.1 Phân bố kiểm thử (160 bài kiểm thử, 21 tệp)

| Tệp | Trọng tâm | Số lượng |
|------|-------|-------|
| `scoring.test.ts` | Đường A/B, 4 biến thể chưa đủ căn cứ, điểm từng phần, làm tròn, chặn nộp | ~25 |
| `matching.test.ts` | DSL, so khớp đường đáp án, ưu tiên path_selection, quy tắc nhất quán | ~20 |
| `linter.test.ts` | Cổng nháp/xuất bản, biến thể lỗi tham chiếu, luật nhiều đoạn | ~15 |
| `semantic.test.ts` | Lớp 2: bất biến chấm điểm, chính sách đường đáp án, nội dung mồ côi, chu trình mở khoá | ~15 |
| `schema-2.1.0.test.ts` | Bộ dữ liệu hợp lệ/không hợp lệ + tương thích ngược 2.0.0 | ~10 |
| `load.test.ts` | Ghép bộ văn bản luật, danh mục, kiểm tra lược đồ | ~8 |
| `legalVersion.test.ts` | không hợp lệ/vắt qua/thiếu/đạt + nhiều đoạn hiệu lực | ~12 |
| `age.test.ts` | Khoảng tuổi, xấp xỉ, chưa rõ, ngày không hợp lệ | ~8 |
| `evidence.test.ts` | Mở khoá, theo dõi tiến độ | ~10 |
| `persistence.test.ts` | Vòng lưu-tải, sao lưu, phiên bản lược đồ/hồ sơ, nhập/xuất, xoá | ~12 |
| `reducer.test.ts` | Đáp án, ghi chú, gợi ý, nộp/mở lại/đặt lại/nhập | ~15 |
| `content.test.ts` | Bất biến nội dung C-01 → C-16 cho case_001 | ~16 |
| `src/ui/**/*.test.tsx` | Hiển thị + tương tác (Testing Library + happy-dom) | ~24 |

### 9.2 Lệnh

```bash
npm test              # Toàn bộ kiểm thử
npm run test:watch    # Chế độ theo dõi
npm run test:corpus   # Bộ dữ liệu lược đồ 2.1.0 + bộ kiểm tra ngữ nghĩa
npm run test:e2e      # Kiểm thử trình duyệt bằng Playwright (Chromium)
npm run lint:content  # Kiểm tra nháp
npm run lint:content -- --publish  # Cổng xuất bản
npm run build         # Dựng trước (kiểm tra nháp) + tsc --noEmit + vite build
npm run check         # Kiểm tra nháp + kiểm thử + dựng
```

### 9.3 Kiểm thử trình duyệt (`e2e/typography.spec.ts`)

Playwright chạy trên Chromium với máy chủ dev do `playwright.config.ts` tự khởi động. Bảy bài kiểm thử:

| Bài kiểm thử | Nội dung |
|---|---|
| Không tràn ngang, sáng/tối | 5 độ rộng (360, 390, 768, 1024, 1440) × 7 màn hình; `scrollWidth` không vượt `clientWidth` quá 1px |
| Sàn cỡ chữ, sáng/tối | Không phần tử văn bản hiển thị nào dưới 11px (bỏ qua `.sr-only` và phần tử ẩn) |
| Thang chữ theo breakpoint | body 15px; hero 56/38/34px; tiêu đề hồ sơ 28/23px |
| Font tiếng Việt | `document.fonts.check` với dấu kết hợp; computed family chứa đúng tên font tự lưu |
| Ảnh chụp | 3 độ rộng × 3 màn hình × 2 chế độ, lưu vào `test-results/` để rà soát thủ công |

Ảnh chụp **không** dùng làm baseline pixel; mục tiêu là phát hiện tràn bố cục và kiểm tra glyph tiếng Việt.

---

## 10. Hạn chế đã biết và nợ kỹ thuật

| Lĩnh vực | Vấn đề |
|------|-------|
| **Kích thước gói** | ~557 KB JavaScript (Vite cảnh báo: khối > 500 KB) — không tách mã |
| **Tải font** | ~253 KB woff2 (latin + vietnamese) ở lần tải đầu; các subset cyrillic/greek không được tải |
| **Nội dung nháp** | case_001 còn chỗ chưa xác minh, thiếu dòng chứng minh cho `element_b_01`, `issue_03` không có gợi ý, phần giải thích không dùng |
| **Chồng lấn đường đáp án** | `conclusion_insufficient` + tự đánh giá `supported` → không khớp đường nào (chỉ có chẩn đoán) |
| **Chọn đường đáp án** | Kiểm tra chồng lấn loại trừ dùng xấp xỉ tĩnh; bỏ qua nhánh `any` |
| **Không có máy chủ** | Không đồng bộ, không tài khoản, không dữ liệu đo lường từ xa |
| **Không chấm điểm bằng trí tuệ nhân tạo** | Không hỗ trợ câu trả lời văn bản tự do |
| **Kiểm thử trình duyệt** | Playwright chỉ kiểm tra tràn ngang, cỡ chữ và font; không có baseline pixel, không kiểm tra tương tác bàn phím |
| **Một hồ sơ duy nhất** | Toàn bộ kiểm thử/kiểm tra chỉ dựa trên case_001 |
| **Chế độ tối** | Đã kiểm tra 7 màn hình ở 5 độ rộng; modal và trạng thái lỗi lưu trữ chưa phủ |
| **Bảng kiểu in** | Chưa triển khai (Feedback/Notebook có thể cần in) |
| **Giảm chuyển động** | Đã tôn trọng `prefers-reduced-motion`; chưa kiểm tra trên thiết bị thật |

---

## 11. Điểm mở rộng

### 11.1 Thêm hồ sơ mới

1. Tạo bộ văn bản luật trong `src/content/laws/` → đăng ký trong `LAW_BUNDLES` (`load.ts`)
2. Tạo tệp JSON hồ sơ trong `src/content/cases/` → đăng ký trong `RAW_CASES` (`load.ts`)
3. Thêm mục vào `manifest.json` với `playable: true`, `publishable: false`
4. Khai báo `answer_fields` trước (mọi đối tượng cho giao diện/chấm điểm phải được đăng ký)
5. Viết `expected_responses` cho từng đường đáp án/tiêu chí kèm `weight`
6. Viết `answer_paths` bằng cú pháp DSL nghiêm ngặt; kiểm tra không chồng lấn
7. Viết `consistency_rules` cho các mâu thuẫn cần chặn
8. Đặt `scoring.path_weights` sao cho mỗi đường đáp án có tổng 100
9. Chạy `npm run lint:content`, `npm test`, `npm run build`

### 11.2 Tiến hoá lược đồ

- Hiện tại: 2.1.0 (chấp nhận 2.0.0 và 2.1.0)
- Trường mới không bắt buộc để đảm bảo tương thích ngược
- Tăng phiên bản ở `manifest.app.schemaVersion` và `metadata.version` của hồ sơ

---

## 12. Chỉ mục tra cứu tệp nhanh

| Tệp | Số dòng | Mục đích |
|------|-------|---------|
| `src/App.tsx` | 324 | Khởi động, định tuyến, khung ứng dụng, GameContext |
| `src/domain/types.ts` | 510 | Toàn bộ giao diện TypeScript |
| `src/domain/load.ts` | 86 | Nạp hồ sơ + ghép bộ văn bản luật |
| `src/domain/scoring.ts` | ~200 | Chấm điểm có trọng số, làm tròn một lần |
| `src/domain/matching.ts` | ~250 | So khớp DSL, nhất quán, chọn đường đáp án |
| `src/domain/evidence.ts` | ~150 | Quy tắc mở khoá |
| `src/domain/legalVersion.ts` | ~200 | Phân giải luật nhiều đoạn hiệu lực |
| `src/domain/semantic.ts` | ~300 | Bất biến Lớp 2 |
| `src/domain/linter.ts` | ~400 | Tham chiếu chéo + cổng xuất bản |
| `src/state/reducer.ts` | ~200 | GameAction + chuyển trạng thái |
| `src/state/persistence.ts` | ~200 | Phiên chơi localStorage + sao lưu |
| `src/ui/GameContext.tsx` | ~80 | Nhà cung cấp ngữ cảnh React |
| `src/ui/router.ts` | 74 | Bộ định tuyến hash |
| `src/ui/components.tsx` | 409 | Thư viện thành phần dùng chung |
| `src/ui/labels.ts` | 230 | Toàn bộ nhãn hiển thị + bộ định dạng |
| `src/ui/screens/*.tsx` | 12 tệp | 12 thành phần màn hình |
| `src/styles.css` | 2606 | Hệ thống thiết kế đầy đủ + token kiểu chữ |
| `e2e/typography.spec.ts` | 155 | Kiểm thử trình duyệt: tràn ngang, cỡ chữ, font tiếng Việt |
| `playwright.config.ts` | 20 | Cấu hình Playwright và máy chủ dev |
| `src/content/cases/case_001.json` | ~1500 | Nội dung hồ sơ nháp |
| `src/content/laws/law_bundle_v1.json` | ~100 | Bộ văn bản luật |
| `src/content/manifest.json` | ~50 | Danh mục hồ sơ |

---

## 13. Lệnh phát triển

```bash
# Cài đặt
npm install

# Máy chủ phát triển (Vite)
npm run dev

# Kiểm thử
npm test                 # Toàn bộ 160 bài kiểm thử
npm run test:watch       # Chế độ theo dõi
npm run test:corpus      # Lược đồ + bộ kiểm tra ngữ nghĩa
npm run test:e2e         # Playwright: bố cục, cỡ chữ, font tiếng Việt

# Kiểm tra nội dung
npm run lint:content     # Chế độ nháp (0 lỗi, 7 cảnh báo)
npm run lint:content -- --publish  # Cổng xuất bản (17 lỗi)

# Dựng
npm run build            # Dựng trước (kiểm tra nháp) + tsc + vite build
npm run preview          # Xem bản dựng phát hành
npm run check            # Kiểm tra + kiểm thử + dựng

# Phân tích
npm run lint:content -- --json  # Kết quả dạng máy đọc
npx vite-bundle-analyzer dist   # Phân tích kích thước gói
```

---

## 14. Triển khai

- **GitHub Pages**: `.github/workflows/deploy-pages.yml` dựng khi đẩy lên `main`
- **Địa chỉ bản chạy thử**: https://ngminhduc129.github.io/tham-tu-hinh-su/
- **Kết quả dựng**: `dist/` (tệp tĩnh, không cần máy chủ)
- **Định tuyến hash** hoạt động trên GitHub Pages mà không cần cấu hình máy chủ

---

*Được tạo từ phân tích mã nguồn — phản ánh trạng thái ngày 2026-11-08*
