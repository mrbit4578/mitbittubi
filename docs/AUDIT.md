# Audit và Kaizen ESG Hub

## Tài liệu đã kiểm tra

ZIP cung cấp 39 mục (641.766 byte giải nén), gồm frontend React/Vite, Convex backend, lớp Type auth, metadata triển khai, lockfile và bản build `dist`. Đã đọc mã nguồn và cấu hình; các tệp sinh tự động được kiểm kê, phân biệt với nguồn cần duy trì. [Inventory](archive-inventory.json) ghi kích thước và SHA-256 của từng tệp để truy nguồn.

PDF `2024_eclat_ESG-Report_en.pdf` đính kèm vượt giới hạn chuyển file 32 MiB. Sau khi người dùng cung cấp URL công khai và quyền mạng được cấp, đã tải bản 39.637.351 byte, 85 trang PDF để đối chiếu các chương/bảng/phụ lục được dẫn. [Mẫu bám Eclat](#report-example) có nguồn, số trang, đơn vị và phạm vi; [source register trên GitHub](https://github.com/mrbit4578/mitbittubi/blob/main/docs/eclat-source-register.json) ghi hash và các chỉ tiêu. Không dùng số liệu Eclat làm dữ liệu của doanh nghiệp khác. Việc đọc PDF không tái xác minh dữ liệu vận hành hoặc assurance của Eclat.

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

- Mẫu Eclat đã có đối chiếu trang/kỳ/phạm vi; trước dùng benchmark cần làm rõ ngoại lệ nguồn và tính phù hợp ngành/cơ sở. Chứng thư xác minh KNK riêng và hồ sơ vận hành chưa được thẩm tra.
- Thẩm định sổ pháp luật và yêu cầu nhãn hàng bằng nguồn chính thức hiện hành; thiết lập người chịu trách nhiệm và lịch cập nhật.
- Mở rộng GHG: registry hệ số theo địa lý/năm/phiên bản, quy đổi đơn vị và các category Scope 3. Phiên bản hiện tại đã có cơ sở và tách phương pháp Scope 2 địa điểm/thị trường. Không cộng cả hai phương pháp Scope 2 vào một tổng.
- Xác lập quy trình thẩm định báo cáo, GRI content index, so sánh năm cơ sở, restatement, disclosure và assurance phù hợp tổ chức. Công cụ không tự tạo chứng nhận “đúng chuẩn”.
- Thiết lập retention, backup/restore đã diễn tập, scan tệp, SSO/MFA, quyền theo phòng ban/cơ sở và kiểm soát dữ liệu nhạy cảm khi mở rộng.
- CAPA cần đánh giá hiệu lực độc lập và nguồn bằng chứng; chủ đề trọng yếu cần chi tiết tác động, đối tượng và phương pháp được tổ chức phê duyệt.

Xem `VALIDATION.md` để biết kiểm tra nào thực sự đã chạy. Các mục production phụ thuộc project thật không được gọi là đã nghiệm thu khi chưa cấu hình.

## Bổ sung khả năng sử dụng — 08/10/2026

Audit dự án được hiển thị tại [Audit & Kaizen](#project-audit), có mục lục và tải Markdown/HTML hoặc in PDF. Mục [Nhật ký thay đổi](#audit) vẫn ghi thao tác dữ liệu và có lối dẫn sang báo cáo audit.

Đã bổ sung [khung 19 phần](#report-kit), [mẫu giả định 20 chương](#report-example) và [sơ đồ thao tác theo vai trò](#guide). Khung có danh mục 30 disclosures GRI 2 và 3 disclosures GRI 3 để kiểm nội dung; việc cung cấp danh mục không xác nhận tuân thủ. Mẫu có bảng tháng, công thức, nguồn giả định và các hạn chế, không nhập vào dữ liệu doanh nghiệp.

## Đối chiếu báo cáo Eclat 2024

Đã bổ sung mẫu tiếng Việt 21 phần và 25 KPI có số trang nguồn. Mẫu giả định riêng dùng để luyện nhập liệu; không tạo dữ liệu tháng Eclat từ số tổng năm. Khung ESG Hub cũng không chuyển tuyên bố GRI hoặc assurance của Eclat thành chứng nhận cho ứng dụng/doanh nghiệp khác.

Các điểm cần làm rõ trong tài liệu, đã kiểm ảnh trang khi cần:

| Mã | Điểm cần làm rõ | Trang in / PDF | Cách ghi nhận |
| --- | --- | --- | --- |
| SRC-01 | Tr.148 dòng chất thải khối may là 10.329.559 kg; tr.12/tr.150 cho 4.029.218 kg | 12,148,150 / 7,75,76 | Giữ cả giá trị nguồn và yêu cầu đối chiếu, không tự sửa |
| SRC-02 | Thuyết minh khoảng 365.369 giờ đào tạo; biểu đồ vùng cộng 395.053,74 giờ | 57–58 / 29–30 | Chưa tính bình quân từ tổng chưa khớp |
| SRC-03 | Scope 1 tr.136 là 31.029,99 tCO2e; bảng loại khí tr.138 tổng 30.999,99 | 136,138,161 / 69,70,81 | Làm rõ phạm vi/khí/số gốc |
| SRC-04 | Tổng nước 2.685.208 m³; cộng trụ sở + hai khối được 2.713.122; khối vải có tái dùng | 143–144,167 / 72–73,84 | Chốt định nghĩa nước lấy/sử dụng/tiêu thụ trước tổng hợp |
| SRC-05 | Overview năng lượng ghi đơn vị ton CO2e; chi tiết là kJ | 11,140–141 / 6,71 | Dùng đơn vị chi tiết, quy đổi GJ có dấu phép tính |
| SRC-06 | Cộng 8 dòng giảm phát thải dự án 6.125,96; Total ghi 4.974,15 tCO2e/năm | 142 / 72 | Làm rõ chồng lấn/phạm vi, không trừ dự án khỏi gross inventory |

Đây là kiểm tra nhất quán tài liệu công bố, không kết luận nguyên nhân hoặc sai phạm của Eclat. Ngoài ra, cường độ may tính từ tổng tr.136 xấp xỉ 3,86, khác 3,85 hiển thị; một số chỉ mục trang cần kiểm tra lại. Mẫu tham chiếu nêu đầy đủ giới hạn.

Thư EY tr.164–167 là limited assurance cho thông tin được chọn (tuyển/nghỉ, đa dạng nhân sự, nước trong phụ lục), không phải toàn bộ báo cáo. Mô tả SGS về kiểm kê KNK ở tr.137/160–161 là lớp xác minh khác; chứng thư riêng chưa tải và thẩm tra. Không nhập các kết luận đảm bảo này vào báo cáo doanh nghiệp khác.
