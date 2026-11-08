# Thám tử Hình sự

Trò chơi học tập chạy trên trình duyệt bằng tiếng Việt về đọc hồ sơ, đánh giá chứng cứ và phân tích pháp lý trong tình huống hình sự hư cấu. Người học đi qua 12 màn hình, trả lời bằng lựa chọn có cấu trúc, nhận phản hồi theo tiêu chí và xem lại căn cứ pháp luật của hồ sơ.

> **Lưu ý:** Tình huống và phản hồi phục vụ học tập; không phải tư vấn pháp lý cho vụ việc thực tế. Trò chơi không mô phỏng đầy đủ thủ tục tố tụng Việt Nam và không tự động diễn giải luật.

Hồ sơ duy nhất hiện có (`case_001`) là **bản nháp chưa thẩm định**: toàn bộ điều khoản, nhãn định danh và một số đáp án còn chờ người rà soát chuyên môn. Hồ sơ vẫn chơi được nhưng bị chặn xuất bản.

## Bản chạy thử

Bản chạy thử công khai: <https://ngminhduc129.github.io/tham-tu-hinh-su/>

Bản chạy thử giữ nguyên `case_001` ở nhãn bản nháp/chưa thẩm định; cổng xuất bản vẫn chặn. Mỗi lần đẩy lên `main`, GitHub Actions dựng và triển khai lại qua `.github/workflows/deploy-pages.yml`.

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
| `npm test` | Chạy toàn bộ Vitest (160 bài kiểm thử) |
| `npm run test:watch` | Chạy kiểm thử ở chế độ theo dõi |
| `npm run test:corpus` | Chạy riêng bộ dữ liệu kiểm thử lược đồ 2.1.0, bộ kiểm tra ngữ nghĩa và bất biến nội dung |
| `npm run lint:content` | Kiểm tra nội dung ở chế độ nháp |
| `npm run lint:content -- --publish` | Chạy cổng xuất bản; hồ sơ nháp phải thất bại |
| `npm run build` | Bước dựng trước kiểm tra nội dung nháp, sau đó `tsc --noEmit` và `vite build` |
| `npm run preview` | Xem bản dựng |
| `npm run check` | Kiểm tra nháp + kiểm thử + dựng |

## Công nghệ

- React 19 + TypeScript, Vite 7
- Vitest
- Ajv 2020 + ajv-formats để kiểm tra lược đồ JSON bản 2020-12
- Bộ định tuyến hash tự viết (không dùng React Router)
- Bộ nhớ cục bộ cho tiến độ; không dùng dữ liệu đo lường từ xa

## Cấu trúc

```text
index.html
schemas/case.schema.json          # Lược đồ JSON 2.1.0 (tương thích ngược 2.0.0)
docs/schema-2.1.0.md              # thay đổi lược đồ và ma trận tương thích
docs/semantic-validator.md        # Bộ kiểm tra ngữ nghĩa lớp 2
scripts/lint-content.ts           # Công cụ dòng lệnh kiểm tra nội dung và cổng xuất bản
src/
  App.tsx                         # khởi động, tự lưu, định tuyến, chặn nộp bài
  main.tsx
  styles.css                      # giao diện học thuật sáng, thích ứng tới 360px
  content/
    manifest.json                 # danh mục hồ sơ, cờ chơi được/xuất bản được
    learning-outcomes.json        # danh mục mục tiêu học tập
    cases/case_001.json           # hồ sơ nháp (chưa gắn bộ văn bản luật)
    laws/law_bundle_v1.json       # bộ văn bản luật tách riêng
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
3. Lấy `metadata.law_bundle_ids`, tra trong danh mục đăng ký `LAW_BUNDLES` (hiện là `src/content/laws/law_bundle_v1.json`).
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

`case_001` vẫn giữ `"2.0.0"` để chứng minh đường tương thích ngược; danh mục của ứng dụng đã chuyển sang `"2.1.0"`.

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

- `npm run lint:content` → **0 lỗi, 7 cảnh báo, 1 thông tin**
- `npm run lint:content -- --publish` → **17 lỗi**, mã thoát 1
- `npm run build` chạy kiểm tra nháp trong bước dựng trước, nên bản dựng vẫn qua dù hồ sơ bị chặn xuất bản

Các nhóm mục chặn xuất bản đang bật cho `case_001`:

- `metadata.status` chưa `approved`/`published`
- `review.status` chưa `approved`, `review_ids` rỗng
- điều khoản luật chưa duyệt, thiếu ngày bắt đầu hiệu lực, thiếu nguồn chính thức
- `conduct_01` chưa phân giải bộ văn bản luật
- quy tắc tuổi chưa duyệt và chưa có điều kiện
- khiếm khuyết thủ tục chưa duyệt
- tình tiết chưa duyệt
- `legal_time_anchor_reason` còn chỗ chưa xác minh
- còn dấu hiệu chưa xác minh trong nội dung
- `explanation_01` không được kỳ vọng hoặc phần so sánh định danh nào dùng (`sem_explanation_unused`)

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

21 tệp, 160 bài kiểm thử:

- `scoring.test.ts`: đường A/B và 4 biến thể chưa đủ căn cứ đạt 100, đường A/B không đòi dấu hiệu của định danh còn lại, điểm từng phần, làm tròn một lần, chọn nhiều đúng tập, chặn nộp bài, chẩn đoán không khớp đường
- `matching.test.ts`: cú pháp DSL, so khớp đường đáp án, ưu tiên `path_selection`, quy tắc nhất quán
- `linter.test.ts`: cổng nháp/xuất bản, các biến thể lỗi tham chiếu, luật nhiều đoạn
- `semantic.test.ts`: Lớp 2 — bất biến chấm điểm, chính sách đường đáp án, nội dung mồ côi, chu trình mở khoá
- `schema-2.1.0.test.ts`: bộ dữ liệu hợp lệ/không hợp lệ cho lược đồ và tương thích ngược
- `load.test.ts`: ghép bộ văn bản luật, danh mục, lược đồ đóng
- `legalVersion.test.ts`: không hợp lệ/vắt qua/thiếu/đạt và nhiều đoạn
- `age.test.ts`: khoảng tuổi, xấp xỉ, chưa rõ, ngày không tồn tại
- `evidence.test.ts`: mở khoá và tiến độ
- `persistence.test.ts`: vòng lưu-tải, sao lưu, phiên bản lược đồ/hồ sơ, nhập/xuất, xoá
- `reducer.test.ts`: câu trả lời, ghi chú, gợi ý, nộp/mở lại/đặt lại/nhập
- `content.test.ts`: bộ bất biến nội dung C-01 → C-16 cho `case_001`
- `src/ui/**/*.test.tsx`: hiển thị và tương tác các màn hình chính bằng Testing Library + happy-dom
- `src/test/e2e-playthrough.test.ts`: hành trình bộ giảm trạng thái từ xem chứng cứ đến nộp bài, chưa phải kiểm thử đầu-cuối trên trình duyệt

## Giới hạn đã biết

- Hồ sơ mẫu là nội dung nháp, chưa được thẩm định pháp lý; không thể xuất bản cho tới khi có người rà soát đủ năng lực.
- Các khoảng trống nội dung đã biết của `case_001`: thiếu dòng chứng minh cho `element_b_01`, `issue_03` chưa có gợi ý, `explanation_01` chưa được dùng, quy tắc tuổi chưa có điều kiện, phân giải luật còn chưa phân giải, còn chỗ chưa xác minh.
- Tổ hợp `conclusion_insufficient` nhưng tự đánh giá ít nhất một dấu hiệu là `supported` không khớp đường nào; người chơi nhận chẩn đoán "không khớp đường đáp án" thay vì bị chặn bởi quy tắc nhất quán.
- `path_selection` chống chồng lấn bằng phân tích tĩnh xấp xỉ; nhánh có `any` được bỏ qua thay vì khẳng định.
- Không có máy chủ, tài khoản, đồng bộ đa thiết bị hoặc dữ liệu đo lường từ xa.
- Không có chấm điểm văn bản tự do bằng trí tuệ nhân tạo.
- Chưa có kiểm thử đầu-cuối trên trình duyệt (Playwright); các bài kiểm thử giao diện hiện chạy bằng Testing Library + happy-dom, chưa kiểm tra bố cục thật ở 360 px.
- Gói JavaScript bản phát hành hiện khoảng 552 kB (Vite cảnh báo khối > 500 kB). Cảnh báo không chặn bản dựng.
- Ứng dụng là mô phỏng học tập rút gọn, không phải quy trình tố tụng đầy đủ.
