# Schema case 2.1.0

Tài liệu này mô tả bản nâng cấp **2.1.0** của `schemas/case.schema.json`.

## Nguyên tắc

2.1.0 là bản mở rộng **tương thích ngược** của 2.0.0:

- `schema_version` chấp nhận cả `"2.0.0"` và `"2.1.0"`.
- Mọi trường mới đều **optional**. Case 2.0.0 không cần sửa gì để tiếp tục validate.
- Vocabulary cũ được giữ nguyên; chỉ bổ sung giá trị mới cho các enum đã có.
- Không đổi cấu trúc canonical answers: vẫn chỉ `answers[fieldId][targetId]`.

`case_001` hiện vẫn khai báo `"2.0.0"` và được dùng làm bằng chứng backward-compatibility trong test.

## Các thay đổi

### 1. Định danh schema

| Trường | Giá trị |
| --- | --- |
| `$id` | `https://tham-tu-hinh-su.invalid/schema/case-2.1.0.json` |
| `properties.schema_version` | `enum: ["2.0.0", "2.1.0"]` |

Manifest (`src/content/manifest.json`) đã chuyển `schemaVersion` sang `"2.1.0"`; manifest là metadata của ứng dụng, không phải nội dung case.

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
- Semantic Validator cảnh báo nếu case 2.1.0 không khai báo hai trường này.

### 3. `path_selection`

Chính sách chọn path khi nhiều path có thể cùng khớp:

```json
"path_selection": {
  "mode": "priority",
  "order": ["path_insufficient", "path_a", "path_b"]
}
```

| `mode` | Ý nghĩa |
| --- | --- |
| `priority` | Chọn path đầu tiên khớp theo `order` |
| `exclusive` | Các path không được chồng lấn; linter báo lỗi nếu có thể cùng khớp |

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

Quy tắc engine (`src/domain/legalVersion.ts`):

- `resolved` + có `segments` → **invalid** (dùng một trong hai, không dùng cả hai).
- `unresolved` + có `bundle_id` hoặc `segments` → **invalid**.
- `crosses_version` phải có **≥ 2 segment**; một segment bị coi là invalid.
- Các segment phải:
  - có `start_date`/`end_date` hợp lệ và `start_date ≤ end_date`;
  - trỏ tới bundle tồn tại;
  - không chồng lấn;
  - không để khoảng trống giữa các segment;
  - phủ kín khoảng ngày hành vi;
  - có provision được tham chiếu nằm trong đúng bundle của segment.

Schema cho phép `start_date`/`end_date` là `null` để biểu diễn dữ liệu chưa đầy đủ, nhưng khi đó engine báo `invalid`/`incomplete`. Việc cho phép `null` ở schema giúp phân biệt “thiếu dữ liệu” với “sai kiểu dữ liệu”.

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

`evidence_link` là object có kiểu, thay cho liên kết chứng cứ dạng mảng ID tự do:

| Trường | Bắt buộc | Giá trị |
| --- | --- | --- |
| `evidence_id` | có | ID chứng cứ |
| `relation` | có | `supports`, `challenges`, `contradicts`, `context`, `contextual` |
| `limitation_ids` | không | Danh sách hạn chế chứng cứ |
| `strength` | không | `strong`, `partial`, `weak` |
| `reasoning` | không | Giải thích quan hệ |
| `weight` | không | Số ≥ 0, dự phòng cho mô hình hoá sau này |

Quan hệ logic (`supports` / `challenges` / `contradicts` / `context`) **không phải** kết luận chứng minh. Kết luận vẫn nằm ở `conclusions`, `proof_row.status` và điểm số.

Chấp nhận cả `context` và `contextual` (cùng nghĩa) để không phá dữ liệu cũ; nội dung mới nên dùng `context`.

### 6. `learning_outcomes` cấp case

Case có thể khai báo outcome cục bộ:

```json
"learning_outcomes": [
  { "id": "lo_local_01", "description": "Mô tả", "label": "Nhãn ngắn" }
]
```

Outcome cục bộ được merge với catalog toàn cục khi lint. Trường này optional và không thay thế catalog chung.

## Ma trận tương thích

| Dữ liệu | 2.0.0 | 2.1.0 |
| --- | --- | --- |
| Case 2.0.0 hiện có | hợp lệ | hợp lệ (không cần sửa) |
| `evidence_links` dạng cũ | — | không còn hợp lệ nếu chỉ là mảng ID; phải là object |
| `law_resolution` không `segments` | hợp lệ | hợp lệ |
| `scoring` không `max_total_points` | hợp lệ | hợp lệ, chỉ cảnh báo |
| `proof_row` có trường lạ | — | bị từ chối |

> Ghi chú: `evidence_links` dạng mảng ID chưa từng là hợp đồng của 2.0.0 trong repo này; nếu có dữ liệu ngoài repo, cần migrate sang object `{ evidence_id, relation }`.

## Test

`src/domain/schema-2.1.0.test.ts` chứa corpus:

- **Valid**: case 2.0.0 nguyên bản; case 2.1.0 dùng đầy đủ trường mới.
- **Invalid**: `schema_version` lạ, `max_total_points ≠ 100`, `weight_scope` sai, `relation` sai/thiếu/thuộc tính lạ, `proof_row` thuộc tính lạ, `proof_row.status` sai, `law_segment` thiếu `bundle_id`, `law_resolution` thiếu `bundle_id`, `path_selection.mode` sai, `learning_outcomes` thiếu `description`, `weight ≤ 0`, `expr.op` sai.

Chạy riêng:

```bash
npx vitest run src/domain/schema-2.1.0.test.ts
```

## Việc chưa làm trong 2.1.0

Các mục sau được đẩy sang 2.2.0 để tránh phá vỡ cấu trúc:

- Tách entity người/thời điểm thành bảng riêng.
- Mô hình hoá trạng thái gameplay trong schema.
- Rule scope linh hoạt và `multi_match`.
- Chuẩn hoá đa ngôn ngữ cho nhãn.
