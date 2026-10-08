// Bộ dữ liệu khởi tạo đề xuất, trích từ "Kế hoạch triển khai ESG cho nhà máy giày
// và rubber boots 2026–2030". Đây là mẫu để giao việc và định nghĩa KPI; không
// chứa số liệu thực tế của nhà máy. Doanh nghiệp ngành khác phải duyệt lại phạm vi,
// chỉ tiêu và đơn vị trước khi sử dụng; các mốc thời gian là kế hoạch mẫu.

import type { AggregationMethod } from "./esg";

type Pillar = "E" | "S" | "G";

export const DEFAULT_KPIS: Array<{
  code: string; name: string; pillar: Pillar; unit: string; rule: string; owner: string; frequency: string; aggregation: AggregationMethod;
}> = [
  { code: "E01", name: "Điện tiêu thụ toàn cơ sở", pillar: "E", unit: "kWh", aggregation: "sum", rule: "Điện lưới + điện tái tạo tự dùng + điện máy phát tự dùng; loại điện xuất lưới và tránh đếm trùng.", owner: "Cơ điện", frequency: "Hằng tháng" },
  { code: "E02", name: "Cường độ điện", pillar: "E", unit: "kWh/đôi đạt", aggregation: "ratio", rule: "Tử số: điện phân bổ; mẫu số: số đôi đạt cùng dòng/kỳ. Kỳ năm = tổng tử số / tổng mẫu số; không cộng tỷ lệ tháng.", owner: "Cơ điện và SX", frequency: "Hằng tháng" },
  { code: "E03", name: "Nhiên liệu sử dụng – cần tách theo loại", pillar: "E", unit: "kg / L / Nm3", aggregation: "manual", rule: "Chỉ là danh mục mẫu: tạo KPI riêng cho mỗi nhiên liệu với một đơn vị trước khi nhập số. Tồn đầu + nhập − tồn cuối − hoàn trả; không cộng kg, L, Nm3.", owner: "Cơ điện và Kho", frequency: "Hằng tháng" },
  { code: "E04", name: "Phát thải Scope 1", pillar: "E", unit: "tCO2e", aggregation: "sum", rule: "Tổng nguồn trực tiếp cùng ranh giới; hoạt động × hệ số kgCO2e/đơn vị / 1.000; không làm tròn từng nguồn.", owner: "ESG", frequency: "Hằng tháng; tổng hợp năm" },
  { code: "E05", name: "Scope 2 theo địa điểm", pillar: "E", unit: "tCO2e", aggregation: "sum", rule: "Điện/hơi/nhiệt/lạnh mua × hệ số phù hợp. Không cộng kết quả theo thị trường vào cùng tổng Scope 2.", owner: "ESG", frequency: "Hằng tháng; tổng hợp năm" },
  { code: "E06", name: "Scope 2 theo thị trường", pillar: "E", unit: "tCO2e", aggregation: "sum", rule: "Tính riêng theo công cụ hợp đồng đáp ứng tiêu chí chất lượng khi áp dụng; báo cáo song song, không cộng với kết quả theo địa điểm.", owner: "ESG và Kế toán", frequency: "Hằng năm" },
  { code: "E07", name: "Phát thải Scope 3 sau sàng lọc", pillar: "E", unit: "tCO2e", aggregation: "sum", rule: "Rà 15 nhóm; nhập phát thải từng nhóm áp dụng; ghi lý do loại trừ, nguồn ước tính và độ bao phủ trong hồ sơ.", owner: "ESG và Mua hàng", frequency: "Hằng năm" },
  { code: "E08", name: "Nước lấy vào", pillar: "E", unit: "m3", aggregation: "sum", rule: "Tổng nước theo nguồn cùng ranh giới; không đếm lại nước tuần hoàn nội bộ.", owner: "Cơ điện", frequency: "Hằng tháng" },
  { code: "E09", name: "Thể tích nước thải", pillar: "E", unit: "m3", aggregation: "sum", rule: "Thể tích xả đo hoặc ước tính có phương pháp. Tạo KPI riêng cho từng thông số chất lượng, giới hạn và phương pháp thử.", owner: "EHS", frequency: "Hằng tháng / theo quan trắc" },
  { code: "E10", name: "Chất thải phát sinh", pillar: "E", unit: "kg", aggregation: "sum", rule: "Tổng phát sinh theo loại/công đoạn; tránh đếm trùng phát sinh, lưu kho và bàn giao; tách loại nguy hại theo nghĩa vụ áp dụng.", owner: "EHS và Kho", frequency: "Hằng tháng" },
  { code: "E11", name: "Tỷ lệ chất thải chuyển tái chế", pillar: "E", unit: "%", aggregation: "ratio", rule: "Tổng kg có bằng chứng tái chế / tổng kg chất thải cùng phạm vi × 100. Đối chiếu tồn đầu/cuối nếu bàn giao khác kỳ phát sinh.", owner: "EHS", frequency: "Hằng tháng" },
  { code: "E12", name: "Phế liệu theo công đoạn", pillar: "E", unit: "kg/kg đầu vào", aggregation: "ratio", rule: "Tổng kg phế / tổng kg đầu vào cùng công đoạn/kỳ; không cộng hoặc lấy trung bình tỷ lệ tháng.", owner: "SX và Kỹ thuật", frequency: "Hằng tháng" },
  { code: "E13", name: "Hóa chất có hồ sơ phê duyệt", pillar: "E", unit: "% mã", aggregation: "ratio", rule: "Số mã có đủ hồ sơ / số mã đang dùng × 100. Kỳ dài dùng cùng phạm vi và ghi rõ đây là độ bao phủ theo các kỳ quan sát.", owner: "Hóa chất", frequency: "Hằng tháng" },
  { code: "E14", name: "Hóa chất phù hợp MRSL", pillar: "E", unit: "% công thức", aggregation: "ratio", rule: "Số công thức có chứng cứ phù hợp / tổng công thức trong phạm vi × 100; ghi phiên bản, cấp yêu cầu và thời hạn chứng cứ.", owner: "Hóa chất", frequency: "Hằng quý" },
  { code: "S01", name: "Số ca thương tích ghi nhận được", pillar: "S", unit: "vụ", aggregation: "sum", rule: "Đếm từng ca không trùng trong kỳ. Nếu tính tỷ lệ, tạo KPI riêng theo tổng giờ làm và ghi rõ cơ sở 200.000 hay 1.000.000 giờ; không so các cơ sở khác nhau.", owner: "EHS và HR", frequency: "Hằng tháng" },
  { code: "S02", name: "CAPA an toàn quá hạn tại cuối kỳ", pillar: "S", unit: "việc", aggregation: "last", rule: "Snapshot số CAPA quá hạn chưa được xác nhận hiệu lực tại ngày chốt; không cộng số tồn các tuần/tháng.", owner: "EHS", frequency: "Hằng tuần" },
  { code: "S03", name: "Trường hợp ngoại lệ giờ làm và nghỉ", pillar: "S", unit: "trường hợp", aggregation: "sum", rule: "Đếm ngoại lệ riêng biệt theo người/ngày/điều kiện áp dụng; giữ mã vụ để không lặp cùng ngoại lệ. Số người duy nhất cần KPI riêng.", owner: "HR và Sinh quản", frequency: "Hằng tháng; cảnh báo tuần" },
  { code: "S04", name: "Thanh toán lương đúng hạn", pillar: "S", unit: "% người", aggregation: "ratio", rule: "Người được trả đủ và đúng hạn / người đến hạn trong từng kỳ × 100; tổng hợp dài kỳ là tỷ lệ các lượt thanh toán.", owner: "HR và Kế toán", frequency: "Hằng tháng" },
  { code: "S05", name: "Đào tạo đạt yêu cầu", pillar: "S", unit: "% người", aggregation: "ratio", rule: "Người đạt kiểm tra năng lực / người phải đào tạo trong kỳ × 100; nêu rõ lượt hay người duy nhất và tránh trùng mẫu số.", owner: "HR và EHS", frequency: "Hằng tháng" },
  { code: "S06", name: "Số khiếu nại tiếp nhận", pillar: "S", unit: "vụ", aggregation: "sum", rule: "Đếm vụ mới không trùng; số tồn mở, số đã xử lý và thời gian xử lý dùng KPI riêng với phương pháp phù hợp; bảo mật dữ liệu cá nhân.", owner: "HR", frequency: "Hằng tháng" },
  { code: "G01", name: "Lô truy xuất đủ", pillar: "G", unit: "% lô", aggregation: "ratio", rule: "Lô kiểm tra đạt / tổng lô đã kiểm tra × 100; mẫu theo rủi ro, không suy ra toàn bộ lô sản xuất nếu chỉ chọn mẫu.", owner: "Kho và QA", frequency: "Hằng quý" },
  { code: "G02", name: "NCC rủi ro cao đã đánh giá", pillar: "G", unit: "% NCC", aggregation: "ratio", rule: "NCC rủi ro cao có đánh giá hiệu lực / NCC rủi ro cao đang dùng × 100; kỳ dài nêu rõ độ bao phủ theo kỳ quan sát.", owner: "Mua hàng", frequency: "Hằng quý" },
  { code: "G03", name: "Dữ liệu có bằng chứng đã duyệt", pillar: "G", unit: "% bản ghi", aggregation: "ratio", rule: "Bản ghi đủ nguồn, phương pháp, kiểm tra và duyệt / tổng bản ghi phải nộp × 100; mẫu số gồm cả nghĩa vụ còn thiếu.", owner: "Điều phối ESG", frequency: "Hằng tháng" },
  { code: "G04", name: "Số vụ vi phạm tuân thủ xác nhận", pillar: "G", unit: "vụ", aggregation: "sum", rule: "Đếm vụ xác nhận không trùng trong kỳ; nghĩa vụ trễ, xử phạt, sửa sau khóa và vụ đạo đức cần KPI riêng, kèm hành động và nguồn.", owner: "ESG và Kế toán", frequency: "Hằng tháng" },
];

type TaskSeed = { department: string; title: string; frequency: string; evidence: string };

const TASK_GROUPS: Array<{ department: string; items: Array<[string, string, string]> }> = [
  { department: "ESG và EHS", items: [
    ["Lập danh mục pháp luật, giấy phép, điều kiện vận hành và yêu cầu nhãn hàng; ghi điều khoản, phạm vi, hạn và người phụ trách.", "Hằng tháng và khi thay đổi", "Sổ nghĩa vụ có nguồn và kết luận áp dụng từng cơ sở."],
    ["Khảo sát từng công đoạn, ghi tác động môi trường và mối nguy; kiểm tra giấy phép, điểm xả thải và kế hoạch ứng phó.", "Ban đầu; khi đổi công nghệ", "Sơ đồ nguồn thải, đánh giá rủi ro và danh sách hành động."],
    ["Tổ chức xác định chủ đề trọng yếu, lấy ý kiến công nhân và các bên bị ảnh hưởng, trình BGĐ phê duyệt.", "Hằng năm; khi có sự cố lớn", "Biên bản tham vấn và danh sách chủ đề có lý do lựa chọn."],
    ["Thu dữ liệu điện, nhiên liệu, nước, chất thải và sự cố; kiểm tra ranh giới và lập kiểm kê KNK theo phương pháp đã duyệt.", "Hằng tháng; tổng hợp năm", "Bảng tính có nguồn, hệ số, phiên bản và người soát xét."],
    ["Theo dõi hành động khắc phục CAPA, kiểm tra hiệu lực tại hiện trường và lập báo cáo ESG.", "Hằng tuần; báo cáo tháng", "CAPA có bằng chứng đóng và báo cáo được BGĐ duyệt."],
  ] },
  { department: "Kinh doanh", items: [
    ["Yêu cầu từng nhãn hàng cung cấp bộ tiêu chuẩn hiện hành, phạm vi T1/T2, cổng nộp dữ liệu, biểu mẫu và lịch đánh giá.", "Khi mở khách hàng; rà soát quý", "Ma trận nhãn hàng có phiên bản và xác nhận bằng văn bản."],
    ["Rà soát khả năng đáp ứng trước nhận đơn: vật liệu được duyệt, thời gian kiểm nghiệm, năng lực chuyền và giờ làm.", "Mỗi đơn hàng hoặc thay đổi", "Phiếu xem xét đơn hàng có ý kiến SX, HR và QA."],
    ["Gắn mã khách hàng, PO, mã hàng và thị trường đến vào dữ liệu; chuyển yêu cầu truy xuất và nhãn cho kho, IT.", "Mỗi đơn hàng", "Master PO và tài liệu nhãn đã duyệt, có lịch sử sửa đổi."],
    ["Kiểm tra các tuyên bố tái chế, nguồn gốc, carbon hoặc môi trường trước gửi khách; lấy phê duyệt chuyên môn và BGĐ.", "Mỗi lần công bố", "Hồ sơ tuyên bố liên kết phép tính, chứng từ và bản được duyệt."],
    ["Theo dõi thay đổi đơn gấp và tác động đến tăng ca, thuê ngoài, vận chuyển; thương lượng lịch và lưu quyết định.", "Hằng tuần", "Log thay đổi đơn hàng và phương án năng lực đã thống nhất."],
  ] },
  { department: "Mua hàng", items: [
    ["Lập danh sách nhà cung cấp, cơ sở sản xuất và nhà thầu; phân loại vật liệu, dịch vụ, quốc gia và rủi ro.", "Ban đầu; cập nhật tháng", "Danh mục nhà cung cấp có mã duy nhất và cơ sở cung ứng."],
    ["Thu hồ sơ nguồn gốc cao su tự nhiên, cao su tổng hợp, da và bao bì theo BOM; yêu cầu chuỗi lô và chứng từ phù hợp.", "Mỗi nguồn mới; mỗi lô theo yêu cầu", "Hồ sơ nhà cung cấp và liên kết lô nhận; thiếu hồ sơ được đánh dấu."],
    ["Chỉ đặt mua hóa chất sau phê duyệt kỹ thuật, EHS và QA; đưa RSL/MRSL và kiểm soát thay đổi vào điều kiện mua.", "Mỗi mã mới hoặc thay đổi", "Phiếu duyệt hóa chất và PO có điều kiện áp dụng."],
    ["Yêu cầu dữ liệu khối lượng, quy trình và phát thải nhà cung cấp cho Scope 3; ghi rõ phạm vi, năm và phương pháp.", "Hằng năm; khi thay đổi nguồn", "Bảng phản hồi có nguồn; số ước tính được tách riêng."],
    ["Đánh giá nhà cung cấp rủi ro cao và nhà thầu chất thải; theo dõi CAPA, kiểm tra giấy phép và cơ sở tiếp nhận.", "Theo rủi ro; tối thiểu rà soát năm", "Phiếu đánh giá, giấy phép còn phù hợp, biên bản nghiệm thu dịch vụ."],
  ] },
  { department: "Trung tâm kỹ thuật", items: [
    ["Chuẩn hóa BOM theo mã hàng, phiên bản, khối lượng và loại cao su; phân biệt giày dán, giày lưu hóa, rubber boots.", "Mỗi mã hàng và thay đổi", "BOM được duyệt, định mức theo đôi và cấu phần vật liệu."],
    ["Xác định điểm đo tại phối trộn, cán, dán, lưu hóa và hoàn tất; chuẩn hóa mẫu số sản lượng đạt và khối lượng phối liệu.", "Ban đầu; khi đổi công đoạn", "Sơ đồ công nghệ và danh mục điểm đo thống nhất với Cơ điện."],
    ["Thử giảm hao hụt, thay keo hoặc phối liệu theo yêu cầu RSL/MRSL; kiểm chứng chất lượng trước đổi sản xuất hàng loạt.", "Mỗi dự án cải tiến", "Kết quả thử, đánh giá rủi ro và phê duyệt thay đổi."],
    ["Chuẩn hóa nhiệt độ, áp suất, thời gian lưu hóa trong cửa sổ đã thẩm định; không tự giảm thông số để đạt KPI điện.", "Mỗi mã công thức; kiểm tra ca", "Thông số chuẩn, log mẻ và kết quả QA phù hợp."],
    ["Lập dữ liệu thử nghiệm dấu chân carbon cho một mã đại diện từng công nghệ; ghi ranh giới và cơ sở phân bổ.", "Thí điểm 2027; mở rộng sau", "BOM khối lượng, năng lượng theo công đoạn, giả định và phạm vi PCF."],
  ] },
  { department: "Hóa chất", items: [
    ["Lập danh mục hóa chất gồm tên thương mại, nhà sản xuất, mục đích, SDS, lô, hạn dùng và trạng thái phê duyệt.", "Mỗi mã mới; cập nhật tháng", "Chemical inventory liên kết SDS và mã hàng nội bộ."],
    ["Kiểm tra chứng cứ MRSL đầu vào và yêu cầu A-01/RSL theo nhãn hàng; ghi phiên bản, hạn và phạm vi chứng cứ.", "Trước mua; trước đổi công thức", "Phiếu đánh giá có cơ sở; không dùng SDS thay kết quả thử."],
    ["Ban hành hướng dẫn cân, pha, cấp phát và hoàn trả; ghi kg theo mẻ và liên kết lệnh SX, công thức, người thao tác.", "Mỗi mẻ và mỗi lần cấp", "Phiếu cân pha, cấp trả và log sai lệch so với định mức."],
    ["Kiểm tra nhãn phụ, tương thích lưu kho, chống tràn và hút cục bộ; khảo sát phơi nhiễm với EHS theo rủi ro.", "Mỗi ca; rà soát định kỳ", "Checklist hiện trường, kết quả đo và hành động khắc phục."],
    ["Cách ly hóa chất hết hạn, không rõ nguồn hoặc thử không đạt; điều tra ảnh hưởng tới mẻ, thành phẩm và chất thải.", "Khi phát sinh", "Biên bản cách ly, danh sách lô ảnh hưởng và quyết định xử lý."],
  ] },
  { department: "Sản xuất và sinh quản", items: [
    ["Ghi mẻ, chuyền, ca, máy, giờ chạy, giờ dừng, số đôi đạt, sửa và loại; tách công nghệ và mã hàng.", "Mỗi ca", "Nhật ký ca đối chiếu xác nhận QA và nhập kho TP."],
    ["Cân vật liệu cấp, trả, dở dang, phế liệu chưa lưu hóa và đã lưu hóa; ghi nguyên nhân và công đoạn.", "Mỗi mẻ; chốt ngày", "Cân bằng vật liệu có chênh lệch được giải thích."],
    ["Thực hiện thông số chuẩn và kiểm tra che chắn, liên động, hút khí; báo nguy cơ và dừng công việc theo quyền được giao.", "Đầu ca; khi bất thường", "Checklist máy, log cảnh báo và xác nhận xử lý trước chạy lại."],
    ["Lập kế hoạch tuần có kiểm tra tăng ca và tải chuyền; báo sớm thiếu năng lực cho kinh doanh, không tự thuê ngoài.", "Hằng tuần; khi đổi đơn", "Kế hoạch năng lực và quyết định thuê ngoài được duyệt nếu có."],
    ["Thực hiện dự án giảm lỗi, giảm chạy rỗng và rò rỉ; so sánh trước sau cùng điều kiện sản lượng, mã và công nghệ.", "Hằng tháng", "Phiếu cải tiến có số đo và xác nhận của Kỹ thuật, QA, Kế toán."],
  ] },
  { department: "Hạ tầng và xây dựng", items: [
    ["Lập hồ sơ mặt bằng, công năng, hồ sơ xây dựng và PCCC liên quan; theo dõi thay đổi bố trí và công trình.", "Ban đầu; khi sửa đổi", "Danh mục hồ sơ, bản vẽ hiện trạng và điểm cần xử lý."],
    ["Khảo sát thoát nước, tách nước mưa với nước thải, bờ bao kho hóa chất và chất thải; kiểm tra nguy cơ tràn.", "Hằng tháng; trước mùa mưa", "Sơ đồ thoát nước, ảnh vị trí và biên bản kiểm tra."],
    ["Đánh giá mái, sàn, tải trọng và lối thoát trước cải tạo hoặc lắp điện mặt trời; lấy thiết kế, thẩm định phù hợp.", "Mỗi dự án", "Hồ sơ chuyên môn và phê duyệt trước thi công."],
    ["Kiểm soát nhà thầu xây dựng: phạm vi, giấy phép làm việc, rào chắn, chất thải và bàn giao an toàn.", "Mỗi công việc", "Hồ sơ nhà thầu, nhật ký và biên bản nghiệm thu."],
    ["Đánh giá rủi ro ngập, nắng nóng, mất điện và gián đoạn hạ tầng; lập phương án bảo vệ người, hóa chất và hàng hóa.", "Hằng năm; sau sự cố", "Kịch bản ứng phó, kiểm tra thực địa và kết quả diễn tập."],
  ] },
  { department: "Cơ điện và bảo trì", items: [
    ["Lập danh mục đồng hồ, máy và nguồn năng lượng; ghi hệ số nhân, vị trí, đơn vị và lịch kiểm định hoặc hiệu chuẩn.", "Ban đầu; khi thay thiết bị", "Sơ đồ đồng hồ và hồ sơ thiết bị đo."],
    ["Ghi chỉ số điện, nước, nhiên liệu và hơi; tách điện lưới, điện mặt trời dùng tại chỗ, xuất lưới và điện máy phát.", "Hằng ngày; chốt tháng", "Log chỉ số có ảnh và biên bản thay đồng hồ nếu có."],
    ["Kiểm tra rò khí nén, bẫy hơi, cách nhiệt, nước ngưng và máy chạy rỗng; lập lệnh sửa có số đo trước sau.", "Hằng tuần; theo kế hoạch", "Phiếu bảo trì, số đo và thời điểm hoàn thành."],
    ["Bảo trì thiết bị áp lực, che chắn, liên động, hút khí và PCCC trong phạm vi được giao; phối hợp người có năng lực.", "Theo lịch kỹ thuật và nghĩa vụ", "Hồ sơ kiểm định, thử chức năng và nghiệm thu an toàn."],
    ["Ghi bổ sung và thu hồi môi chất lạnh theo máy; lập hồ sơ dự án năng lượng và chứng từ điện tái tạo nếu có.", "Mỗi dịch vụ; rà soát tháng", "Log môi chất, biên bản nhà thầu, dự toán và chứng từ năng lượng."],
  ] },
  { department: "Kế toán và tài chính", items: [
    ["Đối chiếu điện, nước, nhiên liệu và phí chất thải với hóa đơn, hợp đồng và kỳ tiêu thụ; tách kỳ hóa đơn khác tháng.", "Hằng tháng", "Bảng đối chiếu có giải thích chênh lệch kỳ và khối lượng."],
    ["Rà soát chi phí lương, bảo hiểm với HR; kiểm tra số đã tính, số đã chi và hồ sơ còn phải xử lý.", "Hằng tháng", "Bảng đối chiếu tổng hợp; hồ sơ cá nhân được hạn chế quyền."],
    ["Thiết lập mã chi phí ESG, ngân sách thử nghiệm, quan trắc, bảo trì và đầu tư; theo dõi thực tế so với duyệt.", "Tháng; lập ngân sách năm", "Báo cáo ngân sách và chứng từ gốc liên kết dự án."],
    ["Thẩm định dự án bằng vốn đầu tư, chi phí vận hành, tiết kiệm ròng và giả định giá; xác nhận lợi ích sau thực hiện.", "Mỗi dự án; hậu kiểm quý", "Bảng tính thời gian hoàn vốn và kết quả đo sau đầu tư."],
    ["Kiểm tra phân quyền mua sắm, xung đột lợi ích, quà tặng và thanh toán bất thường; lưu hồ sơ xử lý.", "Hằng quý; khi phát sinh", "Biên bản kiểm soát và phê duyệt độc lập theo quy chế."],
  ] },
  { department: "Kho vận", items: [
    ["Khi nhập, ghi nhà cung cấp, mã và lô vật liệu, khối lượng, PO, chứng từ nguồn gốc; cách ly lô chưa đủ điều kiện.", "Mỗi lô nhập", "Phiếu nhập, tem lô, cân thực nhận và trạng thái QA."],
    ["Ghi cấp trả theo lệnh SX và lô; liên kết mã mẻ với mã thùng TP, nhãn nội bộ và nhãn khách khi được yêu cầu.", "Mỗi giao dịch", "Chuỗi truy xuất NCC – lô – mẻ – thùng – chuyến xuất."],
    ["Theo dõi bao bì mới, tái sử dụng, hỏng, hàng sửa, hàng loại và tồn lâu; kiểm kê, ghi nguyên nhân và phê duyệt xử lý.", "Hằng ngày; chốt tháng", "Sổ nhập xuất tồn, biên bản kiểm kê và quyết định xử lý."],
    ["Kiểm tra điều kiện kho theo yêu cầu sản phẩm, chống tràn, phân khu và an toàn xe nâng; xử lý sai lệch theo SOP.", "Mỗi ca", "Log nhiệt ẩm khi áp dụng, checklist kho và hồ sơ hành động."],
    ["Ghi cân chất thải và chứng từ bàn giao; lưu vận đơn, tuyến, phương thức, khối lượng hàng và đơn vị vận chuyển.", "Mỗi chuyến; tổng hợp tháng", "Phiếu cân, hồ sơ tiếp nhận chất thải và vận đơn đối chiếu."],
  ] },
  { department: "IT và hệ thống", items: [
    ["Chuẩn hóa mã cơ sở, phòng ban, mã hàng, lô, mẻ, thùng và chỉ tiêu; chỉ định hệ thống sở hữu từng trường.", "Ban đầu; khi thay đổi", "Từ điển dữ liệu, bảng ánh xạ và đầu mối phê duyệt."],
    ["Tổ chức dữ liệu từ ERP/WMS, đồng hồ, chấm công và chứng từ; ưu tiên nhập một lần, xuất theo mẫu khách hàng.", "Theo giao dịch; chốt tháng", "Bảng dữ liệu có khóa duy nhất và đối soát nguồn."],
    ["Thiết lập người nhập, người kiểm, người duyệt; khóa kỳ và log mọi sửa đổi với giá trị cũ, mới, lý do và tài khoản.", "Liên tục", "Ma trận quyền, nhật ký sửa và biên bản mở lại kỳ."],
    ["Phân quyền riêng hồ sơ lương, sức khỏe, khiếu nại và công thức; sao lưu và thử khôi phục dữ liệu.", "Sao lưu theo chính sách; thử quý", "Biên bản khôi phục và danh sách quyền được rà soát."],
    ["Thử giao diện với hệ thống khách sau khi có đặc tả: trùng mã, thiếu mạng, sửa chứng từ, đồng bộ lại và sai đơn vị.", "Trước tích hợp; khi cập nhật", "UAT có kết quả, đối soát dữ liệu và người chấp thuận."],
  ] },
  { department: "Nhân sự và hành chính", items: [
    ["Rà hồ sơ tuyển dụng, độ tuổi, hợp đồng và phí tuyển dụng; kiểm tra nhà thầu lao động và cách giữ giấy tờ.", "Mỗi tuyển dụng; rà soát quý", "Checklist hồ sơ và hành động xử lý theo quy định áp dụng."],
    ["Đối chiếu chấm công, tăng ca, ngày nghỉ, bảng lương và thanh toán; điều tra ngoại lệ và điều chỉnh có lưu vết.", "Hằng tháng; cảnh báo tuần", "Bảng đối chiếu và xác nhận xử lý ngoại lệ."],
    ["Vận hành kênh phản ánh bảo mật, không trả đũa; phân loại, giao người xử lý độc lập và phản hồi người lao động.", "Khi phát sinh; rà soát tháng", "Mã vụ việc, thời hạn, biện pháp và bằng chứng phản hồi ẩn danh."],
    ["Phối hợp đào tạo an toàn, hóa chất, quy tắc ứng xử; đánh giá thực hành theo vị trí, ca và người mới.", "Khi nhận việc; theo nhu cầu", "Danh sách học, nội dung và kết quả kiểm tra năng lực."],
    ["Báo cáo số lao động, nghỉ việc, giới tính, đào tạo và đối thoại; tách lao động trực tiếp và nhà thầu thuộc phạm vi.", "Hằng tháng; đối thoại theo lịch", "Bảng tổng hợp có mẫu số, biên bản đối thoại và quyền truy cập."],
  ] },
  { department: "QA và QC", items: [
    ["Lập kế hoạch kiểm nghiệm theo vật liệu, thị trường và nhãn hàng; kiểm soát phòng thử nghiệm và phương pháp được chấp nhận.", "Mỗi mã hoặc vật liệu mới", "Ma trận test gắn mẫu, lô, phiên bản RSL và kết quả."],
    ["Phê duyệt nhận, cách ly, xuất hoặc xử lý lô theo tiêu chí; kiểm soát sử dụng báo cáo thử đúng phạm vi mẫu.", "Mỗi lô cần kiểm", "Trạng thái QA và liên kết chứng cứ kiểm nghiệm."],
    ["Thẩm định thay đổi keo, vật liệu tái chế, thông số lưu hóa; kiểm tra độ bền, độ kín nước hoặc chỉ tiêu sản phẩm áp dụng.", "Mỗi thay đổi", "Kết quả thử và phê duyệt kỹ thuật, khách hàng khi cần."],
    ["Xác nhận sản lượng đạt, lỗi và sửa cho KPI; điều tra lỗi tái diễn, hàng trả và khiếu nại sản phẩm.", "Mỗi ca; báo cáo tháng", "Báo cáo chất lượng và CAPA có số lô ảnh hưởng."],
    ["Thực hiện truy xuất thử và kiểm tra chéo bằng chứng ESG; đánh giá hiệu lực CAPA độc lập với người thực hiện.", "Hằng quý; trước báo cáo", "Biên bản truy xuất hai chiều và kết quả kiểm tra hồ sơ."],
  ] },
];

export const DEFAULT_TASKS: Array<TaskSeed & { code: string }> = TASK_GROUPS.flatMap((g, gi) =>
  g.items.map(([title, frequency, evidence], i) => ({
    code: `T${String(gi + 1).padStart(2, "0")}.${i + 1}`,
    department: g.department,
    title,
    frequency,
    evidence,
  })),
);

export const DEFAULT_ROADMAP: Array<{ code: string; quarter: string; title: string; description: string; leads: string; acceptance: string }> = [
  { code: "RM-2026Q4", quarter: "2026-Q4", title: "Khởi động: ban ESG, sổ yêu cầu, chốt dữ liệu tháng đầu", description: "Giao trưởng ban và đầu mối; thu bộ yêu cầu buyer; khảo sát hiện trường; kiểm kê đồng hồ và dữ liệu 2025–2026; chốt dữ liệu tháng 10, 11; workshop chủ đề; thử truy xuất một lô; lập danh mục dự án và dự toán 2027.", leads: "BGĐ, ESG/EHS, Kinh doanh, Cơ điện, Kế toán, HR, Kho, IT", acceptance: "Quyết định thành lập; ma trận yêu cầu có nguồn; bản đồ dữ liệu và khoảng trống; bộ dữ liệu tháng có người kiểm; biên bản truy xuất hai chiều; đề án và ngân sách." },
  { code: "RM-2027Q1", quarter: "2027-Q1", title: "Chốt năm cơ sở và báo cáo 2026", description: "Đối soát 12 tháng nếu có; phê duyệt năm cơ sở; cập nhật GRI theo ngày phát hành; lập báo cáo 2026 đúng phạm vi.", leads: "ESG, Kế toán, HR", acceptance: "Từng KPI có nguồn, mẫu số, người duyệt; nếu thiếu cả năm thì công bố đúng kỳ có dữ liệu." },
  { code: "RM-2027Q2", quarter: "2027-Q2", title: "Đo công đoạn và xử lý rủi ro", description: "Lắp hoặc chuẩn hóa điểm đo ưu tiên; khắc phục an toàn, hóa chất; thực hiện dự án khí nén, hơi, chạy rỗng.", leads: "Cơ điện, SX, Hóa chất", acceptance: "Hồ sơ đo và nghiệm thu; QA xác nhận chất lượng; CAPA rủi ro cao có kiểm tra hiệu lực." },
  { code: "RM-2027Q3", quarter: "2027-Q3", title: "Truy xuất và sàng lọc Scope 3", description: "Thử truy xuất hai chiều; khảo sát nhà cung cấp trọng điểm; rà 15 nhóm Scope 3; PCF thí điểm một mã cho mỗi công nghệ.", leads: "Mua hàng, Kho, Kỹ thuật", acceptance: "Truy ngược tới lô đầu vào, truy xuôi tới chuyến xuất; báo cáo PCF ghi rõ ranh giới và ước tính." },
  { code: "RM-2027Q4", quarter: "2027-Q4", title: "Phê duyệt mục tiêu và đầu tư", description: "Đánh giá chủ đề; hoàn thiện dữ liệu năm; chốt mục tiêu đến 2030 và danh mục đầu tư theo ngân sách, buyer, năng lực.", leads: "BGĐ, Kế toán, ESG", acceptance: "Biên bản duyệt mục tiêu tuyệt đối và cường độ, năm cơ sở, chủ dự án và vốn." },
  { code: "RM-2028Q1", quarter: "2028-Q1", title: "Báo cáo và kiểm tra bên ngoài", description: "Chốt báo cáo 2027; thực hiện FEM, SLCP hoặc đánh giá khác nếu buyer yêu cầu; khắc phục sai lệch.", leads: "ESG, HR, QA", acceptance: "Báo cáo có dấu vết dữ liệu; phạm vi xác minh và giới hạn được nêu." },
  { code: "RM-2028Q2", quarter: "2028-Q2", title: "Triển khai đầu tư đã duyệt", description: "Thực hiện dự án điện, nhiệt, nước hoặc hút khí; soát điều kiện công trình và chất lượng trước vận hành.", leads: "Cơ điện, Hạ tầng, SX", acceptance: "Nghiệm thu kỹ thuật, pháp lý áp dụng và đo trước sau." },
  { code: "RM-2028Q3", quarter: "2028-Q3", title: "Mở rộng dữ liệu nhà cung cấp", description: "Ưu tiên vật liệu đóng góp lớn theo kết quả sàng lọc; kiểm tra dữ liệu nguyên cấp và phê duyệt vật liệu thay thế.", leads: "Mua hàng, Kỹ thuật", acceptance: "Phạm vi dữ liệu và khoảng trống minh bạch; vật liệu thay thế qua QA." },
  { code: "RM-2028Q4", quarter: "2028-Q4", title: "Hậu kiểm hiệu quả", description: "Đối chiếu tiết kiệm thực với phương án; cập nhật mục tiêu, rủi ro khí hậu và ngân sách 2029.", leads: "Kế toán, ESG, BGĐ", acceptance: "Lợi ích được đo, nguyên nhân chênh lệch và quyết định điều chỉnh." },
  { code: "RM-2029Q1", quarter: "2029-Q1", title: "Nâng chất lượng báo cáo", description: "Chốt báo cáo 2028; rà chỉ mục GRI và mức tuyên bố; chọn KPI trọng yếu để xác minh độc lập nếu phù hợp.", leads: "ESG, QA, BGĐ", acceptance: "Báo cáo khớp hồ sơ; không mở rộng tuyên bố vượt phạm vi đã kiểm tra." },
  { code: "RM-2029Q2", quarter: "2029-Q2", title: "Tối ưu công nghệ và vật liệu", description: "Mở rộng cải tiến đã thử; giảm phế liệu và làm lại; đánh giá khả năng thay nhiên liệu nếu còn dùng nguồn phát thải cao.", leads: "Kỹ thuật, SX, Cơ điện", acceptance: "Kết quả vận hành có chất lượng và an toàn đạt tiêu chí duyệt." },
  { code: "RM-2029Q3", quarter: "2029-Q3", title: "Kiểm tra sức bền hệ thống", description: "Diễn tập mất điện, ngập, gián đoạn nhà cung cấp và phục hồi dữ liệu; thử truy xuất, thu hồi giả định.", leads: "Hạ tầng, IT, Kho, QA", acceptance: "Biên bản diễn tập, thời gian đáp ứng và điểm cần khắc phục." },
  { code: "RM-2029Q4", quarter: "2029-Q4", title: "Dự báo khoảng cách 2030", description: "Dự báo theo đơn hàng, công nghệ và dự án; trình vốn bổ sung; rà tác động người lao động khi đổi công nghệ.", leads: "ESG, Kế toán, HR, BGĐ", acceptance: "Bảng khoảng cách đến mục tiêu và kế hoạch bù tiến độ có người chịu trách nhiệm." },
  { code: "RM-2030Q1", quarter: "2030-Q1", title: "Chốt báo cáo 2029", description: "Đối soát chuỗi số liệu nhiều năm; tính lại năm cơ sở nếu thuộc chính sách đã duyệt; công bố giải thích.", leads: "ESG, Kế toán", acceptance: "So sánh cùng ranh giới, phương pháp; mọi điều chỉnh có lịch sử." },
  { code: "RM-2030Q2", quarter: "2030-Q2", title: "Hoàn tất dự án trọng điểm", description: "Nghiệm thu dự án còn lại; kiểm tra chuỗi cung ứng, hóa chất và quyền người lao động.", leads: "Chủ dự án và EHS", acceptance: "CAPA trọng yếu được kiểm tra hiệu lực; dự án có đo lợi ích thực." },
  { code: "RM-2030Q3", quarter: "2030-Q3", title: "Rà soát độc lập trước chốt kỳ", description: "Kiểm tra KPI, nguồn và bằng chứng; xử lý sai lệch; dự thảo kế hoạch 2031–2035.", leads: "QA, ESG, BGĐ", acceptance: "Báo cáo soát xét và danh mục sửa đổi trước chốt năm." },
  { code: "RM-2030Q4", quarter: "2030-Q4", title: "Đánh giá mục tiêu 2030", description: "Chốt dữ liệu vận hành; đánh giá đạt và chưa đạt từng mục tiêu; phê duyệt giai đoạn tiếp theo.", leads: "BGĐ và toàn bộ đầu mối", acceptance: "Dữ liệu cả năm được hoàn thiện Q1/2031; báo cáo 2030 phát hành sau kiểm tra, không chốt sớm." },
];

export const DEFAULT_TOPICS: Array<{ code: string; name: string; description: string; owner: string }> = [
  { code: "CD01", name: "Năng lượng và khí nhà kính", description: "Điện, nhiên liệu, hơi cho phối trộn, cán, lưu hóa và phụ trợ.", owner: "Cơ điện và ESG" },
  { code: "CD02", name: "Hóa chất và an toàn sản phẩm", description: "Keo, dung môi, phối liệu cao su, chất trợ và nguy cơ chất hạn chế.", owner: "Hóa chất và QA" },
  { code: "CD03", name: "Vật liệu và chất thải", description: "Phế chưa lưu hóa, phế lưu hóa, da/vải, bao bì, chất thải nguy hại.", owner: "SX, Kho và EHS" },
  { code: "CD04", name: "Nước và nước thải", description: "Nguồn nước, làm mát, vệ sinh, nước thải công đoạn nếu có.", owner: "EHS và Cơ điện" },
  { code: "CD05", name: "An toàn và sức khỏe nghề nghiệp", description: "Máy cán, áp lực, nhiệt, bụi, hơi hóa chất, xe nâng và nhà thầu.", owner: "EHS và SX" },
  { code: "CD06", name: "Lao động và quyền con người", description: "Giờ làm, lương, tuyển dụng, phân biệt đối xử, khiếu nại và đối thoại.", owner: "HR và Sinh quản" },
  { code: "CD07", name: "Truy xuất và nhà cung cấp", description: "Cao su tự nhiên, da, bao bì; nguồn hợp lệ; nhà thầu và thuê ngoài.", owner: "Mua hàng, Kỹ thuật và Kho" },
  { code: "CD08", name: "Tuân thủ và tính trung thực dữ liệu", description: "Giấy phép, đạo đức, chống tham nhũng, quyền dữ liệu, phê duyệt báo cáo.", owner: "BGĐ, ESG, Kế toán và IT" },
  { code: "CD09", name: "Đa dạng sinh học, nguồn nguyên liệu và đất", description: "Cần đánh giá thêm trước khi quyết định gộp hay báo cáo riêng.", owner: "Mua hàng và ESG" },
  { code: "CD10", name: "Cộng đồng và khả năng ứng phó", description: "Cần đánh giá thêm; ngập, nắng nóng, mất điện, tác động cộng đồng xung quanh.", owner: "Hạ tầng và ESG" },
];

export const DEFAULT_REQUIREMENTS: Array<{ code: string; layer: "law" | "brand" | "framework"; name: string; clause: string; owner: string }> = [
  { code: "YC-L01", layer: "law", name: "Giấy phép môi trường và quan trắc định kỳ", clause: "Kiểm tra giấy phép, điểm xả thải, tần suất quan trắc, nơi nộp báo cáo.", owner: "EHS" },
  { code: "YC-L02", layer: "law", name: "Xây dựng và phòng cháy chữa cháy", clause: "Hồ sơ hoàn công, thẩm duyệt PCCC, kiểm định hệ thống.", owner: "Hạ tầng" },
  { code: "YC-L03", layer: "law", name: "An toàn vệ sinh lao động và kiểm định thiết bị", clause: "Thiết bị áp lực, xe nâng, huấn luyện ATVSLĐ, khám sức khỏe.", owner: "EHS và HR" },
  { code: "YC-L04", layer: "law", name: "Quản lý hóa chất", clause: "Khai báo, lưu kho, SDS, kế hoạch phòng ngừa ứng phó sự cố hóa chất.", owner: "Hóa chất" },
  { code: "YC-L05", layer: "law", name: "Lao động, tiền lương và bảo hiểm", clause: "Hợp đồng, giờ làm, tăng ca, lương tối thiểu, BHXH, đối thoại.", owner: "HR" },
  { code: "YC-L06", layer: "law", name: "Quản lý chất thải và chất thải nguy hại", clause: "Phân loại, lưu tạm, chứng từ chuyển giao, đơn vị xử lý có giấy phép.", owner: "EHS và Kho" },
  { code: "YC-L07", layer: "law", name: "Kiểm kê khí nhà kính – kiểm tra văn bản hiện hành", clause: "Đối chiếu nguồn chính thức theo pháp nhân/cơ sở/địa chỉ; lưu số hiệu, ngày hiệu lực, kết luận áp dụng, hạn và cơ quan nhận. Nội dung mẫu chưa xác minh nghĩa vụ của cơ sở.", owner: "ESG" },
  { code: "YC-L08", layer: "law", name: "Bảo vệ dữ liệu cá nhân", clause: "Phân quyền hồ sơ lương, sức khỏe, khiếu nại; lưu trữ và sao lưu.", owner: "IT và HR" },
  { code: "YC-B01", layer: "brand", name: "adidas Workplace Standards", clause: "Lao động, an toàn, môi trường; xác nhận bộ áp dụng với đầu mối adidas.", owner: "Kinh doanh và ESG" },
  { code: "YC-B02", layer: "brand", name: "adidas A-01 Policy – nếu có hợp đồng áp dụng", clause: "Nhận phiên bản, hiệu lực, ma trận vật liệu và yêu cầu kiểm nghiệm từ nhãn hàng; lưu xác nhận phạm vi, không dùng phiên bản mẫu như nghĩa vụ đã xác minh.", owner: "Hóa chất và QA" },
  { code: "YC-B03", layer: "brand", name: "adidas Environmental Guidelines", clause: "Năng lượng, nước, khí thải, chất thải, hóa chất; không thay tài liệu giao riêng cho nhà máy.", owner: "EHS" },
  { code: "YC-B04", layer: "brand", name: "Nhãn hàng rubber boots khác (bổ sung tên)", clause: "Mỗi khách: thị trường, RSL/MRSL, nguồn cao su, kiểm nghiệm, tiêu chí xã hội, biểu mẫu, portal, lịch nộp, đơn vị đánh giá chấp nhận.", owner: "Kinh doanh" },
  { code: "YC-F01", layer: "framework", name: "GRI 1 Foundation 2021 và GRI 3 Material Topics 2021", clause: "Chỉ ghi 'in accordance' hoặc 'with reference' khi đáp ứng đúng yêu cầu tương ứng.", owner: "ESG" },
  { code: "YC-F02", layer: "framework", name: "GRI Climate Change và Energy – kiểm tra phiên bản", clause: "Rà nguồn GRI chính thức về phiên bản, ngày hiệu lực và điều kiện áp dụng sớm; lưu quyết định chuẩn dùng trước từng kỳ công bố.", owner: "ESG" },
  { code: "YC-F03", layer: "framework", name: "GHG Protocol Corporate Standard", clause: "Ranh giới tổ chức và vận hành; kiểm kê Scope 1, 2.", owner: "ESG" },
  { code: "YC-F04", layer: "framework", name: "GHG Protocol Scope 2 Guidance", clause: "Phân biệt phương pháp theo địa điểm và theo thị trường; tiêu chí công cụ hợp đồng.", owner: "ESG và Kế toán" },
  { code: "YC-F05", layer: "framework", name: "GHG Protocol Scope 3 Standard", clause: "Sàng lọc đủ 15 nhóm; ghi lý do loại trừ và khoảng trống.", owner: "ESG và Mua hàng" },
  { code: "YC-F06", layer: "framework", name: "ZDHC MRSL", clause: "Kiểm soát hóa chất đầu vào; chốt bản và cấp phù hợp với buyer; SDS không phải chứng nhận MRSL.", owner: "Hóa chất" },
  { code: "YC-F07", layer: "framework", name: "AFIRM RSL – phiên bản được kiểm tra", clause: "Đối chiếu tài liệu gốc và phiên bản hiện hành với tiêu chuẩn từng nhãn hàng; không coi tài liệu tham khảo là chấp thuận tự động.", owner: "QA" },
  { code: "YC-F08", layer: "framework", name: "Higg FEM (Cascale)", clause: "Tự đánh giá môi trường cấp cơ sở; tự đánh giá và xác minh là hai bước khác nhau.", owner: "EHS" },
  { code: "YC-F09", layer: "framework", name: "EUDR – kiểm tra phạm vi sản phẩm cao su", clause: "Đối chiếu Annex I đang hiệu lực, mã CN/HS, vai trò giao dịch; không gán tự động cho mọi boots.", owner: "Kinh doanh và Mua hàng" },
];
