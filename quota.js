let body = $response.body;

if (body) {
    try {
        console.log("================ [EASYCOMIX QUOTA - BEFORE] ================");
        console.log(body);
        let obj = JSON.parse(body);

        if (obj.data && typeof obj.data === "object") {
            obj.data.quota.tier = "pro";
            obj.data.quota.remaining = "9999";
            obj.data.liveQuota.tier = "pro";
            obj.data.liveQuota.remaining = "9999";
            obj.success = true;
            body = JSON.stringify(obj);
            console.log("================ [EASYCOMIX QUOTA - AFTER] ================");
            console.log(body);
        }
    } catch (e) {
        console.log("Error: " + e);
    }
}

$done({ body });
