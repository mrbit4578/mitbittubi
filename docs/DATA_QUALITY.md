# Quy tắc dữ liệu và báo cáo

## Thiếu dữ liệu khác số 0

`measured` và `estimated` phải có số hữu hạn, đơn vị đúng KPI, kỳ và nguồn rõ ràng. `missing` và `na` lưu `null`, có lý do; không biến thành số 0. Ước tính cần phương pháp/bằng chứng và được trình bày riêng. Một giá trị đo bằng 0 là hợp lệ và khác chưa đo.

## Tổng hợp KPI

- `sum`: chỉ dùng cho đại lượng cộng được có đơn vị chuẩn. Không cộng kWh với MWh mà chưa quy đổi được xác nhận.
- `last`: giá trị cuối kỳ theo ngày và phiên bản; không cộng số tồn/cuối kỳ.
- `ratio`: tổng tử số chia tổng mẫu số; phần trăm nhân 100, cường độ giữ đúng đơn vị. Mẫu số bằng 0 phải báo thiếu/không xác định.
- `manual`: chỉ tiêu ghép nhiều đại lượng hoặc phương pháp chưa xác lập không được tự tổng hợp thành con số chính thức.

Không chọn sum cho tỷ lệ hoặc cường độ để lấy kết quả dễ hơn. Bộ mẫu chỉ là gợi ý và không chứa dữ liệu thực tế. Doanh nghiệp phải chuẩn hóa KPI, cơ sở, mục tiêu, phương pháp và chủ dữ liệu trước nhập.

## Kiểm và khóa kỳ

Trong cloud, người dùng xác thực và vai trò của workspace quyết định quyền. Editor nhập liệu; reviewer kiểm dữ liệu của người khác; người duyệt được server ghi nhận. Chỉ tài khoản có quyền mới khóa/mở kỳ. Mở khóa cần lý do và có nhật ký. Thêm mới, sửa, xóa và import vào kỳ khóa đều bị từ chối.

Sandbox dùng để thử chức năng và công thức; quyền mô phỏng trên browser không phải cơ chế bảo mật giữa người dùng. Không thay thế nghiệm thu Supabase RLS production.

## Báo cáo

Chỉ dữ liệu được duyệt và khóa mới được tính vào số chính thức. Báo cáo phải ghi kỳ, phạm vi, phương pháp, thiếu dữ liệu và ước tính. Dữ liệu chưa đủ, KPI không xác định, unit không khớp hoặc tỷ lệ thiếu tử/mẫu phải xuất hiện như vấn đề cần xử lý; không tự chuyển thành “đạt”.

Bản phê duyệt/phát hành phải giữ dataset cùng ID/version. Thay đổi dữ liệu sau đó không tự viết lại bản đã phát hành. Muốn hiệu chỉnh phải có bản báo cáo mới, lý do restatement và phê duyệt theo quy trình của doanh nghiệp.

KNK dùng `tCO2e = activity × factor(kgCO2e/đơn vị) / 1000`; lưu độ chính xác đầy đủ và làm tròn khi trình bày. Phải khớp đơn vị hoạt động với đơn vị hệ số và có nguồn/năm/phiên bản. Không gộp các năm hoặc các phương pháp Scope 2 thay thế vào một tổng.
