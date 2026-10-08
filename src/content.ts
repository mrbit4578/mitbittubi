// Thư viện kiến thức ESG tích hợp sẵn, tổng hợp từ bộ tài liệu dự án.
// Nguồn/tuyên bố trong archive là tham khảo, chưa phải kết luận xác minh
// hay nghĩa vụ tự động áp dụng cho từng doanh nghiệp.
// Tổng quan ESG & điểm xuất phát; Kế hoạch ESG nhà máy giày 2026–2030;
// Cấu trúc báo cáo ESG từ 4 doanh nghiệp ngành giày; Tổng hợp báo cáo ESG đầy đủ.

export type Article = { id: string; category: string; title: string; summary: string; content: string; tags: string[]; source: string };

export const CATEGORIES: Array<{ id: string; label: string }> = [
  { id: "tong-quan", label: "Tổng quan ESG" },
  { id: "phat-thai", label: "Phát thải & Net Zero" },
  { id: "gri", label: "GRI & chủ đề trọng yếu" },
  { id: "du-lieu", label: "Dữ liệu & bằng chứng" },
  { id: "bao-cao", label: "Cấu trúc báo cáo" },
  { id: "benchmark", label: "Benchmark ngành giày" },
  { id: "to-chuc", label: "Tổ chức & lộ trình" },
  { id: "yeu-cau", label: "Yêu cầu & tuân thủ" },
  { id: "thuat-ngu", label: "Thuật ngữ & nguồn" },
];

export const ARTICLES: Article[] = [
  { id: "a01", category: "tong-quan", title: "ESG là gì và vì sao quan trọng ngay lúc này", tags: ["ESG", "khách hàng", "chuỗi cung ứng"], source: "Tổng Quan ESG và Điểm Xuất Phát",
    summary: "Khách hàng và người mua yêu cầu dữ liệu ESG từ nhà cung cấp; bền vững đang trở thành yêu cầu tối thiểu.",
    content: `E (Môi trường): theo dõi và giảm các dữ liệu đo lường được – nước, chất thải, năng lượng. Phải có số liệu cụ thể, kiểm soát và giảm theo thời gian.
S (Xã hội): số nhân viên, tỷ lệ giới tính, lương, an toàn, gắn kết cộng đồng. Chi tiêu CSR bên ngoài không thay thế phúc lợi nội bộ cho người lao động.
G (Quản trị): kiểm soát tài chính, chiến lược đầu tư, tuân thủ pháp lý, ra quyết định minh bạch.

Vì sao ngay lúc này:
• Người mua chọn nhà cung cấp dựa trên hiệu suất bền vững; không cung cấp được dữ liệu ESG có nguy cơ mất đơn hàng.
• Yêu cầu truy xuất phụ thuộc sản phẩm, thị trường, vai trò giao dịch và hợp đồng; kiểm tra phạm vi áp dụng trước khi kết luận nghĩa vụ.
• Việt Nam cam kết Net Zero 2050. Sau Covid, chuỗi cung ứng tái cơ cấu và EU ban hành nhiều quy định mới từ 2021.
• Văn hóa "bằng chứng": mọi tuyên bố phải dựa trên dữ liệu, không phải cảm tính.` },
  { id: "a02", category: "tong-quan", title: "Điểm xuất phát của nhà máy và cách hiểu đúng các con số", tags: ["15,09", "benchmark", "năm cơ sở"], source: "Kế hoạch ESG 2026–2030, mục 1",
    summary: "Điểm ESG 15,09 và chuẩn ngành 50–60 là ghi chép buổi tư vấn, chưa xác minh phương pháp; cần xin bảng chấm gốc.",
    content: `Ghi chép buổi tư vấn nêu điểm 15,09, chuẩn ngành 50–60/100, lộ trình khoảng 3 năm và việc đã thu thập một số dữ liệu xã hội, lương, môi trường. Đây là thông tin ghi trong nguồn tham khảo, chưa xác minh phương pháp hay dữ liệu của doanh nghiệp đang dùng ứng dụng.

Cách xử lý khi triển khai:
• Điểm 15,09: chưa xác minh được thang điểm, trọng số, mẫu so sánh, biên bản audit → xin bảng chấm gốc; không dùng làm xếp hạng hay cam kết tăng điểm.
• Năm cơ sở 2025: giữ là phương án cần kiểm tra; chỉ chốt khi ranh giới và dữ liệu đủ 12 tháng, tái lập được phép tính.
• Tài liệu gốc nêu mức giảm 70% Scope 1+2 và 42% Scope 3 của adidas so với 2022: cần đối chiếu báo cáo tập đoàn, không tự gán cho nhà máy.
• "Scope 3 thường 80–90%", "điện mặt trời bù sau 5 năm": không dùng làm số liệu của nhà máy; phải tính.
• Mốc 2060, AIDA, doanh thu ~50 triệu USD: chưa rõ chủ thể và văn bản; không dùng làm nghĩa vụ.
• Điện cả năm = tổng các kỳ không trùng; cường độ năm = tổng điện / tổng sản lượng, không lấy trung bình tỷ lệ tháng.
• Kiểm tra phiên bản GRI Climate Change/Energy, ngày hiệu lực và điều kiện áp dụng sớm tại nguồn GRI chính thức; lưu phiên bản thực tế dùng.` },
  { id: "a03", category: "phat-thai", title: "Scope 1, 2, 3 và lộ trình Net Zero", tags: ["Scope 1", "Scope 2", "Scope 3", "Net Zero"], source: "Tổng quan ESG; Kế hoạch mục 13",
    summary: "Scope 1 phát thải trực tiếp, Scope 2 năng lượng mua ngoài, Scope 3 chuỗi giá trị (15 nhóm). Net Zero khác carbon trung tính.",
    content: `Scope 1: lò hơi/lò nhiệt đốt tại chỗ, máy phát, xe do cơ sở kiểm soát, rò rỉ môi chất lạnh, phát thải quá trình.
Scope 2: điện lưới và hơi, nhiệt, lạnh mua ngoài tiêu thụ trong ranh giới. Lưới điện Việt Nam gồm gió, mặt trời, thủy điện và than.
Scope 3: 15 nhóm chuỗi giá trị – thượng nguồn (nguyên liệu, compound, vận tải, chất thải, dịch vụ, công đoạn thuê ngoài) và hạ nguồn (sử dụng, cuối vòng đời). Tỷ trọng phải được tính, không giả định.

Lộ trình Net Zero cần xác định tiêu chuẩn mục tiêu, ranh giới, năm cơ sở, mức giảm dài hạn và cách xử lý phát thải còn lại. Ưu tiên giảm trong hoạt động và chuỗi giá trị; không dùng mua tín chỉ để thay thế mức giảm đã cam kết. Khi tiêu chuẩn yêu cầu neutralization, kiểm tra loại bỏ carbon, lưu trữ và điều kiện được chấp nhận theo đúng phiên bản.
Carbon trung tính phải nêu đối tượng, kỳ, phạm vi và phương pháp bù đắp. Net Zero cần giảm sâu dài hạn và xử lý phát thải còn lại theo tiêu chuẩn được chọn; không mặc định mọi loại tín chỉ đều đáp ứng.

Công thức theo dõi:
• Giảm tuyệt đối (%) = (phát thải năm cơ sở − năm báo cáo) / phát thải năm cơ sở × 100.
• Giảm cường độ (%) = (cường độ nền − cường độ kỳ) / cường độ nền × 100. Mẫu số nền phải lớn hơn 0. Báo cáo đồng thời hai tỷ lệ và giải thích thay đổi cơ cấu sản phẩm.` },
  { id: "a04", category: "phat-thai", title: "Cách tính phát thải, hệ số và PCF", tags: ["hệ số phát thải", "GWP", "PCF", "cradle-to-gate"], source: "Kế hoạch mục 13",
    summary: "tCO2e = lượng hoạt động × hệ số / 1.000; sổ hệ số có nguồn, năm, địa lý, phiên bản. Phân biệt Scope 2 theo địa điểm và theo thị trường.",
    content: `Khi hệ số đã là kgCO2e/đơn vị: tCO2e = hoạt động × hệ số / 1.000. Nếu hệ số theo từng khí, quy đổi bằng GWP phù hợp; không nhân GWP thêm lần nữa.
Sổ hệ số lưu: nguồn, năm, địa lý, công nghệ, đơn vị, phạm vi, phiên bản, người duyệt.

Hơi sản xuất trong lò của cơ sở: tính nhiên liệu ở Scope 1, không cộng hơi nội bộ vào Scope 2. Hơi mua ngoài → Scope 2. Kiểm tra sở hữu/kiểm soát với thiết bị thuê và tiện ích chung.

Điện tái tạo: tách điện sản xuất, tự dùng, mua và xuất lưới. Quyền thuộc tính môi trường và tiêu chí công cụ hợp đồng cần kiểm tra khi tính Scope 2 theo thị trường; không tự coi một hợp đồng điện mặt trời hay tín chỉ carbon là đủ để trừ phát thải.

Chính sách tính lại năm cơ sở phải được duyệt khi đổi ranh giới, phương pháp hoặc lỗi đáng kể; không thay năm cơ sở để làm kết quả đẹp.

Cấp nhà máy và cấp sản phẩm: phát thải nhà máy / tổng đôi chỉ là cường độ vận hành. PCF sản phẩm cần BOM, quy trình, ranh giới vòng đời và quy tắc phân bổ. Chỉ tính tới cổng nhà máy phải ghi "cradle-to-gate".` },
  { id: "a05", category: "gri", title: "Greenwashing và nguyên tắc 'chỉ công bố điều chứng minh được'", tags: ["greenwashing", "bằng chứng"], source: "Tổng quan ESG",
    summary: "Kiểm tra bằng chứng, phạm vi và giới hạn trước công bố; tuyên bố thiếu căn cứ có rủi ro gây hiểu lầm.",
    content: `Greenwashing xuất hiện khi doanh nghiệp tuyên bố môi trường không có bằng chứng xác minh, ví dụ "dây 100% tự nhiên", "nhà máy thân thiện môi trường" mà không chứng minh.
Nguyên tắc: thông tin công bố cần dữ liệu, phương pháp, phạm vi và bằng chứng kiểm chứng. Mức đảm bảo và chuẩn pháp lý của báo cáo ESG phải được nêu riêng, không tự coi tương đương báo cáo tài chính.
Báo cáo cần trình bày cả kết quả tốt, sai lệch, việc chưa làm và dữ liệu còn thiếu. Hoạt động thiện nguyện có thể ghi nhận nhưng không thay việc xử lý điều kiện lao động hoặc tác động môi trường trọng yếu.
Kinh doanh phải kiểm tra các tuyên bố tái chế, nguồn gốc, carbon trước khi gửi khách; lấy phê duyệt chuyên môn và BGĐ (quy trình ESG 08).` },
  { id: "a06", category: "gri", title: "Khung GRI: GRI 1, 2, 3 và cách tuyên bố", tags: ["GRI", "in accordance", "with reference"], source: "Tổng quan ESG; Kế hoạch mục 2",
    summary: "GRI là bản thiết kế chuẩn quốc tế. GRI 1 nguyên tắc, GRI 2 công bố tổ chức, GRI 3 chủ đề trọng yếu.",
    content: `GRI 1: nguyên tắc sử dụng tiêu chuẩn. GRI 2: công bố thông tin tổ chức. GRI 3: xác định chủ đề trọng yếu.
Ba nhóm chủ đề: Kinh tế (hiện diện thị trường, tác động kinh tế, thuế); Môi trường (năng lượng, nước, chất thải, đa dạng sinh học, KNK); Xã hội (việc làm, an toàn sức khỏe, giáo dục, DEI).

Nguyên tắc: báo cáo không phải càng dài càng tốt; chọn đúng chủ đề trọng yếu; dữ liệu thu thập liên tục, không một lần.
Chỉ ghi "in accordance with GRI" hoặc "with reference to GRI" khi đáp ứng đúng yêu cầu tương ứng. Rà phiên bản tại ngày công bố, ngày hiệu lực và điều kiện áp dụng sớm từ nguồn GRI chính thức; lưu quyết định phiên bản dùng.
GRI, kiểm kê KNK, ISO, đánh giá xã hội (SLCP), Higg FEM và chấp thuận nhà cung cấp là các việc khác nhau.

Không nên: cố làm báo cáo hoàn hảo ngay từ đầu; chọn quá nhiều chủ đề; viết 100+ trang thiếu dữ liệu thực chất.` },
  { id: "a07", category: "gri", title: "Xác định chủ đề trọng yếu theo GRI 3 (workshop 6 bước)", tags: ["materiality", "GRI 3", "workshop"], source: "Kế hoạch mục 5–6",
    summary: "Chủ đề trọng yếu xác định từ mức độ đáng kể của tác động. Không loại một chủ đề chỉ vì khó thu dữ liệu.",
    content: `Quy trình workshop đề xuất:
1. Vẽ chuỗi hoạt động từ nguyên liệu tới xuất hàng, sử dụng, cuối vòng đời; đánh dấu công đoạn nội bộ, mua ngoài, nhà thầu.
2. Lập danh sách tác động từ audit, giấy phép, sự cố, khiếu nại, tiêu hao, hóa chất, nhà cung cấp; phân biệt đã xảy ra/tiềm ẩn, tích cực/tiêu cực.
3. Tham vấn kinh doanh, công nhân các ca, nhóm dễ bị ảnh hưởng, đại diện NLĐ, nhà cung cấp, khách hàng, cộng đồng.
4. Đánh giá độ nghiêm trọng, phạm vi, khả năng khắc phục (và khả năng xảy ra với tác động tiềm ẩn). Với quyền con người, ưu tiên mức nghiêm trọng.
5. Cột riêng rủi ro/cơ hội kinh doanh: đơn hàng, chi phí, gián đoạn, vốn – hỗ trợ kế hoạch, không thay tiêu chí tác động.
6. BGĐ phê duyệt danh sách, ngưỡng, lý do; gắn mỗi chủ đề với chủ sở hữu, biện pháp, KPI, bằng chứng, lịch rà soát.

Phiếu đánh giá cần lưu: mã tác động; công đoạn; người bị ảnh hưởng; bằng chứng; thực tế/tiềm ẩn; mức độ, phạm vi, khả năng khắc phục; khả năng xảy ra; ý kiến bên liên quan; người đánh giá; kết luận; người duyệt; ngày rà lại.

8 chủ đề ưu tiên khảo sát: Năng lượng & KNK; Hóa chất & an toàn sản phẩm; Vật liệu & chất thải; Nước & nước thải; An toàn & sức khỏe nghề nghiệp; Lao động & quyền con người; Truy xuất & nhà cung cấp; Tuân thủ & trung thực dữ liệu. Hai chủ đề đánh giá thêm: đa dạng sinh học/nguyên liệu/đất; cộng đồng/khả năng ứng phó.
Giày dán: rà keo, dung môi, hút khí, sấy, phế. Giày lưu hóa/rubber boots: phối trộn, cân bột, cán, nhiệt/hơi, áp lực, phế trước/sau lưu hóa.` },
  { id: "a08", category: "du-lieu", title: "Thiết kế bản ghi dữ liệu và 4 trạng thái dữ liệu", tags: ["bản ghi", "đo thực", "ước tính", "chốt kỳ"], source: "Kế hoạch mục 12",
    summary: "Mỗi bản ghi cần kỳ, cơ sở, phòng ban, mã KPI, nguồn, giá trị, đơn vị, trạng thái, mã bằng chứng, người lập/kiểm/duyệt.",
    content: `Mỗi bản ghi: kỳ dữ liệu, ngày phát sinh, mã cơ sở, phòng ban, mã KPI, nguồn/đồng hồ/lô, giá trị, đơn vị, phạm vi, trạng thái đo thực hoặc ước tính, mã bằng chứng, người lập, người kiểm, người duyệt, phiên bản. Chỉ tiêu tính toán cần thêm tử số, mẫu số, hệ số, công thức.

Bốn trạng thái dữ liệu:
• Đo/ghi thực: có nguồn trực tiếp.
• Ước tính: ghi lý do, công thức, dữ liệu thay thế và người duyệt.
• Thiếu: để trống giá trị, giao hạn bổ sung.
• Không áp dụng: có lý do và người duyệt.
Số 0 chỉ dùng khi có cơ sở xác nhận thực sự không phát sinh.

Nguồn và cách đối chiếu:
• Đồng hồ: ghi đầu/cuối kỳ, hệ số nhân, ảnh, mã đồng hồ. Tiêu thụ = (cuối − đầu) × hệ số.
• ERP/kho: giao dịch đã duyệt; giữ mã lô, lệnh SX, thùng, PO; đối chiếu nhập xuất tồn.
• Sản xuất: đôi đạt, sửa, loại, mẻ, giờ chạy. Mẫu số KPI là sản lượng cùng phạm vi, không dùng số xuất hàng.
• Kế toán: hóa đơn đối chiếu với kỳ sử dụng; tách kỳ hóa đơn khác tháng.
• Nhân sự: số tổng hợp; hồ sơ cá nhân ở khu vực phân quyền.

Chốt và sửa kỳ: kiểm tra trùng chứng từ, trùng kỳ, sai đơn vị, thiếu điểm đo, bất thường sản lượng, cân bằng vật liệu. Sửa sau khóa phải có phiếu đề nghị, lý do, số cũ/mới, người duyệt. Không ghi đè tệp gốc.` },
  { id: "a09", category: "du-lieu", title: "Hồ sơ bằng chứng và kiểm tra truy xuất", tags: ["bằng chứng", "truy xuất", "QA"], source: "Kế hoạch mục 16–17",
    summary: "Một KPI phải truy ngược được: báo cáo → KPI/kỳ/cơ sở → bảng tính → bản ghi → chứng từ gốc → người lập/kiểm.",
    content: `Bộ hồ sơ theo loại:
• Điện/nhiên liệu: hóa đơn; log điểm đo; ảnh chỉ số; tồn/cấp nhiên liệu; bảng đối chiếu; hệ số và bảng tính.
• Hóa chất: mã; SDS; chứng cứ MRSL/RSL; phiếu duyệt; lô; cấp trả; kiểm nghiệm.
• Chất thải: cân phát sinh; tồn tạm; loại; bên nhận; giấy phép; biên bản bàn giao; chứng từ xử lý.
• Lao động & an toàn: chấm công; bảng lương; đào tạo; kiểm tra máy; hồ sơ sự cố; phản ánh bảo mật; CAPA.
• Truy xuất: PO; NCC; lô nhận; lệnh cấp; mẻ; lô TP; thùng; chuyến xuất; đối chiếu khối lượng.
• Quản trị: quyết định; biên bản; ngân sách; sổ nghĩa vụ; dữ liệu đã khóa; nhật ký sửa; phê duyệt công bố.

Cấu trúc lưu: ESG / Năm / Cơ_sở / Chủ_đề / Tháng / Hồ_sơ. Tên mẫu: 2026-10_CS01_E01_DONGHO01_v01.
Kiểm tra trước công bố: QA chọn mẫu theo rủi ro; truy một KPI về nguồn và một chứng từ ra báo cáo; ghi cỡ mẫu, kết quả, vấn đề còn mở.

Kho vận: chuỗi NCC – lô – mẻ – thùng – chuyến xuất; giữ quan hệ nhiều-nhiều và lịch sử; thử các tình huống: một thùng nhiều mẻ, một mẻ nhiều lô, tách/gộp thùng, in lại tem, thiếu mạng, đồng bộ trùng.` },
  { id: "a10", category: "bao-cao", title: "Cấu trúc báo cáo ESG đề xuất: thư lãnh đạo và 9 chương", tags: ["cấu trúc", "GRI", "SASB", "Dunlop"], source: "Cấu trúc báo cáo – tài liệu tham khảo trong archive, chưa xác minh nguồn gốc",
    summary: "Thư lãnh đạo → Giới thiệu → Quản trị → Trọng yếu → Môi trường → Người lao động → Chuỗi cung ứng & cộng đồng → Trách nhiệm sản phẩm → GRI/SASB Index.",
    content: `Chương 0 – Thư từ lãnh đạo (GRI 2-22): cam kết, thành tựu nổi bật, định hướng.
Chương 1 – Giới thiệu doanh nghiệp (GRI 2-1→2-6): hồ sơ, địa điểm sản xuất, nhân lực tổng quan, sản phẩm & thị trường, chứng nhận, timeline ESG.
Chương 2 – Quản trị ESG (GRI 2-9→2-29; SASB): cấu trúc HĐQT/ủy ban ESG, đạo đức kinh doanh, whistleblower, quản lý rủi ro khí hậu, cam kết UNGC/SBTi.
Chương 3 – Đánh giá trọng yếu (GRI 3-1, 3-2): phương pháp trọng yếu tác động, danh sách chủ đề, lý do và liên kết SDGs. Nếu áp dụng trọng yếu kép, đánh giá tài chính riêng theo khung được chọn; không coi GRI 3 tự động là trọng yếu kép.
Chương 4 – Môi trường (GRI 300s; SASB Footwear): KNK Scope 1/2/3 và mục tiêu; năng lượng; nguyên vật liệu & sản phẩm xanh; chất thải & kinh tế tuần hoàn; chuỗi cung ứng bền vững.
Chương 5 – Xã hội: người lao động (GRI 400s): hồ sơ lực lượng lao động; đào tạo; an toàn sức khỏe (ISO 45001, TRIR); phúc lợi & DEI.
Chương 6 – Chuỗi cung ứng & cộng đồng (ví dụ GRI 408, 409, 414, tùy chủ đề/phiên bản): thu mua có trách nhiệm, đánh giá NCC; chống lao động cưỡng bức/trẻ em; đóng góp cộng đồng.
Chương 7 – Trách nhiệm sản phẩm (SASB CG-AA): chất lượng & an toàn; EPD/nhãn sinh thái; đổi mới có trách nhiệm.
Chương 8 – Scorecard: kết quả năm, mục tiêu 2030/2050.
Chương 9 – Phụ lục: phương pháp & ranh giới, năm cơ sở, GRI Index, SDGs, xác nhận bên thứ ba.

Báo cáo năm của nhà máy (Kế hoạch mục 18): pháp nhân, cơ sở, công nghệ, kỳ và ranh giới; quản trị ESG; từng chủ đề: tác động – chính sách – người phụ trách – biện pháp – KPI – kết quả – hạn chế – kế hoạch; bảng dữ liệu nhiều năm có đơn vị, mẫu số, nguồn; nội dung chưa có dữ liệu/ước tính/chưa đạt; phê duyệt công bố, phiên bản, ngày phát hành.
Báo cáo điều hành tháng 1–2 trang: KPI kỳ và lũy kế; so với mục tiêu/năm cơ sở; rủi ro và CAPA quá hạn; dữ liệu thiếu; dự án và chi phí; quyết định cần BGĐ.` },
  { id: "a11", category: "benchmark", title: "Benchmark ngành giày: Dunlop, Yue Yuen, Pou Chen, Fulgent Sun, Eclat, Rocky Brands", tags: ["benchmark", "KPI", "EcoVadis"], source: "Tổng hợp báo cáo ESG đầy đủ; Cấu trúc 4 doanh nghiệp",
    summary: "Danh sách báo cáo trong archive để tham khảo cấu trúc. Số liệu chưa đối chiếu báo cáo gốc và không dùng làm chuẩn ngành.",
    content: `Tài liệu gốc đề cập Dunlop, Yue Yuen, Pou Chen, Fulgent Sun, Eclat và Rocky Brands. Đây là gợi ý tìm tài liệu, không phải xếp hạng hay số liệu đã được xác minh.

Trước khi so sánh, lưu tên báo cáo, đường dẫn gốc, năm, trang, pháp nhân/cơ sở, ranh giới, đơn vị, mẫu số, phương pháp và phạm vi đảm bảo. Không so cường độ vận hành với PCF sản phẩm; không so tỷ lệ tai nạn có cơ sở giờ khác nhau.

Lựa chọn báo cáo tham khảo theo công nghệ, sản phẩm, quy mô và vai trò OEM/thương hiệu. Học cách mô tả phương pháp, dữ liệu thiếu và bảng chỉ mục; không lấy mục tiêu hoặc số liệu doanh nghiệp khác làm số liệu nhà máy.

Báo cáo Eclat 2024 do người dùng đính kèm chưa được đọc và đối chiếu trong lần chuẩn bị này; ứng dụng không xác nhận các số liệu Eclat ghi trong bản nguồn.` },
  { id: "a12", category: "to-chuc", title: "Ban ESG: vai trò, nhịp làm việc và phân quyền quyết định", tags: ["ban ESG", "trưởng ban", "điều phối", "nhịp tháng"], source: "Kế hoạch mục 3–4",
    summary: "Tận dụng cơ cấu hiện có; mỗi đầu ra một người chịu trách nhiệm cuối; người nhập và người duyệt tách bước.",
    content: `Vai trò: BGĐ phê duyệt chính sách, phạm vi, chủ đề, ngân sách, mục tiêu, báo cáo. Trưởng ban ESG (giám đốc nhà máy) điều phối liên phòng ban. Điều phối ESG quản lý lịch, sổ yêu cầu, dữ liệu, CAPA, dự thảo báo cáo. Nhóm môi trường & kỹ thuật (EHS, Cơ điện, Hạ tầng, Hóa chất, Kỹ thuật, SX, Kho). Nhóm lao động (HR, Sinh quản, EHS, đại diện NLĐ). Nhóm quản trị & chuỗi cung ứng (Kế toán, Mua hàng, Kinh doanh, IT, QA). Người kiểm tra độc lập (QA/kiểm soát nội bộ).

Nhịp làm việc:
• Hằng ngày/ca: ghi điện, nước, sản lượng, vật liệu, hóa chất, sự cố.
• Hằng tuần: EHS rà rủi ro cao, CAPA, tăng ca, hóa chất cách ly, thiếu dữ liệu.
• Ngày 1–3 tháng kế: các phòng nộp dữ liệu và bằng chứng kỳ trước.
• Ngày 4–7: trưởng phòng, Kế toán, ESG đối chiếu; trả sai lệch.
• Ngày 8–10: trưởng ban duyệt, khóa kỳ, họp KPI và CAPA.
• Hằng quý: BGĐ rà mục tiêu, ngân sách, rủi ro, ý kiến NLĐ, yêu cầu buyer.
• Hằng năm: rà chủ đề; chốt kiểm kê; lập, soát xét, phê duyệt báo cáo.

Phân quyền: chủ đề/mục tiêu/năm cơ sở → BGĐ duyệt; dữ liệu tháng → trưởng phòng; khóa kỳ → trưởng ban ESG; hóa chất mới → người được ủy quyền (và buyer nếu yêu cầu); đầu tư → phân cấp vốn; phát hành báo cáo → BGĐ.
Tai nạn nặng, cháy, tràn lớn, nghi cưỡng bức lao động, chất cấm, sai lệch dữ liệu nghiêm trọng: kích hoạt SOP ngay, không chờ họp tháng.` },
  { id: "a13", category: "to-chuc", title: "Lộ trình 2026–2030 và kế hoạch khởi động Q4/2026", tags: ["lộ trình", "2026", "2030", "khởi động"], source: "Kế hoạch mục 7–9",
    summary: "Q4/2026 khởi động ban ESG và chốt dữ liệu tháng đầu; 2027 chốt năm cơ sở, đo công đoạn, Scope 3, mục tiêu 2030; 2028–2030 đầu tư, xác minh, đánh giá.",
    content: `Khởi động 10–12/2026: 07–16/10 giao trưởng ban và đầu mối; 17–31/10 thu bộ yêu cầu buyer, sổ nghĩa vụ, khảo sát hiện trường, kiểm kê đồng hồ và dữ liệu 2025–2026; 01–10/11 chốt dữ liệu tháng 10 lần đầu; 01–15/11 workshop chủ đề và từ điển KPI v1; 16–30/11 thử truy xuất một lô; 01–10/12 chốt tháng 11, rà hóa chất và nguồn nguyên liệu; 11–20/12 danh mục dự án và dự toán 2027; 21–31/12 BGĐ rà kết quả, hướng chọn năm cơ sở, giao kế hoạch Q1/2027.
Không lấy ba tháng quý IV nhân bốn để gọi là số liệu cả năm.

2027: Q1 chốt năm cơ sở và báo cáo 2026; Q2 đo công đoạn, xử lý rủi ro; Q3 truy xuất và sàng lọc Scope 3, PCF thí điểm; Q4 phê duyệt mục tiêu 2030 và đầu tư.
2028: Q1 báo cáo 2027 và kiểm tra bên ngoài (FEM, SLCP nếu buyer yêu cầu); Q2 triển khai đầu tư; Q3 mở rộng dữ liệu NCC; Q4 hậu kiểm hiệu quả.
2029: Q1 nâng chất lượng báo cáo; Q2 tối ưu công nghệ, vật liệu; Q3 kiểm tra sức bền hệ thống; Q4 dự báo khoảng cách 2030.
2030: Q1 chốt báo cáo 2029; Q2 hoàn tất dự án; Q3 rà soát độc lập; Q4 đánh giá mục tiêu 2030, phê duyệt giai đoạn 2031–2035.
Duy trì xuyên suốt: chốt dữ liệu tháng, họp quý, rà giấy phép và yêu cầu nhãn hàng, đào tạo, CAPA, kiểm soát phiên bản.` },
  { id: "a14", category: "to-chuc", title: "8 quy trình ESG cần nối với vận hành hiện có", tags: ["SOP", "quy trình", "CAPA"], source: "Kế hoạch mục 11",
    summary: "ESG 01 Yêu cầu & thay đổi; 02 Hóa chất; 03 Dữ liệu tháng; 04 Sự cố & CAPA; 05 Chất thải; 06 Truy xuất; 07 Lao động & phản ánh; 08 Đầu tư & công bố.",
    content: `ESG 01 Yêu cầu và thay đổi: nhận yêu cầu → kiểm tra phạm vi → giao chủ thực hiện → cập nhật SOP, KPI, phần mềm → đào tạo → xác nhận.
ESG 02 Hóa chất và vật liệu: Mua hàng đề nghị → Kỹ thuật, Hóa chất, EHS, QA đánh giá → duyệt → nhập cách ly/giải phóng → cấp theo lô → kiểm tra thay đổi.
ESG 03 Dữ liệu tháng: người ghi lập từ nguồn → trưởng phòng kiểm → Kế toán đối chiếu → ESG kiểm phương pháp → trưởng ban duyệt → IT khóa → phát hành.
ESG 04 Sự cố và CAPA: bảo vệ người → thông báo theo nghĩa vụ → bảo toàn chứng cứ → nguyên nhân gốc → hành động → kiểm tra hiệu lực → đóng.
ESG 05 Chất thải: phân loại tại nguồn → cân/ghi → lưu tạm → kiểm tra đơn vị tiếp nhận → bàn giao → đối chiếu.
ESG 06 Truy xuất: mã NCC/lô → lệnh cấp → mẻ/công đoạn → QA → thùng → chuyến xuất; sửa nhãn/gộp/tách lô có lịch sử.
ESG 07 Lao động và phản ánh: HR thu hồ sơ, chấm công, lương → đối soát → phản ánh bảo mật → xử lý độc lập → phản hồi → kiểm tra không trả đũa.
ESG 08 Đầu tư và công bố: lập phương án → đánh giá pháp lý/an toàn/chất lượng/tài chính → duyệt → đo nghiệm thu. Báo cáo chỉ dùng kết quả đã kiểm tra.
Mỗi SOP cần: mục đích, phạm vi, trách nhiệm, bước làm, tiêu chí chuyển bước, ngoại lệ, biểu mẫu, thời hạn lưu, người duyệt.` },
  { id: "a15", category: "yeu-cau", title: "Bộ yêu cầu ba lớp: pháp luật, nhãn hàng, khung báo cáo", tags: ["pháp luật", "adidas", "A-01", "GRI", "EUDR", "nguồn chính thức"], source: "Kế hoạch mục 2 – cần đối chiếu nguồn và phạm vi áp dụng",
    summary: "Quản lý song song nghĩa vụ pháp luật tại cơ sở, yêu cầu hợp đồng/nhãn hàng và chuẩn phương pháp doanh nghiệp lựa chọn.",
    content: `Pháp luật Việt Nam: giấy phép môi trường và quan trắc, xây dựng/PCCC, an toàn lao động, hóa chất, lao động, bảo hiểm, chất thải, bảo vệ dữ liệu, kiểm kê KNK. Tra văn bản hiện hành theo pháp nhân/cơ sở/địa chỉ; lưu nguồn chính thức, ngày hiệu lực và kết luận áp dụng. Số hiệu và ngày trong tài liệu gốc cần đối chiếu, không tự coi là đã xác minh.
adidas: nếu doanh nghiệp có khách hàng adidas, lấy Workplace Standards, Environmental Guidelines và A-01 do đầu mối nhãn hàng xác nhận, kèm phiên bản, ngày hiệu lực và phạm vi. Không mặc định mọi doanh nghiệp đều có nghĩa vụ adidas.
Nhãn hàng rubber boots khác: lập từng dòng – mã khách, thị trường, RSL/MRSL, nguồn cao su, kiểm nghiệm, tiêu chí xã hội, biểu mẫu, portal, lịch nộp, đơn vị đánh giá chấp nhận.
Khung: GRI (tác động), GHG Protocol (kiểm kê), Higg FEM (môi trường cấp cơ sở).
Hóa chất: MRSL (ZDHC) kiểm soát đầu vào; RSL/A-01 kiểm soát vật liệu và sản phẩm; SDS phục vụ nhận diện nguy hại, không thay kết quả thử.
EUDR: với cao su và hàng xuất EU, kiểm tra mã CN/HS, nguyên liệu, vai trò giao dịch, phạm vi Annex I và thời điểm áp dụng tại nguồn EU chính thức; không suy ra mọi rubber boots đều thuộc EUDR.` },
  { id: "a16", category: "yeu-cau", title: "Thông tin cần bổ sung để phê duyệt chính thức", tags: ["phê duyệt", "biên bản", "thông tin"], source: "Kế hoạch mục 19",
    summary: "Danh sách thông tin và quyết định phải ghi thành biên bản trước khi triển khai chính thức.",
    content: `Cần có: tên pháp nhân, địa chỉ, danh sách cơ sở (BGĐ/Hành chính); danh sách nhãn hàng, thị trường, tài liệu được giao (Kinh doanh); công đoạn tự làm và thuê ngoài (Kỹ thuật/SX); thiết bị nhiệt, nhiên liệu, điện, nước, xử lý chất thải (Cơ điện/EHS); hồ sơ điện, nhiên liệu, nước, vật liệu, sản lượng, HR 2025–2026 (Kế toán/Kho/SX/HR); bảng chấm audit gốc và CAPA mở (ESG/tư vấn); sơ đồ tổ chức, SOP, nguồn lực; hệ thống phần mềm và đặc tả kết nối (IT/Kho/Kinh doanh).

Quyết định cần biên bản: chấp thuận phạm vi; bổ nhiệm trưởng ban và điều phối; giao đầu mối; duyệt lịch chốt dữ liệu; giao khắc phục rủi ro khẩn cấp; duyệt khảo sát và điểm đo; cách chọn năm cơ sở; xác nhận chưa công bố mục tiêu giảm định lượng khi chưa đủ căn cứ.

Đào tạo: 10/2026 BGĐ và trưởng phòng (bài tập duyệt một yêu cầu buyer); 11/2026 đầu mối dữ liệu (hoàn thành một bộ dữ liệu tháng); 12/2026 Kho, Hóa chất, SX, QA (truy một lô, xử lý một ngoại lệ); 2027+ theo công việc mới, kiểm tra năng lực sau học.` },
  { id: "a17", category: "thuat-ngu", title: "Thuật ngữ ESG dùng trong bộ hướng dẫn", tags: ["thuật ngữ", "CAPA", "SDS", "MRSL", "PCF"], source: "Kế hoạch – Thuật ngữ",
    summary: "ESG/EHS, Buyer/NCC, BOM/PO, CAPA, SDS/RSL/MRSL, KNK/PCF/FEM/SLCP, T1/T2.",
    content: `ESG: môi trường, xã hội, quản trị. EHS: môi trường, sức khỏe và an toàn.
Buyer: khách hàng hoặc nhãn hàng. NCC: nhà cung cấp.
BOM: định mức/cấu trúc vật liệu. PO: đơn đặt hàng.
CAPA: hành động khắc phục và phòng ngừa; cần kiểm tra nguyên nhân và hiệu lực.
SDS: phiếu an toàn hóa chất. RSL: danh mục chất hạn chế trên vật liệu/sản phẩm. MRSL: danh mục chất hạn chế trong sản xuất.
KNK: khí nhà kính. PCF: dấu chân carbon sản phẩm. FEM: Higg Facility Environmental Module. SLCP: chương trình hội tụ dữ liệu xã hội và lao động.
T1/T2: cấp nhà cung cấp trong chuỗi của nhãn hàng.
Scope 1/2/3: phát thải trực tiếp / năng lượng mua ngoài / chuỗi giá trị.
Năm cơ sở: mốc tham chiếu để đo mức giảm. Cường độ: lượng tiêu thụ hoặc phát thải trên mỗi đôi đạt.
Double materiality: đánh giá trọng yếu kép (tác động + tài chính). EPD: tuyên bố môi trường sản phẩm. TRIR: tỷ lệ thương tích ghi nhận được.` },
  { id: "a18", category: "thuat-ngu", title: "Nguồn tham khảo (T1–T2, N1–N16)", tags: ["nguồn", "GRI", "GHG Protocol", "ZDHC", "AFIRM"], source: "Kế hoạch mục 20",
    summary: "Danh mục nguồn do tài liệu gốc cung cấp; kiểm tra văn bản, phiên bản và trang gốc trước sử dụng.",
    content: `T1 ASD – Tầm nhìn ESG và phương pháp báo cáo phát triển bền vững (42 trang, 07/10/2026).
T2 Ghi chép buổi tư vấn – Tổng quan ESG và điểm xuất phát.
N1 adidas Workplace Standards – adidas-group.com/en/sustainability/transparency/policies
N2 adidas A-01 Policy: xin bản và phạm vi áp dụng được nhãn hàng xác nhận.
N3 adidas Environmental Guidelines 2019.
N4 adidas Annual Report – mục tiêu tập đoàn chỉ để tham khảo; đối chiếu báo cáo gốc và không gán cho nhà máy.
N5 GRI 1 Foundation 2021 – globalreporting.org
N6 GRI 3 Material Topics 2021.
N7 GRI Climate Change & Energy: kiểm tra phiên bản, ngày hiệu lực và điều kiện áp dụng sớm tại globalreporting.org.
N8 GHG Protocol Corporate Standard – ghgprotocol.org/corporate-standard
N9 GHG Protocol Scope 2 Guidance.
N10 GHG Protocol Scope 3 Standard.
N11 ZDHC MRSL – zdhc.org/mrsl
N12 AFIRM RSL 2026 – afirm-group.com/afirm-rsl
N13 Cascale – An Introduction to Higg FEM.
N14 HSE Rubber COSHH essentials – hse.gov.uk/coshh/essentials/direct-advice/rubber.htm
N15 Văn bản danh mục kiểm kê KNK hiện hành – vanban.chinhphu.vn; kiểm tra số hiệu/ngày từ văn bản gốc.
N16 European Commission – nguồn EUDR chính thức; kiểm tra phạm vi và thời điểm áp dụng hiện hành.
Báo cáo tham chiếu: Dunlop ESG 2024 (dunlopboots.com), Rocky Brands CSR 2023, Fulgent Sun ESG 2023, Yue Yuen ESG 2023/2024, Pou Chen 2024, Eclat 2024, adidas AR 2024, PUMA sustainability reporting.
Trước khi áp dụng, kiểm tra văn bản, phiên bản tiêu chuẩn và yêu cầu nhãn hàng có hiệu lực.` },
];

export type ChecklistItem = { code: string; group: string; text: string; help: string };

export const CHECKLIST: ChecklistItem[] = [
  { code: "G1", group: "Quản trị và tổ chức", text: "Đã có quyết định thành lập ban ESG với trưởng ban, điều phối và đầu mối từng phòng ban (có người thay thế).", help: "Kế hoạch mục 3" },
  { code: "G2", group: "Quản trị và tổ chức", text: "Đã chốt phạm vi báo cáo: pháp nhân, cơ sở, công đoạn, nhà thầu, kỳ báo cáo.", help: "Quyết định cần chốt" },
  { code: "G3", group: "Quản trị và tổ chức", text: "Có lịch chốt dữ liệu tháng (ngày 1–10) và lịch họp quý được BGĐ duyệt.", help: "Kế hoạch mục 4" },
  { code: "G4", group: "Quản trị và tổ chức", text: "Người nhập, người kiểm, người duyệt dữ liệu được tách bước và phân quyền trong phần mềm.", help: "ESG 03; IT" },
  { code: "G5", group: "Quản trị và tổ chức", text: "Có kênh phản ánh bảo mật, không trả đũa cho người lao động.", help: "ESG 07" },
  { code: "R1", group: "Yêu cầu và tuân thủ", text: "Sổ nghĩa vụ pháp luật (giấy phép môi trường, PCCC, ATLĐ, hóa chất, lao động, chất thải) có điều khoản, hạn và người phụ trách.", help: "Kế hoạch mục 2" },
  { code: "R2", group: "Yêu cầu và tuân thủ", text: "Đã đối chiếu văn bản danh mục kiểm kê KNK hiện hành theo pháp nhân/cơ sở và lưu kết luận áp dụng.", help: "N15; nguồn chính thức và phiên bản" },
  { code: "R3", group: "Yêu cầu và tuân thủ", text: "Đã có bộ tài liệu được từng nhãn hàng (adidas và các nhãn boots) xác nhận bằng văn bản, kèm phiên bản.", help: "Kinh doanh" },
  { code: "R4", group: "Yêu cầu và tuân thủ", text: "Đã xác định phiên bản GRI, GHG Protocol áp dụng cho kỳ báo cáo sắp tới.", help: "N5–N10" },
  { code: "D1", group: "Dữ liệu và bằng chứng", text: "Có danh mục đồng hồ điện, nước, nhiên liệu với hệ số nhân, vị trí và lịch kiểm định.", help: "Cơ điện" },
  { code: "D2", group: "Dữ liệu và bằng chứng", text: "Đã lập bản đồ dữ liệu 2025–2026: tháng nào có hồ sơ, thiếu, hoặc phải ước tính.", help: "Khởi động 17–31/10" },
  { code: "D3", group: "Dữ liệu và bằng chứng", text: "Từ điển KPI phiên bản 1 đã được duyệt với định nghĩa, đơn vị, mẫu số, chủ dữ liệu.", help: "Mục 14–15" },
  { code: "D4", group: "Dữ liệu và bằng chứng", text: "Đã chốt ít nhất một kỳ dữ liệu tháng có đối chiếu điện, nước, sản lượng, tồn kho, lao động.", help: "01–10/11/2026" },
  { code: "D5", group: "Dữ liệu và bằng chứng", text: "Sổ bằng chứng có mã, đường dẫn, chủ sở hữu, kỳ, phiên bản; cấu trúc ESG/Năm/Cơ_sở/Chủ_đề/Tháng.", help: "Mục 16" },
  { code: "D6", group: "Dữ liệu và bằng chứng", text: "Đã có hướng chọn năm cơ sở (2025 hoặc 2026) được BGĐ xác nhận, có lý do.", help: "21–31/12/2026" },
  { code: "E1", group: "Môi trường", text: "Ranh giới tổ chức và vận hành cho kiểm kê KNK đã được xác lập trước khi chọn hệ số.", help: "Mục 13" },
  { code: "E2", group: "Môi trường", text: "Đã khảo sát từng công đoạn: sơ đồ nguồn thải, điểm xả, mối nguy, CAPA ưu tiên.", help: "EHS/Kỹ thuật" },
  { code: "E3", group: "Môi trường", text: "Danh mục hóa chất liên kết SDS, trạng thái phê duyệt, chứng cứ MRSL/RSL đúng phạm vi.", help: "Hóa chất" },
  { code: "E4", group: "Môi trường", text: "Chất thải được phân loại tại nguồn, cân/ghi, chuyển cho đơn vị có giấy phép với chứng từ.", help: "ESG 05" },
  { code: "S1", group: "Xã hội", text: "Chấm công, tăng ca, lương, bảo hiểm được đối chiếu hằng tháng; ngoại lệ có lưu vết.", help: "HR" },
  { code: "S2", group: "Xã hội", text: "Thiết bị áp lực, che chắn, liên động, hút khí, PCCC được kiểm định và bảo trì theo lịch.", help: "Cơ điện/EHS" },
  { code: "S3", group: "Xã hội", text: "Đào tạo an toàn, hóa chất, quy tắc ứng xử có kiểm tra năng lực sau học.", help: "HR/EHS" },
  { code: "C1", group: "Chuỗi cung ứng và truy xuất", text: "Danh mục nhà cung cấp có mã duy nhất, cơ sở sản xuất, phân loại rủi ro.", help: "Mua hàng" },
  { code: "C2", group: "Chuỗi cung ứng và truy xuất", text: "Đã thử truy xuất hai chiều một lô: NCC – lô – mẻ – thùng – chuyến xuất.", help: "16–30/11/2026" },
  { code: "C3", group: "Chuỗi cung ứng và truy xuất", text: "Hồ sơ nguồn gốc cao su tự nhiên, da, bao bì theo BOM; thiếu hồ sơ được đánh dấu.", help: "Mua hàng" },
];

export const DEPARTMENTS = [
  "ESG và EHS", "Kinh doanh", "Mua hàng", "Trung tâm kỹ thuật", "Hóa chất", "Sản xuất và sinh quản",
  "Hạ tầng và xây dựng", "Cơ điện và bảo trì", "Kế toán và tài chính", "Kho vận", "IT và hệ thống",
  "Nhân sự và hành chính", "QA và QC", "Ban giám đốc",
];

export const QUICK_QUESTIONS = [
  "Scope 1, 2, 3 khác nhau thế nào?",
  "Chúng tôi nên chọn năm cơ sở nào?",
  "Bắt đầu ESG cần làm gì trong 3 tháng đầu?",
  "Cấu trúc một báo cáo ESG gồm những chương nào?",
  "Thế nào là greenwashing và cách tránh?",
  "Chủ đề trọng yếu được xác định như thế nào?",
];
