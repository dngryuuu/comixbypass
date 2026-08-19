
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

    let requestBody = $request.body;
    if (!requestBody) {
        log("❌ Request Body rỗng!");
        $done({});
        return;
    }

    let parsedReq = {};
    try {
        parsedReq = JSON.parse(requestBody);
    } catch (e) {
        log("💥 Lỗi Parse Request Body", e.toString());
        $done({});
        return;
    }

    let originalTexts = parsedReq.texts || [];
    if (!originalTexts || originalTexts.length === 0) {
        log("⚠️ Không tìm thấy mảng text trong Request!");
        $done({});
        return;
    }

    let vercelPayload = {
        sourceLanguage: parsedReq.sourceLanguage || "ja",
        targetLanguage: parsedReq.targetLanguage || "vi",
        texts: originalTexts
    };

    $httpClient.post({
        url: VERCEL_API_URL,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(vercelPayload),
        timeout: 10
    }, function(error, response, data) {
        if (error || !data) {
            log("❌ Lỗi gọi Vercel", error);
            $done({});
            return;
        }

        try {
            let vercelData = JSON.parse(data);
            let translatedTexts = vercelData.translations || (vercelData.data && vercelData.data.translations) || [];

            let fakeResponseBody = {
                success: true,
                data: {
                    translations: translatedTexts
                }
            };

            let responseString = JSON.stringify(fakeResponseBody);

            log("Sending Mock 200 OK to App");
            
            // Ép trả về với đầy đủ Header tiêu chuẩn
            $done({
                status: 200,
                headers: {
                    "Content-Type": "application/json; charset=utf-8",
                    "Content-Length": responseString.length.toString(),
                    "Connection": "keep-alive",
                    "Cache-Control": "no-store",
                    "Access-Control-Allow-Origin": "*"
                },
                body: responseString
            });
            return;

        } catch (e) {
            log("💥 Lỗi Parse Response JSON từ Vercel", e.toString());
            $done({});
        }
    });
}

main();
