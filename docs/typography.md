# Thám tử Hình sự — Quy chuẩn kiểu chữ

> Phiên bản 1.0 · hướng thiết kế: biên tập · học thuật · điều tra
> Áp dụng cho toàn bộ giao diện 12 màn hình, cả chế độ sáng và tối.

## 1. Mục tiêu

Kiểu chữ phải tạo cảm giác như một hệ thống hồ sơ và tài liệu điều tra, không phải bảng điều khiển SaaS. Bốn nguyên tắc:

1. **Biên tập trước** — tiêu đề mang phong cách sách, báo chí, tài liệu chuyên khảo.
2. **Khả năng đọc trước** — nội dung dài ưu tiên độ dễ đọc.
3. **Phân cấp rõ** — tách tiêu đề, nội dung, metadata, chứng cứ và nhận xét.
4. **Tiết chế** — ít family, ít weight, không hiệu ứng trang trí.

Tiếng Việt là ngôn ngữ gốc: dấu phải cân đối ở mọi cỡ chữ và weight.

## 2. Ba vai trò font

| Vai trò | Font | Dùng cho | Weight |
|---|---|---|---|
| Display | Source Serif 4 | Hero, tên hồ sơ, tiêu đề mục/card, tiêu đề giải thích pháp lý | 400–700 |
| Interface | IBM Plex Sans | Điều hướng, nội dung, nút, biểu mẫu, mô tả chứng cứ, bảng | 400–700 |
| Data | IBM Plex Mono | Mã chứng cứ, mã tài liệu, phiên bản, mốc thời gian, mã điều luật | 400–500 |

Font được **tự lưu** qua `@fontsource`, nạp trong `src/main.tsx`:

```ts
import '@fontsource-variable/source-serif-4/standard.css' // wght + opsz
import '@fontsource-variable/ibm-plex-sans/wght.css'
import '@fontsource/ibm-plex-mono/400.css'
import '@fontsource/ibm-plex-mono/500.css'
```

Không gọi máy chủ font bên thứ ba. Tên family do gói khai báo là `"Source Serif 4 Variable"` và `"IBM Plex Sans Variable"` — token phải dùng đúng tên này, nếu không trình duyệt sẽ rơi về fallback mà không báo lỗi.

Fallback theo thứ tự: `Georgia, serif` · `"Segoe UI", system-ui, sans-serif` · `"Cascadia Code", Consolas, monospace`. Cả ba đều hiển thị được tiếng Việt.

**Tải thực tế:** ~253 KB woff2 cho subset `latin` + `vietnamese`. Các subset cyrillic/greek có trong `dist` nhưng không được tải nhờ `unicode-range`.

## 3. Token tập trung (`src/styles.css`)

```css
--font-display: "Source Serif 4 Variable", "Source Serif 4", Georgia, serif;
--font-body: "IBM Plex Sans Variable", "IBM Plex Sans", "Segoe UI", system-ui, sans-serif;
--font-mono: "IBM Plex Mono", "Cascadia Code", Consolas, monospace;

--weight-regular: 400; --weight-medium: 500;
--weight-semibold: 600; --weight-bold: 700;

--text-display-xl: 3.5rem;   --text-display-lg: 3rem;
--text-h1: 2.25rem;          --text-h2: 1.875rem;
--text-h3: 1.5rem;           --text-h4: 1.25rem;
--text-case-title: 1.75rem;  --text-doc-title: 1.375rem;
--text-body-lg: 1.0625rem;   --text-body: 0.9375rem;
--text-body-sm: 0.875rem;    --text-label: 0.8125rem;
--text-caption: 0.75rem;     --text-micro: 0.6875rem;

--leading-display: 1.12; --leading-h1: 1.2; --leading-h2: 1.25;
--leading-h3: 1.3;       --leading-h4: 1.35;
--leading-body: 1.65;    --leading-legal: 1.75;
--leading-compact: 1.4;  --leading-table: 1.5;

--tracking-display: -0.035em; --tracking-heading: -0.02em;
--tracking-normal: 0;         --tracking-label: 0.06em;
--tracking-mono: 0.01em;
```

Gốc `html` là 16px nên `0.9375rem = 15px`. Các token tổng hợp `--type-*` tồn tại để tra cứu; component dùng biến rời để tránh `font:` shorthand ghi đè line-height.

## 4. Thang cỡ và responsive

| Token | Desktop | ≤ 768px | ≤ 380px |
|---|---|---|---|
| display-xl | 56 | 38 | 34 |
| display-lg | 48 | 34 | 34 |
| h1 | 36 | 29 | 27 |
| h2 | 30 | 24 | 24 |
| h3 | 24 | 20 | 20 |
| h4 | 20 | 18 | 18 |
| tiêu đề hồ sơ | 28 | 23 | 23 |
| body | 15 | 15 | 15 |
| label | 13 | 13 | 13 |
| caption | 12 | 12 | 12 |
| micro | 11 | 11 | 11 |

Breakpoint **bố cục** vẫn là 1020 / 900 / 720 / 480px. Breakpoint **kiểu chữ** là 768 / 380px; trong khoảng 721–768px bố cục chưa đổi nhưng chữ đã nhỏ hơn — đây là chủ ý.

Ngoại lệ có lý do: `.input`/`.textarea` dùng 16px khi ≤ 768px để iOS không tự phóng to trang khi chạm vào ô nhập.

## 5. Mapping component → token

### Display (Source Serif 4, 600)

| Selector | Token / giá trị |
|---|---|
| `.hero__copy h1` | `--text-display-xl`, `--leading-display`, `--tracking-display` |
| `h1` | `--text-h1` / `--leading-h1` |
| `h2` | `--text-h2` / `--leading-h2` |
| `h3` | `--text-h3` / `--leading-h3` |
| `h4` | `--text-h4` / `--leading-h4` |
| `.case-card__head h2` | `--text-case-title` |
| `.card > h3` | `--text-h3` (24) |
| `.evidence-card__head h3` | `--text-h4` (19–22) |
| `.feedback-path` | `--text-doc-title` (22) |
| `.glossary dt`, `.hero__panel-title` | `--text-h4` |
| `.modal__head h2` | `--text-h3` |
| `.score-number` | `--text-display-lg` |
| `.brand__name` | `--text-body-lg` |
| `.brand__mark`, `.callout__icon` | `--text-body-sm` / 15 |

### Interface (IBM Plex Sans)

| Nhóm | Cỡ / line-height |
|---|---|
| `body` | 15 / 1.65 |
| `.hero__lead` | 17 / 1.65 |
| `.small`, `.button`, `.header-link`, `.field__legend`, `.choice` | 14 |
| `.field__hint`, `.link-button`, `.app-footer`, `.stepper__item` | 13 |
| `.badge`, `.chip`, `.tag`, `.source-chip`, `.case-chip` | 12 |
| `.eyebrow`, `.fact-grid dt`, `.hint-panel__level` | 12–13, in hoa, `--tracking-label` |
| `.law-list > li` | 15 / 1.75 |
| `.data-table` | 14 / 1.5; `thead th` 12 / 600 |

### Data (IBM Plex Mono, 11–12px)

`code`, `.mono`, `.case-chip`, `.timeline__date`, `.stepper__index`, `.timeline-list__index`, `.progress__meta`, `.expectation__values dt`, nhãn phiên bản và mã hồ sơ.

Không dùng mono cho đoạn giải thích dài. Không dùng 11px cho thông tin cần đọc để ra quyết định pháp lý.

## 6. Weight và letter spacing

- Chỉ bốn weight: 400, 500, 600, 700. Không còn 550/650.
- `strong` dùng 600; 700 chỉ dành cho nhấn mạnh có chọn lọc (mark, brand).
- Tracking: display −0.035em, heading −0.02em, body/navigation 0, label in hoa 0.06em, mono 0.01em.
- Không dùng tracking âm lớn cho tiếng Việt vì dấu dễ bị chật.

## 7. Quy tắc nội dung

- **Sàn 11px** cho mọi văn bản hiển thị. Dưới ngưỡng này chỉ dùng cho glyph trang trí.
- Body giữ 15px ổn định trên desktop, tablet và mobile.
- Tên hồ sơ xuống dòng tự nhiên, không ép `nowrap`.
- Bảng ưu tiên khả năng đọc; không giảm cỡ chữ để nhồi thêm cột.
- Không in hoa đoạn mô tả dài; chỉ in hoa nhãn ngắn.
- Metadata quan trọng (mã điều luật, mốc thời gian) dùng mono 12px, không nhỏ hơn.

## 8. Kiểm chứng

```bash
npx tsc --noEmit
npm test
npm run test:e2e
npm run build
```

`e2e/typography.spec.ts` kiểm tra:

- không tràn ngang ở 360 / 390 / 768 / 1024 / 1440px trên 7 màn hình, cả sáng và tối;
- không phần tử văn bản nào dưới 11px;
- cỡ chữ hero và tiêu đề hồ sơ đúng theo breakpoint;
- `document.fonts.check` với dấu kết hợp tiếng Việt và computed family chứa đúng tên font;
- ảnh chụp lưu ở `test-results/` để rà soát thủ công (không dùng baseline pixel).

Checklist glyph thủ công: `ă â ê ô ơ ư đ`, dấu kết hợp `ắ ấ ệ ộ ợ ữ`, chữ hoa có dấu, weight 400/600/700, xác nhận không có ký tự nào rơi riêng về fallback.

## 9. Khác biệt có chủ ý so với guideline gốc

| Điểm | Guideline | Áp dụng | Lý do |
|---|---|---|---|
| Ô nhập trên mobile | body 15px | 16px khi ≤ 768px | Chặn iOS tự phóng to |
| `.timeline__date` | không quy định | mono 12px | Là dữ liệu ngày, không phải tiêu đề biên tập |
| Tiêu đề hồ sơ mobile | 23px | 23px qua token | Giữ đúng bảng responsive |
| `.modal__head h2` | card title 22–28 | 24px (`--text-h3`) | Modal là mục, không phải card |
| Điểm số | không quy định | 48 / 34px | Dùng display-lg, tabular-nums |
