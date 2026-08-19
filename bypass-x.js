/**
 * Shadowrocket Script - EasyComix Full Debug & Gemini Translator
 * Type: response
 * URL Pattern: ^https?:\/\/.*easycomix.*\/
 */

const VERCEL_API_URL = "https://gemini-api-self-rho.vercel.app/api/translate";

// Bật/Tắt chế độ thử nghiệm xóa Signature Header
// true = Xóa Header signature để ép App bỏ qua bước verify
// false = Giữ nguyên Header signature gốc
const REMOVE_SIGNATURE_HEADER = true; 

function log(msg, data = null) {
    const prefix = "[EasyComix-Debug]";
    if (data) {
        if (typeof data === 'object') {
            console.log(`${prefix} ${msg}:\n${JSON.stringify(data, null, 2)}`);
        } else {
            console.log(`${prefix} ${msg}: ${data}`);
        }
    } else {
        console.log(`${prefix} ${msg}`);
    }
}

function main() {
    log("================== START INTERCEPT ==================");
    log("URL Request", $request.url);
    log("Method", $request.method);

    // 1. Kiểm tra Response Body gốc từ EasyComix
    let responseBody = $response.body;
    let responseHeaders = { ...$response.headers };

    log("Response Status Code", $response.status || $response.statusCode);
    log("Original Response Headers", responseHeaders);

    if (!responseBody) {
        log("❌ Response Body rỗng, bỏ qua xử lý!");
        log("=================== END INTERCEPT ===================");
        $done({});
        return;
    }

    try {
        let jsonObj = JSON.parse(responseBody);
        log("Original Response Body (JSON)", jsonObj);

        // 2. Trích xuất mảng text/bubbles cần dịch từ JSON gốc
        let originalTexts = extractTextsFromJSON(jsonObj);
        log("Extracted Texts count", originalTexts.length);
        log("Extracted Texts list", originalTexts);

        if (!originalTexts || originalTexts.length === 0) {
            log("⚠️ Không tìm thấy mảng text nào cần dịch trong JSON!");
            log("=================== END INTERCEPT ===================");
            $done({});
            return;
        }

        // 3. Chuẩn bị Payload gửi sang Vercel
        let vercelPayload = {
            sourceLanguage: "ja",
            targetLanguage: "vi",
            texts: originalTexts
        };

        log("Sending Payload to Vercel", vercelPayload);

        let requestToVercel = {
            url: VERCEL_API_URL,
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(vercelPayload)
        };

        // 4. Gọi Vercel (Gemini) để dịch
        let startTime = Date.now();
        $task.fetch(requestToVercel).then(
            (response) => {
                let duration = Date.now() - startTime;
                log(`Vercel Responded in ${duration}ms with Status`, response.statusCode);
                log("Vercel Raw Response Body", response.body);

                if (response.statusCode === 200 || response.statusCode === 201) {
                    let vercelData = JSON.parse(response.body);
                    
                    // Lấy kết quả dịch từ Response của Vercel (Hỗ trợ nhiều dạng format response)
                    let translatedTexts = [];
                    if (vercelData.data && vercelData.data.translations) {
                        translatedTexts = vercelData.data.translations;
                    } else if (vercelData.translations) {
                        translatedTexts = vercelData.translations;
                    }

                    log("Translated Texts received", translatedTexts);

                    if (translatedTexts && translatedTexts.length > 0) {
                        // 5. Ghi đè text Tiếng Việt vào JSON gốc
                        let updatedJSON = replaceTextsInJSON(jsonObj, translatedTexts);
                        log("Updated Response Body (JSON)", updatedJSON);

                        // 6. Xử lý Header Signature
                        if (REMOVE_SIGNATURE_HEADER) {
                            log("🔥 Đang tiến hành XÓA các Header Signature để test bypass...");
                            Object.keys(responseHeaders).forEach((key) => {
                                if (key.toLowerCase().includes("signature") || key.toLowerCase().includes("sign")) {
                                    log(`Deleted Header: ${key} = ${responseHeaders[key]}`);
                                    delete responseHeaders[key];
                                }
                            });
                        }

                        log("Final Headers sent to App", responseHeaders);
                        log("=================== END INTERCEPT (SUCCESS) ===================");

                        $done({
                            body: JSON.stringify(updatedJSON),
                            headers: responseHeaders
                        });
                        return;
                    } else {
                        log("❌ Vercel không trả về mảng translations hợp lệ!");
                    }
                } else {
                    log("❌ Lỗi khi gọi Vercel API, HTTP Code:", response.statusCode);
                }

                log("=================== END INTERCEPT (FALLBACK) ===================");
                $done({});
            },
            (reason) => {
                log("❌ Lỗi kết nối $task.fetch tới Vercel:", reason.error);
                log("=================== END INTERCEPT (ERROR) ===================");
                $done({});
            }
        );

    } catch (e) {
        log("💥 Script Exception Error:", e.toString());
        log("Stack trace:", e.stack);
        log("=================== END INTERCEPT (EXCEPTION) ===================");
        $done({});
    }
}

/**
 * HÀM BỔ TRỢ 1: Lấy danh sách câu thoại từ JSON EasyComix
 * BẠN CẦN SOI LOG ĐỂ SỬA HÀM NÀY CHO KHỚP VỚI CẤU TRÚC THỰC TẾ CỦA EASYCOMIX
 */
function extractTextsFromJSON(obj) {
    let texts = [];

    // Trường hợp 1: Dạng {"data": {"texts": ["...", "..."]}}
    if (obj && obj.data && Array.isArray(obj.data.texts)) {
        return obj.data.texts;
    }

    // Trường hợp 2: Dạng {"data": {"bubbles": [{"text": "..."}, ...]}}
    if (obj && obj.data && Array.isArray(obj.data.bubbles)) {
        return obj.data.bubbles.map(b => b.text || "");
    }

    // Trường hợp 3: Dạng {"bubbles": [{"text": "..."}, ...]}
    if (obj && Array.isArray(obj.bubbles)) {
        return obj.bubbles.map(b => b.text || "");
    }

    // Trường hợp 4: Duyệt đệ quy tìm tất cả key "text" trong JSON nếu chưa biết cấu trúc
    function recursiveFind(item) {
        if (!item) return;
        if (typeof item === 'object') {
            for (let key in item) {
                if (key === 'text' && typeof item[key] === 'string') {
                    texts.push(item[key]);
                } else {
                    recursiveFind(item[key]);
                }
            }
        }
    }
    recursiveFind(obj);

    return texts;
}

/**
 * HÀM BỔ TRỢ 2: Thay thế text cũ bằng text đã dịch
 */
function replaceTextsInJSON(obj, newTexts) {
    let index = 0;

    // Trường hợp 1: Mảng texts trực tiếp
    if (obj && obj.data && Array.isArray(obj.data.texts)) {
        obj.data.texts = newTexts;
        return obj;
    }

    // Trường hợp 2 & 3: Thay vào mảng bubbles
    let bubbles = (obj.data && obj.data.bubbles) || obj.bubbles;
    if (Array.isArray(bubbles)) {
        bubbles.forEach((b, i) => {
            if (newTexts[i] !== undefined) {
                b.text = newTexts[i];
            }
        });
        return obj;
    }

    // Trường hợp 4: Đệ quy thay thế lại toàn bộ key "text"
    function recursiveReplace(item) {
        if (!item) return;
        if (typeof item === 'object') {
            for (let key in item) {
                if (key === 'text' && typeof item[key] === 'string') {
                    if (newTexts[index] !== undefined) {
                        item[key] = newTexts[index];
                    }
                    index++;
                } else {
                    recursiveReplace(item[key]);
                }
            }
        }
    }
    recursiveReplace(obj);

    return obj;
}

main();
