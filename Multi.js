var ua = ($request.headers["User-Agent"] || $request.headers["user-agent"] || "").toLowerCase();
var body = $response.body;

if (body) {
    try {
        var obj = JSON.parse(body);
        if (!obj.subscriber) {
            obj.subscriber = { subscriptions: {}, entitlements: {} };
        }

        const farFutureDate = "2099-12-31T23:59:59Z";
        const standardDate = "2005-01-09T10:10:14Z";

        // 1. Phân loại cho EasyComix dựa vào User-Agent
        if (ua.includes("easycomix") || ua.includes("comix")) {
            const entitlementName = "EasyComix Pro";
            const productId = "app.easycomix.weekly";

            obj.subscriber.entitlements[entitlementName] = {
                "expires_date": farFutureDate,
                "grace_period_expires_date": null,
                "product_identifier": productId,
                "purchase_date": standardDate
            };

            obj.subscriber.subscriptions[productId] = {
                "auto_resume_date": null,
                "billing_issues_detected_at": null,
                "display_name": "Pro Member",
                "expires_date": farFutureDate,
                "grace_period_expires_date": null,
                "is_sandbox": false,
                "management_url": "https://apps.apple.com/account/subscriptions",
                "original_purchase_date": standardDate,
                "ownership_type": "PURCHASED",
                "period_type": "normal",
                "price": { "amount": 0, "currency": "USD" },
                "purchase_date": standardDate,
                "refunded_at": null,
                "store": "app_store",
                "store_transaction_id": "30003444945602",
                "unsubscribe_detected_at": null
            };
        } 
        else {         
            const mapping = {
                '%E8%BD%A6%E7%A5%A8%E7%A5%A8': ['vip+watch_vip'],
                'locket': ['Gold']
            };

            var duyvinh09 = {
                auto_resume_date: null,
                display_name: "locket_1600_1y",
                is_sandbox: true,
                ownership_type: "PURCHASED",
                billing_issues_detected_at: null,
                management_url: "https://apps.apple.com/account/subscriptions",
                period_type: "normal",
                price: { "amount": 399000.0, "currency": "VND" },
                expires_date: "9999-01-09T10:10:14Z",
                grace_period_expires_date: null,
                refunded_at: null,
                unsubscribe_detected_at: null,
                original_purchase_date: standardDate,
                purchase_date: standardDate,
                store: "app_store",
                store_transaction_id: "2000001108724193",
            };

            var locketGold = {
                grace_period_expires_date: null,
                purchase_date: standardDate,
                product_identifier: "locket_1600_1y",
                expires_date: "9999-01-09T10:10:14Z"
            };

            const match = Object.keys(mapping).find(e => ua.includes(e.toLowerCase()));
            if (match) {
                let [e, s] = mapping[match];
                if (s) {
                    locketGold.product_identifier = s;
                    obj.subscriber.subscriptions[s] = duyvinh09;
                } else {
                    obj.subscriber.subscriptions["locket_1600_1y"] = duyvinh09;
                }
                obj.subscriber.entitlements[e] = locketGold;
            } else {
                obj.subscriber.subscriptions["locket_1600_1y"] = duyvinh09;
                obj.subscriber.entitlements.pro = locketGold;
            }
        }

        body = JSON.stringify(obj);
    } catch (e) {
        console.log("RevenueCat Script Error: " + e);
    }
}

$done({ body });
