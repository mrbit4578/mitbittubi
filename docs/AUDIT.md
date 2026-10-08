# Audit và Kaizen ESG Hub

## Tài liệu đã kiểm tra

ZIP cung cấp 39 mục (641.766 byte giải nén), gồm frontend React/Vite, Convex backend, lớp Type auth, metadata triển khai, lockfile và bản build `dist`. Đã đọc mã nguồn và cấu hình; các tệp sinh tự động được kiểm kê, phân biệt với nguồn cần duy trì. [Inventory](archive-inventory.json) ghi kích thước và SHA-256 của từng tệp để truy nguồn.

PDF `2024_eclat_ESG-Report_en.pdf` không tải được vì lớn hơn giới hạn chuyển file 32 MiB. **Chưa đối chiếu báo cáo Eclat.** Mọi benchmark hoặc dẫn chiếu Eclat có trong ZIP không được coi là đã xác minh với PDF. Không dùng chúng làm số liệu doanh nghiệp.

## Phát hiện nguyên bản và biện pháp

| Ưu tiên | Phát hiện nguyên bản | Kaizen trong mã mới |
| --- | --- | --- |
| P0 | `typeAuth.tsx` đòi host Type; frontend Vercel không đăng nhập được | Thay bằng runtime độc lập; sandbox và Supabase được phân biệt rõ |
| P0 | Backend không có tenant doanh nghiệp, chỉ có write capability toàn app | Membership và vai trò theo workspace; RLS và RPC kiểm quyền phía server |
| P0 | `locked` là checkbox; CRUD vẫn sửa/xóa/thêm/import vào kỳ đã khóa | Kỳ authoritative, kiểm khóa trong mọi write và nhật ký mở lại |
| P0 | Người lập/kiểm/duyệt chỉ là tên text tùy nhập | Danh tính tài khoản, review workflow, không tự duyệt trong cloud |
| P1 | Báo cáo cộng cả tỷ lệ/cường độ, các đơn vị khác nhau và dữ liệu chưa duyệt | KPI aggregation, weighted ratio, kiểm unit, chỉ tổng hợp official từ approved+locked |
| P1 | Excel sai số thành 0, enum sai thành lựa chọn đầu (đôi khi “Đã có”) | Coercion nghiêm ngặt, lỗi theo dòng/cột, preview trước ghi, giới hạn batch atomic |
| P1 | Import lặp làm tăng bản ghi và số liệu | Khóa nghiệp vụ/chống trùng và version khi sửa |
| P1 | `RecordForm` giữ dữ liệu A khi chuyển sang sửa B | Reset/key form theo entity và ID |
| P1 | GHG làm tròn từng dòng, nhận `tco2e` từ client, cộng mọi năm | Server tính lại, giữ precision, lọc kỳ trước tổng |
| P1 | Báo cáo snapshot là dữ liệu live, trạng thái tự chọn | Kiểm quyền và quality gates, lưu dataset/version khi duyệt/phát hành |
| P1 | Mã bằng chứng không có tài liệu/registry thật | Sổ bằng chứng, metadata/checksum, private storage, kiểm liên kết khi duyệt |
| P1 | “Xuất toàn bộ” bỏ dataRecords, knowledge, questions và nhiều trường | Xuất đủ entity; JSON backup tách khỏi báo cáo Excel |
| P1 | Backend `.take(2000)` làm thiếu dữ liệu âm thầm | Runtime nạp đầy đủ theo phân trang; SQL tổng hợp/khóa toàn kỳ |
| P2 | Desktop bị `.app-shell` giới hạn 640px/xếp cột | Responsive shell; kiểm viewport desktop/mobile |
| P2 | Khái niệm GRI, Net Zero, benchmark/pháp luật thiếu xác minh | Sửa hướng dẫn có thể gây hiểu nhầm, ghi nguồn và trạng thái tham khảo |

Các ví dụ sai đã tái hiện khi audit: cường độ `100/100` và `900/300` không cộng thành 4; tỷ lệ tổng đúng theo mẫu số là 2,5. Hai nghìn dòng `1 × 0,4 kgCO2e` phải cho 0,8 tCO2e, không làm tròn từng dòng thành 0.

## Hành trình sản phẩm

1. Học khái niệm và phương pháp từ thư viện có nguồn.
2. Tự đánh giá sẵn sàng và xác định trách nhiệm, phạm vi/cơ sở.
3. Chọn chủ đề trọng yếu, từ điển KPI và nghĩa vụ áp dụng.
4. Giao nhiệm vụ, thực hiện hoạt động và quản lý CAPA.
5. Đăng ký bằng chứng; nhập dữ liệu đo/ước tính/thiếu/không áp dụng.
6. Kiểm và duyệt độc lập, xử lý thiếu/sai, khóa kỳ.
7. Tổng hợp đúng phương pháp, lưu snapshot, xuất báo cáo có truy xuất.

## Kaizen cần tiếp tục sau phiên bản này

- Đối chiếu PDF Eclat sau khi có bản tải được hoặc văn bản trích xuất; ghi trang, kỳ, ranh giới và phương pháp cho từng benchmark.
- Thẩm định sổ pháp luật và yêu cầu nhãn hàng bằng nguồn chính thức hiện hành; thiết lập người chịu trách nhiệm và lịch cập nhật.
- Mở rộng GHG: registry hệ số theo địa lý/năm/phiên bản, quy đổi đơn vị và các category Scope 3. Phiên bản hiện tại đã có cơ sở và tách phương pháp Scope 2 địa điểm/thị trường. Không cộng cả hai phương pháp Scope 2 vào một tổng.
- Xác lập quy trình thẩm định báo cáo, GRI content index, so sánh năm cơ sở, restatement, disclosure và assurance phù hợp tổ chức. Công cụ không tự tạo chứng nhận “đúng chuẩn”.
- Thiết lập retention, backup/restore đã diễn tập, scan tệp, SSO/MFA, quyền theo phòng ban/cơ sở và kiểm soát dữ liệu nhạy cảm khi mở rộng.
- CAPA cần đánh giá hiệu lực độc lập và nguồn bằng chứng; chủ đề trọng yếu cần chi tiết tác động, đối tượng và phương pháp được tổ chức phê duyệt.

Xem `VALIDATION.md` để biết kiểm tra nào thực sự đã chạy. Các mục production phụ thuộc project thật không được gọi là đã nghiệm thu khi chưa cấu hình.
