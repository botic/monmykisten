const Firestore = require("@google-cloud/firestore");

const firestore = new Firestore({
    projectId: process.env.GCP_PROJECTID,
    timestampsInSnapshots: true,
});

exports.monitor = async (req, res) => {
    const remoteAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const secret = process.env.MONITOR_SECRET || "secret";

    if (req.method === "POST") {
        // check the client id
        if (!(req.query && req.query.client_id)) {
            return res.status(400).send("Parameter missing: client_id");
        } else if (req.query.client_id.length <= 3) {
            return res.status(400).send("client_id too short!");
        } else if (req.query.client_id.length > 100) {
            return res.status(400).send("client_id too long!");
        }

        // check the secret
        if (!(req.query && req.query.secret) || req.query.secret !== secret) {
            console.warn(`Unauthorized request from ${remoteAddress}`);
            return res.status(401).send("Unauthorized.");
        }

        try {
            const pingCollection = firestore.collection("pings");
            const ping = await pingCollection.add({
                "client_id": req.query.client_id,
                "remote": remoteAddress,
                "timestamp": new Date(),
            });

            console.log(`Added ping ${ping.id}`);
            res.status(201).send("Added new ping.");
        } catch (e) {
            console.error(e);
            res.status(500).send(`Could not store ping.`);
        }
    } else if (req.method === "GET") {
        res.setHeader("Cache-Control", "no-cache");

        // check the client id
        if (!(req.query && req.query.client_id)) {
            return res.status(400).send("Parameter missing: client_id");
        } else if (req.query.client_id.length <= 3) {
            return res.status(400).send("client_id too short!");
        } else if (req.query.client_id.length > 100) {
            return res.status(400).send("client_id too long!");
        }

        try {
            const pingCollection = firestore.collection("pings");
            const pingSnapshots = await pingCollection
                .where("client_id", "==", req.query.client_id)
                .orderBy("timestamp", "desc")
                .limit(1)
                .get();

            if (pingSnapshots.docs.length === 1) {
                const data = pingSnapshots.docs[0].data();
                const freshness = Date.now() - pingSnapshots.docs[0].createTime.toDate().getTime();

                res.setHeader("Last-Modified", (pingSnapshots.docs[0].createTime.toDate()).toUTCString());
                res.status(200).send({
                    "client_id": data.client_id,
                    "remote": data.remote,
                    "timestamp": (data.timestamp.toDate()).toISOString(),
                    "freshness": (
                        freshness <= (1000 * 60 * 5)
                            ? "younger_5min"
                            : freshness <= (1000 * 60 * 10)
                                ? "younger_10min"
                                : freshness <= (1000 * 60 * 15)
                                    ? "younger_15min"
                                    : "older_15min"
                    )
                });
            } else {
                res.status(200).send({});
            }
        } catch (e) {
            console.error(e);
            res.status(500).send(`Could not retrieve last ping.`);
        }
    } else {
        res.set("Allow", "GET, POST");
        res.status(405).send("Method Not Allowed");
    }
};
