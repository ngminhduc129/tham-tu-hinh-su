# Thám tử Hình sự

Trò chơi học tập client-side tiếng Việt về đọc hồ sơ, đánh giá chứng cứ và phân tích pháp lý trong tình huống hình sự hư cấu. Người học đi qua 12 màn hình, trả lời bằng lựa chọn có cấu trúc, nhận phản hồi theo tiêu chí và xem lại căn cứ pháp luật của case.

> **Lưu ý:** Tình huống và phản hồi phục vụ học tập; không phải tư vấn pháp lý cho vụ việc thực tế. Trò chơi không mô phỏng đầy đủ thủ tục tố tụng Việt Nam và không tự động diễn giải luật.

Case duy nhất hiện có (`case_001`) là **bản nháp chưa thẩm định**: toàn bộ điều khoản, nhãn định danh và một số đáp án còn chờ người rà soát chuyên môn. Case vẫn chơi được nhưng bị chặn publish.

## Demo

Bản demo công khai: <https://ngminhduc129.github.io/tham-tu-hinh-su/>

Demo giữ nguyên `case_001` ở nhãn draft/chưa thẩm định; publish gate vẫn chặn. Mỗi lần push lên `main`, GitHub Actions build và deploy lại qua `.github/workflows/deploy-pages.yml`.

## Chạy nhanh

```bash
npm install
npm run dev
```

Mở địa chỉ Vite in ra trong terminal. Ứng dụng không có backend, không có tài khoản và không gửi dữ liệu đi đâu.

### Lệnh

| Lệnh | Mục đích |
| --- | --- |
| `npm run dev` | Chạy dev server |
| `npm test` | Chạy toàn bộ Vitest (160 test) |
| `npm run test:watch` | Chạy test ở chế độ theo dõi |
| `npm run test:corpus` | Chạy riêng corpus schema 2.1.0, semantic validator và bất biến nội dung |
| `npm run lint:content` | Lint nội dung ở chế độ draft |
| `npm run lint:content -- --publish` | Chạy publish gate; case nháp phải thất bại |
| `npm run build` | `prebuild` lint draft, sau đó `tsc --noEmit` và `vite build` |
| `npm run preview` | Xem bản build |
| `npm run check` | Lint draft + test + build |

## Công nghệ

- React 19 + TypeScript, Vite 7
- Vitest
- Ajv 2020 + ajv-formats để validate JSON Schema Draft 2020-12
- Hash router tự viết (không dùng React Router)
- localStorage cho tiến độ; không telemetry

## Cấu trúc

```text
index.html
schemas/case.schema.json          # JSON Schema 2.1.0 (tương thích ngược 2.0.0)
docs/schema-2.1.0.md              # thay đổi schema và ma trận tương thích
docs/semantic-validator.md        # Layer 2 semantic validator
scripts/lint-content.ts           # CLI content lint / publish gate
src/
  App.tsx                         # boot, autosave, routing, guard nộp bài
  main.tsx
  styles.css                      # theme học thuật sáng, responsive tới 360px
  content/
    manifest.json                 # danh mục case, cờ playable/publishable
    learning-outcomes.json        # catalog mục tiêu học tập
    cases/case_001.json           # case nháp (chưa gắn law bundle)
    laws/law_bundle_v1.json       # law bundle tách riêng
  domain/
    types.ts                      # kiểu case, luật, phiên, kết quả chấm
    validate.ts                   # Ajv schema validation
    load.ts                       # ghép law bundle + manifest + validate
    answers.ts                    # registry đáp án chuẩn, so sánh multi-select
    expr.ts                       # DSL match/consistency
    matching.ts                   # path matching + consistency rules
    scoring.ts                    # chấm theo path, partial credit
    evidence.ts                   # discovery/unlock chứng cứ
    age.ts                        # khoảng tuổi theo DateInterval
    legalVersion.ts               # phân giải hiệu lực law bundle, kể cả multi-segment
    semantic.ts                   # Layer 2: bất biến ngữ nghĩa
    lookups.ts                    # index tra cứu cho UI
    linter.ts                     # cross-reference + publish blocker
    *.test.ts
  state/
    reducer.ts                    # GameAction và chuyển trạng thái phiên
    persistence.ts                # localStorage, export/import, backup
  ui/
    GameContext.tsx
    router.ts
    components.tsx
    labels.ts
    download.ts
    evidence-detail.tsx
    screens/                      # Home, Brief, CaseFile, Investigation,
                                  # EvidenceBoard, Hypotheses, ProofMatrix,
                                  # Analysis, Submission, Feedback, Notebook,
                                  # Settings
```

## Kiến trúc domain

### 1. Nạp và validate nội dung

`src/domain/load.ts` là nguồn duy nhất để lấy case:

1. Tìm entry trong `manifest.json`.
2. Đọc case JSON.
3. Lấy `metadata.law_bundle_ids`, tra trong registry `LAW_BUNDLES` (hiện là `src/content/laws/law_bundle_v1.json`).
4. Ghép `law_bundles` vào case **trước khi** validate bằng Ajv.
5. Kiểm tra `metadata.id` và `metadata.version` khớp manifest.

Case trên đĩa không chứa nội dung luật; luật được tách sang `src/content/laws/` để nhiều case có thể dùng chung một bundle.

### 2. Lưu câu trả lời

Đáp án chỉ được lưu theo registry khai báo trong `answer_fields`:

```text
answers[fieldId][targetId] = string | string[]
```

Không lưu đáp án theo nhãn hiển thị, không lưu text tự do để chấm điểm. Ghi chú cá nhân nằm ở `session.notes` và không tham gia chấm.

### 3. Match đường đáp án (strict)

`answer_paths[].match` là biểu thức DSL (`all`, `any`, `equals`, `not_equals`, `contains`, `not_contains`, `is_empty`, `is_not_empty`).

- Path chỉ khớp khi **toàn bộ** biểu thức đúng.
- Không có cơ chế “gần đúng”, không fallback sang path gần nhất.
- Nhiều path có thể cùng tồn tại. Nếu case khai báo `path_selection`, chính sách được áp dụng:
  - `priority`: chọn path đầu tiên khớp theo `order`;
  - `exclusive`: các path không được chồng lấn; Semantic Validator báo lỗi nếu chúng có thể cùng khớp.
- Nếu không khai báo `path_selection`, hành vi cũ được giữ nguyên: path khớp đầu tiên theo thứ tự khai báo.

Với `case_001`, “chưa đủ căn cứ” là trục chính. Có 4 biến thể `path_insufficient*` cho các tổ hợp `unresolved`/`not_supported` của hai dấu hiệu, cộng `path_a` và `path_b` cho hai định danh có điều kiện. Path A/B chỉ chấm dấu hiệu và định danh tương ứng, không đòi dấu hiệu của định danh còn lại. Kết luận `conclusion_a`/`conclusion_b` bị chặn nếu không chọn đúng `charge_a`/`charge_b`.

### 4. Quy tắc nhất quán chạy trước khi chấm

`consistency_rules` được đánh giá trước path matching. Nếu có rule `severity: "blocking"` thất bại:

- `score.total = null`
- `score.blocking = true`
- `score.criteria = []`
- Không tạo điểm kết luận và không cho coi là đã nộp hợp lệ.

Nhờ vậy, các tổ hợp mâu thuẫn (ví dụ chọn định danh nhưng đánh dấu dấu hiệu bắt buộc là không được hỗ trợ) không thể vô tình nhận điểm.

### 5. Chấm điểm

Nếu không blocking:

- Không path nào khớp → `total = null`, `unmatched = true`, chỉ trả `diagnostics` theo tiêu chí. Đây là chẩn đoán, không phải điểm cuối.
- Có path khớp → lấy điểm tối đa của từng criterion từ `scoring.path_weights`.

Công thức cho mỗi criterion:

```text
earned = max_points × (tổng weight expectation đạt) / (tổng weight expectation áp dụng cho path)
```

Quy tắc:

- Chỉ expectation có `path_ids` chứa path đã khớp mới được tính.
- `multi_select` so khớp **đúng toàn bộ tập giá trị**.
- `accepted_values: []` nghĩa là phải để trống lựa chọn.
- `scoring.max_total_points` (2.1.0) cố định thang điểm ở 100.
- `scoring.partial_credit.weight_scope = "within_criterion"` (2.1.0) khẳng định trọng số được chuẩn hoá trong từng criterion, không nhân trọng số hai lần.
- Làm tròn **một lần duy nhất** ở tổng: `round(sum(earned))`, kẹp trong `[0, 100]`.
- Gợi ý đã dùng chỉ được ghi vào `selectedHints`; **không trừ điểm**.

### 6. Discovery chứng cứ

`evidence[].discovery` quyết định trạng thái:

- `always`: đọc ngay
- `viewed`: cần xem đủ tài liệu phụ thuộc
- `check`: cần xem đủ tài liệu, sau đó người chơi yêu cầu kiểm tra
- `unavailable`: không bao giờ mở

Tiến độ discovery chỉ để tham khảo, không phải điểm số.

### 7. Tuổi và phiên bản luật

- `age.ts` tính khoảng tuổi từ `DateInterval`; thiếu ngày hoặc precision `unknown` trả `unknown`, không tự chọn một tuổi.
- `legalVersion.ts` đối chiếu `conduct_events[].law_resolution` với bundle/provision:
  - `invalid`: chưa phân giải, provision chưa duyệt, cấu hình segment sai
  - `crosses`: khoảng ngày hành vi vượt hiệu lực provision, hoặc segment không phủ kín
  - `incomplete`: thiếu ngày hiệu lực để đối chiếu
  - `ok`: đủ điều kiện đối chiếu
- Với `status: "crosses_version"`, case phải khai báo tối thiểu hai `segments`. Engine kiểm tra segment không chồng lấn, không để khoảng trống, phủ kín ngày hành vi và provision thuộc đúng bundle của segment.

## Soạn nội dung case mới

1. **Thêm law bundle** vào `src/content/laws/`, sau đó đăng ký trong `LAW_BUNDLES` ở `src/domain/load.ts`.
2. **Thêm case** vào `src/content/cases/` và đăng ký trong `RAW_CASES` ở `src/domain/load.ts`.
3. **Thêm entry** vào `src/content/manifest.json` với `id`, `version`, `playable`, `publishable`, `lawBundleIds`, `learningOutcomeIds`.
4. **Khai báo `answer_fields`** trước, vì mọi target/option dùng cho UI và chấm điểm phải nằm trong registry này.
5. **Viết `expected_responses`** cho từng path và criterion; dùng `weight` để biểu diễn mức quan trọng tương đối.
6. **Viết `answer_paths`** bằng DSL strict; kiểm tra các path không chồng lấn.
7. **Viết `consistency_rules`** cho các mâu thuẫn phải chặn.
8. **Gán `scoring.path_weights`** sao cho tổng điểm mỗi path bằng 100.
9. Chạy `npm run lint:content`, `npm test`, `npm run build`.

Khi sửa case đã có người chơi, hãy tăng `metadata.version` và version trong manifest. Session lưu kèm `caseVersion`; bản lưu khác phiên bản sẽ bị giữ nguyên và không tự ghi đè.

## Schema 2.1.0 và mở rộng có kiểm soát

Schema hiện là **2.1.0**, mở rộng tương thích ngược từ 2.0.0. `schema_version` chấp nhận cả `"2.0.0"` và `"2.1.0"`; mọi trường mới đều optional.

Các bổ sung chính:

| Trường | Vai trò |
| --- | --- |
| `scoring.max_total_points` | Cố định thang điểm 100 |
| `scoring.partial_credit.weight_scope` | Chuẩn hoá trọng số trong từng criterion |
| `path_selection` | Chính sách `priority` / `exclusive` khi nhiều path cùng khớp |
| `law_resolution.segments` | Phân giải luật nhiều đoạn khi hành vi cắt qua phiên bản |
| `proof_row.evidence_links[]` dạng object | Liên kết chứng cứ có kiểu (`relation`, `strength`, `reasoning`, …) |
| `proof_row.status` | Trạng thái chứng minh của mệnh đề |
| `learning_outcomes` cấp case | Outcome cục bộ, merge với catalog toàn cục |

Chi tiết đầy đủ và ma trận tương thích: [`docs/schema-2.1.0.md`](docs/schema-2.1.0.md).

`case_001` vẫn giữ `"2.0.0"` để chứng minh đường tương thích ngược; manifest của ứng dụng đã chuyển sang `"2.1.0"`.

Các collection nội dung như `evidence`, `hypotheses`, `issues`, `hints`, `glossary` dùng `content_record` với trường mở. Tuy vậy, mọi tham chiếu chéo vẫn bị linter kiểm tra; trường mở không phải giấy phép bỏ qua review.

## Content lint và publish gate

`src/domain/linter.ts` kiểm tra:

- ID trùng giữa các collection
- `source_ids` không tồn tại
- ngày không hợp lệ / sai thứ tự / thiếu ngày
- biểu thức DSL tham chiếu field/target/option không tồn tại
- expectation dùng accepted value không có trong options
- tổng điểm criterion của path khác 100
- answer path xung đột hoặc path “chưa đủ căn cứ” vẫn khai báo charge
- learning outcome không tồn tại hoặc không được criterion nào đo
- age rule chồng lấn
- option trùng trong cùng field
- law resolution và review status

Lớp thứ hai (`src/domain/semantic.ts`) kiểm tra các bất biến ngữ nghĩa:

- expectation trùng nhóm chấm (`sem_unique_expectation`)
- `scoring.max_total_points` / `weight_scope` sai hoặc thiếu
- `path_selection.order` không phải hoán vị đầy đủ, hoặc path chồng lấn khi `exclusive`
- reference/segment trỏ provision hoặc bundle sai
- `critical` và `critical_issue_ids` lệch nhau
- chu trình mở khoá chứng cứ nhiều bước
- chứng cứ mồ côi, explanation không dùng, criterion không có expectation, element bắt buộc thiếu fact

Chi tiết mã kiểm tra: [`docs/semantic-validator.md`](docs/semantic-validator.md).

### Trạng thái hiện tại

- `npm run lint:content` → **0 error, 7 warning, 1 info**
- `npm run lint:content -- --publish` → **17 error**, exit code 1
- `npm run build` chạy lint draft trong `prebuild`, nên build vẫn qua dù case bị chặn publish

Các nhóm publish blocker đang bật cho `case_001`:

- `metadata.status` chưa `approved`/`published`
- `review.status` chưa `approved`, `review_ids` rỗng
- law provision chưa duyệt, thiếu `effective_from`, thiếu nguồn chính thức
- `conduct_01` chưa phân giải law bundle
- age rule chưa duyệt và chưa có conditions
- procedural defect chưa duyệt
- circumstance chưa duyệt
- `legal_time_anchor_reason` còn placeholder
- còn token placeholder/chưa xác minh trong nội dung
- `explanation_01` không được expectation hoặc charge comparison nào dùng (`sem_explanation_unused`)

Manifest đặt `publishable: false`. CLI cũng chặn trường hợp manifest và metadata lệch nhau, hoặc case được đánh dấu publishable nhưng còn lỗi publish.

**Không sửa case nháp thành “đã duyệt” chỉ để build qua.** Build hiện tại đã đúng thiết kế: draft lint phải sạch lỗi cấu trúc, publish gate phải tiếp tục thất bại cho tới khi có người rà soát thật.

## Lưu trữ, export/import và reset

- Key phiên: `ttths.session.v1.<caseId>`
- Bản sao bản lưu lỗi: `ttths.backup.v1.<caseId>.<timestamp>`
- Session schema: `1`
- Autosave sau mỗi thay đổi trạng thái.
- Nếu bản lưu lỗi schema/JSON/case version: ứng dụng tạo phiên mới, **giữ nguyên dữ liệu gốc**, hiện banner cảnh báo và cho tải bản lưu lỗi trong Cài đặt.
- Export tạo JSON chứa session, app version, case version, savedAt.
- Import từ chối JSON lỗi, sai `caseId`, sai `caseVersion`, sai session schema hoặc thiếu trường bắt buộc; không ghi đè dữ liệu hiện tại.
- Reset case và xóa toàn bộ dữ liệu đều có hộp xác nhận.

## Test

21 file, 160 test:

- `scoring.test.ts`: path A/B và 4 biến thể chưa đủ căn cứ đạt 100, path A/B không đòi dấu hiệu của định danh còn lại, partial credit, làm tròn một lần, multi-select đúng tập, blocking, unmatched diagnostics
- `matching.test.ts`: DSL, path matching, `path_selection` priority, consistency rule
- `linter.test.ts`: draft/publish gate, các mutation lỗi tham chiếu, law multi-segment
- `semantic.test.ts`: Layer 2 — scoring invariant, path policy, orphan content, discovery cycle
- `schema-2.1.0.test.ts`: corpus valid/invalid cho schema và backward compatibility
- `load.test.ts`: ghép law bundle, manifest, schema đóng
- `legalVersion.test.ts`: invalid/crosses/incomplete/ok và multi-segment
- `age.test.ts`: khoảng tuổi, approximate, unknown, ngày không tồn tại
- `evidence.test.ts`: discovery/unlock và tiến độ
- `persistence.test.ts`: round-trip, backup, schema/case version, import/export, clear
- `reducer.test.ts`: câu trả lời, ghi chú, hint, submit/reopen/reset/import
- `content.test.ts`: bộ bất biến nội dung C-01 → C-16 cho `case_001`
- `src/ui/**/*.test.tsx`: render và tương tác các màn hình chính bằng Testing Library + happy-dom
- `src/test/e2e-playthrough.test.ts`: hành trình reducer từ xem chứng cứ đến nộp bài, chưa phải browser e2e

## Giới hạn đã biết

- Case mẫu là nội dung nháp, chưa được thẩm định pháp lý; không thể publish cho tới khi có người rà soát đủ năng lực.
- Các khoảng trống nội dung đã biết của `case_001`: thiếu proof row cho `element_b_01`, `issue_03` chưa có hint, `explanation_01` chưa được dùng, age rule chưa có conditions, law resolution còn unresolved, còn placeholder.
- Tổ hợp `conclusion_insufficient` nhưng tự đánh giá ít nhất một dấu hiệu là `supported` không khớp path nào; người chơi nhận chẩn đoán "không khớp đường đáp án" thay vì bị chặn bởi consistency rule.
- `path_selection` chống chồng lấn bằng phân tích tĩnh xấp xỉ; nhánh có `any` được bỏ qua thay vì khẳng định.
- Không có backend, tài khoản, đồng bộ đa thiết bị hoặc telemetry.
- Không có chấm điểm văn bản tự do bằng AI.
- Chưa có browser e2e (Playwright); các test UI hiện chạy bằng Testing Library + happy-dom, chưa kiểm tra layout thật ở 360 px.
- Bundle JS production hiện khoảng 552 kB (Vite cảnh báo chunk > 500 kB). Cảnh báo không chặn build.
- Ứng dụng là mô phỏng học tập rút gọn, không phải quy trình tố tụng đầy đủ.
