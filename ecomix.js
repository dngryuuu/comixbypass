let body = $response.body;

if (body) {
    try {
        let obj = JSON.parse(body);

        if (obj.data && typeof obj.data === "object") {
            obj.data.subscriptionType = "premium";
            obj.data.activeEntitlementId = "weekly";
            obj.data.subscriptionEndDate = "2099-12-31T23:59:59.000Z";
            obj.data.subscriptionProvider = "apple";
            obj.success = true;
            body = JSON.stringify(obj);
            console.log("================ [EASYCOMIX - AFTER] ================");
            console.log(body);
        }
    } catch (e) {
        console.log("Error: " + e);
    }
}

$done({ body });
