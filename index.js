const express = require("express");
const app = express();
const imaps = require("imap-simple");
const { simpleParser } = require("mailparser");
const fs = require("fs");

// IMAP Configuration
const config = {
    // TODO: Update the configuration
    imap: {
        user: "tdummy482@gmail.com",
        password: "bors ojfn fcit duvy",
        host: "imap.gmail.com",
        port: 993,
        tls: true,
        authTimeout: 3000,
        tlsOptions: { rejectUnauthorized: false }, // Aceptar certificados autofirmados
    },
};

imaps
    .connect(config)
    .then((connection) => {
        return connection.openBox("INBOX").then(() => {
            // TODO seach specific emails
            const searchCriteria = ["UNSEEN"];
            const fetchOptions = {
                bodies: [""],
                markSeen: true,
                struct: true,
            };

            return connection
                .search(searchCriteria, fetchOptions)
                .then((results) => {
                    results.forEach((res) => {
                        const parts = imaps.getParts(res.attributes.struct);
                        parts
                            .filter(
                                (part) =>
                                    part.disposition &&
                                    part.disposition.type.toUpperCase() ===
                                        "ATTACHMENT"
                            )
                            .forEach((part) => {
                                const partID = part.partID;
                                const encoding = part.encoding;

                                connection
                                    .getPartData(res, part)
                                    .then((partData) => {
                                        const buffer = Buffer.from(
                                            partData,
                                            encoding
                                        );
                                        fs.writeFileSync(
                                            part.disposition.params.filename,
                                            buffer
                                        );
                                        console.log(
                                            `Attachment saved: ${part.disposition.params.filename}`
                                        );
                                    });
                            });

                        const allBodies = res.parts
                            .map((part) => part.body)
                            .join("");
                        simpleParser(allBodies, (err, mail) => {
                            if (err) {
                                console.error(err);
                                return;
                            }
                            console.log("From:", mail.from.text);
                            console.log("Subject:", mail.subject);
                            console.log("Body:", mail.text);
                        });
                    });
                });
        });
    })
    .catch((err) => {
        console.error(err);
    });

// Express Configuration
app.get("/", (req, res) => {
    res.send("Hello, Express.js Server!");
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server is running on port http://localhost:${port}`);
});
