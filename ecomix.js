let body = $response.body;

if (body) {
    try {
        let obj = JSON.parse(body);

        if (obj.data && typeof obj.data === "object") {
            // Chuyển loại tài khoản sang vip/premium
            obj.data.subscriptionType = "premium";
            
            obj.data.activeEntitlementId = "unlimited";
            
            obj.data.subscriptionEndDate = "2099-12-31T23:59:59.000Z";
            
            obj.data.subscriptionProvider = "apple";
            
            obj.success = true;

            console.log("+++" + obj.data);
        }

        body = JSON.stringify(obj);
    } catch (e) {
        console.log(e);
    }
}

$done({ body });
