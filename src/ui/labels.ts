import type { ElementType } from '../domain/types'

export const FIELD_LABELS: Record<string, string> = {
  source_assessment: 'Nguồn và tính toàn vẹn',
  procedure_assessment: 'Quy trình thu thập và khiếm khuyết',
  reliability_assessment: 'Xác thực và độ tin cậy',
  relevance_assessment: 'Liên quan và sức hỗ trợ',
  proof_assessment: 'Đánh giá mệnh đề chứng minh',
  hypothesis_support: 'Chứng cứ ủng hộ giả thuyết',
  hypothesis_challenge: 'Chứng cứ phản bác giả thuyết',
  element_status: 'Đánh giá dấu hiệu cấu thành',
  selected_charge: 'Định danh được chọn',
  conclusion: 'Kết luận cho người và hành vi',
  circumstance_status: 'Đánh giá tình tiết',
  legal_basis: 'Căn cứ pháp luật',
}

export const FIELD_HINTS: Record<string, string> = {
  source_assessment:
    'Nguồn/tài liệu tồn tại không đồng nghĩa sự kiện đã được chứng minh. Chọn mức phù hợp với nguồn gốc được ghi trong hồ sơ.',
  procedure_assessment:
    'Nhận diện vấn đề thủ tục, không tự loại chứng cứ. Hệ quả pháp lý do reviewer xác định.',
  reliability_assessment:
    'Đánh giá độ chính xác và giới hạn của thông tin, tách khỏi câu hỏi hợp pháp/hợp lệ.',
  relevance_assessment:
    'Chứng cứ đang hỗ trợ, phản bác hay chỉ làm bối cảnh cho mệnh đề trọng tâm?',
  proof_assessment:
    'Mệnh đề có được nhiều nguồn đối chiếu hay chỉ có một nguồn trong giới hạn?',
  hypothesis_support: 'Chọn các nguồn thực sự ủng hộ giả thuyết này, không chọn vì có liên quan chung.',
  hypothesis_challenge: 'Chọn các nguồn phản bác hoặc làm giảm độ tin của giả thuyết này.',
  element_status:
    'Tách dấu hiệu hành vi và dấu hiệu mục đích. Không suy dấu hiệu này từ dấu hiệu kia.',
  selected_charge:
    'Chỉ chọn định danh khi dấu hiệu bắt buộc của định danh đó có dữ kiện hỗ trợ.',
  conclusion:
    'Kết luận phải gắn với người, hành vi và dấu hiệu. Có thể chọn “chưa đủ dữ kiện/căn cứ”.',
  circumstance_status:
    'Chỉ đánh giá tình tiết mà case yêu cầu; nếu hồ sơ không có dữ kiện, chọn “chưa đủ thông tin”.',
  legal_basis:
    'Chọn căn cứ từ thư viện case. Trong bản nháp, mọi căn cứ đều chưa được xác minh.',
}

export const ELEMENT_TYPE_LABELS: Record<ElementType, string> = {
  protected_interest: 'Khách thể được bảo vệ',
  conduct: 'Hành vi',
  result: 'Kết quả',
  causation: 'Quan hệ nhân quả',
  subject: 'Chủ thể',
  mental_state: 'Mặt chủ quan / mục đích',
  circumstance: 'Tình tiết',
  other: 'Khác',
}

export const ROLE_LABELS: Record<string, string> = {
  person_of_interest: 'Người được chú ý',
  employee: 'Nhân viên',
  warehouse_worker: 'Nhân viên kho',
  witness: 'Người làm chứng',
  security_guard: 'Bảo vệ',
  warehouse_manager: 'Quản lý kho',
}

export const PLAYER_ROLE_COPY: Record<string, { title: string; body: string }> = {
  learner_case_analyst: {
    title: 'Học viên phân tích hồ sơ',
    body: 'Bạn đọc hồ sơ hư cấu, đánh giá chứng cứ và đưa ra kết luận học tập. Bạn không phải người có thẩm quyền tố tụng và sản phẩm không mô phỏng đầy đủ thủ tục tố tụng Việt Nam.',
  },
}

export const EVIDENCE_STATE_LABELS: Record<string, string> = {
  locked: 'Chưa mở khóa',
  available: 'Có thể đọc',
  viewed: 'Đã xem',
  requested: 'Đã yêu cầu kiểm tra',
  unavailable: 'Không khả dụng',
}

export const EVIDENCE_TYPE_LABELS: Record<string, string> = {
  record: 'Tài liệu',
  statement: 'Lời trình bày',
  message: 'Tin nhắn',
  physical: 'Vật chứng',
}

export const REVIEW_STATUS_LABELS: Record<string, string> = {
  not_reviewed: 'Chưa rà soát',
  in_review: 'Đang rà soát',
  approved: 'Đã duyệt',
  review_required: 'Cần rà soát lại',
}

export const CATEGORY_LABELS: Record<string, string> = {
  aggravating: 'Tăng nặng',
  mitigating: 'Giảm nhẹ',
  other: 'Khác / cần xác định',
}

export const CONCLUSION_TYPE_LABELS: Record<string, string> = {
  charge_supported: 'Có dữ kiện hỗ trợ định danh',
  not_supported: 'Không được hỗ trợ',
  insufficient_information: 'Chưa đủ dữ kiện/căn cứ',
  alternative_hypothesis_remains: 'Còn giả thuyết khác',
}

export function fieldLabel(fieldId: string): string {
  return FIELD_LABELS[fieldId] ?? fieldId
}
