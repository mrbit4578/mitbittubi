# Hướng dẫn thao tác ESG Hub

Tài liệu hướng dẫn theo vai trò; số minh họa không phải dữ liệu thật hoặc Eclat. Chọn vai trò trong hướng dẫn không thay đổi quyền tài khoản.

## Sơ đồ tư duy

- **Hiểu ESG**: Học hỏi & tìm kiếm → Hỏi đáp → Đánh giá sẵn sàng. Đọc kiến thức nền, hỏi nội bộ và tự đánh giá mức sẵn sàng. Đầu ra: danh sách khoảng trống và người phụ trách.
- **Xây hệ thống**: Chủ đề trọng yếu → Thu thập dữ liệu → Từ điển KPI → Lộ trình & giao việc. Ban ESG xác định pháp nhân/cơ sở, chủ đề trọng yếu và nghĩa vụ. Chủ dữ liệu chốt mã KPI, đơn vị, phương pháp, tần suất và bằng chứng; giao việc theo bộ phận.
- **Ghi nhận**: Sổ bằng chứng → Thu thập dữ liệu → Kiểm kê KNK. Đăng ký nguồn trước, nhập bản ghi theo kỳ/cơ sở/KPI/nguồn, kiểm đơn vị và trạng thái. KNK cần hoạt động × hệ số đúng đơn vị; sổ hệ số phải được EHS kiểm tra ngoài ứng dụng.
- **Soát xét & khóa**: Thu thập dữ liệu → Bản ghi → Khóa kỳ đã duyệt → Nhật ký thay đổi. Người soát xét đối chiếu tài liệu nguồn, ghi kết quả rồi duyệt hoặc trả sửa. Khi dữ liệu đủ điều kiện mới khóa kỳ có lý do. Trong cloud, người nhập không tự duyệt.
- **Báo cáo**: Khung báo cáo ESG → Báo cáo tham chiếu → Báo cáo. Dùng khung nội dung và mẫu tham chiếu để biên soạn. Màn Báo cáo chốt số liệu đã duyệt/khóa; các chương thuyết minh, chỉ mục và phê duyệt nội dung cần doanh nghiệp hoàn thiện.
- **Kaizen**: CAPA & yêu cầu → Audit & Kaizen → Nhật ký thay đổi. Ghi phát hiện, nguyên nhân gốc, hành động, người phụ trách và hạn. Người khác kiểm hiệu lực và bằng chứng trước khi đóng. Nếu sửa dữ liệu sau phát hành, giữ bản cũ và phát hành phiên bản thay thế.

## Lưu trình

1. Chuẩn bị tài khoản và phạm vi
2. Chốt chủ đề, KPI và giao việc
3. Đăng ký bằng chứng
4. Nhập và tự kiểm dữ liệu
5. Soát xét độc lập
6. Khóa kỳ đủ điều kiện
7. Biên soạn, chốt và phát hành
8. Kaizen và hiệu chỉnh có truy xuất

Không đạt khi soát xét → trả sửa về bước 4 → duyệt lại. Sửa sau khóa/phát hành → ghi lý do mở kỳ → sửa → duyệt/khóa lại → báo cáo phiên bản mới; giữ bản cũ.

## Vai trò

- **Người nhập liệu (editor)**: Thu nguồn, lập KPI/đầu việc và bản ghi, sửa khi có yêu cầu. Không tự duyệt hoặc mở/khóa kỳ trong cloud.
- **Người soát xét (reviewer)**: Đối chiếu nguồn, duyệt/trả sửa, khóa/mở kỳ và duyệt/phát hành báo cáo. Không có quyền CRUD nhập liệu trong cloud.
- **Quản trị doanh nghiệp (owner)**: Quản lý thành viên, điều phối phạm vi/trách nhiệm, nhập và soát xét theo quyền. Người lập vẫn không được tự duyệt bản ghi của mình trong cloud.
- **Người xem (viewer)**: Xem dữ liệu, bằng chứng, hướng dẫn, báo cáo và tệp xuất theo quyền workspace; không nhập, duyệt hoặc khóa.

## 1. Chuẩn bị tài khoản và phạm vi

**Màn hình:** Tài khoản & doanh nghiệp / Tổng quan

**Thao tác:** Đăng nhập vào doanh nghiệp đúng; owner mời editor/reviewer/viewer. Xác định kỳ, cơ sở và trách nhiệm trong quyết định Ban ESG. Nếu chưa kết nối Supabase, chỉ dùng sandbox để tập thao tác.

**Đầu vào:** Tên doanh nghiệp, danh sách thành viên, vai trò, cơ sở, kỳ báo cáo, quyết định phân công.

**Đầu ra:** Đúng workspace, có người nhập và người soát xét khác nhau; phạm vi được duyệt.

**Điểm kiểm:** Không dùng tài khoản chung. Vai trò owner có thể quản trị và soát xét nhưng vẫn không tự duyệt bản ghi mình lập trong cloud.

## 2. Chốt chủ đề, KPI và giao việc

**Màn hình:** Chủ đề trọng yếu / Từ điển KPI / Lộ trình & giao việc

**Thao tác:** Đánh giá tác động và lưu chủ đề. Vào Thu thập dữ liệu → Từ điển KPI → + Thêm mới. Nhập mã, đơn vị, cách tổng hợp và quy tắc; giao người chính, người thay thế, hạn và bằng chứng nghiệm thu.

**Đầu vào:** Mã E01, tên Điện mua, đơn vị kWh, cách tổng hợp Cộng dồn; phạm vi CS01, chủ dữ liệu Cơ điện, tần suất tháng.

**Đầu ra:** Có mã KPI hợp lệ và quy tắc trước khi nhập bản ghi.

**Điểm kiểm:** Headcount chọn Giá trị cuối kỳ. Tỷ lệ chọn Tỷ lệ từ tổng tử / mẫu; quy tắc nói rõ nhân 100 hay đơn vị cường độ. Không cộng % tháng.

## 3. Đăng ký bằng chứng

**Màn hình:** Sổ bằng chứng

**Thao tác:** Nhập Mã bằng chứng, Tên tài liệu, tải tệp tối đa 10 MiB hoặc đường dẫn HTTPS; ghi mô tả nguồn, kỳ và phạm vi. Chọn Đăng ký bằng chứng, kiểm Mở nguồn.

**Đầu vào:** Mã 2025-01_CS01_E01_DONGHO01_v01; hóa đơn/biên bản ghi chỉ số; mô tả nhà máy, đồng hồ, ngày và đơn vị.

**Đầu ra:** Mã đã đăng ký, nguồn mở được và có phiên bản tài liệu.

**Điểm kiểm:** Tệp sandbox chỉ tồn tại trong phiên hiện tại. Dữ liệu thật cần kho Supabase riêng; không đưa bảng lương/hồ sơ y tế vào liên kết công khai.

## 4. Nhập và tự kiểm dữ liệu

**Màn hình:** Thu thập dữ liệu → Bản ghi

**Thao tác:** Chọn + Thêm mới; điền kỳ, ngày, cơ sở, phòng ban, mã KPI, nguồn, giá trị, đơn vị, trạng thái và mã bằng chứng. Chọn Lưu. Nếu nhập Excel: tải mẫu, giữ tiêu đề, xem preview/lỗi, sửa lỗi rồi xác nhận nhập.

**Đầu vào:** Kỳ 2025-01; CS01; E01; DONGHO01; 480000; kWh; Đo/ghi thực; mã bằng chứng bước 3. Đây là ví dụ giả định để tập, không phải Eclat.

**Đầu ra:** Bản ghi chờ soát xét, nhận diện theo kỳ + cơ sở + KPI + nguồn.

**Điểm kiểm:** Số 0 phải có nguồn. Thiếu/không áp dụng để trống giá trị và ghi lý do. KPI tỷ lệ nhập tử và mẫu > 0. Không ghi cùng một hóa đơn dưới hai nguồn làm tăng tổng. Sửa bản ghi sẽ cần duyệt lại.

## 5. Soát xét độc lập

**Màn hình:** Thu thập dữ liệu → Bản ghi

**Thao tác:** Mở nguồn ở Sổ bằng chứng, đối chiếu kỳ/phạm vi/đơn vị/giá trị. Trong bảng bản ghi, nhập Ghi chú soát xét rồi chọn Duyệt hoặc Yêu cầu sửa. Nhận sai thì trả về bước 4, ghi rõ phần phải sửa.

**Đầu vào:** Bản ghi chờ duyệt, hóa đơn/biên bản, phương pháp và ghi chú đối chiếu.

**Đầu ra:** Đã duyệt hoặc cần sửa, có danh tính người thực hiện và nhật ký.

**Điểm kiểm:** Không chỉ đọc con số; kiểm dữ liệu đủ tháng/cơ sở, không trùng và đơn vị đúng. Sandbox mô phỏng người soát xét; không coi đó là duyệt thật.

## 6. Khóa kỳ đủ điều kiện

**Màn hình:** Thu thập dữ liệu → Bản ghi

**Thao tác:** Chọn kỳ, rà tình trạng duyệt/thiếu/không áp dụng. Điền Lý do khóa / mở lại kỳ rồi chọn Khóa kỳ đã duyệt. Kiểm nút sửa/xóa không còn khả dụng cho bản ghi đã khóa.

**Đầu vào:** Kỳ tháng hoặc phạm vi kỳ phù hợp, bản ghi đã duyệt, lý do chốt.

**Đầu ra:** Kỳ được khóa authoritative; không thêm/sửa/xóa/import vào kỳ đã khóa.

**Điểm kiểm:** Ứng dụng có kiểm soát dữ liệu và coverage cho báo cáo. Người soát xét vẫn phải kiểm nội dung, nguồn và trường hợp không áp dụng hợp lý.

## 7. Biên soạn, chốt và phát hành

**Màn hình:** Khung báo cáo ESG / Báo cáo tham chiếu / Báo cáo

**Thao tác:** Người nhập lập dự thảo tại Báo cáo với mã, kỳ, tóm tắt, KPI, so sánh, rủi ro, phần thiếu, dự án và quyết định. Ban ESG biên soạn các chương theo khung. Reviewer kiểm, chọn Duyệt & chốt báo cáo rồi Phát hành bản đã duyệt khi có đủ phê duyệt nội dung.

**Đầu vào:** Dữ liệu đã duyệt và khóa; thuyết minh, giới hạn, chỉ mục khung, biên bản lãnh đạo và phiên bản.

**Đầu ra:** Snapshot số liệu không đổi; bản phát hành và tệp Excel/PDF có phạm vi và hạn chế.

**Điểm kiểm:** Duyệt số liệu trên web không tự xác nhận GRI/pháp luật hoặc sinh đủ 19 chương. Trước công bố phải đối chiếu yêu cầu và nội dung báo cáo ngoài bảng KPI.

## 8. Kaizen và hiệu chỉnh có truy xuất

**Màn hình:** CAPA & yêu cầu / Nhật ký thay đổi

**Thao tác:** Lập CAPA với nguồn phát hiện, mức độ, nguyên nhân gốc, hành động, người phụ trách và hạn. Thu bằng chứng, kiểm hiệu lực độc lập rồi ghi trạng thái. Nếu dữ liệu đã khóa cần sửa: người có quyền ghi lý do Mở lại kỳ, người nhập sửa, soát xét/khóa lại và lập báo cáo phiên bản mới.

**Đầu vào:** Phát hiện audit/đối chiếu/khiếu nại, kết quả khắc phục, bằng chứng nghiệm thu, lý do sửa.

**Đầu ra:** Vấn đề được xử lý và kiểm hiệu lực; bản báo cáo cũ được bảo toàn.

**Điểm kiểm:** Không xóa dấu vết hoặc ghi đè bản đã duyệt. CAPA hiện ghi nhận trạng thái; tổ chức chịu trách nhiệm thực hiện kiểm hiệu lực, ứng dụng chưa tự xác minh người kiểm độc lập cho CAPA.

## Quy tắc ghi nhận

- Giữ kỳ, cơ sở, KPI và nguồn nhất quán; không cộng trùng hóa đơn và đồng hồ nhánh.
- Thiếu khác 0; đo khác ước tính; không áp dụng cần lý do.
- Không cộng tỷ lệ/nhân viên cuối kỳ theo tháng; đối chiếu tổng tử/mẫu.
- Hệ số KNK phải đúng đơn vị, địa lý, năm, phiên bản; không cộng hai phương pháp Scope 2.
- Bảo vệ nguồn và dữ liệu cá nhân; theo quy trình lưu giữ/backup của doanh nghiệp.
- [Khung báo cáo ESG](#report-kit), [Báo cáo tham chiếu](#report-example), [Audit & Kaizen](#project-audit).
