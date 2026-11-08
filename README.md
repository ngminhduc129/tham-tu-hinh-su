# Thám tử Hình sự

Trò chơi học tập chạy trên trình duyệt bằng tiếng Việt về đọc hồ sơ, đánh giá chứng cứ và phân tích pháp lý trong tình huống hình sự hư cấu. Người học đi qua 12 màn hình, trả lời bằng lựa chọn có cấu trúc, nhận phản hồi theo tiêu chí và xem lại căn cứ pháp luật của hồ sơ.

> **Lưu ý:** Tình huống và phản hồi phục vụ học tập; không phải tư vấn pháp lý cho vụ việc thực tế. Trò chơi không mô phỏng đầy đủ thủ tục tố tụng Việt Nam và không tự động diễn giải luật.

Thư viện hiện có hai hồ sơ, `case_001` và `case_002`, đều là **bản nháp chưa thẩm định**: điều khoản, nhãn định danh và một số đáp án còn chờ người rà soát chuyên môn. Cả hai vẫn chơi được nhưng bị chặn xuất bản. `case_002` (“Chiếc xe tay ga cho mượn”) có hai đường đáp án cạnh tranh — lạm dụng tín nhiệm và lừa đảo chiếm đoạt — cùng 12 chứng cứ.

## Bản chạy thử

Bản chạy thử công khai: <https://ngminhduc129.github.io/tham-tu-hinh-su/>

Bản chạy thử giữ nguyên cả hai hồ sơ ở nhãn bản nháp/chưa thẩm định; cổng xuất bản vẫn chặn. Mỗi lần đẩy lên `main`, GitHub Actions dựng và triển khai lại qua `.github/workflows/deploy-pages.yml`.

## Chạy nhanh

```bash
npm install
npm run dev
```

Mở địa chỉ Vite in ra trong terminal. Ứng dụng không có máy chủ, không có tài khoản và không gửi dữ liệu đi đâu.

### Lệnh

| Lệnh | Mục đích |
| --- | --- |
| `npm run dev` | Chạy máy chủ phát triển |
| `npm test` | Chạy toàn bộ Vitest (163 bài kiểm thử) |
| `npm run test:watch` | Chạy kiểm thử ở chế độ theo dõi |
| `npm run test:corpus` | Chạy riêng bộ dữ liệu kiểm thử lược đồ 2.1.0, bộ kiểm tra ngữ nghĩa và bất biến nội dung |
| `npm run test:e2e` | Chạy Playwright trên Chromium: tràn ngang, cỡ chữ và font tiếng Việt |
| `npm run lint:content` | Kiểm tra nội dung ở chế độ nháp |
| `npm run lint:content -- --publish` | Chạy cổng xuất bản; hồ sơ nháp phải thất bại |
| `npm run build` | Bước dựng trước kiểm tra nội dung nháp, sau đó `tsc --noEmit` và `vite build` |
| `npm run preview` | Xem bản dựng |
| `npm run check` | Kiểm tra nháp + kiểm thử + dựng |

## Công nghệ

- React 19 + TypeScript, Vite 7
- Vitest
- Playwright + Chromium cho kiểm thử bố cục và kiểu chữ trên trình duyệt
- Source Serif 4, IBM Plex Sans, IBM Plex Mono (tự lưu qua `@fontsource`, có subset tiếng Việt)
- Ajv 2020 + ajv-formats để kiểm tra lược đồ JSON bản 2020-12
- Bộ định tuyến hash tự viết (không dùng React Router)
- Bộ nhớ cục bộ cho tiến độ; không dùng dữ liệu đo lường từ xa

## Cấu trúc

```text
index.html
schemas/case.schema.json          # Lược đồ JSON 2.1.0 (tương thích ngược 2.0.0)
docs/schema-2.1.0.md              # thay đổi lược đồ và ma trận tương thích
docs/semantic-validator.md        # Bộ kiểm tra ngữ nghĩa lớp 2
docs/typography.md                # quy chuẩn kiểu chữ và bảng mapping
scripts/lint-content.ts           # Công cụ dòng lệnh kiểm tra nội dung và cổng xuất bản
e2e/typography.spec.ts            # Playwright: tràn ngang, cỡ chữ, font tiếng Việt
playwright.config.ts              # Cấu hình Playwright + máy chủ dev
src/
  App.tsx                         # khởi động, tự lưu, định tuyến, chặn nộp bài
  main.tsx                        # nạp font tự lưu + gắn ứng dụng
  styles.css                      # giao diện học thuật sáng, thích ứng tới 360px
  content/
    manifest.json                 # danh mục hồ sơ, cờ chơi được/xuất bản được
    learning-outcomes.json        # danh mục mục tiêu học tập
    cases/case_001.json           # hồ sơ nháp (chưa gắn bộ văn bản luật)
    cases/case_002.json           # hồ sơ nháp thứ hai (lược đồ 2.1.0, chưa gắn luật)
    laws/law_bundle_v1.json       # bộ văn bản luật của case_001
    laws/law_bundle_blhs.json     # BLHS cho case_002 (Điều 174, 175, 51)
    laws/law_bundle_bltths.json   # BLTTHS cho case_002
  domain/
    types.ts                      # kiểu hồ sơ, luật, phiên, kết quả chấm
    validate.ts                   # kiểm tra lược đồ bằng Ajv
    load.ts                       # ghép bộ văn bản luật + danh mục + kiểm tra
    answers.ts                    # danh mục đáp án chuẩn, so sánh chọn nhiều
    expr.ts                       # cú pháp so khớp/nhất quán
    matching.ts                   # so khớp đường đáp án + quy tắc nhất quán
    scoring.ts                    # chấm theo đường đáp án, điểm từng phần
    evidence.ts                   # mở khoá chứng cứ
    age.ts                        # khoảng tuổi theo DateInterval
    legalVersion.ts               # phân giải hiệu lực bộ văn bản luật, kể cả nhiều đoạn
    semantic.ts                   # Lớp 2: bất biến ngữ nghĩa
    lookups.ts                    # chỉ mục tra cứu cho giao diện
    linter.ts                     # tham chiếu chéo + mục chặn xuất bản
    *.test.ts
  state/
    reducer.ts                    # GameAction và chuyển trạng thái phiên
    persistence.ts                # bộ nhớ cục bộ, xuất/nhập, sao lưu
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

### 1. Nạp và kiểm tra nội dung

`src/domain/load.ts` là nguồn duy nhất để lấy hồ sơ:

1. Tìm mục trong `manifest.json`.
2. Đọc tệp JSON của hồ sơ.
3. Lấy `metadata.law_bundle_ids`, tra trong danh mục đăng ký `LAW_BUNDLES` (hiện có `law_bundle_v1.json`, `law_bundle_blhs.json`, `law_bundle_bltths.json`).
4. Ghép `law_bundles` vào hồ sơ **trước khi** kiểm tra bằng Ajv.
5. Kiểm tra `metadata.id` và `metadata.version` khớp danh mục.

Hồ sơ trên đĩa không chứa nội dung luật; luật được tách sang `src/content/laws/` để nhiều hồ sơ có thể dùng chung một bộ văn bản luật.

### 2. Lưu câu trả lời

Đáp án chỉ được lưu theo danh mục khai báo trong `answer_fields`:

```text
answers[fieldId][targetId] = string | string[]
```

Không lưu đáp án theo nhãn hiển thị, không lưu văn bản tự do để chấm điểm. Ghi chú cá nhân nằm ở `session.notes` và không tham gia chấm.

### 3. So khớp đường đáp án (nghiêm ngặt)

`answer_paths[].match` là biểu thức DSL (`all`, `any`, `equals`, `not_equals`, `contains`, `not_contains`, `is_empty`, `is_not_empty`).

- Đường đáp án chỉ khớp khi **toàn bộ** biểu thức đúng.
- Không có cơ chế “gần đúng”, không dự phòng sang đường gần nhất.
- Nhiều đường đáp án có thể cùng tồn tại. Nếu hồ sơ khai báo `path_selection`, chính sách được áp dụng:
  - `priority`: chọn đường đầu tiên khớp theo `order`;
  - `exclusive`: các đường không được chồng lấn; bộ kiểm tra ngữ nghĩa báo lỗi nếu chúng có thể cùng khớp.
- Nếu không khai báo `path_selection`, hành vi cũ được giữ nguyên: đường khớp đầu tiên theo thứ tự khai báo.

Với `case_001`, “chưa đủ căn cứ” là trục chính. Có 4 biến thể `path_insufficient*` cho các tổ hợp `unresolved`/`not_supported` của hai dấu hiệu, cộng `path_a` và `path_b` cho hai định danh có điều kiện. Đường A/B chỉ chấm dấu hiệu và định danh tương ứng, không đòi dấu hiệu của định danh còn lại. Kết luận `conclusion_a`/`conclusion_b` bị chặn nếu không chọn đúng `charge_a`/`charge_b`.

Với `case_002`, hai đường `path_a` (lạm dụng tín nhiệm) và `path_b` (lừa đảo chiếm đoạt) loại trừ nhau qua đánh giá thời điểm hình thành ý định; quy tắc `rule_intent_timing_exclusive` chặn tổ hợp mâu thuẫn. Cả hai đường đều đạt 100 điểm với câu trả lời lý tưởng.

### 4. Quy tắc nhất quán chạy trước khi chấm

`consistency_rules` được đánh giá trước khi so khớp đường đáp án. Nếu có quy tắc `severity: "blocking"` thất bại:

- `score.total = null`
- `score.blocking = true`
- `score.criteria = []`
- Không tạo điểm kết luận và không cho coi là đã nộp hợp lệ.

Nhờ vậy, các tổ hợp mâu thuẫn (ví dụ chọn định danh nhưng đánh dấu dấu hiệu bắt buộc là không được hỗ trợ) không thể vô tình nhận điểm.

### 5. Chấm điểm

Nếu không bị chặn:

- Không đường nào khớp → `total = null`, `unmatched = true`, chỉ trả `diagnostics` theo tiêu chí. Đây là chẩn đoán, không phải điểm cuối.
- Có đường khớp → lấy điểm tối đa của từng tiêu chí từ `scoring.path_weights`.

Công thức cho mỗi tiêu chí:

```text
earned = max_points × (tổng trọng số kỳ vọng đạt) / (tổng trọng số kỳ vọng áp dụng cho đường đáp án)
```

Quy tắc:

- Chỉ kỳ vọng có `path_ids` chứa đường đã khớp mới được tính.
- `single_choice` nhận **một giá trị** nằm trong `accepted_values`; nhiều giá trị là các đáp án thay thế cùng đạt điểm.
- `multi_select` so khớp **đúng toàn bộ tập giá trị**.
- `accepted_values: []` nghĩa là phải để trống lựa chọn.
- `scoring.max_total_points` (2.1.0) cố định thang điểm ở 100.
- `scoring.partial_credit.weight_scope = "within_criterion"` (2.1.0) khẳng định trọng số được chuẩn hoá trong từng tiêu chí, không nhân trọng số hai lần.
- Làm tròn **một lần duy nhất** ở tổng: `round(sum(earned))`, kẹp trong `[0, 100]`.
- Gợi ý đã dùng chỉ được ghi vào `selectedHints`; **không trừ điểm**.

### 6. Mở khoá chứng cứ

`evidence[].discovery` quyết định trạng thái:

- `always`: đọc ngay
- `viewed`: cần xem đủ tài liệu phụ thuộc
- `check`: cần xem đủ tài liệu, sau đó người chơi yêu cầu kiểm tra
- `unavailable`: không bao giờ mở

Tiến độ mở khoá chỉ để tham khảo, không phải điểm số.

### 7. Tuổi và phiên bản luật

- `age.ts` tính khoảng tuổi từ `DateInterval`; thiếu ngày hoặc độ chính xác `unknown` trả `unknown`, không tự chọn một tuổi.
- `legalVersion.ts` đối chiếu `conduct_events[].law_resolution` với bộ văn bản luật/điều khoản:
  - `invalid`: chưa phân giải, điều khoản chưa duyệt, cấu hình đoạn hiệu lực sai
  - `crosses`: khoảng ngày hành vi vượt hiệu lực điều khoản, hoặc đoạn hiệu lực không phủ kín
  - `incomplete`: thiếu ngày hiệu lực để đối chiếu
  - `ok`: đủ điều kiện đối chiếu
- Với `status: "crosses_version"`, hồ sơ phải khai báo tối thiểu hai `segments`. Hệ thống kiểm tra đoạn hiệu lực không chồng lấn, không để khoảng trống, phủ kín ngày hành vi và điều khoản thuộc đúng bộ văn bản của đoạn.

## Soạn nội dung hồ sơ mới

1. **Thêm bộ văn bản luật** vào `src/content/laws/`, sau đó đăng ký trong `LAW_BUNDLES` ở `src/domain/load.ts`.
2. **Thêm hồ sơ** vào `src/content/cases/` và đăng ký trong `RAW_CASES` ở `src/domain/load.ts`.
3. **Thêm mục** vào `src/content/manifest.json` với `id`, `version`, `playable`, `publishable`, `lawBundleIds`, `learningOutcomeIds`.
4. **Khai báo `answer_fields`** trước, vì mọi đối tượng/lựa chọn dùng cho giao diện và chấm điểm phải nằm trong danh mục này.
5. **Viết `expected_responses`** cho từng đường đáp án và tiêu chí; dùng `weight` để biểu diễn mức quan trọng tương đối.
6. **Viết `answer_paths`** bằng cú pháp nghiêm ngặt; kiểm tra các đường không chồng lấn.
7. **Viết `consistency_rules`** cho các mâu thuẫn phải chặn.
8. **Gán `scoring.path_weights`** sao cho tổng điểm mỗi đường bằng 100.
9. Chạy `npm run lint:content`, `npm test`, `npm run build`.

Khi sửa hồ sơ đã có người chơi, hãy tăng `metadata.version` và phiên bản trong danh mục. Phiên chơi lưu kèm `caseVersion`; bản lưu khác phiên bản sẽ bị giữ nguyên và không tự ghi đè.

## Lược đồ 2.1.0 và mở rộng có kiểm soát

Lược đồ hiện là **2.1.0**, mở rộng tương thích ngược từ 2.0.0. `schema_version` chấp nhận cả `"2.0.0"` và `"2.1.0"`; mọi trường mới đều không bắt buộc.

Các bổ sung chính:

| Trường | Vai trò |
| --- | --- |
| `scoring.max_total_points` | Cố định thang điểm 100 |
| `scoring.partial_credit.weight_scope` | Chuẩn hoá trọng số trong từng tiêu chí |
| `path_selection` | Chính sách `priority` / `exclusive` khi nhiều đường cùng khớp |
| `law_resolution.segments` | Phân giải luật nhiều đoạn khi hành vi cắt qua phiên bản |
| `proof_row.evidence_links[]` dạng đối tượng | Liên kết chứng cứ có kiểu (`relation`, `strength`, `reasoning`, …) |
| `proof_row.status` | Trạng thái chứng minh của mệnh đề |
| `learning_outcomes` cấp hồ sơ | Mục tiêu cục bộ, hợp nhất với danh mục toàn cục |

Chi tiết đầy đủ và ma trận tương thích: [`docs/schema-2.1.0.md`](docs/schema-2.1.0.md).

`case_001` vẫn giữ `"2.0.0"` để chứng minh đường tương thích ngược; `case_002` dùng `"2.1.0"` với `scoring.max_total_points` và `partial_credit.weight_scope`; danh mục của ứng dụng đã chuyển sang `"2.1.0"`.

Các tập nội dung như `evidence`, `hypotheses`, `issues`, `hints`, `glossary` dùng `content_record` với trường mở. Tuy vậy, mọi tham chiếu chéo vẫn bị bộ kiểm tra nội dung rà soát; trường mở không phải giấy phép bỏ qua rà soát.

## Kiểm tra nội dung và cổng xuất bản

`src/domain/linter.ts` kiểm tra:

- Mã định danh trùng giữa các tập
- `source_ids` không tồn tại
- ngày không hợp lệ / sai thứ tự / thiếu ngày
- biểu thức DSL tham chiếu trường/đối tượng/lựa chọn không tồn tại
- kỳ vọng dùng giá trị được chấp nhận không có trong lựa chọn
- tổng điểm tiêu chí của đường khác 100
- đường đáp án xung đột hoặc đường “chưa đủ căn cứ” vẫn khai báo định danh
- mục tiêu học tập không tồn tại hoặc không được tiêu chí nào đo
- quy tắc tuổi chồng lấn
- lựa chọn trùng trong cùng trường
- phân giải luật và trạng thái rà soát

Lớp thứ hai (`src/domain/semantic.ts`) kiểm tra các bất biến ngữ nghĩa:

- kỳ vọng trùng nhóm chấm (`sem_unique_expectation`)
- `scoring.max_total_points` / `weight_scope` sai hoặc thiếu
- `path_selection.order` không phải hoán vị đầy đủ, hoặc đường chồng lấn khi `exclusive`
- tham chiếu/đoạn hiệu lực trỏ điều khoản hoặc bộ văn bản sai
- `critical` và `critical_issue_ids` lệch nhau
- chu trình mở khoá chứng cứ nhiều bước
- chứng cứ mồ côi, phần giải thích không dùng, tiêu chí không có kỳ vọng, dấu hiệu bắt buộc thiếu dữ kiện

Chi tiết mã kiểm tra: [`docs/semantic-validator.md`](docs/semantic-validator.md).

### Trạng thái hiện tại

- `npm run lint:content` → **0 lỗi, 22 cảnh báo, 2 thông tin** (case_001: 7 cảnh báo; case_002: 15 cảnh báo)
- `npm run lint:content -- --publish` → **57 lỗi** (case_001: 17, case_002: 40), mã thoát 1
- `npm run build` chạy kiểm tra nháp trong bước dựng trước, nên bản dựng vẫn qua dù hồ sơ bị chặn xuất bản

Các nhóm mục chặn xuất bản đang bật cho cả hai hồ sơ:

- `metadata.status` chưa `approved`/`published`
- `review.status` chưa `approved`, `review_ids` rỗng
- điều khoản luật chưa duyệt, thiếu ngày bắt đầu hiệu lực, thiếu nguồn chính thức
- `conduct_01` (case_001) và `conduct_nhan_xe`/`conduct_ban_xe` (case_002) chưa phân giải bộ văn bản luật
- quy tắc tuổi chưa duyệt và chưa có điều kiện; `case_002` còn thiếu ngày sinh của các nhân vật
- khiếm khuyết thủ tục chưa duyệt
- tình tiết chưa duyệt
- `legal_time_anchor_reason` còn chỗ chưa xác minh
- còn dấu hiệu chưa xác minh trong nội dung
- `explanation_01` không được kỳ vọng hoặc phần so sánh định danh nào dùng (`sem_explanation_unused`, case_001)

Danh mục đặt `publishable: false`. Công cụ dòng lệnh cũng chặn trường hợp danh mục và metadata lệch nhau, hoặc hồ sơ được đánh dấu xuất bản được nhưng còn lỗi xuất bản.

**Không sửa hồ sơ nháp thành “đã duyệt” chỉ để bản dựng đi qua.** Bản dựng hiện tại đã đúng thiết kế: kiểm tra nháp phải sạch lỗi cấu trúc, cổng xuất bản phải tiếp tục thất bại cho tới khi có người rà soát thật.

## Lưu trữ, xuất/nhập và đặt lại

- Khoá phiên: `ttths.session.v1.<caseId>`
- Bản sao lưu khi dữ liệu hỏng: `ttths.backup.v1.<caseId>.<timestamp>`
- Lược đồ phiên chơi: `1`
- Tự lưu sau mỗi thay đổi trạng thái.
- Nếu bản lưu lỗi lược đồ/tệp dữ liệu/phiên bản hồ sơ: ứng dụng tạo phiên mới, **giữ nguyên dữ liệu gốc**, hiện banner cảnh báo và cho tải bản lưu lỗi trong Cài đặt.
- Xuất tạo tệp dữ liệu chứa phiên chơi, phiên bản ứng dụng, phiên bản hồ sơ, thời điểm lưu.
- Nhập từ chối tệp dữ liệu lỗi, sai `caseId`, sai `caseVersion`, sai lược đồ phiên chơi hoặc thiếu trường bắt buộc; không ghi đè dữ liệu hiện tại.
- Đặt lại hồ sơ và xóa toàn bộ dữ liệu đều có hộp xác nhận.

## Kiểm thử

21 tệp, 163 bài kiểm thử:

- `scoring.test.ts`: đường A/B và 4 biến thể chưa đủ căn cứ đạt 100, đường A/B không đòi dấu hiệu của định danh còn lại, điểm từng phần, làm tròn một lần, chọn nhiều đúng tập, chặn nộp bài, chẩn đoán không khớp đường; `case_002` đạt 100 ở cả hai đường và nhận đáp án thay thế cho `single_choice`
- `matching.test.ts`: cú pháp DSL, so khớp đường đáp án, ưu tiên `path_selection`, quy tắc nhất quán
- `linter.test.ts`: cổng nháp/xuất bản, các biến thể lỗi tham chiếu, luật nhiều đoạn
- `semantic.test.ts`: Lớp 2 — bất biến chấm điểm, chính sách đường đáp án, nội dung mồ côi, chu trình mở khoá
- `schema-2.1.0.test.ts`: bộ dữ liệu hợp lệ/không hợp lệ cho lược đồ và tương thích ngược
- `load.test.ts`: ghép bộ văn bản luật, danh mục hai hồ sơ, lược đồ đóng, nạp `case_002` với hai bundle/6 điều khoản
- `legalVersion.test.ts`: không hợp lệ/vắt qua/thiếu/đạt và nhiều đoạn
- `age.test.ts`: khoảng tuổi, xấp xỉ, chưa rõ, ngày không tồn tại
- `evidence.test.ts`: mở khoá và tiến độ
- `persistence.test.ts`: vòng lưu-tải, sao lưu, phiên bản lược đồ/hồ sơ, nhập/xuất, xoá
- `reducer.test.ts`: câu trả lời, ghi chú, gợi ý, nộp/mở lại/đặt lại/nhập
- `content.test.ts`: bộ bất biến nội dung C-01 → C-16 cho `case_001`
- `src/ui/**/*.test.tsx`: hiển thị và tương tác các màn hình chính bằng Testing Library + happy-dom
- `src/test/e2e-playthrough.test.ts`: hành trình bộ giảm trạng thái từ xem chứng cứ đến nộp bài (không phải kiểm thử trình duyệt)

Kiểm thử trình duyệt nằm ở `e2e/typography.spec.ts` (Playwright + Chromium, 8 bài):

- 5 độ rộng × 7 màn hình × sáng/tối: không tràn ngang và không có chữ dưới 11px
- thang cỡ chữ đúng theo breakpoint 1440 / 768 / 390 / 360px
- `document.fonts.check` xác nhận font tự lưu phủ dấu tiếng Việt, computed family đúng
- mở hồ sơ `case_002` từ thư viện: đủ 12 chứng cứ, chip “Vụ án 002”, không tràn ngang ở 360/768/1440px
- ảnh chụp lưu ở `test-results/` để rà soát thủ công, không dùng baseline pixel

## Giới hạn đã biết

- Cả hai hồ sơ đều là nội dung nháp, chưa được thẩm định pháp lý; không thể xuất bản cho tới khi có người rà soát đủ năng lực.
- Các khoảng trống nội dung đã biết của `case_001`: thiếu dòng chứng minh cho `element_b_01`, `issue_03` chưa có gợi ý, `explanation_01` chưa được dùng, quy tắc tuổi chưa có điều kiện, phân giải luật còn chưa phân giải, còn chỗ chưa xác minh.
- `case_002` còn thiếu ngày sinh của năm nhân vật, chưa phân giải luật cho hai hành vi, và các điều khoản BLHS/BLTTHS chưa được rà soát.
- Tổ hợp `conclusion_insufficient` nhưng tự đánh giá ít nhất một dấu hiệu là `supported` không khớp đường nào; người chơi nhận chẩn đoán "không khớp đường đáp án" thay vì bị chặn bởi quy tắc nhất quán.
- `path_selection` chống chồng lấn bằng phân tích tĩnh xấp xỉ; nhánh có `any` được bỏ qua thay vì khẳng định.
- Không có máy chủ, tài khoản, đồng bộ đa thiết bị hoặc dữ liệu đo lường từ xa.
- Không có chấm điểm văn bản tự do bằng trí tuệ nhân tạo.
- Kiểm thử trình duyệt dùng Playwright chỉ kiểm tra tràn ngang, cỡ chữ và font; không có baseline pixel và chưa kiểm tra tương tác bàn phím.
- Gói JavaScript bản phát hành hiện khoảng 635 kB (Vite cảnh báo khối > 500 kB). Font tự lưu thêm ~253 kB woff2 ở lần tải đầu (chỉ subset latin + vietnamese). Cảnh báo không chặn bản dựng.
- Ứng dụng là mô phỏng học tập rút gọn, không phải quy trình tố tụng đầy đủ.
