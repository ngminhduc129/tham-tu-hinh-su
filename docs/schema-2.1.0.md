# Lược đồ hồ sơ 2.1.0

Tài liệu này mô tả bản nâng cấp **2.1.0** của `schemas/case.schema.json`.

## Nguyên tắc

2.1.0 là bản mở rộng **tương thích ngược** của 2.0.0:

- `schema_version` chấp nhận cả `"2.0.0"` và `"2.1.0"`.
- Mọi trường mới đều **không bắt buộc**. Hồ sơ 2.0.0 không cần sửa gì để tiếp tục kiểm tra hợp lệ.
- Từ vựng cũ được giữ nguyên; chỉ bổ sung giá trị mới cho các kiểu liệt kê đã có.
- Không đổi cấu trúc đáp án chuẩn: vẫn chỉ `answers[fieldId][targetId]`.

`case_001` hiện vẫn khai báo `"2.0.0"` và được dùng làm bằng chứng tương thích ngược trong kiểm thử.

## Các thay đổi

### 1. Định danh lược đồ

| Trường | Giá trị |
| --- | --- |
| `$id` | `https://tham-tu-hinh-su.invalid/schema/case-2.1.0.json` |
| `properties.schema_version` | `enum: ["2.0.0", "2.1.0"]` |

Danh mục (`src/content/manifest.json`) đã chuyển `schemaVersion` sang `"2.1.0"`; danh mục là thông tin mô tả của ứng dụng, không phải nội dung hồ sơ.

### 2. `scoring.max_total_points`

```json
"scoring": {
  "max_total_points": 100,
  "path_weights": [...],
  "partial_credit": {
    "method": "weighted_expectation_ratio",
    "rounding": "nearest_integer",
    "weight_scope": "within_criterion"
  }
}
```

- `max_total_points` là `const: 100` (nếu khai báo). Mục đích là cố định thang điểm và chặn case vô tình đổi thang.
- `partial_credit.weight_scope = "within_criterion"` khẳng định trọng số expectation được chuẩn hoá **trong từng criterion**, tránh nhân trọng số hai lần.
- Bộ kiểm tra ngữ nghĩa cảnh báo nếu hồ sơ 2.1.0 không khai báo hai trường này.

### 3. `path_selection`

Chính sách chọn đường đáp án khi nhiều đường có thể cùng khớp:

```json
"path_selection": {
  "mode": "priority",
  "order": ["path_insufficient", "path_a", "path_b"]
}
```

| `mode` | Ý nghĩa |
| --- | --- |
| `priority` | Chọn đường đầu tiên khớp theo `order` |
| `exclusive` | Các đường không được chồng lấn; bộ kiểm tra nội dung báo lỗi nếu có thể cùng khớp |

`order`, khi có mặt, phải là hoán vị đầy đủ của `answer_paths` (không thiếu, không trùng, không lạ).

### 4. `law_resolution.segments`

`law_resolution` giữ nguyên `status`, `bundle_id`, `review_id` và thêm mảng `segments` optional:

```json
"law_resolution": {
  "status": "crosses_version",
  "bundle_id": null,
  "review_id": "review_cross_01",
  "segments": [
    {
      "start_date": "2024-05-01",
      "end_date": "2024-05-31",
      "bundle_id": "law_bundle_v1",
      "provision_ids": ["provision_01"],
      "review_id": "review_segment_01"
    }
  ]
}
```

Quy tắc của hệ thống (`src/domain/legalVersion.ts`):

- `resolved` + có `segments` → **invalid** (dùng một trong hai, không dùng cả hai).
- `unresolved` + có `bundle_id` hoặc `segments` → **invalid**.
- `crosses_version` phải có **≥ 2 đoạn hiệu lực**; một đoạn bị coi là không hợp lệ.
- Các đoạn hiệu lực phải:
  - có `start_date`/`end_date` hợp lệ và `start_date ≤ end_date`;
  - trỏ tới bộ văn bản tồn tại;
  - không chồng lấn;
  - không để khoảng trống giữa các đoạn;
  - phủ kín khoảng ngày hành vi;
  - có điều khoản được tham chiếu nằm trong đúng bộ văn bản của đoạn.

Lược đồ cho phép `start_date`/`end_date` là `null` để biểu diễn dữ liệu chưa đầy đủ, nhưng khi đó hệ thống báo `invalid`/`incomplete`. Việc cho phép `null` ở lược đồ giúp phân biệt “thiếu dữ liệu” với “sai kiểu dữ liệu”.

### 5. `proof_row` và `evidence_link`

`proof_row` được đóng (`additionalProperties: false`) và có thêm `status`:

```json
{
  "id": "proof_row_01",
  "proposition": "…",
  "charge_element_ids": ["element_a_01"],
  "evidence_links": [
    {
      "evidence_id": "ev_record_01",
      "relation": "supports",
      "limitation_ids": ["limit_01"],
      "strength": "strong",
      "reasoning": "…"
    }
  ],
  "status": "partially_established"
}
```

`evidence_link` là đối tượng có kiểu, thay cho liên kết chứng cứ dạng mảng mã tự do:

| Trường | Bắt buộc | Giá trị |
| --- | --- | --- |
| `evidence_id` | có | Mã chứng cứ |
| `relation` | có | `supports`, `challenges`, `contradicts`, `context`, `contextual` |
| `limitation_ids` | không | Danh sách hạn chế chứng cứ |
| `strength` | không | `strong`, `partial`, `weak` |
| `reasoning` | không | Giải thích quan hệ |
| `weight` | không | Số ≥ 0, dự phòng cho mô hình hoá sau này |

Quan hệ logic (`supports` / `challenges` / `contradicts` / `context`) **không phải** kết luận chứng minh. Kết luận vẫn nằm ở `conclusions`, `proof_row.status` và điểm số.

Chấp nhận cả `context` và `contextual` (cùng nghĩa) để không phá dữ liệu cũ; nội dung mới nên dùng `context`.

### 6. `learning_outcomes` cấp hồ sơ

Hồ sơ có thể khai báo mục tiêu cục bộ:

```json
"learning_outcomes": [
  { "id": "lo_local_01", "description": "Mô tả", "label": "Nhãn ngắn" }
]
```

Mục tiêu cục bộ được hợp nhất với danh mục toàn cục khi kiểm tra. Trường này không bắt buộc và không thay thế danh mục chung.

## Ma trận tương thích

| Dữ liệu | 2.0.0 | 2.1.0 |
| --- | --- | --- |
| Hồ sơ 2.0.0 hiện có | hợp lệ | hợp lệ (không cần sửa) |
| `evidence_links` dạng cũ | — | không còn hợp lệ nếu chỉ là mảng mã; phải là đối tượng |
| `law_resolution` không `segments` | hợp lệ | hợp lệ |
| `scoring` không `max_total_points` | hợp lệ | hợp lệ, chỉ cảnh báo |
| `proof_row` có trường lạ | — | bị từ chối |

> Ghi chú: `evidence_links` dạng mảng mã chưa từng là hợp đồng của 2.0.0 trong kho mã này; nếu có dữ liệu ngoài kho, cần chuyển đổi sang đối tượng `{ evidence_id, relation }`.

## Kiểm thử

`src/domain/schema-2.1.0.test.ts` chứa bộ dữ liệu:

- **Hợp lệ**: hồ sơ 2.0.0 nguyên bản; hồ sơ 2.1.0 dùng đầy đủ trường mới.
- **Không hợp lệ**: `schema_version` lạ, `max_total_points ≠ 100`, `weight_scope` sai, `relation` sai/thiếu/thuộc tính lạ, `proof_row` thuộc tính lạ, `proof_row.status` sai, `law_segment` thiếu `bundle_id`, `law_resolution` thiếu `bundle_id`, `path_selection.mode` sai, `learning_outcomes` thiếu `description`, `weight ≤ 0`, `expr.op` sai.

Chạy riêng:

```bash
npx vitest run src/domain/schema-2.1.0.test.ts
```

## Việc chưa làm trong 2.1.0

Các mục sau được đẩy sang 2.2.0 để tránh phá vỡ cấu trúc:

- Tách thực thể người/thời điểm thành bảng riêng.
- Mô hình hoá trạng thái trò chơi trong lược đồ.
- Phạm vi quy tắc linh hoạt và `multi_match`.
- Chuẩn hoá đa ngôn ngữ cho nhãn.
