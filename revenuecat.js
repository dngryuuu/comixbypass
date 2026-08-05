let body = $response.body;

if (body) {
    try {
        let obj = JSON.parse(body);

        if (obj && obj.subscriber) {
            
            const entitlementName = "EasyComix Pro";
            const productId = "app.easycomix.weekly";
            const farFutureDate = "2099-12-31T23:59:59Z";

            obj.subscriber.entitlements[entitlementName] = {
                "expires_date": farFutureDate,
                "grace_period_expires_date": null,
                "product_identifier": productId,
                "purchase_date": "2026-08-05T22:15:16Z"
            };

            obj.subscriber.subscriptions[productId] = {
                "auto_resume_date": null,
                "billing_issues_detected_at": null,
                "display_name": "Pro Member",
                "expires_date": farFutureDate,
                "grace_period_expires_date": null,
                "is_sandbox": false,
                "management_url": "https://apps.apple.com/account/subscriptions",
                "original_purchase_date": "2026-08-05T22:15:16Z",
                "ownership_type": "PURCHASED",
                "period_type": "normal",
                "price": {
                    "amount": 0,
                    "currency": "USD"
                },
                "purchase_date": "2026-08-05T22:15:16Z",
                "refunded_at": null,
                "store": "app_store",
                "store_transaction_id": "30003444945602",
                "unsubscribe_detected_at": null
            };

            body = JSON.stringify(obj);

            console.log("================ [REVENUE - AFTER] ================");
            console.log(body);
        }
    } catch (e) {
        console.log(e);
    }
}

$done({ body });
