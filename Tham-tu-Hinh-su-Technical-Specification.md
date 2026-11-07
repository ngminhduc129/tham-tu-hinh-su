# Thám tử Hình sự

## Technical Specification cho sản phẩm giáo dục với gameplay điều tra và phân tích pháp lý

**Phiên bản tài liệu:** 1.2  
**Trạng thái:** Đặc tả triển khai MVP  
**Ngôn ngữ sản phẩm:** Tiếng Việt  
**Nền tảng mục tiêu:** Web responsive, ưu tiên client-side cho MVP

## 1. Mục đích và định hướng sản phẩm

Thám tử Hình sự là trò chơi học tập cho phép người chơi đọc hồ sơ hư cấu, thu thập và đánh giá chứng cứ, kiểm tra các giả thuyết, phân tích dấu hiệu pháp lý, rồi đưa ra kết luận có giải thích. Giá trị cốt lõi là rèn kỹ năng lập luận dựa trên hồ sơ; trò chơi không chỉ kiểm tra khả năng nhớ số điều hoặc chọn đáp án trùng với một lời giải mẫu.

Tài liệu này xác định phạm vi, gameplay, mô hình dữ liệu, kiến trúc, nguyên tắc chấm điểm, trải nghiệm người dùng, quy trình bảo đảm chất lượng và lộ trình MVP. Tài liệu pháp luật dùng trong trò chơi phải được quản lý như nội dung có phiên bản và chỉ được phát hành sau thẩm định chuyên môn phù hợp. Đặc tả này không xác nhận hiệu lực hiện tại của bất kỳ điều luật, khoản, điểm, ngưỡng hay chế tài nào.

### 1.1 Mục tiêu đã chốt

- **Mục tiêu chính:** Giáo dục, phục vụ sinh viên luật, người học pháp luật đại cương và người tự học.
- **Phong cách gameplay:** Hybrid, kết hợp điều tra/thu thập chứng cứ, phân tích pháp lý/chọn hướng xử lý, và kết luận/phán quyết kèm phản hồi.
- **Trải nghiệm:** Một vụ án có thể hoàn thành trong khoảng 10–20 phút ở MVP. Thời lượng là mục tiêu cần kiểm tra với người học, không phải điều kiện để giảm độ sâu lập luận.
- **MVP:** Một case hoàn chỉnh, sau đó mở rộng thư viện case theo cùng schema và quy trình kiểm duyệt.
- **Nền tảng:** Web responsive, không cần tài khoản hoặc backend trong MVP.

### 1.2 Nguyên tắc thiết kế

1. **Lập luận trước đáp án:** Người chơi phải chỉ ra dữ kiện, chứng cứ và dấu hiệu được dùng để đi đến kết luận.
2. **Không ép kết luận khi hồ sơ chưa đủ:** Có lựa chọn “chưa đủ dữ kiện/căn cứ để kết luận” trong phạm vi kịch bản và giai đoạn tố tụng đã định nghĩa.
3. **Tách sự kiện, chứng cứ và đánh giá pháp lý:** Một tài liệu/chứng cứ không đồng nghĩa với sự kiện đã được chứng minh; độ tin cậy và tính hợp pháp không phải cùng một thuộc tính.
4. **Không tự động kết luận luật:** Engine chấm theo rubric đã được tác giả và người rà soát pháp lý cấu hình. Engine không tự diễn giải luật bằng mô hình ngôn ngữ.
5. **Công khai bất định hợp lý:** Những đáp án thay thế được chấp nhận phải nêu điều kiện, lập luận, giới hạn và căn cứ trong nội dung case.
6. **Không thưởng cho tốc độ bằng điểm học tập:** Thời gian có thể dùng làm thống kê cá nhân, không ảnh hưởng điểm năng lực pháp lý trong MVP.
7. **Có thể truy nguyên:** Mỗi nội dung pháp lý cần gắn nguồn, phiên bản, ngày áp dụng dự kiến, trạng thái rà soát và lịch sử thay đổi.

### 1.3 Ngoài phạm vi MVP

- Tư vấn pháp lý thực tế, dự đoán kết quả vụ án thật hoặc thay thế người hành nghề.
- Nộp hồ sơ, ra quyết định tố tụng thật, hoặc tích hợp hệ thống cơ quan nhà nước.
- Chatbot tự sinh kết luận pháp lý; chấm bài tự do bằng AI; tra cứu luật trực tiếp từ internet trong lúc chơi.
- Tài khoản, bảng xếp hạng toàn cầu, lớp học nhiều người, đồng bộ đa thiết bị, phân tích hành vi người dùng ở quy mô lớn.
- Tái dựng chi tiết hành vi bạo lực, dùng hồ sơ thật chưa được phép, hoặc dùng dữ liệu nhận dạng cá nhân thật.
- Mô phỏng đầy đủ thủ tục tố tụng Việt Nam. Mỗi case chỉ mô phỏng một nhiệm vụ học tập được xác định rõ.

## 2. Đối tượng, vai trò và kết quả học tập

### 2.1 Người dùng

- **Người học:** Chơi case, lưu tiến độ trên thiết bị, xem phản hồi và ôn lại kiến thức.
- **Tác giả nội dung:** Soạn tình huống, câu hỏi, dữ liệu chứng cứ, đáp án chấp nhận và rubric.
- **Người rà soát chuyên môn:** Kiểm tra tính chính xác, nguồn luật, cách diễn đạt và độ công bằng của đáp án.
- **Quản trị nội dung (sau MVP):** Phê duyệt, xuất bản, thu hồi hoặc thay phiên bản case.

Trong MVP, tác giả và người rà soát là quy trình nội bộ; chưa cần giao diện quản trị riêng.

### 2.2 Ranh giới vai trò tố tụng trong gameplay

Kế hoạch gốc liệt kê điều tra viên, kiểm sát viên và thẩm phán tập sự như các vai trò có thể thay thế nhau. MVP cần chọn **một vai trò dẫn chuyện rõ ràng** và ghi rõ các hoạt động nào chỉ là bài tập học tập, không mô phỏng thẩm quyền tố tụng.

Đề xuất MVP: người chơi là **học viên phân tích hồ sơ trong phiên học mô phỏng**. Họ có thể thực hiện lần lượt các nhiệm vụ điều tra hư cấu (mở thông tin, yêu cầu kiểm tra dữ kiện), đánh giá hồ sơ và đưa ra kết luận học tập. Trò chơi không gọi người chơi là người có thẩm quyền thật và không gộp các quyết định của các giai đoạn tố tụng thành một quyết định pháp lý duy nhất.

Giai đoạn mở rộng có thể có các kịch bản riêng:

| Chế độ | Nhiệm vụ người chơi | Đầu ra trong game |
|---|---|---|
| Điều tra | Tìm thông tin, chọn bước kiểm tra, phát hiện khoảng trống và mâu thuẫn | Bản đồ dữ kiện và giả thuyết |
| Rà soát truy tố | Đánh giá căn cứ buộc tội/gỡ tội, dấu hiệu cấu thành và vấn đề cần làm rõ | Bản phân tích hồ sơ mô phỏng |
| Xét xử học tập | Đánh giá tổng thể hồ sơ, phản hồi lập luận hai phía, kết luận theo dữ kiện giả định | Kết luận học tập và lý do |

Mỗi chế độ phải có mục tiêu, giai đoạn, loại đầu ra và từ vựng riêng. Không dùng các nhãn quyết định tố tụng chính thức khi nội dung chưa được rà soát pháp lý.

### 2.3 Learning outcomes

Sau khi hoàn thành một case được thiết kế tốt, người học có thể:

| ID | Kết quả học tập | Interaction được đo | Tiêu chí đánh giá |
|---|---|---|---|
| `lo_source_fact_01` | Phân biệt nguồn/tài liệu với sự kiện cần chứng minh | Mở hồ sơ và lập proof matrix | `criterion_evidence` |
| `lo_evidence_01` | Đánh giá liên quan, độ tin cậy, vấn đề thủ tục và giới hạn suy luận | Đánh giá evidence theo bốn lớp | `criterion_evidence` |
| `lo_reasoning_01` | Lập giả thuyết cạnh tranh; gắn chứng cứ ủng hộ/phản bác/chưa phân định | Hypothesis board | `criterion_hypothesis` |
| `lo_proof_01` | Đối chiếu nhiều nguồn với từng sự kiện cần chứng minh | Proof matrix | `criterion_proof` |
| `lo_elements_01` | Ánh xạ dữ kiện vào dấu hiệu cấu thành, chỉ ra dấu hiệu thiếu và nhận diện tình tiết được case hỏi | Charge elements và circumstance assessment | `criterion_elements`, `criterion_circumstance` |
| `lo_charge_01` | Chọn định danh hoặc trạng thái chưa đủ căn cứ theo hồ sơ | Kết luận gắn với người và hành vi | `criterion_charge` |
| `lo_law_01` | Dùng căn cứ pháp luật đúng phiên bản và giải thích mối liên hệ | Law references và feedback | `criterion_law` |

Catalog này là định nghĩa chuẩn cho các ID. Mỗi case khai báo `learning_outcome_ids`; mỗi criterion tham chiếu ít nhất một ID và một hoặc nhiều answer fields. Linter yêu cầu mọi outcome của case được đo bởi interaction và criterion thực sự có mặt trong case.

## 3. Phạm vi nội dung pháp lý và quản lý phiên bản

### 3.1 Ranh giới pháp lý

- Phạm vi dự kiến là pháp luật hình sự Việt Nam và các quy tắc tố tụng/chứng cứ cần thiết để hiểu case. Danh mục văn bản cụ thể phải được xác định bởi người phụ trách nội dung và người rà soát đủ chuyên môn.
- Không được suy ra quy tắc về chứng cứ, thủ tục hoặc hệ quả tố tụng chỉ từ Bộ luật Hình sự. Khi case cần dùng quy định tố tụng, nguồn đó phải được khai báo riêng.
- Không đưa mức hình phạt cụ thể hoặc kết luận về điều khoản áp dụng vào nội dung xuất bản nếu chưa có người rà soát xác nhận nguồn và cách áp dụng.
- Tránh dùng “chứng cứ trái pháp luật thì tự động loại bỏ” như một quy tắc chung trong engine. Case phải trình bày câu hỏi học tập, dữ kiện và hệ quả được người rà soát duyệt.
- Không đưa lời khuyên cho vụ việc thật. Dòng thông báo trong game: “Tình huống và phản hồi phục vụ học tập; không phải tư vấn pháp lý cho vụ việc thực tế.”

### 3.2 Mô hình phiên bản pháp luật

Mọi nội dung pháp lý dùng ID ổn định, không dựa vào chuỗi tự do như “Điều X” làm khóa chính. Mỗi bản quy định chứa metadata tối thiểu:

- `instrument_id`, tên văn bản, cơ quan ban hành (nếu đã xác minh), loại văn bản, mã định danh điều/khoản/điểm.
- `version_id`, trạng thái phiên bản, ngày hiệu lực bắt đầu/kết thúc nếu đã được xác nhận.
- URL/định danh nguồn chính thức hoặc bản nguồn được lưu theo chính sách dự án; ngày truy cập/đối chiếu.
- Nội dung trích dẫn hoặc tóm tắt có kiểm soát bản quyền; ngôn ngữ; phạm vi sử dụng.
- Người rà soát, ngày rà soát, ghi chú thay đổi và case bị ảnh hưởng.

Trường thời gian chưa xác minh phải để `null` và chặn xuất bản nội dung phụ thuộc trường đó. Không điền ngày hiệu lực dựa trên suy đoán.

Mỗi case ghim một hoặc nhiều law bundles bất biến; mỗi `conduct_event` được ánh xạ riêng tới bundle phiên bản áp dụng đã được reviewer xác nhận. Ngày nền để chọn luật là một quyết định nội dung có `legal_time_anchor` và lý do, không được suy ra tự động nếu có quy tắc chuyển tiếp hoặc nhiều thời điểm liên quan.

Build linter so sánh khoảng ngày của từng conduct event với `effective_from`/`effective_to` của provisions được tham chiếu. Nếu khoảng ngày nằm hoàn toàn trong một phiên bản, case có thể ghim phiên bản đó sau review. Nếu khoảng ngày cắt qua ngày luật đổi, hoặc thiếu ngày cần thiết, linter chặn publish cho đến khi reviewer (a) bổ sung dữ kiện chính xác, (b) thiết kế các nhánh phiên bản riêng có đáp án và scoring nhất quán, hoặc (c) xác nhận căn cứ thời gian phù hợp khác. Không tự chọn luật mới nhất hay áp một phiên bản cho toàn case.

### 3.3 Quy trình phát hành nội dung pháp lý

1. Tác giả lập nội dung và gắn từng luận điểm với nguồn luật.
2. Người rà soát pháp lý kiểm tra quy định, cách diễn giải, thuật ngữ, đáp án thay thế và ranh giới tố tụng.
3. Người thiết kế học tập kiểm tra rằng mục tiêu, thao tác, rubric và phản hồi đo đúng năng lực.
4. QA nội dung kiểm tra mọi ID tham chiếu, liên kết, ngày áp dụng, dữ liệu nhân vật và đường đi gameplay.
5. Bản build chỉ nhận case có `review_status: approved`, đủ trường phiên bản và không có cảnh báo blocking.
6. Khi nguồn luật hoặc cách diễn giải thay đổi, tạo version mới; giữ nguyên lịch sử. Case đang xuất bản được chuyển sang `review_required` hoặc `retired` theo quyết định của người rà soát.

Đây là yêu cầu sản phẩm và quy trình; quyết định chuyên môn về nội dung cần người có chuyên môn phù hợp phê duyệt.

## 4. Gameplay và luồng phiên chơi

### 4.1 Core loop

`Nhận nhiệm vụ → Khám phá hồ sơ → Thu thập/kiểm tra → Lập giả thuyết → Đối chiếu chứng cứ → Phân tích dấu hiệu → Chọn hướng xử lý → Nộp kết luận → Nhận phản hồi và xem lại`

### 4.2 Các giai đoạn

| Giai đoạn | Hành động | Điều kiện hoàn thành |
|---|---|---|
| 0. Giới thiệu | Đọc mục tiêu, vai trò mô phỏng, thời điểm pháp luật áp dụng trong case và lưu ý giáo dục | Người chơi xác nhận bắt đầu |
| 1. Hồ sơ ban đầu | Xem tóm tắt, nhân vật, mốc thời gian, câu hỏi cần giải quyết | Đã đọc brief; có thể quay lại bất kỳ lúc nào |
| 2. Khám phá | Mở địa điểm/tài liệu, chọn thao tác kiểm tra có sẵn; một số lựa chọn mở thêm thông tin | Đã xem tối thiểu thông tin nền; không bắt buộc mở hết nhánh |
| 3. Bảng chứng cứ | Đánh dấu chứng cứ đã xem, ghi nhận nguồn, liên kết chứng cứ với vấn đề/sự kiện, đánh giá giới hạn | Người chơi đã đánh giá đủ các vấn đề trọng tâm hoặc chủ động chọn tiếp tục với hồ sơ hiện có |
| 4. Giả thuyết | Tạo/chọn các giả thuyết, gắn chứng cứ ủng hộ, phản bác, chưa phân định; nêu dữ kiện cần thêm | Có ít nhất một giả thuyết và một đánh giá chứng cứ; case có thể yêu cầu so sánh hai giả thuyết |
| 5. Phân tích pháp lý | Trả lời các vấn đề/sự kiện, ánh xạ dấu hiệu, nêu dấu hiệu còn thiếu | Các trường bắt buộc đã có câu trả lời hoặc trạng thái “chưa đủ dữ kiện” |
| 6. Kết luận | Chọn kết luận mô phỏng, căn cứ/điều luật từ thư viện case, tình tiết được hỗ trợ và mức độ chắc chắn | Có kết luận, căn cứ và giải thích ngắn |
| 7. Phản hồi | Điểm theo rubric, đáp án chấp nhận, giải thích theo từng dấu hiệu, phần chưa được chứng minh, nội dung đọc thêm | Người chơi xem hoặc đóng phản hồi; kết quả lưu cục bộ |

### 4.3 Thu thập và mở khóa

- Nội dung chia thành `always_available`, `choice_unlocked`, `hint_unlocked` hoặc loại tương đương. Điều kiện mở khóa phải khai báo bằng rule dữ liệu đơn giản, không nhúng JavaScript tùy ý trong JSON.
- Không bắt buộc thu thập mọi vật phẩm. Case định nghĩa `critical_issues` và điều kiện tối thiểu để người chơi có thể nộp kết luận.
- Người chơi được nộp với hồ sơ chưa hoàn chỉnh, nhưng nhận phản hồi riêng về thiếu dữ kiện và giới hạn kết luận.
- Một lựa chọn thu thập có thể làm lộ chứng cứ thuận lợi, bất lợi hoặc trung tính; không dùng nhánh để trừng phạt người chơi vì chưa biết một luật chưa được dạy.
- Chứng cứ được mô tả bằng dữ liệu quan sát được và nguồn tạo ra nó. Các đánh giá pháp lý là rubric/hướng dẫn học tập, không phải cờ boolean tự động quyết định giá trị chứng cứ.

### 4.4 Thao tác trên bảng chứng cứ

Mỗi item chứng cứ có thể được:

- Đánh dấu đã xem/đã yêu cầu kiểm tra.
- Gắn vào một `issue` hoặc `fact`.
- Đánh giá “ủng hộ”, “phản bác”, “chưa phân định”, “không liên quan trực tiếp” theo ngữ cảnh.
- Ghi một nhận xét ngắn hoặc chọn một giới hạn suy luận có sẵn.
- So sánh với chứng cứ khác hoặc tạo liên kết mâu thuẫn.

Trong MVP, ưu tiên lựa chọn có cấu trúc và trường giải thích ngắn; không cần sơ đồ kéo thả phức tạp.

### 4.5 Trạng thái kết luận

Mỗi case phải khai báo tập kết luận được phép cho đúng bối cảnh, ví dụ `supported`, `not_supported`, `insufficient_information`, `alternative_hypothesis_remains`. Đây là mã gameplay trung tính, không tự động tương đương tên quyết định tố tụng cụ thể. Tác giả nội dung phải ghi nhãn hiển thị phù hợp sau khi rà soát.

## 5. Engines và chấm điểm

### 5.1 Evidence Engine

Trách nhiệm:

- Nạp danh sách chứng cứ, nguồn, điều kiện xuất hiện và quan hệ với các issue/fact.
- Theo dõi trạng thái `locked`, `available`, `viewed`, `requested`, `unavailable`.
- Ghi nhận đánh giá của người chơi mà không sửa nội dung gốc.
- Tính đầy đủ của hồ sơ theo rubric case, không suy ra tính hợp pháp/giá trị chứng minh.
- Hỗ trợ nhánh đơn giản bằng điều kiện dữ liệu; kiểm tra vòng lặp hoặc ID điều kiện sai lúc build.

Kết quả engine là cấu trúc dữ liệu trình bày cho giao diện. Nó không phán định chứng cứ có giá trị pháp lý.

Mỗi chứng cứ được phân tích qua bốn lớp riêng, không gộp thành một nhãn `reliable/lawful`:

1. **Nguồn và tính toàn vẹn:** ai/tổ chức tạo hoặc cung cấp; nguồn gốc; bản gốc/bản sao; chuỗi bàn giao hoặc metadata khi có.
2. **Quy trình thu thập và khiếm khuyết thủ tục:** thao tác nào đã diễn ra, điểm nào bị đặt vấn đề, quy tắc liên quan và hệ quả cần reviewer xác định. Người chơi nhận diện vấn đề; engine không tự loại chứng cứ.
3. **Xác thực và độ tin cậy:** dấu hiệu nhận dạng/tính toàn vẹn, độ chính xác, sai số, mâu thuẫn và độ tin cậy của thông tin.
4. **Liên quan và sức hỗ trợ cho sự kiện:** chứng cứ có thể hỗ trợ, phản bác hay chỉ đặt bối cảnh cho mệnh đề nào; suy luận nào còn thiếu hoặc vượt quá dữ liệu.

Case có thể chỉ bật những lớp phù hợp với mục tiêu học tập. Mỗi lớp được chấm qua lựa chọn có cấu trúc và kỳ vọng tham chiếu trong case data.

### 5.2 Reasoning Engine

Trách nhiệm:

- Quản lý giả thuyết và liên kết chứng cứ–sự kiện–vấn đề.
- Chấm những thao tác nhận diện mâu thuẫn, giới hạn suy luận, chứng cứ phản bác và khoảng trống thông tin.
- Chấm cách người chơi lập giả thuyết, chọn chứng cứ ủng hộ/phản bác/chưa phân định và xử lý thông tin còn thiếu dựa trên `hypothesis_expectations`.
- Chấm từng hàng proof matrix: mệnh đề cần chứng minh, links ủng hộ/phản bác, nguồn độc lập hay phụ thuộc và giới hạn suy luận.
- Cho phép nhiều đường lập luận được cấu hình trước.
- Trả về các tiêu chí đạt/chưa đạt và thông tin phản hồi tương ứng.

MVP chỉ chấm câu trả lời dạng lựa chọn và tập hợp ID có rubric xác định. Không chấm điểm đoạn văn tự do và không có trạng thái `manual_review` trong schema runtime. Có thể cung cấp ô “ghi chú suy nghĩ” tùy chọn để người học tự xem lại; nội dung đó không được dùng tính điểm, không gửi server và không được giả vờ là đã được đánh giá. Nếu về sau cần chấm tự do, đây là thay đổi kiến trúc riêng với dịch vụ chấm, quy trình người rà soát, minh bạch dữ liệu và cơ chế phản hồi sai.

### 5.3 Legal Analysis Engine

Trách nhiệm:

- Hiển thị cấu trúc phân tích do case khai báo: issue, dấu hiệu, dữ kiện liên quan, kết luận từng dấu hiệu.
- So sánh candidate charges theo từng constituent element; mỗi charge gắn với người, conduct event, căn cứ đã chọn phiên bản và tình tiết liên quan.
- Cho phép so sánh nhiều candidate charge theo từng dấu hiệu cấu thành và hiển thị dấu hiệu phân biệt; kết quả phải gắn với người và sự kiện hành vi cụ thể.
- Tính khoảng tuổi tại từng conduct event từ hai date interval đã ghi nguồn; ngày không chính xác được giữ là khoảng, không làm tròn thành một ngày giả định. Engine không áp ngưỡng tuổi chịu trách nhiệm hình sự; ngưỡng, ngoại lệ và hệ quả là `legal_age_rule` có nguồn/version và review status.
- Kiểm tra tham chiếu đến thư viện luật có tồn tại trong bundle phiên bản đã chọn.
- Gắn giải thích/nguồn đã được biên tập.

Engine không truy vấn web, không cập nhật luật tự động, không suy ra điều khoản hoặc mức hình phạt.

### 5.3.1 Mô hình câu trả lời và ràng buộc toàn cục

Một registry `answer_fields` là danh mục duy nhất cho mọi câu trả lời. Mỗi field có ID, kiểu dữ liệu, scope, target IDs và option IDs; mapping tới outcome được kiểm tra qua criterion và expected response. State chỉ chứa các giá trị của field đã khai báo. Không cho phép path tự do như `answers.anything`.

`answer_paths` là nguồn chuẩn duy nhất cho tổ hợp đáp án được chấp nhận. Mỗi path có điều kiện máy đọc được trên answer fields như element status, charge selection và conclusion; path không khai báo rubric hoặc consistency rules riêng. `accepted_answers` và điều kiện thay thế dạng chuỗi tự do không được dùng làm nguồn chấm thứ hai. Khi có một luận giải thay thế được reviewer chấp nhận, biểu diễn nó thành một path riêng.

`consistency_rules` là bộ kiểm tra bất biến chung chạy trên mọi câu trả lời trước khi tìm path. Rule không được liệt kê lại trong từng path. Rule có scope tường minh theo person/conduct và biểu thức boolean `all`/`any`; atom dùng `equals`, `not_equals`, `contains`, `not_contains`, `is_empty` hoặc `is_not_empty`. `when` kích hoạt rule; `assert` mô tả điều phải đúng. Ví dụ: nếu một charge được chọn cho một conduct thì mọi element bắt buộc của charge đó phải có assessment phù hợp; kết luận `insufficient_information` loại trừ việc đồng thời chọn một charge được hỗ trợ cho cùng người/hành vi. Tất cả predicates đều có ID target và enum operator; không chạy code lấy từ JSON.

Nếu rule `blocking` thất bại thì không có final score và UI chỉ rõ câu trả lời mâu thuẫn. Khi rule qua nhưng chưa có path khớp, người chơi nhận phản hồi “cấu hình case chưa nhận diện tổ hợp này” hoặc “xem lại lựa chọn”; không được gán điểm kết luận tùy tiện. Pilot phải tìm các path hợp lý còn thiếu trước khi publish.

### 5.4 Scoring Engine

Điểm năng lực tối đa 100, tính theo tiêu chí được case khai báo. Trọng số khởi điểm cho MVP:

| Criterion | Điểm tối đa khởi điểm |
|---|---:|
| Đánh giá chứng cứ bốn lớp | 20 |
| So sánh giả thuyết | 20 |
| Ma trận chứng minh | 15 |
| Phân tích dấu hiệu cấu thành | 20 |
| Chọn charge và kết luận nhất quán | 15 |
| Tình tiết được case yêu cầu | 5 |
| Căn cứ và phiên bản luật | 5 |
| **Tổng mỗi path** | **100** |

Mỗi `criterion` tham chiếu outcome và answer fields được chấm. `scoring.path_weights` cấp điểm tối đa theo path; từng `expected_response` được gán criterion và các path áp dụng. Path có thể dùng chung expectation cho phân tích chứng cứ, nhưng element, charge, conclusion và căn cứ có expectation riêng theo nhánh. Linter xác nhận mỗi criterion có expectation áp dụng trên path đó và tổng trần bằng 100.

Điểm criterion = điểm tối đa của criterion × tổng trọng số expectation đạt / tổng trọng số expectation áp dụng. Lựa chọn nhiều mục được chấm theo tập giá trị chấp nhận được khai báo cho target; tác giả có thể tách một kỹ năng thành nhiều expectation có trọng số để cho điểm từng phần. Làm tròn một lần ở tổng cuối. Feedback giải thích câu trả lời đạt/chưa đạt, không quyết định điểm.

Điểm không bị giảm vì thời gian hoặc dùng gợi ý trong MVP; gợi ý vẫn được ghi lại để nghiên cứu trải nghiệm. Kết quả lưu `answer_path_id`, điểm theo path/criterion, consistency results, `case_version` và law-version resolution theo từng conduct event.

Quy tắc an toàn chấm điểm:

- Trùng kết luận mà không hoàn thành assessment/evidence links bắt buộc chỉ đạt điểm kết quả được plan cấu hình; không tự động đạt điểm suy luận.
- Lập luận đúng nhưng chọn nhầm nhãn cuối cùng vẫn được điểm cho dữ kiện, chứng cứ và phân tích dấu hiệu đã đúng.
- Một đáp án thay thế đạt điểm theo path và scoring plan riêng khi thỏa điều kiện đã duyệt.
- Kết luận có buộc tội/kết luận vượt quá dữ kiện phải được phản hồi theo tiêu chí “vượt quá căn cứ”; không đặt một mức phạt điểm cố định cho mọi case.
- Hình phạt cụ thể không nằm trong MVP. Nếu case nâng cao bàn về hình phạt, chấm trước việc nhận diện khung/loại yếu tố cần cân nhắc và lập luận theo nguồn đã duyệt, không yêu cầu một con số duy nhất.
- Tránh tính trùng một tình tiết giữa dấu hiệu cấu thành/định khung và phần tình tiết khác nếu nội dung chuyên môn không cho phép; phải được rubric case giải quyết rõ.

### 5.5 Hints

Ba cấp gợi ý theo kế hoạch gốc được giữ lại:

1. Hướng sự chú ý tới dữ kiện hoặc vấn đề cần xem lại.
2. Nhắc nguyên tắc/khái niệm đã được cung cấp trong case.
3. Thu hẹp tập lựa chọn nhưng không đưa đáp án cuối.

Mỗi gợi ý liên kết với `issue_id` hoặc `rubric_id`, có thứ tự và mức khấu trừ tối đa. Màn hình kết quả vẫn hiển thị nội dung học tập đầy đủ sau khi nộp.

## 6. Yêu cầu chức năng và phi chức năng

### 6.1 Chức năng MVP

- Trang chủ và danh sách case khả dụng.
- Tóm tắt case, nhân vật và câu hỏi trọng tâm.
- Màn hình khám phá/thu thập dữ liệu theo nhánh đơn giản.
- Bảng chứng cứ, vấn đề, giả thuyết và liên kết chứng cứ.
- Phân tích dấu hiệu pháp lý theo từng charge, đánh giá tình tiết được case hỏi, chọn kết luận nhất quán và ghi căn cứ.
- Hints, nộp bài, phản hồi theo từng tiêu chí.
- Lưu/khôi phục phiên chơi trên cùng trình duyệt.
- Sổ tay thuật ngữ/nguồn pháp lý xuất hiện trong case.
- Kiểm tra dữ liệu case và luật lúc build.

### 6.2 Phi chức năng

- **Responsive:** dùng được ở màn hình điện thoại từ 360 px và desktop.
- **Khả năng tiếp cận:** điều hướng bàn phím, focus rõ, nhãn biểu mẫu, độ tương phản phù hợp, không truyền đạt ý nghĩa chỉ bằng màu sắc.
- **Hiệu năng:** tải giao diện nhanh; gói dữ liệu ban đầu chỉ chứa metadata và case cần thiết.
- **Bền vững dữ liệu:** bản sao lưu cục bộ theo schema version; lỗi parse không làm mất dữ liệu thô trước khi người chơi xác nhận reset.
- **Riêng tư:** không thu thông tin nhận dạng cá nhân trong MVP; nội dung tiến độ lưu cục bộ, có nút xóa dữ liệu.
- **An toàn nội dung:** nhãn cảnh báo trước nội dung nhạy cảm; mô tả trung tính, tối giản chi tiết bạo lực.
- **Khả năng kiểm thử:** logic engine độc lập UI; dữ liệu tĩnh có schema và kiểm tra tham chiếu.
- **Quản lý lỗi:** hiển thị thông báo thân thiện khi case không tải được; không hiển thị stack trace cho người chơi.

## 7. Kiến trúc và lựa chọn công nghệ

### 7.1 Phương án MVP

- **UI:** React + TypeScript + Vite.
- **Điều hướng:** React Router hoặc state machine nhẹ nếu chỉ có một route case; tránh thêm thư viện lớn khi chưa cần.
- **State phiên chơi:** Zustand hoặc reducer thuần React. Đề xuất reducer thuần cho MVP để giảm phụ thuộc và dễ kiểm tra luồng chuyển trạng thái.
- **Dữ liệu:** JSON tĩnh theo case và gói luật/nguồn; tải từ `src/content` hoặc `public/content`.
- **Validate:** JSON Schema Draft 2020-12 với `Ajv2020` từ `ajv/dist/2020` và `ajv-formats` để kiểm tra `format: date`/`date-time`; kiểm tra liên kết chéo và quy tắc nhất quán bằng script riêng. Theo [hướng dẫn chính thức của Ajv về các draft](https://ajv.js.org/json-schema.html), Draft 2020-12 cần class import riêng; định dạng chuẩn dùng gói [ajv-formats](https://ajv.js.org/packages/ajv-formats.html). Cấu hình mẫu:

  ```ts
  import Ajv2020 from "ajv/dist/2020";
  import addFormats from "ajv-formats";

  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  ```

  Chọn một draft cho một Ajv instance; schema trong repo và validator phải khai báo cùng draft.
- **Lưu tiến độ:** `localStorage` có key theo người dùng cục bộ, case ID và schema version; lưu sau mỗi thay đổi có ý nghĩa.
- **Kiểm thử tự động:** Vitest cho engine và validator; Playwright cho smoke flow nếu nhóm có thời gian. Đây là kế hoạch kiểm thử, không phải xác nhận đã chạy.
- **Triển khai:** host static HTTPS bất kỳ được nhóm lựa chọn; không cần API server trong MVP.

Lựa chọn cụ thể có thể đổi theo năng lực nhóm, nhưng bắt buộc giữ các ranh giới: UI tách engine, dữ liệu tách code, validate nội dung trước phát hành, version hóa tiến độ và case.

### 7.2 Sơ đồ thành phần

```text
React UI
  ├── Home / Case Brief / Investigation / Evidence Board
  ├── Hypotheses / Legal Analysis / Submission / Feedback
  └── Local progress UI
        │ dispatch actions / render view models
        ▼
Application State (reducer)
  ├── session state
  ├── progress persistence adapter (localStorage)
  └── stage transition rules
        │
        ▼
Domain Engines (pure functions)
  ├── case loader + schema validator
  ├── evidence and unlock evaluator
  ├── reasoning / answer matcher
  ├── scoring / hint evaluator
  └── feedback assembler
        │
        ▼
Versioned content bundles (JSON)
  ├── cases/<case-id>/<version>.json
  ├── laws/<bundle-id>.json
  └── content index / manifest
```

### 7.3 State model

```ts
type GameSession = {
  sessionId: string;
  caseId: string;
  caseVersion: string;
  lawBundleId: string;
  currentStage: "brief" | "investigation" | "evidence" | "hypotheses" | "analysis" | "submission" | "feedback";
  discoveredContentIds: string[];
  evidenceAssessments: Record<string, { relevance?: string; reliability?: string; legalityQuestion?: string; note?: string }>;
  hypotheses: Array<{ hypothesisId: string; supportEvidenceIds: string[]; challengeEvidenceIds: string[]; unresolvedEvidenceIds: string[] }>;
  selectedChargeIdsByConduct: Record<string, string[]>;
  selectedCircumstanceIdsByPerson: Record<string, string[]>;
  answers: Record<string, unknown>;
  consistencyResults?: Array<{ ruleId: string; status: "pass" | "fail"; affectedAnswerPaths: string[] }>;
  selectedHints: string[];
  submittedAt?: string;
  score?: { total: number; rubricResults: Array<{ rubricId: string; earned: number; max: number }> };
  status: "in_progress" | "submitted";
  updatedAt: string;
};
```

State migration must be explicit: when an app version cannot migrate a saved session, preserve the old record and offer restart/export or reset. A case update should not silently rewrite a submitted result; saved results retain `caseVersion` and `lawBundleId`.

### 7.4 Khi cần backend

Chỉ bổ sung backend khi MVP chứng minh nhu cầu tài khoản/giảng viên/analytics. Khi đó, có thể dùng API service (ví dụ FastAPI hoặc Node) cùng PostgreSQL; dữ liệu cá nhân, phân quyền, retention, backup và consent phải được thiết kế riêng trước khi thu thập. Không thêm backend chỉ để lưu dữ liệu luật tĩnh.

## 8. Dữ liệu và JSON Schema

### 8.1 Mô hình dữ liệu chuẩn

Case và law bundle được version hóa riêng. Một schema duy nhất tại `schemas/case.schema.json` định nghĩa cấu trúc; cross-reference linter kiểm tra tính liên kết và các phép tổng hợp.

- `answer_fields` là registry chuẩn cho mọi câu trả lời. Runtime chỉ lưu theo `field_id + target_id`; không có path tự do trong `answers.*`. Mỗi field khai báo kiểu, scope, targets và options.
- `expected_responses` định nghĩa đáp án tham chiếu theo field/target/path, gồm accepted values, trọng số, criterion, learning outcome và explanation.
- `answer_paths` là nguồn chuẩn duy nhất cho tổ hợp kết luận được chấp nhận. `accepted_answers` và `alternatives` được bỏ; đáp án thay thế là một path riêng.
- `consistency_rules` là bất biến toàn cục chạy trước path matching; path không lặp lại hoặc vô hiệu hóa rule.
- `criteria` định nghĩa năng lực/learning outcome; `scoring.path_weights` phân bổ điểm theo path. Mỗi path có tổng điểm tối đa 100 và quy tắc điểm một phần rõ ràng.
- `candidate_charges`, `charge_elements`, `charge_comparisons`, `circumstances` và `age_rules` là thực thể riêng. Kết luận pháp lý cần qualified review.

**Mô hình chứng cứ bốn lớp:** (1) nguồn và tính toàn vẹn; (2) quy trình thu thập và khiếm khuyết thủ tục; (3) xác thực/độ tin cậy; (4) liên quan và sức hỗ trợ cho mệnh đề. Khiếm khuyết thủ tục lưu riêng với căn cứ và hệ quả do reviewer xác định; engine không tự loại chứng cứ.

**Ma trận chứng minh:** mỗi hàng là một mệnh đề cần chứng minh, gắn charge elements, links chứng cứ ủng hộ/phản bác/bối cảnh và giới hạn suy luận. Lựa chọn trên evidence, hypothesis board và proof matrix đều có `answer_field` cùng `expected_responses`, nên đều được chấm.

Catalog learning outcome là bảng ở mục 2.3. Mỗi criterion trỏ tới outcome và answer fields. Linter yêu cầu mọi outcome case công bố được đo bởi ít nhất một criterion.

### 8.2 Ví dụ dữ liệu case

Ví dụ hư cấu để minh họa; placeholder pháp lý chưa được xác minh và không tạo kết luận pháp lý.

~~~json
{
  "schema_version": "2.0.0",
  "metadata": {
    "id": "case_001", "version": "0.2.0", "title": "Case mẫu cần thẩm định", "status": "draft", "jurisdiction": "VN",
    "legal_time_anchor": "reviewer_defined", "legal_time_anchor_reason": "[Reviewer ghi căn cứ chọn thời điểm]",
    "law_bundle_ids": ["law_bundle_v1"],
    "learning_outcome_ids": ["lo_source_fact_01", "lo_evidence_01", "lo_reasoning_01", "lo_proof_01", "lo_elements_01", "lo_charge_01", "lo_law_01"]
  },
  "brief": {"narrative": "[Bối cảnh hư cấu]", "task_prompt": "[Câu hỏi học tập]", "player_role": "learner_case_analyst"},
  "law_bundles": [{"id": "law_bundle_v1", "version": "placeholder", "jurisdiction": "VN", "provisions": [{"id": "provision_placeholder_01", "citation": "[Chưa xác minh]", "effective_from": null, "effective_to": null, "source_ref": "[Reviewer bổ sung nguồn chính thức]", "review_status": "not_reviewed"}]}],
  "temporal_context": {"conduct_events": [
    {"id": "conduct_01", "date_interval": {"start_date": "2024-06-01", "end_date": "2024-06-01", "precision": "day", "source_ids": ["ev_record_01"]}, "law_resolution": {"status": "unresolved", "bundle_id": null, "review_id": null}}
  ]},
  "characters": [{"id": "person_a", "display_name": "Nhân vật A", "roles": ["person_of_interest"], "birth_date_interval": {"start_date": "2004-02-01", "end_date": "2004-02-01", "precision": "day", "source_ids": ["ev_record_01"]}}],
  "facts": [{"id": "fact_01", "text": "[Dữ kiện trong hồ sơ]", "source_ids": ["ev_record_01"]}],
  "evidence": [
    {"id": "ev_record_01", "type": "record", "title": "Tài liệu A", "content": "[Nội dung hư cấu]", "source": {"origin": "[Nguồn]", "integrity_notes": ["[Giới hạn/metadata]"]}, "procedural_defect_ids": ["defect_01"], "limitation_ids": ["limit_01"]},
    {"id": "ev_statement_01", "type": "statement", "title": "Lời trình bày B", "content": "[Nội dung hư cấu]", "source": {"origin": "[Nguồn]", "integrity_notes": []}, "procedural_defect_ids": [], "limitation_ids": []}
  ],
  "procedural_defects": [{"id": "defect_01", "evidence_id": "ev_record_01", "step": "[Bước]", "observed_issue": "[Vấn đề cần review]", "legal_basis_ids": ["provision_placeholder_01"], "review_status": "not_reviewed", "possible_effect_codes": ["effect_to_be_reviewed"]}],
  "evidence_limitations": [{"id": "limit_01", "evidence_id": "ev_record_01", "description": "[Giới hạn suy luận]"}],
  "hypotheses": [{"id": "hypothesis_a", "label": "Giả thuyết A", "description": "[Mô tả trung tính]"}, {"id": "hypothesis_b", "label": "Giả thuyết B", "description": "[Giả thuyết cạnh tranh]"}],
  "proof_matrix": [{"id": "proof_row_01", "proposition": "[Mệnh đề cần chứng minh]", "charge_element_ids": ["element_a_01"], "evidence_links": [{"evidence_id": "ev_record_01", "relation": "supports", "limitation_ids": ["limit_01"]}, {"evidence_id": "ev_statement_01", "relation": "challenges", "limitation_ids": []}]}],
  "candidate_charges": [
    {"id": "charge_a", "display_label": "[Định danh A cần xác nhận]", "person_id": "person_a", "conduct_event_ids": ["conduct_01"], "legal_basis_ids": ["provision_placeholder_01"], "charge_element_ids": ["element_a_01"]},
    {"id": "charge_b", "display_label": "[Định danh gần B cần xác nhận]", "person_id": "person_a", "conduct_event_ids": ["conduct_01"], "legal_basis_ids": ["provision_placeholder_01"], "charge_element_ids": ["element_b_01"]}
  ],
  "charge_elements": [
    {"id": "element_a_01", "charge_id": "charge_a", "element_type": "conduct", "label": "[Dấu hiệu A]", "legal_test": "[Reviewer điền sau khi xác minh]", "required": true, "fact_ids": ["fact_01"], "evidence_ids": ["ev_record_01"], "legal_basis_ids": ["provision_placeholder_01"]},
    {"id": "element_b_01", "charge_id": "charge_b", "element_type": "mental_state", "label": "[Dấu hiệu phân biệt B]", "legal_test": "[Reviewer điền sau khi xác minh]", "required": true, "fact_ids": ["fact_01"], "evidence_ids": ["ev_statement_01"], "legal_basis_ids": ["provision_placeholder_01"]}
  ],
  "charge_comparisons": [{"id": "comparison_ab", "candidate_charge_ids": ["charge_a", "charge_b"], "distinguishing_element_ids": ["element_a_01", "element_b_01"], "explanation_id": "explanation_01"}],
  "age_rules": [{"id": "age_rule_01", "candidate_charge_ids": ["charge_a", "charge_b"], "conduct_event_ids": ["conduct_01"], "law_bundle_ids": ["law_bundle_v1"], "legal_basis_ids": ["provision_placeholder_01"], "conditions": [], "review_status": "not_reviewed"}],
  "circumstances": [{"id": "circumstance_01", "category": "mitigating", "person_id": "person_a", "conduct_event_ids": ["conduct_01"], "legal_basis_ids": ["provision_placeholder_01"], "fact_ids": ["fact_01"], "review_status": "not_reviewed"}],
  "conclusions": [
    {"id": "conclusion_a", "type": "charge_supported", "charge_id": "charge_a", "person_id": "person_a", "conduct_event_ids": ["conduct_01"], "label": "[Kết luận A sau review]"},
    {"id": "conclusion_b", "type": "charge_supported", "charge_id": "charge_b", "person_id": "person_a", "conduct_event_ids": ["conduct_01"], "label": "[Kết luận B sau review]"},
    {"id": "conclusion_insufficient", "type": "insufficient_information", "charge_id": null, "person_id": "person_a", "conduct_event_ids": ["conduct_01"], "label": "Chưa đủ dữ kiện/căn cứ trong hồ sơ mô phỏng"}
  ],
  "answer_fields": [
    {"id": "source_assessment", "scope": "evidence", "target_ids": ["ev_record_01", "ev_statement_01"], "value_type": "single_choice", "options": [{"id": "source_supported", "label": "Nguồn có căn cứ trong hồ sơ"}, {"id": "source_unresolved", "label": "Nguồn chưa rõ"}]},
    {"id": "procedure_assessment", "scope": "evidence", "target_ids": ["ev_record_01"], "value_type": "single_choice", "options": [{"id": "defect_identified", "label": "Nhận diện vấn đề"}, {"id": "no_issue_identified", "label": "Không nhận diện vấn đề"}, {"id": "unresolved", "label": "Chưa rõ"}]},
    {"id": "reliability_assessment", "scope": "evidence", "target_ids": ["ev_record_01", "ev_statement_01"], "value_type": "single_choice", "options": [{"id": "reliable", "label": "Đáng tin trong giới hạn"}, {"id": "limited", "label": "Có giới hạn"}, {"id": "unresolved", "label": "Chưa rõ"}]},
    {"id": "relevance_assessment", "scope": "evidence", "target_ids": ["ev_record_01", "ev_statement_01"], "value_type": "single_choice", "options": [{"id": "supports", "label": "Hỗ trợ"}, {"id": "challenges", "label": "Phản bác"}, {"id": "context", "label": "Bối cảnh"}, {"id": "unresolved", "label": "Chưa rõ"}]},
    {"id": "proof_assessment", "scope": "proof_row", "target_ids": ["proof_row_01"], "value_type": "single_choice", "options": [{"id": "supports", "label": "Đủ sức hỗ trợ trong giới hạn"}, {"id": "challenges", "label": "Thách thức mệnh đề"}, {"id": "unresolved", "label": "Chưa phân định"}]},
    {"id": "hypothesis_support", "scope": "hypothesis", "target_ids": ["hypothesis_a", "hypothesis_b"], "value_type": "multi_select", "options": [{"id": "ev_record_01", "label": "Tài liệu A"}, {"id": "ev_statement_01", "label": "Lời trình bày B"}]},
    {"id": "hypothesis_challenge", "scope": "hypothesis", "target_ids": ["hypothesis_a", "hypothesis_b"], "value_type": "multi_select", "options": [{"id": "ev_record_01", "label": "Tài liệu A"}, {"id": "ev_statement_01", "label": "Lời trình bày B"}]},
    {"id": "element_status", "scope": "charge_element", "target_ids": ["element_a_01", "element_b_01"], "value_type": "single_choice", "options": [{"id": "supported", "label": "Có dữ kiện hỗ trợ"}, {"id": "not_supported", "label": "Chưa được hỗ trợ"}, {"id": "unresolved", "label": "Chưa đủ thông tin"}]},
    {"id": "selected_charge", "scope": "person_conduct", "target_ids": ["person_a:conduct_01"], "value_type": "single_choice", "options": [{"id": "charge_a", "label": "Định danh A"}, {"id": "charge_b", "label": "Định danh B"}]},
    {"id": "conclusion", "scope": "person_conduct", "target_ids": ["person_a:conduct_01"], "value_type": "single_choice", "options": [{"id": "conclusion_a", "label": "Kết luận A"}, {"id": "conclusion_b", "label": "Kết luận B"}, {"id": "conclusion_insufficient", "label": "Chưa đủ"}]},
    {"id": "circumstance_status", "scope": "circumstance", "target_ids": ["circumstance_01"], "value_type": "single_choice", "options": [{"id": "established", "label": "Có dữ kiện hỗ trợ"}, {"id": "not_established", "label": "Không được hỗ trợ"}, {"id": "unresolved", "label": "Chưa đủ thông tin"}]},
    {"id": "legal_basis", "scope": "conclusion", "target_ids": ["conclusion_a", "conclusion_b", "conclusion_insufficient"], "value_type": "multi_select", "options": [{"id": "provision_placeholder_01", "label": "[Nguồn luật chưa xác minh]"}]}
  ],
  "expected_responses": [
    {"id": "expect_source_record", "path_ids": ["path_insufficient", "path_a", "path_b"], "field_id": "source_assessment", "target_id": "ev_record_01", "accepted_values": ["source_supported"], "weight": 1, "criterion_id": "criterion_evidence", "learning_outcome_ids": ["lo_source_fact_01"], "explanation_id": "explanation_01"},
    {"id": "expect_source_statement", "path_ids": ["path_insufficient", "path_a", "path_b"], "field_id": "source_assessment", "target_id": "ev_statement_01", "accepted_values": ["source_supported"], "weight": 1, "criterion_id": "criterion_evidence", "learning_outcome_ids": ["lo_source_fact_01"], "explanation_id": "explanation_01"},
    {"id": "expect_procedure", "path_ids": ["path_insufficient", "path_a", "path_b"], "field_id": "procedure_assessment", "target_id": "ev_record_01", "accepted_values": ["defect_identified"], "weight": 1, "criterion_id": "criterion_evidence", "learning_outcome_ids": ["lo_evidence_01"], "explanation_id": "explanation_01"},
    {"id": "expect_reliability_record", "path_ids": ["path_insufficient", "path_a", "path_b"], "field_id": "reliability_assessment", "target_id": "ev_record_01", "accepted_values": ["limited"], "weight": 1, "criterion_id": "criterion_evidence", "learning_outcome_ids": ["lo_evidence_01"], "explanation_id": "explanation_01"},
    {"id": "expect_reliability_statement", "path_ids": ["path_insufficient", "path_a", "path_b"], "field_id": "reliability_assessment", "target_id": "ev_statement_01", "accepted_values": ["reliable"], "weight": 1, "criterion_id": "criterion_evidence", "learning_outcome_ids": ["lo_evidence_01"], "explanation_id": "explanation_01"},
    {"id": "expect_relevance_record", "path_ids": ["path_insufficient", "path_a", "path_b"], "field_id": "relevance_assessment", "target_id": "ev_record_01", "accepted_values": ["supports"], "weight": 1, "criterion_id": "criterion_evidence", "learning_outcome_ids": ["lo_evidence_01"], "explanation_id": "explanation_01"},
    {"id": "expect_relevance_statement", "path_ids": ["path_insufficient", "path_a", "path_b"], "field_id": "relevance_assessment", "target_id": "ev_statement_01", "accepted_values": ["challenges"], "weight": 1, "criterion_id": "criterion_evidence", "learning_outcome_ids": ["lo_evidence_01"], "explanation_id": "explanation_01"},
    {"id": "expect_hyp_a_support", "path_ids": ["path_insufficient", "path_a", "path_b"], "field_id": "hypothesis_support", "target_id": "hypothesis_a", "accepted_values": ["ev_record_01"], "weight": 1, "criterion_id": "criterion_hypothesis", "learning_outcome_ids": ["lo_reasoning_01"], "explanation_id": "explanation_01"},
    {"id": "expect_hyp_a_challenge", "path_ids": ["path_insufficient", "path_a", "path_b"], "field_id": "hypothesis_challenge", "target_id": "hypothesis_a", "accepted_values": ["ev_statement_01"], "weight": 1, "criterion_id": "criterion_hypothesis", "learning_outcome_ids": ["lo_reasoning_01"], "explanation_id": "explanation_01"},
    {"id": "expect_hyp_b_support", "path_ids": ["path_insufficient", "path_a", "path_b"], "field_id": "hypothesis_support", "target_id": "hypothesis_b", "accepted_values": ["ev_statement_01"], "weight": 1, "criterion_id": "criterion_hypothesis", "learning_outcome_ids": ["lo_reasoning_01"], "explanation_id": "explanation_01"},
    {"id": "expect_hyp_b_challenge", "path_ids": ["path_insufficient", "path_a", "path_b"], "field_id": "hypothesis_challenge", "target_id": "hypothesis_b", "accepted_values": ["ev_record_01"], "weight": 1, "criterion_id": "criterion_hypothesis", "learning_outcome_ids": ["lo_reasoning_01"], "explanation_id": "explanation_01"},
    {"id": "expect_proof", "path_ids": ["path_insufficient", "path_a", "path_b"], "field_id": "proof_assessment", "target_id": "proof_row_01", "accepted_values": ["supports"], "weight": 1, "criterion_id": "criterion_proof", "learning_outcome_ids": ["lo_proof_01"], "explanation_id": "explanation_01"},
    {"id": "expect_circumstance", "path_ids": ["path_insufficient", "path_a", "path_b"], "field_id": "circumstance_status", "target_id": "circumstance_01", "accepted_values": ["unresolved"], "weight": 1, "criterion_id": "criterion_circumstance", "learning_outcome_ids": ["lo_elements_01"], "explanation_id": "explanation_01"},
    {"id": "expect_path_insufficient_element_a_01", "path_ids": ["path_insufficient"], "field_id": "element_status", "target_id": "element_a_01", "accepted_values": ["unresolved"], "weight": 1, "criterion_id": "criterion_elements", "learning_outcome_ids": ["lo_elements_01"], "explanation_id": "explanation_01"},
    {"id": "expect_path_insufficient_element_b_01", "path_ids": ["path_insufficient"], "field_id": "element_status", "target_id": "element_b_01", "accepted_values": ["unresolved"], "weight": 1, "criterion_id": "criterion_elements", "learning_outcome_ids": ["lo_elements_01"], "explanation_id": "explanation_01"},
    {"id": "expect_path_insufficient_charge", "path_ids": ["path_insufficient"], "field_id": "selected_charge", "target_id": "person_a:conduct_01", "accepted_values": [], "weight": 1, "criterion_id": "criterion_charge", "learning_outcome_ids": ["lo_charge_01"], "explanation_id": "explanation_01"},
    {"id": "expect_path_insufficient_conclusion", "path_ids": ["path_insufficient"], "field_id": "conclusion", "target_id": "person_a:conduct_01", "accepted_values": ["conclusion_insufficient"], "weight": 1, "criterion_id": "criterion_charge", "learning_outcome_ids": ["lo_charge_01"], "explanation_id": "explanation_01"},
    {"id": "expect_path_insufficient_basis", "path_ids": ["path_insufficient"], "field_id": "legal_basis", "target_id": "conclusion_insufficient", "accepted_values": [], "weight": 1, "criterion_id": "criterion_law", "learning_outcome_ids": ["lo_law_01"], "explanation_id": "explanation_01"},
    {"id": "expect_path_a_element_a_01", "path_ids": ["path_a"], "field_id": "element_status", "target_id": "element_a_01", "accepted_values": ["supported"], "weight": 1, "criterion_id": "criterion_elements", "learning_outcome_ids": ["lo_elements_01"], "explanation_id": "explanation_01"},
    {"id": "expect_path_a_element_b_01", "path_ids": ["path_a"], "field_id": "element_status", "target_id": "element_b_01", "accepted_values": ["not_supported"], "weight": 1, "criterion_id": "criterion_elements", "learning_outcome_ids": ["lo_elements_01"], "explanation_id": "explanation_01"},
    {"id": "expect_path_a_charge", "path_ids": ["path_a"], "field_id": "selected_charge", "target_id": "person_a:conduct_01", "accepted_values": ["charge_a"], "weight": 1, "criterion_id": "criterion_charge", "learning_outcome_ids": ["lo_charge_01"], "explanation_id": "explanation_01"},
    {"id": "expect_path_a_conclusion", "path_ids": ["path_a"], "field_id": "conclusion", "target_id": "person_a:conduct_01", "accepted_values": ["conclusion_a"], "weight": 1, "criterion_id": "criterion_charge", "learning_outcome_ids": ["lo_charge_01"], "explanation_id": "explanation_01"},
    {"id": "expect_path_a_basis", "path_ids": ["path_a"], "field_id": "legal_basis", "target_id": "conclusion_a", "accepted_values": ["provision_placeholder_01"], "weight": 1, "criterion_id": "criterion_law", "learning_outcome_ids": ["lo_law_01"], "explanation_id": "explanation_01"},
    {"id": "expect_path_b_element_a_01", "path_ids": ["path_b"], "field_id": "element_status", "target_id": "element_a_01", "accepted_values": ["not_supported"], "weight": 1, "criterion_id": "criterion_elements", "learning_outcome_ids": ["lo_elements_01"], "explanation_id": "explanation_01"},
    {"id": "expect_path_b_element_b_01", "path_ids": ["path_b"], "field_id": "element_status", "target_id": "element_b_01", "accepted_values": ["supported"], "weight": 1, "criterion_id": "criterion_elements", "learning_outcome_ids": ["lo_elements_01"], "explanation_id": "explanation_01"},
    {"id": "expect_path_b_charge", "path_ids": ["path_b"], "field_id": "selected_charge", "target_id": "person_a:conduct_01", "accepted_values": ["charge_b"], "weight": 1, "criterion_id": "criterion_charge", "learning_outcome_ids": ["lo_charge_01"], "explanation_id": "explanation_01"},
    {"id": "expect_path_b_conclusion", "path_ids": ["path_b"], "field_id": "conclusion", "target_id": "person_a:conduct_01", "accepted_values": ["conclusion_b"], "weight": 1, "criterion_id": "criterion_charge", "learning_outcome_ids": ["lo_charge_01"], "explanation_id": "explanation_01"},
    {"id": "expect_path_b_basis", "path_ids": ["path_b"], "field_id": "legal_basis", "target_id": "conclusion_b", "accepted_values": ["provision_placeholder_01"], "weight": 1, "criterion_id": "criterion_law", "learning_outcome_ids": ["lo_law_01"], "explanation_id": "explanation_01"}
  ],
  "answer_paths": [
    {"id": "path_insufficient", "match": {"op": "all", "args": [{"op": "equals", "field_id": "element_status", "target_id": "element_a_01", "value": "unresolved"}, {"op": "equals", "field_id": "element_status", "target_id": "element_b_01", "value": "unresolved"}, {"op": "is_empty", "field_id": "selected_charge", "target_id": "person_a:conduct_01"}, {"op": "equals", "field_id": "conclusion", "target_id": "person_a:conduct_01", "value": "conclusion_insufficient"}]}, "conclusion_ids": ["conclusion_insufficient"], "charge_ids": []},
    {"id": "path_a", "match": {"op": "all", "args": [{"op": "equals", "field_id": "element_status", "target_id": "element_a_01", "value": "supported"}, {"op": "equals", "field_id": "element_status", "target_id": "element_b_01", "value": "not_supported"}, {"op": "equals", "field_id": "selected_charge", "target_id": "person_a:conduct_01", "value": "charge_a"}, {"op": "equals", "field_id": "conclusion", "target_id": "person_a:conduct_01", "value": "conclusion_a"}]}, "conclusion_ids": ["conclusion_a"], "charge_ids": ["charge_a"]},
    {"id": "path_b", "match": {"op": "all", "args": [{"op": "equals", "field_id": "element_status", "target_id": "element_b_01", "value": "supported"}, {"op": "equals", "field_id": "element_status", "target_id": "element_a_01", "value": "not_supported"}, {"op": "equals", "field_id": "selected_charge", "target_id": "person_a:conduct_01", "value": "charge_b"}, {"op": "equals", "field_id": "conclusion", "target_id": "person_a:conduct_01", "value": "conclusion_b"}]}, "conclusion_ids": ["conclusion_b"], "charge_ids": ["charge_b"]}
  ],
  "consistency_rules": [
    {"id": "rule_insufficient_excludes_charge", "scope": {"person_id": "person_a", "conduct_event_id": "conduct_01"}, "when": {"op": "equals", "field_id": "conclusion", "target_id": "person_a:conduct_01", "value": "conclusion_insufficient"}, "assert": {"op": "is_empty", "field_id": "selected_charge", "target_id": "person_a:conduct_01"}, "severity": "blocking", "message": "Kết luận chưa đủ căn cứ loại trừ charge cho cùng người/hành vi."},
    {"id": "rule_charge_a_element", "scope": {"person_id": "person_a", "conduct_event_id": "conduct_01"}, "when": {"op": "equals", "field_id": "selected_charge", "target_id": "person_a:conduct_01", "value": "charge_a"}, "assert": {"op": "equals", "field_id": "element_status", "target_id": "element_a_01", "value": "supported"}, "severity": "blocking", "message": "Charge A cần dấu hiệu bắt buộc được hỗ trợ."},
    {"id": "rule_charge_b_element", "scope": {"person_id": "person_a", "conduct_event_id": "conduct_01"}, "when": {"op": "equals", "field_id": "selected_charge", "target_id": "person_a:conduct_01", "value": "charge_b"}, "assert": {"op": "equals", "field_id": "element_status", "target_id": "element_b_01", "value": "supported"}, "severity": "blocking", "message": "Charge B cần dấu hiệu bắt buộc được hỗ trợ."}
  ],
  "criteria": [
    {"id": "criterion_evidence", "learning_outcome_ids": ["lo_evidence_01", "lo_source_fact_01"], "answer_field_ids": ["source_assessment", "procedure_assessment", "reliability_assessment", "relevance_assessment"], "label": "Đánh giá chứng cứ"},
    {"id": "criterion_hypothesis", "learning_outcome_ids": ["lo_reasoning_01"], "answer_field_ids": ["hypothesis_support", "hypothesis_challenge"], "label": "So sánh giả thuyết"},
    {"id": "criterion_proof", "learning_outcome_ids": ["lo_source_fact_01", "lo_proof_01"], "answer_field_ids": ["proof_assessment"], "label": "Ma trận chứng minh"},
    {"id": "criterion_elements", "learning_outcome_ids": ["lo_elements_01"], "answer_field_ids": ["element_status", "circumstance_status"], "label": "Phân tích dấu hiệu và tình tiết"},
    {"id": "criterion_charge", "learning_outcome_ids": ["lo_charge_01"], "answer_field_ids": ["selected_charge", "conclusion"], "label": "Định danh/kết luận"},
    {"id": "criterion_circumstance", "learning_outcome_ids": ["lo_elements_01"], "answer_field_ids": ["circumstance_status"], "label": "Đánh giá tình tiết"},
    {"id": "criterion_law", "learning_outcome_ids": ["lo_law_01"], "answer_field_ids": ["legal_basis"], "label": "Căn cứ pháp lý"}
  ],
  "scoring": {"path_weights": [
    {"path_id": "path_insufficient", "criterion_points": {"criterion_evidence": 20, "criterion_hypothesis": 20, "criterion_proof": 15, "criterion_elements": 20, "criterion_charge": 15, "criterion_circumstance": 5, "criterion_law": 5}},
    {"path_id": "path_a", "criterion_points": {"criterion_evidence": 20, "criterion_hypothesis": 20, "criterion_proof": 15, "criterion_elements": 20, "criterion_charge": 15, "criterion_circumstance": 5, "criterion_law": 5}},
    {"path_id": "path_b", "criterion_points": {"criterion_evidence": 20, "criterion_hypothesis": 20, "criterion_proof": 15, "criterion_elements": 20, "criterion_charge": 15, "criterion_circumstance": 5, "criterion_law": 5}}
  ], "partial_credit": {"method": "weighted_expectation_ratio", "rounding": "nearest_integer"}},
  "review": {"status": "not_reviewed", "review_ids": []},
  "explanations": [{"id": "explanation_01", "title": "[Giải thích]", "body": "[Dữ kiện → suy luận → yếu tố → căn cứ]", "legal_basis_ids": ["provision_placeholder_01"]}],
  "references": {"legal_basis_ids": ["provision_placeholder_01"]}
}
~~~

Trong ví dụ, mọi path có trần 100. Đây là case nháp có law resolution chưa phân giải, nên linter phải chặn publish. Sau khi có review, điểm thực nhận = điểm criterion × tổng trọng số expectation khớp / tổng trọng số expectation áp dụng. Path A/B chỉ chấm element/charge tương ứng, không đòi A và B cùng đúng. Path chưa đủ căn cứ vẫn có thể đạt tối đa nhờ evidence, hypothesis, proof matrix và nhận diện giới hạn. Feedback partial chỉ chọn lời giải thích; công thức trên quyết định điểm.

### 8.3 Luật theo thời điểm và tuổi

Mỗi law bundle chứa provisions với `effective_from`/`effective_to`, nguồn và trạng thái xác minh. Mỗi conduct event được ánh xạ riêng tới bundle đã được reviewer xác nhận. `legal_time_anchor` ghi cơ sở thời gian; không mặc định dùng luật mới nhất hoặc một bundle cho cả case.

Linter đối chiếu date interval của từng conduct event với effective interval của provisions có trong law bundle; `law_resolution.bundle_id` phải trỏ tới đúng bundle, và provision dùng trong charge/age rule phải thuộc bundle đó. Nếu khoảng ngày cắt qua thời điểm đổi luật, thiếu ngày hoặc không xác định được phiên bản, chặn publish cho tới khi reviewer bổ sung dữ kiện, xác định căn cứ thời gian, hoặc tạo các path/scoring tương ứng cho từng phiên bản. Không tự chọn luật.

Tuổi được tính theo ngày sinh và khoảng ngày hành vi thành khoảng tuổi tròn năm nhỏ nhất/lớn nhất có thể có, dùng ngày kỷ niệm sinh nhật theo lịch. Không suy ra một tuổi đơn khi đầu vào là khoảng. `age_rules` gắn rõ candidate charge IDs, conduct event IDs, law bundle IDs và legal-basis IDs; vì vậy một rule không tự áp sang charge khác. `conditions` là bảng máy đọc được do reviewer điền: khoảng tuổi nguyên năm (`min_age_years`, `max_age_years`), charge áp dụng, mã kết quả học tập, căn cứ và `review_id`. Không có điều kiện mặc định; draft có thể để mảng rỗng nhưng không được publish. Linter phát hiện khoảng chồng lấn/mất khoảng và điều kiện chưa được duyệt. Engine chỉ trả kết quả tính toán/không xác định; qualified reviewer xác định hệ quả pháp lý. Linter chặn publish nếu thiếu ngày sinh/ngày hành vi cần thiết, charge/event/bundle không khớp, hoặc tuổi có thể nằm hai phía của ngưỡng do reviewer khai báo mà case không có nhánh xử lý đã duyệt.

### 8.4 JSON Schema duy nhất

Schema triển khai duy nhất đặt tại `schemas/case.schema.json`; tài liệu này chứa bản chuẩn để tạo file triển khai đó. Khai báo cấu trúc, kiểu và enum; linter riêng thực hiện cross-reference, logic, tổng điểm và kiểm tra thời gian. Các object điều khiển gameplay, thời gian, luật, đáp án và chấm điểm là khép kín. Một số thực thể nội dung dùng `content_record` có trường mở để cho phép mở rộng có kiểm soát qua kiểm tra tham chiếu và review nội dung.

~~~json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://tham-tu-hinh-su.invalid/schema/case-2.0.0.json",
  "type": "object", "additionalProperties": false,
  "required": ["schema_version", "metadata", "brief", "temporal_context", "characters", "facts", "evidence", "procedural_defects", "evidence_limitations", "hypotheses", "law_bundles", "proof_matrix", "candidate_charges", "charge_elements", "charge_comparisons", "age_rules", "circumstances", "conclusions", "answer_fields", "expected_responses", "answer_paths", "consistency_rules", "criteria", "scoring", "review", "explanations", "references"],
  "properties": {
    "schema_version": {"const": "2.0.0"},
    "metadata": {"$ref": "#/$defs/metadata"},
    "brief": {"type": "object", "required": ["narrative", "task_prompt", "player_role"], "properties": {"narrative": {"type": "string"}, "task_prompt": {"type": "string"}, "player_role": {"type": "string"}}, "additionalProperties": false},
    "characters": {"type": "array", "items": {"$ref": "#/$defs/character"}},
    "facts": {"type": "array", "items": {"$ref": "#/$defs/content_record"}},
    "evidence": {"type": "array", "items": {"$ref": "#/$defs/content_record"}},
    "procedural_defects": {"type": "array", "items": {"$ref": "#/$defs/content_record"}},
    "evidence_limitations": {"type": "array", "items": {"$ref": "#/$defs/content_record"}},
    "hypotheses": {"type": "array", "items": {"$ref": "#/$defs/content_record"}},
    "law_bundles": {"type": "array", "items": {"$ref": "#/$defs/law_bundle"}},
    "charge_comparisons": {"type": "array", "items": {"$ref": "#/$defs/content_record"}},
    "conclusions": {"type": "array", "items": {"$ref": "#/$defs/content_record"}},
    "explanations": {"type": "array", "items": {"$ref": "#/$defs/content_record"}},
    "references": {"type": "object", "required": ["legal_basis_ids"], "properties": {"legal_basis_ids": {"$ref": "#/$defs/ids"}}, "additionalProperties": false},
    "temporal_context": {"type": "object", "required": ["conduct_events"], "properties": {"conduct_events": {"type": "array", "items": {"$ref": "#/$defs/conduct_event"}}}, "additionalProperties": false},
    "answer_fields": {"type": "array", "items": {"$ref": "#/$defs/answer_field"}},
    "expected_responses": {"type": "array", "items": {"$ref": "#/$defs/expected_response"}},
    "answer_paths": {"type": "array", "minItems": 1, "items": {"$ref": "#/$defs/answer_path"}},
    "consistency_rules": {"type": "array", "items": {"$ref": "#/$defs/rule"}},
    "criteria": {"type": "array", "items": {"$ref": "#/$defs/criterion"}},
    "scoring": {"$ref": "#/$defs/scoring"},
    "candidate_charges": {"type": "array", "items": {"$ref": "#/$defs/charge"}},
    "charge_elements": {"type": "array", "items": {"$ref": "#/$defs/charge_element"}},
    "circumstances": {"type": "array", "items": {"$ref": "#/$defs/circumstance"}},
    "age_rules": {"type": "array", "items": {"$ref": "#/$defs/age_rule"}},
    "proof_matrix": {"type": "array", "items": {"$ref": "#/$defs/proof_row"}},
    "review": {"type": "object", "required": ["status", "review_ids"], "properties": {"status": {"enum": ["not_reviewed", "in_review", "approved", "review_required"]}, "review_ids": {"$ref": "#/$defs/ids"}}, "additionalProperties": false}
  },
  "$defs": {
    "id": {"type": "string", "pattern": "^[a-z][a-z0-9_:-]{1,99}$"},
    "content_record": {"type": "object", "required": ["id"], "properties": {"id": {"$ref": "#/$defs/id"}}, "additionalProperties": true},
    "character": {"type": "object", "required": ["id", "display_name", "roles", "birth_date_interval"], "properties": {"id": {"$ref": "#/$defs/id"}, "display_name": {"type": "string"}, "roles": {"type": "array", "items": {"type": "string"}}, "birth_date_interval": {"$ref": "#/$defs/date_interval"}}, "additionalProperties": true},
    "law_bundle": {"type": "object", "required": ["id", "version", "jurisdiction", "provisions"], "properties": {"id": {"$ref": "#/$defs/id"}, "version": {"type": "string"}, "jurisdiction": {"type": "string"}, "provisions": {"type": "array", "items": {"type": "object", "required": ["id", "citation", "effective_from", "effective_to", "source_ref", "review_status"], "properties": {"id": {"$ref": "#/$defs/id"}, "citation": {"type": "string"}, "effective_from": {"type": ["string", "null"], "format": "date"}, "effective_to": {"type": ["string", "null"], "format": "date"}, "source_ref": {"type": "string"}, "review_status": {"enum": ["not_reviewed", "in_review", "approved", "review_required"]}}, "additionalProperties": false}}}, "additionalProperties": false},
    "ids": {"type": "array", "uniqueItems": true, "items": {"$ref": "#/$defs/id"}},
    "metadata": {"type": "object", "required": ["id", "version", "title", "status", "jurisdiction", "law_bundle_ids", "learning_outcome_ids", "legal_time_anchor", "legal_time_anchor_reason"], "properties": {"id": {"$ref": "#/$defs/id"}, "version": {"type": "string"}, "title": {"type": "string"}, "status": {"enum": ["draft", "review", "approved", "published", "review_required", "retired"]}, "jurisdiction": {"type": "string"}, "law_bundle_ids": {"$ref": "#/$defs/ids"}, "learning_outcome_ids": {"$ref": "#/$defs/ids"}, "legal_time_anchor": {"enum": ["conduct_date", "case_defined", "reviewer_defined"]}, "legal_time_anchor_reason": {"type": "string"}}, "additionalProperties": false},
    "date_interval": {"type": "object", "required": ["start_date", "end_date", "precision", "source_ids"], "properties": {"start_date": {"type": ["string", "null"], "format": "date"}, "end_date": {"type": ["string", "null"], "format": "date"}, "precision": {"enum": ["day", "month", "year", "range", "unknown"]}, "source_ids": {"$ref": "#/$defs/ids"}}, "additionalProperties": false},
    "conduct_event": {"type": "object", "required": ["id", "date_interval", "law_resolution"], "properties": {"id": {"$ref": "#/$defs/id"}, "date_interval": {"$ref": "#/$defs/date_interval"}, "law_resolution": {"type": "object", "required": ["status", "bundle_id", "review_id"], "properties": {"status": {"enum": ["resolved", "crosses_version", "unresolved"]}, "bundle_id": {"type": ["string", "null"]}, "review_id": {"type": ["string", "null"]}}, "additionalProperties": false}}, "additionalProperties": false},
    "answer_field": {"type": "object", "required": ["id", "scope", "target_ids", "value_type", "options"], "properties": {"id": {"$ref": "#/$defs/id"}, "scope": {"enum": ["case", "evidence", "hypothesis", "proof_row", "charge_element", "person_conduct", "circumstance", "conclusion"]}, "target_ids": {"$ref": "#/$defs/ids"}, "value_type": {"enum": ["single_choice", "multi_select"]}, "options": {"type": "array", "items": {"type": "object", "required": ["id", "label"], "properties": {"id": {"$ref": "#/$defs/id"}, "label": {"type": "string"}}, "additionalProperties": false}}}, "additionalProperties": false},
    "expected_response": {"type": "object", "required": ["id", "path_ids", "field_id", "target_id", "accepted_values", "weight", "criterion_id", "learning_outcome_ids", "explanation_id"], "properties": {"id": {"$ref": "#/$defs/id"}, "path_ids": {"$ref": "#/$defs/ids"}, "field_id": {"$ref": "#/$defs/id"}, "target_id": {"$ref": "#/$defs/id"}, "accepted_values": {"$ref": "#/$defs/ids"}, "weight": {"type": "number", "exclusiveMinimum": 0}, "criterion_id": {"$ref": "#/$defs/id"}, "learning_outcome_ids": {"$ref": "#/$defs/ids"}, "explanation_id": {"$ref": "#/$defs/id"}}, "additionalProperties": false},
    "expr": {"oneOf": [{"type": "object", "required": ["op", "args"], "properties": {"op": {"enum": ["all", "any"]}, "args": {"type": "array", "minItems": 1, "items": {"$ref": "#/$defs/expr"}}}, "additionalProperties": false}, {"type": "object", "required": ["op", "field_id", "target_id", "value"], "properties": {"op": {"enum": ["equals", "not_equals", "contains", "not_contains"]}, "field_id": {"$ref": "#/$defs/id"}, "target_id": {"$ref": "#/$defs/id"}, "value": {"$ref": "#/$defs/id"}}, "additionalProperties": false}, {"type": "object", "required": ["op", "field_id", "target_id"], "properties": {"op": {"enum": ["is_empty", "is_not_empty"]}, "field_id": {"$ref": "#/$defs/id"}, "target_id": {"$ref": "#/$defs/id"}}, "additionalProperties": false}]},
    "answer_path": {"type": "object", "required": ["id", "match", "conclusion_ids", "charge_ids"], "properties": {"id": {"$ref": "#/$defs/id"}, "match": {"$ref": "#/$defs/expr"}, "conclusion_ids": {"$ref": "#/$defs/ids"}, "charge_ids": {"$ref": "#/$defs/ids"}}, "additionalProperties": false},
    "rule": {"type": "object", "required": ["id", "scope", "when", "assert", "severity", "message"], "properties": {"id": {"$ref": "#/$defs/id"}, "scope": {"type": "object", "required": ["person_id", "conduct_event_id"], "properties": {"person_id": {"$ref": "#/$defs/id"}, "conduct_event_id": {"$ref": "#/$defs/id"}}, "additionalProperties": false}, "when": {"$ref": "#/$defs/expr"}, "assert": {"$ref": "#/$defs/expr"}, "severity": {"enum": ["blocking", "major", "minor"]}, "message": {"type": "string"}}, "additionalProperties": false},
    "criterion": {"type": "object", "required": ["id", "learning_outcome_ids", "answer_field_ids", "label"], "properties": {"id": {"$ref": "#/$defs/id"}, "learning_outcome_ids": {"$ref": "#/$defs/ids"}, "answer_field_ids": {"$ref": "#/$defs/ids"}, "label": {"type": "string"}}, "additionalProperties": false},
    "scoring": {
      "type": "object", "required": ["path_weights", "partial_credit"],
      "properties": {
        "path_weights": {"type": "array", "items": {"type": "object", "required": ["path_id", "criterion_points"], "properties": {"path_id": {"$ref": "#/$defs/id"}, "criterion_points": {"type": "object", "additionalProperties": {"type": "number", "minimum": 0}}}, "additionalProperties": false}},
        "partial_credit": {"type": "object", "required": ["method", "rounding"], "properties": {"method": {"const": "weighted_expectation_ratio"}, "rounding": {"const": "nearest_integer"}}, "additionalProperties": false}
      }, "additionalProperties": false
    },
    "charge": {"type": "object", "required": ["id", "person_id", "conduct_event_ids", "legal_basis_ids", "charge_element_ids"], "properties": {"id": {"$ref": "#/$defs/id"}, "person_id": {"$ref": "#/$defs/id"}, "conduct_event_ids": {"$ref": "#/$defs/ids"}, "legal_basis_ids": {"$ref": "#/$defs/ids"}, "charge_element_ids": {"$ref": "#/$defs/ids"}}, "additionalProperties": true},
    "charge_element": {"type": "object", "required": ["id", "charge_id", "element_type", "required", "legal_basis_ids"], "properties": {"id": {"$ref": "#/$defs/id"}, "charge_id": {"$ref": "#/$defs/id"}, "element_type": {"enum": ["protected_interest", "conduct", "result", "causation", "subject", "mental_state", "circumstance", "other"]}, "required": {"type": "boolean"}, "legal_basis_ids": {"$ref": "#/$defs/ids"}}, "additionalProperties": true},
    "circumstance": {"type": "object", "required": ["id", "category", "person_id", "conduct_event_ids", "legal_basis_ids", "review_status"], "properties": {"id": {"$ref": "#/$defs/id"}, "category": {"enum": ["aggravating", "mitigating", "other"]}, "person_id": {"$ref": "#/$defs/id"}, "conduct_event_ids": {"$ref": "#/$defs/ids"}, "legal_basis_ids": {"$ref": "#/$defs/ids"}, "review_status": {"enum": ["not_reviewed", "in_review", "approved"]}}, "additionalProperties": true},
    "age_rule": {"type": "object", "required": ["id", "candidate_charge_ids", "conduct_event_ids", "law_bundle_ids", "legal_basis_ids", "conditions", "review_status"], "properties": {"id": {"$ref": "#/$defs/id"}, "candidate_charge_ids": {"$ref": "#/$defs/ids"}, "conduct_event_ids": {"$ref": "#/$defs/ids"}, "law_bundle_ids": {"$ref": "#/$defs/ids"}, "legal_basis_ids": {"$ref": "#/$defs/ids"}, "conditions": {"type": "array", "items": {"type": "object", "required": ["min_age_years", "max_age_years", "applies_to_charge_ids", "effect_code", "legal_basis_ids", "review_id"], "properties": {"min_age_years": {"type": "integer", "minimum": 0}, "max_age_years": {"type": "integer", "minimum": 0}, "applies_to_charge_ids": {"$ref": "#/$defs/ids"}, "effect_code": {"type": "string"}, "legal_basis_ids": {"$ref": "#/$defs/ids"}, "review_id": {"$ref": "#/$defs/id"}}, "additionalProperties": false}}, "review_status": {"enum": ["not_reviewed", "in_review", "approved"]}}, "additionalProperties": false},
    "proof_row": {"type": "object", "required": ["id", "proposition", "charge_element_ids", "evidence_links"], "properties": {"id": {"$ref": "#/$defs/id"}, "proposition": {"type": "string"}, "charge_element_ids": {"$ref": "#/$defs/ids"}, "evidence_links": {"type": "array"}}, "additionalProperties": true}
  }
}
~~~

### 8.5 Cross-reference linter và release gates

JSON Schema không thể kiểm tra liên thực thể, logic hoặc phép cộng điểm. Linter build phải kiểm tra:

- ID duy nhất; mọi source/evidence/fact/element/field/option/explanation/outcome/legal-basis ID tồn tại.
- Expected response field/target có scope hợp lệ; accepted values thuộc options của field.
- Answer path có biểu thức hợp lệ; paths không chồng lấn với kết luận khác nhau; mọi đáp án thay thế là path riêng. Field chọn charge dùng single-choice cho mỗi cặp person/conduct để không thể chọn đồng thời hai định danh loại trừ nhau.
- Consistency rules chạy trước path matching, có scope/reference hợp lệ; tổ hợp vi phạm rule blocking không được chấm. DSL chỉ cho all/any và equals/not_equals/contains/not_contains/is_empty/is_not_empty trên field đã khai báo; không nạp code từ JSON.
- Mỗi `answer_path.id` phải có đúng một `scoring.path_weights.path_id` trùng ID; tổng điểm criterion theo từng path phải bằng 100. Với mỗi path, mọi criterion có điểm dương phải có expectation áp dụng (`path_ids` chứa path đó); criterion không có expectation không được tính điểm. Expectation chỉ thuộc một criterion và mọi expectation phải được gán path hợp lệ.
- Điểm mỗi criterion = điểm tối đa của criterion trên path × tổng weight của expectation đạt / tổng weight expectation áp dụng cho criterion/path; nếu không đạt expectation nào thì 0. Với lựa chọn nhiều mục, mỗi expectation kiểm tra đúng tập giá trị được chấp nhận cho target; điểm lẻ được làm tròn một lần sau khi cộng các criterion theo quy tắc nearest integer. Feedback chỉ giải thích kết quả, không quyết định điểm.
- Mỗi criterion trỏ tới learning outcomes và answer fields đã khai báo; mọi outcome của case được đo bởi criterion.
- Mỗi charge có elements/căn cứ/người/event; path charge/conclusion khớp element bắt buộc. Circumstance/age rule gắn charge, person, event, law bundle.
- Date interval có thứ tự và nguồn. Law resolution unresolved, effective interval không phù hợp, hoặc khoảng ngày cắt qua phiên bản mà chưa có path/review thì chặn publish.
- Case published phải approved, không còn placeholder/TBD/blocking notes; law versions, procedural-defect outcomes, age rules và accepted paths có review history.


## 9. UX và màn hình

| Màn hình | Thành phần chính | Hành động chính |
|---|---|---|
| Trang chủ | Mục tiêu học tập, danh sách case, tiến độ | Bắt đầu/tiếp tục case |
| Brief | Bối cảnh, vai trò mô phỏng, cảnh báo, câu hỏi | Mở hồ sơ |
| Hồ sơ | Mốc thời gian, nhân vật, tài liệu ban đầu | Chọn nội dung cần xem |
| Khám phá | Địa điểm/thao tác, trạng thái nhánh | Thực hiện kiểm tra/đọc tài liệu |
| Bảng chứng cứ | Thẻ chứng cứ, bộ lọc theo issue, nguồn và giới hạn | Đánh giá, liên kết, ghi chú |
| Giả thuyết | Các giả thuyết, evidence links, thông tin còn thiếu | So sánh giả thuyết |
| Phân tích | Câu hỏi issue/dấu hiệu, căn cứ luật được cung cấp | Trả lời từng vấn đề |
| Kết luận | Chọn kết luận, căn cứ, giải thích ngắn, mức chắc chắn | Nộp bài |
| Phản hồi | Tổng điểm, kết quả từng tiêu chí, đáp án thay thế, lý do | Xem lại hoặc hoàn thành |
| Sổ tay | Thuật ngữ, điều khoản/nguồn đã được case tham chiếu | Tra cứu trong phiên |

UX bắt buộc:

- Có nút quay lại hồ sơ ở mọi giai đoạn; thao tác quay lại không mất câu trả lời.
- Hiển thị trạng thái đã xem/chưa xem và tiến độ, không dùng tiến độ để buộc thu thập mọi item.
- Cảnh báo trước khi nộp nếu còn issue trọng tâm chưa trả lời.
- Hỗ trợ lưu nháp tự động và xác nhận trước khi xóa/reset.
- Phản hồi giải thích theo “dữ kiện → suy luận → dấu hiệu → căn cứ”, tách rõ điều người chơi làm tốt và phần cần xem lại.
- Nội dung trên điện thoại không phụ thuộc hover, drag-and-drop hoặc chữ quá nhỏ.

## 10. Kiểm thử và QA

### 10.1 Các lớp kiểm thử

1. **Schema/content tests:** JSON hợp lệ, enum, trường bắt buộc, ID duy nhất, tham chiếu chéo, version và status.
2. **Unit tests:** unlock engine, reducer, answer matcher, path consistency, weighted scoring, age interval calculation, legal-version resolver, persistence migration.
3. **Integration tests:** một phiên chơi từ brief tới feedback; lưu rồi tải lại; nộp với nội dung chưa xem; nhánh mở khóa.
4. **Content QA:** người rà soát độc lập chơi case mà không xem đáp án; thử các đáp án cạnh tranh; kiểm tra gợi ý không tiết lộ quá sớm.
5. **Usability pilot:** 5–10 người học phù hợp với đối tượng; phỏng vấn ngắn về điểm khó, độ rõ và phản hồi. Đây là quy mô pilot, không phải bằng chứng thống kê đại diện.
6. **Compatibility/accessibility:** Chrome, Safari, màn hình điện thoại; keyboard navigation, focus, nhãn form, tương phản và zoom.

### 10.2 Bộ ca kiểm thử chấm điểm tối thiểu

- Đáp án và lập luận đều đủ: đạt đầy đủ tiêu chí liên quan.
- Chọn đúng kết luận nhưng không viện dẫn dữ kiện: chỉ đạt điểm kết quả cấu hình, không đạt điểm suy luận.
- Lập luận đúng nhưng nhãn kết luận sai: giữ điểm phần lập luận/dấu hiệu đúng.
- Chọn một path thay thế đã duyệt và đủ điều kiện: được tính theo expectations và điểm của path đó.
- Tổ hợp gần với path nhưng thiếu điều kiện: không khớp path; feedback nêu rõ dữ kiện/điều kiện cần xem lại.
- Không đủ thông tin và người chơi chọn “chưa đủ”: được chấp nhận khi case định nghĩa đáp án này.
- Dựa vào chứng cứ có giới hạn nhưng nêu giới hạn: phân biệt với trường hợp coi chứng cứ là chắc chắn.
- Chọn candidate charge trong khi một dấu hiệu cấu thành bắt buộc được đánh giá là chưa được hỗ trợ: consistency rule chặn kết quả và chỉ rõ câu trả lời mâu thuẫn.
- Ghép hai câu trả lời loại trừ nhau ở các issue liên quan: consistency rule chặn trước khi tìm path, không chốt điểm tổng.
- Chọn một trong hai định danh gần nhau: engine so sánh các constituent elements và chỉ chấp nhận đường đáp án có đủ dấu hiệu phân biệt đã được duyệt.
- Ngày sinh hoặc ngày hành vi chỉ biết theo khoảng: engine trả age range/unknown; không tự chọn một tuổi hoặc áp quy tắc pháp lý.
- Mỗi path có đủ expectation cho mọi criterion điểm dương; tổng điểm tối đa đúng 100 và điểm phần lẻ được làm tròn một lần sau khi cộng criterion.
- Trả lời thiếu một expectation trong criterion: nhận đúng tỷ lệ điểm theo weight; trả lời đầy đủ expectation trong path khác vẫn có thể đạt đủ 100.
- Mảng multi-select được so bằng tập giá trị chấp nhận cho từng target, không được coi là khớp chỉ vì chứa một option đúng.
- Conduct interval cắt qua effective boundary của hai phiên bản: linter chặn publish hoặc yêu cầu path/version review riêng.
- Tuổi nằm trong khoảng quanh một mốc reviewer khai báo, hoặc ngày sinh/ngày hành vi chưa rõ: engine trả range/unknown và không áp một điều kiện tuổi.
- Dữ liệu lưu sai phiên bản: khôi phục có cảnh báo hoặc giữ bản cũ, không tự ghi đè.

### 10.3 Chỉ số học tập MVP

- Tỷ lệ hoàn thành case và thời lượng trung vị.
- Điểm rubric theo năng lực, không chỉ tổng điểm.
- Tỷ lệ phát hiện chứng cứ mâu thuẫn/giới hạn.
- Tỷ lệ trả lời đúng sau feedback hoặc lượt làm lại (nếu triển khai).
- Các mục người học đánh dấu “chưa rõ”.

Không đặt trước tỷ lệ đúng theo cấp như chỉ tiêu chất lượng cố định. Pilot đầu tiên dùng để xác định mức khó; điểm thấp có thể do case, hướng dẫn hoặc rubric chưa rõ.

## 11. Rủi ro và giảm thiểu

| Rủi ro | Tác động | Kiểm soát |
|---|---|---|
| Luật hoặc nội dung diễn giải sai/lỗi thời | Người học tiếp thu sai | Phiên bản luật, nguồn truy nguyên, rà soát chuyên môn, chặn publish khi chưa approved |
| Có nhiều kết luận hợp lý | Chấm thiếu công bằng | Accepted answers, điều kiện thay thế, reviewer thử phản biện, rubric theo lập luận |
| Trộn lẫn vai trò/giai đoạn | Tạo hiểu sai về thủ tục | Một vai trò MVP rõ, gắn boundary cho từng case, rà soát thuật ngữ tố tụng |
| Chứng cứ bị đơn giản hóa thành đúng/sai | Kết luận sai về giá trị chứng cứ | Tách nguồn, giới hạn, liên quan, độ tin cậy và vấn đề hợp pháp; không dùng boolean kết luận |
| Scope creep 8–10 case ngay MVP | Chất lượng nội dung thấp, timeline trễ | Chốt một case end-to-end; thêm case chỉ sau khi pipeline và pilot hoạt động |
| Chấm hình phạt bằng một con số | Truyền tải sai rằng chỉ có một kết quả | Loại mức án số khỏi MVP; chấm căn cứ/khung khi được duyệt |
| Lưu tiến độ cục bộ mất dữ liệu | Trải nghiệm gián đoạn | Autosave, version key, import/export hoặc reset rõ ràng, migration có kiểm soát |
| Nội dung nhạy cảm hoặc giống vụ án thật | Gây tổn hại/quyền riêng tư | Hư cấu hóa, tối thiểu hóa chi tiết, content warning, không dùng dữ liệu thật chưa được phép |
| Dữ liệu JSON sai | Case lỗi khi chơi | JSON Schema, cross-reference lint, build gate, content preview |

## 12. Roadmap MVP và tiêu chí nghiệm thu

Giả định nhóm nhỏ 2–4 người có một người phụ trách nội dung và tiếp cận được người rà soát chuyên môn. Các mốc là ước tính theo tuần (tổng 8–9 tuần, chưa tính thời gian chờ reviewer ngoài nhóm); nếu review pháp lý chưa sẵn sàng, lùi phát hành nội dung thay vì bỏ gate.

### Mốc 0 — Chốt thiết kế và nội dung (Tuần 1)

**Công việc:** Chốt mục tiêu học tập đầu tiên, vai trò mô phỏng, cấu trúc một case, case brief, schema version 2.0.0, scoring rubric, style guide và checklist review. Chọn tình huống hư cấu có độ phức tạp thấp; chưa chọn chủ đề theo danh sách 24 case nếu chưa có reviewer.

**Tiêu chí nghiệm thu:**

- Một trang brief được người học hiểu mà không cần giải thích ngoài game.
- Bảy learning outcomes trong mục 2.3 đều có ID và ánh xạ đến criterion thực tế trong schema; linter kiểm tra coverage hai chiều từ outcome tới expectation.
- Schema cấp cao được chốt; mọi trường pháp lý có owner và trạng thái review.
- Có danh sách nội dung cần reviewer pháp lý xác nhận; không có nội dung chưa kiểm chứng được trình bày như kết luận hiện hành.

### Mốc 1 — Dựng vertical slice (Tuần 2)

**Công việc:** Tạo app React/TypeScript, navigation, brief, hồ sơ, danh sách chứng cứ, bảng giả thuyết, form phân tích, nộp và feedback bằng một case mẫu có dữ liệu placeholder.

**Tiêu chí nghiệm thu:**

- Người chơi hoàn thành luồng từ đầu tới cuối bằng chuột và bàn phím.
- Quay lại màn hình trước không mất câu trả lời.
- UI không phụ thuộc backend.
- Nội dung placeholder có banner/blocking marker và không thể xuất bản như case đã duyệt.

### Mốc 2 — Engines và data validation (Tuần 3–5)

**Công việc:** Chia thành ba lát nhỏ: (a) registry answer và session state; (b) evidence/hypothesis/proof, age range và legal-version resolution; (c) consistency DSL, path matching, rubric scoring, linter tổng hợp, persistence. Không đưa legal conclusions chưa review vào bản phát hành.

**Tiêu chí nghiệm thu:**

- Build thất bại với dữ liệu thiếu ID, tham chiếu sai, path thiếu expectation, tổng điểm path khác 100, mâu thuẫn blocking, law interval chưa phân giải hoặc case chưa được duyệt trong danh sách publish.
- Nộp được khi đã bỏ qua item không bắt buộc; feedback nêu giới hạn hồ sơ.
- Các tình huống scoring tối thiểu ở mục 10.2 được bao phủ bởi test cases.
- Lưu/tải phiên giữ nguyên `caseVersion`, phiên bản luật đã phân giải theo từng conduct event, tuổi dạng khoảng và phiên bản schema.

### Mốc 3 — Nội dung đầu tiên được review và pilot (Tuần 6–7)

**Công việc:** Hoàn thiện một case, review pháp lý, review sư phạm, kiểm thử đáp án cạnh tranh, chơi thử với nhóm người học, chỉnh độ khó và phản hồi.

**Tiêu chí nghiệm thu:**

- Case có `review_status: approved`, nguồn luật và phiên bản được xác định bởi reviewer; không có `blocking_notes`.
- Ít nhất một reviewer độc lập xác nhận rubric, phản hồi và đáp án thay thế.
- Pilot không phát hiện lỗi chặn tiến trình; mọi nhận xét về nội dung được ghi nhận và xử lý.
- Người chơi hiểu thông báo phạm vi mô phỏng và biết lý do điểm được trao/trừ.

### Mốc 4 — Phát hành MVP (Tuần 8–9)

**Công việc:** Hoàn thiện responsive/accessibility pass, nội dung sổ tay, trang thông tin giáo dục, telemetry tối thiểu hoặc không telemetry theo quyết định nhóm, build và deploy static.

**Tiêu chí nghiệm thu:**

- Một case đã duyệt chơi được từ đầu đến cuối trên desktop và mobile.
- Không có lỗi blocking trong schema/content/logic; kết quả và tiến độ được lưu cục bộ.
- Có cách xóa dữ liệu cục bộ và thông tin giới hạn của sản phẩm.
- Có release notes ghi phiên bản app, case và law bundle.

**Sau MVP:** Mở rộng từng case qua cùng pipeline. Chỉ cân nhắc backend, dashboard lớp học, chat hoặc chấm tự do khi có nhu cầu người dùng được chứng minh và quy trình riêng cho quyền riêng tư, an toàn và kiểm duyệt nội dung.

## 13. Practical first-case template

Đây là mẫu làm việc để tác giả nội dung bắt đầu case đầu tiên. Điền trước bằng tình huống hư cấu, sau đó gửi phần pháp lý cho người rà soát. Không phát hành đến khi các trường `TBD` đã được xử lý.

### 13.1 One-page case brief

- **Case ID/version:** `case_001 / 0.1.0`
- **Mục tiêu học tập chính:** `[Ví dụ: phân biệt dữ kiện được ghi nhận với suy luận từ dữ kiện]`
- **Đối tượng/độ khó:** `[Người học mới / nhập môn]`
- **Vai trò mô phỏng:** `[Học viên phân tích hồ sơ]`
- **Câu hỏi trung tâm:** `[Một câu hỏi có thể trả lời dựa trên hồ sơ]`
- **Phạm vi pháp lý cần reviewer xác định:** `[Danh mục văn bản/điều khoản do reviewer điền]`
- **Thời điểm pháp luật áp dụng:** `TBD — reviewer phải xác nhận hoặc để case không xuất bản`
- **Sự kiện nền (3–5):** `[Chỉ dữ kiện có nguồn trong kịch bản]`
- **Giả thuyết cạnh tranh (tối thiểu 2):** `[H1]`, `[H2]`; mô tả trung tính
- **Chứng cứ (4–6):** `[2 hỗ trợ, 1 phản bác/mâu thuẫn, 1 giới hạn/nhiễu, tùy case]`
- **Dữ kiện cần thu thập thêm:** `[Một điểm chưa được chứng minh]`
- **Issue pháp lý:** `[Reviewer xác định dấu hiệu và căn cứ; không tự suy diễn]`
- **Kết luận được chấp nhận:** `[Các kết luận và điều kiện; có lựa chọn chưa đủ dữ kiện nếu phù hợp]`
- **Lỗi học tập cần phản hồi:** `[Ví dụ: đồng nhất lời khai với sự kiện chắc chắn]`
- **Nội dung nhạy cảm/quyền riêng tư:** `[Không dùng người thật; mô tả tối giản]`
- **Review:** Tác giả `[TBD]`; chuyên môn pháp lý `[TBD]`; sư phạm `[TBD]`; ngày `[TBD]`

### 13.2 First-case authoring workflow

1. Viết câu hỏi học tập và tiêu chí thành công trước khi viết cốt truyện.
2. Viết sự kiện hư cấu, ghi rõ nguồn nào hỗ trợ mỗi sự kiện.
3. Tạo ít nhất hai giả thuyết và chủ động thêm dữ kiện có khả năng phản bác giả thuyết hấp dẫn nhất.
4. Viết chứng cứ với nguồn, thời điểm, cách xuất hiện và giới hạn suy luận.
5. Mời reviewer pháp lý xác định issues, căn cứ, cách dùng thuật ngữ, đáp án và điều kiện chấp nhận.
6. Thiết kế rubric có điểm cho suy luận một phần; không dùng một chuỗi `correct_answer` đơn lẻ.
7. Tác giả khác thử giải case mà không xem đáp án, rồi ghi các cách hiểu khác nhau.
8. Cập nhật JSON, chạy validator, kiểm tra UX và pilot với người học.
9. Chỉ chuyển status sang `approved`/`published` theo quy trình nội bộ sau khi reviewer ký xác nhận.

## 14. Definition of Done cho case

Một case sẵn sàng phát hành khi tất cả điều kiện sau được thỏa mãn:

- Có mục tiêu học tập đo được và luồng tương tác tương ứng.
- Vai trò mô phỏng, câu hỏi trung tâm và ranh giới pháp lý rõ.
- Sự kiện, chứng cứ, nguồn, giới hạn và giả thuyết được tách riêng.
- Có đáp án chính và mọi đáp án thay thế hợp lý đã biết, với điều kiện chấp nhận/từ chối.
- Rubric chấm phần lập luận, dấu hiệu và kết luận; gợi ý không tiết lộ đáp án quá sớm.
- Mọi căn cứ luật được định danh bằng ID trong law bundle đã version hóa và được reviewer xác nhận.
- Nội dung vượt qua schema, cross-reference và content QA.
- Reviewer pháp lý và reviewer học tập ghi tên/ngày/trạng thái; không còn blocking notes.
- Không có dữ liệu người thật chưa được phép; nội dung nhạy cảm đã tối giản và có cảnh báo khi cần.
- Case chơi được trên màn hình điện thoại và có phản hồi giải thích người học cần làm gì tiếp theo.

## 15. Những quyết định còn mở cho nhóm dự án

Các mục này không cản việc bắt đầu vertical slice, nhưng phải được chốt trước khi phát hành MVP:

1. Ai sẽ đảm nhiệm rà soát pháp lý và phạm vi chuyên môn của họ?
2. Case đầu tiên tập trung vào năng lực nào và reviewer xác định nguồn pháp luật nào liên quan?
3. Có cần lưu ghi chú tự do người chơi hay chỉ dùng lựa chọn cấu trúc trong pilot?
4. Nhóm có muốn cho phép xuất/nhập tiến độ JSON trong MVP hay chỉ lưu cục bộ?
5. Hosting static và chính sách cập nhật nội dung sẽ do ai vận hành?

