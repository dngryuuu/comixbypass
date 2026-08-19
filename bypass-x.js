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

    // 1. LẤY REQUEST BODY TỪ APP
    let requestBody = $request.body;
    log("Raw Request Body from App", requestBody);

    if (!requestBody) {
        log("❌ Request Body rỗng! Kiểm tra option 'requires-body=1' trong config.");
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

    // 2. TRÍCH XUẤT MẢNG TEXT
    let originalTexts = parsedReq.texts || [];
    log("Extracted Original Texts", originalTexts);

    if (!originalTexts || originalTexts.length === 0) {
        log("⚠️ Không tìm thấy mảng text trong Request!");
        $done({});
        return;
    }

    // 3. ĐÓNG GÓI PAYLOAD GỬI VERCEL
    let vercelPayload = {
        sourceLanguage: parsedReq.sourceLanguage || "ja",
        targetLanguage: parsedReq.targetLanguage || "vi",
        texts: originalTexts
    };

    log("Sending to Vercel Payload", vercelPayload);

    // 4. GỬI HTTP REQUEST (Cú pháp chuẩn Shadowrocket: $httpClient.post)
    let requestOptions = {
        url: VERCEL_API_URL,
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(vercelPayload)
    };

    $httpClient.post(requestOptions, function(error, response, data) {
        if (error) {
            log("❌ Lỗi $httpClient.post tới Vercel", error);
            $done({});
            return;
        }

        log("Vercel Response Status Code", response.status || response.statusCode);
        log("Vercel Raw Body", data);

        if ((response.status === 200 || response.statusCode === 200) && data) {
            try {
                let vercelData = JSON.parse(data);
                let translatedTexts = vercelData.translations || (vercelData.data && vercelData.data.translations) || [];

                log("Translated Texts Received", translatedTexts);

                // 5. MOCK RESPONSE 200 OK CHO APP EASYCOMIX
                let fakeResponseBody = {
                    success: true,
                    data: {
                        translations: translatedTexts
                    }
                };

                log("Mocking HTTP 200 Response back to App", fakeResponseBody);
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

            } catch (e) {
                log("💥 Lỗi Parse Response JSON từ Vercel", e.toString());
            }
        }

        log("❌ Gọi Vercel thất bại hoặc không nhận được HTTP 200");
        $done({});
    });
}

main();
