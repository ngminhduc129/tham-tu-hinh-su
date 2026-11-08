# Bộ kiểm tra ngữ nghĩa (Lớp 2)

`src/domain/semantic.ts` là lớp kiểm tra **ngữ nghĩa** bổ sung cho lược đồ JSON và bộ kiểm tra tham chiếu.

## Vì sao có lớp này

Lược đồ JSON chỉ trả lời được “dữ liệu có đúng hình dạng không?”. Nó không biết rằng:

- hai kỳ vọng có thể cùng chấm một nhóm và cộng điểm trùng;
- hai đường đáp án có thể cùng khớp dù chính sách là `exclusive`;
- một `law_segment` có thể trỏ điều khoản của bộ văn bản khác;
- chứng cứ có thể tạo chu trình mở khoá không lối vào;
- nội dung có thể “mồ côi” dù mọi mã định danh đều đúng kiểu.

Lớp 2 kiểm tra các bất biến đó. Nó **không** thay thế việc rà soát pháp lý và không tự sửa dữ liệu.

## Luồng chạy

```text
JSON hồ sơ
  → loadCase(): ghép bộ văn bản luật
  → validateCaseSchema(): Ajv / lược đồ JSON 2.1.0
  → lintCase(): bộ kiểm tra tham chiếu (Lớp 1)
      → checkLawResolution(): hệ thống phiên bản luật
      → validateCaseSemantics(): Lớp 2
      → collectPublishBlockers(): cổng xuất bản
```

`lintCase` gọi `validateCaseSemantics(caseFile, { mode })` và nối kết quả vào danh sách `LintIssue` chung. Vì vậy công cụ dòng lệnh `npm run lint:content` và kiểm thử dùng cùng một nguồn.

## Hai chế độ

| Chế độ | Hành vi |
| --- | --- |
| `draft` | Lỗi cấu trúc/ngữ nghĩa là `error`; nội dung chưa hoàn thiện là `warning` |
| `publish` | Phần lớn `warning` được nâng thành `error` để chặn phát hành |

Ngoại lệ: `sem_score_max_total_missing` giữ nguyên `warning` ở chế độ xuất bản vì đây là khuyến nghị khai báo tường minh, không phải lỗi nội dung.

## Mã kiểm tra

### Chấm điểm

| Mã | Mức | Ý nghĩa |
| --- | --- | --- |
| `sem_score_max_total` | error | `scoring.max_total_points` phải bằng `100` |
| `sem_score_weight_scope` | error | `partial_credit.weight_scope` chỉ nhận `within_criterion` |
| `sem_score_max_total_missing` | warning | Hồ sơ 2.1.0 nên khai báo `max_total_points` |
| `sem_score_weight_scope_missing` | warning | Hồ sơ 2.1.0 nên khai báo `weight_scope` |
| `sem_unique_expectation` | error | Nhiều kỳ vọng cùng `path + criterion + field + target`; điểm sẽ cộng trùng |

`sem_unique_expectation` là kiểm tra quan trọng nhất của phần chấm điểm: hai kỳ vọng cùng nhóm không sai cú pháp, nhưng phá vỡ giả định “mỗi nhóm đáp án được chấm một lần”.

### Chọn đường đáp án

| Mã | Mức | Ý nghĩa |
| --- | --- | --- |
| `sem_path_order_unknown` | error | `path_selection.order` chứa đường không tồn tại |
| `sem_path_order_duplicate` | error | Một đường xuất hiện nhiều lần trong `order` |
| `sem_path_order_missing` | error | Có đường không nằm trong `order` |
| `sem_path_overlap` | error | Với `mode: "exclusive"`, hai đường có thể cùng khớp |

Phát hiện chồng lấn dùng phân tích tĩnh trên các phần tử của DSL. Nếu một nhánh có `any`, bộ kiểm tra bỏ qua cặp đó thay vì báo sai (không kết luận khi chưa đủ chắc chắn).

### Luật và chứng cứ

| Mã | Mức | Ý nghĩa |
| --- | --- | --- |
| `sem_reference_law` | error | `references.legal_basis_ids` trỏ điều khoản không tồn tại |
| `sem_segment_provision` | error | `law_segment.provision_ids` trỏ điều khoản không tồn tại |
| `sem_segment_provision_bundle` | error | Điều khoản thuộc bộ văn bản khác với đoạn hiệu lực |
| `sem_discovery_cycle` | error | Chu trình mở khoá chứng cứ nhiều bước |

Chu trình tự tham chiếu một bước (`evidence A` cần chính nó) đã được bộ kiểm tra cũ báo bằng `unlock_cycle`; Lớp 2 bỏ qua trường hợp đó để tránh báo hai lần.

### Nội dung và tính nhất quán

| Mã | Mức | Ý nghĩa |
| --- | --- | --- |
| `sem_critical_flag` | error/warning | `issue.critical` và `critical_issue_ids` không khớp nhau |
| `sem_evidence_orphan` | warning | Chứng cứ không được tham chiếu ở dữ kiện, ma trận chứng minh, dấu hiệu, vấn đề, cơ chế mở tài liệu hoặc kỳ vọng |
| `sem_explanation_unused` | warning | Phần giải thích không được kỳ vọng hoặc phần so sánh định danh dùng |
| `sem_criterion_no_expectation` | warning | Tiêu chí không có kỳ vọng nào nên không sinh điểm |
| `sem_element_no_fact` | warning | Dấu hiệu bắt buộc không có `fact_ids` |

“Chứng cứ mồ côi” được xét theo nhiều nguồn tham chiếu, không chỉ `facts`. Điều này tránh báo sai với chứng cứ chỉ xuất hiện trong ma trận chứng minh hoặc cơ chế mở tài liệu.

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

`path` và `entityId` giúp người rà soát mở đúng chỗ trong JSON thay vì dò toàn bộ hồ sơ.

## Tích hợp với bộ kiểm tra nội dung

```ts
for (const issue of semanticFindingsToLintIssues(validateCaseSemantics(caseFile, options))) {
  push(issue)
}
```

`SemanticFinding` được chuyển thành `LintIssue` có `path`. Nhờ vậy:

- CLI in cùng một định dạng;
- kiểm thử có thể khẳng định theo `code`;
- không có hai hệ thống báo lỗi song song.

## Bộ kiểm thử

`src/domain/semantic.test.ts` phủ:

1. Hồ sơ mẫu chỉ có cảnh báo nội dung đã biết, không có lỗi ngữ nghĩa.
2. Kỳ vọng trùng nhóm.
3. `max_total_points` khác 100.
4. `weight_scope` sai.
5. Hồ sơ 2.1.0 thiếu khai báo chấm điểm tường minh.
6. `path_selection.order` thiếu/trùng/lạ.
7. Hai đường chồng lấn khi `exclusive`.
8. `references.legal_basis_ids` trỏ điều khoản lạ.
9. `segment.provision_ids` trỏ điều khoản lạ.
10. Critical flag lệch một chiều.
11. Chu trình mở khoá nhiều bước.
12. Chứng cứ mồ côi: cảnh báo ở chế độ nháp, lỗi ở chế độ xuất bản.
13. Tiêu chí không có kỳ vọng và dấu hiệu thiếu dữ kiện.

Chạy riêng:

```bash
npx vitest run src/domain/semantic.test.ts
```

## Giới hạn

- Phân tích chồng lấn đường đáp án là **xấp xỉ tĩnh**, không mô phỏng toàn bộ không gian đáp án. Khi gặp `any`, bộ kiểm tra bỏ qua thay vì khẳng định sai.
- Bộ kiểm tra không đánh giá nội dung pháp lý đúng/sai; đó là việc của người rà soát.
- Bộ kiểm tra không sửa dữ liệu, không tự chọn bộ văn bản luật, không tự điền `conditions` cho quy tắc tuổi.
- Các kiểm tra tham chiếu mã định danh cũ vẫn nằm ở Lớp 1 trong 2.1.0. Việc hợp nhất hoàn toàn được để lại cho 2.2.0.
