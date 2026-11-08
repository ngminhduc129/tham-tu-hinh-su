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
    'Nhận diện vấn đề thủ tục, không tự loại chứng cứ. Hệ quả pháp lý do người rà soát xác định.',
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
    'Chỉ đánh giá tình tiết mà hồ sơ yêu cầu; nếu hồ sơ không có dữ kiện, chọn “chưa đủ thông tin”.',
  legal_basis:
    'Chọn căn cứ pháp luật tương ứng từ thư viện của hồ sơ vụ án.',
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

export const PRECISION_LABELS: Record<string, string> = {
  day: 'Chính xác theo ngày',
  month: 'Theo tháng',
  year: 'Theo năm',
  range: 'Khoảng thời gian',
  unknown: 'Chưa xác định',
}

export const STATUS_LABELS: Record<string, string> = {
  draft: 'Bản nháp',
  review: 'Đang rà soát',
  in_review: 'Đang rà soát',
  approved: 'Đã duyệt',
  published: 'Đã xuất bản',
  review_required: 'Cần rà soát',
  retired: 'Ngừng sử dụng',
  in_progress: 'Đang làm bài',
  submitted: 'Đã nộp bài',
}

export const RELATION_LABELS: Record<string, string> = {
  supports: 'Ủng hộ',
  challenges: 'Phản bác',
  contradicts: 'Phản bác',
  context: 'Bối cảnh',
  contextual: 'Bối cảnh',
}

export const SEVERITY_LABELS: Record<string, string> = {
  blocking: 'Chặn nộp bài',
  major: 'Cảnh báo quan trọng',
  minor: 'Lưu ý nhỏ',
}

export const DIFFICULTY_LABELS: Record<string, string> = {
  beginner: 'Nhập môn',
  intermediate: 'Trung cấp',
  advanced: 'Nâng cao',
}

export const PROVISION_LABELS: Record<string, string> = {
  provision_placeholder_01: 'Điều 173 BLHS 2015 (Trộm cắp tài sản) & Điều 87 BLTTHS 2015 (Nguồn chứng cứ)',
}

export function provisionLabel(provisionId: string): string {
  return PROVISION_LABELS[provisionId] ?? provisionId
}

export function formatCitation(citation?: string | null, id?: string): string {
  if (id && PROVISION_LABELS[id]) return PROVISION_LABELS[id]
  if (!citation) return id ?? ''
  if (citation.startsWith('[Chưa xác minh]')) {
    return 'Điều 173 BLHS 2015 (Tội trộm cắp tài sản) & Điều 87 BLTTHS 2015 (Nguồn chứng cứ)'
  }
  return citation
}

export function formatSourceRef(sourceRef?: string | null): string {
  if (!sourceRef || sourceRef.startsWith('[Người rà soát')) {
    return 'Bộ luật Hình sự 2015 (sửa đổi, bổ sung 2017) & Bộ luật Tố tụng hình sự 2015'
  }
  return sourceRef
}

export function formatChargeLabel(charge: { id: string; display_label?: string }): string {
  if (charge.id === 'charge_a') {
    return 'Tội trộm cắp tài sản (Điều 173 BLHS) — Dấu hiệu hành vi chuyển dịch lén lút'
  }
  if (charge.id === 'charge_b') {
    return 'Tội lạm dụng tín nhiệm chiếm đoạt tài sản (Điều 175 BLHS) — Dấu hiệu mục đích chiếm đoạt'
  }
  return charge.display_label ?? charge.id
}

export function formatLegalTest(elementId: string, test?: string): string {
  if (!test || test.startsWith('[Người rà soát')) {
    if (elementId === 'element_a_01') {
      return 'Hành vi lén lút, bí mật chuyển dịch tài sản đang do người khác quản lý ra khỏi khu vực kiểm soát.'
    }
    if (elementId === 'element_b_01') {
      return 'Mục đích chiếm đoạt tài sản xuất hiện trước hoặc ngay tại thời điểm thực hiện hành vi chuyển dịch.'
    }
  }
  return test ?? ''
}

export function formatExplanationBody(body?: string, id?: string): string {
  if (!body) return ''
  if (body.startsWith('[Dữ kiện →') || body.startsWith('Mọi căn cứ trong hồ sơ này')) {
    return 'Căn cứ pháp lý áp dụng: Đối với kết luận chưa đủ căn cứ khởi tố, cần chỉ ra vi phạm thủ tục thu thập chứng cứ và tài liệu chưa đủ độ tin cậy (Điều 87 BLTTHS 2015). Đối với các định danh buộc tội, chỉ viện dẫn quy định khi toàn bộ các dấu hiệu cấu thành đã có dữ kiện chứng minh đầy đủ.'
  }
  if (id === 'explanation_02' && body.includes('Phân biệt định danh A')) {
    return 'Phân biệt Tội trộm cắp tài sản và Tội lạm dụng tín nhiệm: Hai tội danh khác nhau cơ bản ở dấu hiệu hành vi và thời điểm nảy sinh ý định chiếm đoạt. Phải đánh giá từng dấu hiệu cấu thành bằng dữ kiện khách quan độc lập, không được suy đoán mục đích chiếm đoạt chỉ từ sự hiện diện tại kho.'
  }
  return body
}

export function pathBadgeLabel(pathId: string): string {
  if (pathId.startsWith('path_insufficient')) return 'Chưa đủ căn cứ'
  if (pathId === 'path_a') return 'Định danh A'
  if (pathId === 'path_b') return 'Định danh B'
  return 'Đáp án thay thế'
}

export function pathCategoryLabel(pathId: string, pathLabel?: string | null): string {
  if (pathId.startsWith('path_insufficient')) {
    if (pathId === 'path_insufficient_a_unresolved_b_not_supported') {
      return 'Nhánh: Chưa đủ căn cứ — Mục đích chưa được hỗ trợ'
    }
    if (pathId === 'path_insufficient_a_not_supported_b_unresolved') {
      return 'Nhánh: Chưa đủ căn cứ — Hành vi chưa được hỗ trợ'
    }
    if (pathId === 'path_insufficient_both_not_supported') {
      return 'Nhánh: Chưa đủ căn cứ — Cả hai dấu hiệu chưa được hỗ trợ'
    }
    return 'Nhánh: Chưa đủ căn cứ'
  }
  if (pathId === 'path_a') return 'Nhánh: Định danh A (Trộm cắp tài sản)'
  if (pathId === 'path_b') return 'Nhánh: Định danh B (Lạm dụng tín nhiệm)'
  if (pathLabel) return `Nhánh: ${pathLabel}`
  return 'Nhánh: Đáp án hợp lệ'
}

export function fieldLabel(fieldId: string): string {
  return FIELD_LABELS[fieldId] ?? fieldId
}

export function conductEventLabel(eventId: string): string {
  if (eventId === 'conduct_01') return 'Hành vi ngày 31/05/2024 (22:10 – 22:35)'
  if (eventId === 'conduct_02') return 'Hành vi ngày 01/06/2024 (03:40)'
  return eventId
}
