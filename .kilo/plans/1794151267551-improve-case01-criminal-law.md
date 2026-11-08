# Kế hoạch: Cải thiện case_001 để học Bộ luật Hình sự

## Mục tiêu
Thay thế điều luật placeholder trong case_001 bằng điều luật thực của BLHS và căn chỉnh mục tiêu học, dấu hiệu cấu thành, phản hồi theo khái niệm luật hình sự.

## Phạm vi
- `src/content/laws/law_bundle_v1.json`: thêm điều khoản cho Điều 173 (trộm cắp tài sản), Điều 15 (chưa đạt), Điều 51/52 (tình tiết), kèm trích dẫn và ngày hiệu lực.
- `src/content/cases/case_001.json`: thay `provision_placeholder_01` bằng id điều khoản thực; cập nhật `legal_test` cho dấu hiệu cấu thành; thêm lựa chọn căn cứ luật; cập nhật kết luận/expected responses tương ứng.
- Đảm bảo schema và linter hợp lệ; chạy `npm run lint:content`.

## Quyết định
- Tội chính: Điều 173 BLHS (trộm cắp tài sản).
- Phụ: Điều 15 (chưa đạt) cho tình huống chưa hoàn thành.
- Tình tiết: Điều 51/52 cho tăng/giảm nhẹ.
- Giữ đường "chưa đủ thông tin" làm trung tâm.

## Rủi ro
- Cần trích dẫn chính xác; đối chiếu văn bản gốc.
- Linter có thể bắt schema; kiểm tra `src/domain/linter.ts`.

## Kiểm chứng
- `npm run lint:content`
- `npm test` (content tests)
- Rà soát thủ công trích dẫn luật.
