/**
 * Shadowrocket Script - EasyComix Quota Bypass & Gemini Translator
 * Type: response
 * URL Pattern: ^https?:\/\/api\.easycomix\.app\/api\/v1\/translate
 */

const VERCEL_API_URL = "https://gemini-api-self-rho.vercel.app/api/translate";

function log(msg, data = null) {
    const prefix = "[EasyComix-Debug]";
    if (data !== null) {
        console.log(`${prefix} ${msg}:\n${typeof data === 'object' ? JSON.stringify(data, null, 2) : data}`);
    } else {
        console.log(`${prefix} ${msg}`);
    }
}

function main() {
    log("================== START INTERCEPT ==================");

    // 1. LẤY REQUEST BODY (Nơi chứa mảng text Tiếng Nhật/Trung gốc)
    let requestBody = $request.body;
    log("Raw Request Body from App", requestBody);

    if (!requestBody) {
        log("❌ Request Body rỗng! Kiểm tra cấu hình Module xem đã có 'requires-body=1' chưa.");
        $done({});
        return;
    }

    let parsedReq = {};
    try {
        parsedReq = JSON.parse(requestBody);
        log("Parsed Request Body", parsedReq);
    } catch (e) {
        log("💥 Lỗi Parse Request Body", e.toString());
        $done({});
        return;
    }

    // 2. Trích xuất mảng text từ Request gốc của App
    // EasyComix thường gửi dạng: { "texts": ["..."] } hoặc { "data": ["..."] }
    let originalTexts = parsedReq.texts || parsedReq.data || parsedReq.content || [];
    if (Array.isArray(originalTexts) && typeof originalTexts[0] === 'object') {
        originalTexts = originalTexts.map(item => item.text || item.content || "");
    }

    log("Extracted Original Texts", originalTexts);

    if (!originalTexts || originalTexts.length === 0) {
        log("⚠️ Không tìm thấy mảng text trong Request!");
        $done({});
        return;
    }

    // 3. Gửi mảng text đó sang Vercel cho Gemini dịch
    let vercelPayload = {
        sourceLanguage: parsedReq.sourceLanguage || "ja",
        targetLanguage: "vi",
        texts: originalTexts
    };

    log("Sending to Vercel Payload", vercelPayload);

    $task.fetch({
        url: VERCEL_API_URL,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(vercelPayload)
    }).then(
        (response) => {
            log("Vercel Status Code", response.statusCode);
            log("Vercel Response Body", response.body);

            if (response.statusCode === 200 || response.statusCode === 201) {
                let vercelData = JSON.parse(response.body);
                let translatedTexts = vercelData.translations || (vercelData.data && vercelData.data.translations) || [];

                log("Translated Texts Received", translatedTexts);

                // 4. MOCK RESPONSE HTTP 200 OK TRẢ VỀ CHO APP
                // Biến HTTP Status 429 (Lỗi hết Quota) thành HTTP 200 OK thành công
                let fakeResponseBody = {
                    success: true,
                    data: {
                        translations: translatedTexts
                    }
                };

                log("Mocking 200 OK Response to App", fakeResponseBody);
                log("=================== END INTERCEPT (SUCCESS) ===================");

                $done({
                    status: 200,
                    headers: {
                        "Content-Type": "application/json; charset=utf-8",
                        "Access-Control-Allow-Origin": "*",
                        "Access-Control-Allow-Credentials": "true"
                    },
                    body: JSON.stringify(fakeResponseBody)
                });
                return;
            }

            log("❌ Vercel Lỗi Status: " + response.statusCode);
            $done({});
        },
        (reason) => {
            log("❌ Lỗi fetch Vercel", reason.error);
            $done({});
        }
    );
}

main();
