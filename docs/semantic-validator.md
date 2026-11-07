# Semantic Validator (Layer 2)

`src/domain/semantic.ts` là lớp kiểm tra **ngữ nghĩa** bổ sung cho JSON Schema và linter tham chiếu.

## Vì sao có lớp này

JSON Schema chỉ trả lời được “dữ liệu có đúng hình dạng không?”. Nó không biết rằng:

- hai expectation có thể cùng chấm một nhóm và cộng điểm trùng;
- hai answer path có thể cùng khớp dù chính sách là `exclusive`;
- một `law_segment` có thể trỏ provision của bundle khác;
- chứng cứ có thể tạo chu trình mở khoá không lối vào;
- nội dung có thể “mồ côi” dù mọi ID đều đúng kiểu.

Layer 2 kiểm tra các bất biến đó. Nó **không** thay thế review pháp lý và không tự sửa dữ liệu.

## Luồng chạy

```text
JSON case
  → loadCase(): ghép law bundle
  → validateCaseSchema(): Ajv / JSON Schema 2.1.0
  → lintCase(): linter tham chiếu (Layer 1)
      → checkLawResolution(): engine phiên bản luật
      → validateCaseSemantics(): Layer 2
      → collectPublishBlockers(): publish gate
```

`lintCase` gọi `validateCaseSemantics(caseFile, { mode })` và nối kết quả vào danh sách `LintIssue` chung. Vì vậy CLI `npm run lint:content` và test dùng cùng một nguồn.

## Hai chế độ

| Chế độ | Hành vi |
| --- | --- |
| `draft` | Lỗi cấu trúc/ngữ nghĩa là `error`; nội dung chưa hoàn thiện là `warning` |
| `publish` | Phần lớn `warning` được nâng thành `error` để chặn release |

Ngoại lệ: `sem_score_max_total_missing` giữ nguyên `warning` ở publish vì đây là khuyến nghị khai báo tường minh, không phải lỗi nội dung.

## Mã kiểm tra

### Scoring

| Mã | Mức | Ý nghĩa |
| --- | --- | --- |
| `sem_score_max_total` | error | `scoring.max_total_points` phải bằng `100` |
| `sem_score_weight_scope` | error | `partial_credit.weight_scope` chỉ nhận `within_criterion` |
| `sem_score_max_total_missing` | warning | Case 2.1.0 nên khai báo `max_total_points` |
| `sem_score_weight_scope_missing` | warning | Case 2.1.0 nên khai báo `weight_scope` |
| `sem_unique_expectation` | error | Nhiều expectation cùng `path + criterion + field + target`; điểm sẽ cộng trùng |

`sem_unique_expectation` là kiểm tra quan trọng nhất của phần scoring: hai expectation cùng nhóm không sai cú pháp, nhưng phá vỡ giả định “mỗi nhóm đáp án được chấm một lần”.

### Chọn đường đáp án

| Mã | Mức | Ý nghĩa |
| --- | --- | --- |
| `sem_path_order_unknown` | error | `path_selection.order` chứa path không tồn tại |
| `sem_path_order_duplicate` | error | Một path xuất hiện nhiều lần trong `order` |
| `sem_path_order_missing` | error | Có path không nằm trong `order` |
| `sem_path_overlap` | error | Với `mode: "exclusive"`, hai path có thể cùng khớp |

Phát hiện chồng lấn dùng phân tích tĩnh trên các atom của DSL. Nếu một nhánh có `any`, validator bỏ qua cặp đó thay vì báo sai (không kết luận khi chưa đủ chắc chắn).

### Luật và chứng cứ

| Mã | Mức | Ý nghĩa |
| --- | --- | --- |
| `sem_reference_law` | error | `references.legal_basis_ids` trỏ provision không tồn tại |
| `sem_segment_provision` | error | `law_segment.provision_ids` trỏ provision không tồn tại |
| `sem_segment_provision_bundle` | error | Provision thuộc bundle khác với segment |
| `sem_discovery_cycle` | error | Chu trình mở khoá chứng cứ nhiều bước |

Chu trình tự tham chiếu một bước (`evidence A` cần chính nó) đã được linter cũ báo bằng `unlock_cycle`; Layer 2 bỏ qua trường hợp đó để tránh báo hai lần.

### Nội dung và tính nhất quán

| Mã | Mức | Ý nghĩa |
| --- | --- | --- |
| `sem_critical_flag` | error/warning | `issue.critical` và `critical_issue_ids` không khớp nhau |
| `sem_evidence_orphan` | warning | Chứng cứ không được tham chiếu ở facts, proof matrix, element, issue, discovery hoặc expectation |
| `sem_explanation_unused` | warning | Explanation không được expectation hoặc charge comparison dùng |
| `sem_criterion_no_expectation` | warning | Criterion không có expectation nào nên không sinh điểm |
| `sem_element_no_fact` | warning | Element bắt buộc không có `fact_ids` |

“Chứng cứ mồ côi” được xét theo nhiều nguồn tham chiếu, không chỉ `facts`. Điều này tránh báo sai với chứng cứ chỉ xuất hiện trong proof matrix hoặc discovery.

`sem_critical_flag` có hai chiều:

- `critical: true` nhưng thiếu trong `critical_issue_ids` → **error**;
- có trong `critical_issue_ids` nhưng `critical` không phải `true` → **warning**.

## Cấu trúc kết quả

```ts
interface SemanticFinding {
  code: string
  severity: 'error' | 'warning' | 'info'
  path: string          // vị trí dữ liệu, ví dụ "expected_responses(exp_01,exp_02)"
  message: string
  entityId?: string
}
```

`path` và `entityId` giúp reviewer mở đúng chỗ trong JSON thay vì dò toàn bộ case.

## Tích hợp với linter

```ts
for (const issue of semanticFindingsToLintIssues(validateCaseSemantics(caseFile, options))) {
  push(issue)
}
```

`SemanticFinding` được chuyển thành `LintIssue` có `path`. Nhờ vậy:

- CLI in cùng một định dạng;
- test có thể assert theo `code`;
- không có hai hệ thống báo lỗi song song.

## Bộ test

`src/domain/semantic.test.ts` phủ:

1. Case mẫu chỉ có warning nội dung đã biết, không có lỗi ngữ nghĩa.
2. Expectation trùng nhóm.
3. `max_total_points` khác 100.
4. `weight_scope` sai.
5. Case 2.1.0 thiếu khai báo scoring tường minh.
6. `path_selection.order` thiếu/trùng/lạ.
7. Hai path chồng lấn khi `exclusive`.
8. `references.legal_basis_ids` trỏ provision lạ.
9. `segment.provision_ids` trỏ provision lạ.
10. Critical flag lệch một chiều.
11. Chu trình discovery nhiều bước.
12. Chứng cứ mồ côi: warning ở draft, error ở publish.
13. Criterion không có expectation và element thiếu fact.

Chạy riêng:

```bash
npx vitest run src/domain/semantic.test.ts
```

## Giới hạn

- Phân tích chồng lấn path là **xấp xỉ tĩnh**, không mô phỏng toàn bộ không gian đáp án. Khi gặp `any`, validator bỏ qua thay vì khẳng định sai.
- Validator không đánh giá nội dung pháp lý đúng/sai; đó là việc của reviewer.
- Validator không sửa dữ liệu, không tự chọn bundle luật, không tự điền `conditions` cho age rule.
- Các kiểm tra tham chiếu ID cũ vẫn nằm ở Layer 1 trong 2.1.0. Việc hợp nhất hoàn toàn được để lại cho 2.2.0.
