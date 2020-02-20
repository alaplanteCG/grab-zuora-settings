/* eslint-disable no-await-in-loop */
/* eslint-disable no-loop-func */
/* eslint-disable no-undef */
/* eslint-disable no-console */
/* eslint-disable func-names */

/**
 * Required External Modules
 */

const https = require("https");
const fs = require("fs");
const querystring = require("querystring");
const config = require("config");

/**
 * App Variables
 *
 */

const settingsReport = [];
const errorsReport = [];
let requests = 0;
let completedRequests = 0;
let reportCount = 0;

/**
 * Grabs OAuth access token from Zuora.
 *
 * @param {string} id Zuora client id
 * @param {string} secret Zuora client secret
 * @param {function} callback callback function
 */
function getAccessToken(id, secret, callback) {
    const options = {
        hostname: config.Zuora.hostName,
        path: "/oauth/token",
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
    };

    const postData = querystring.stringify({
        client_id: id,
        client_secret: secret,
        grant_type: "client_credentials",
    });

    const req = https.request(options, res => {
        console.log(`statusCode: ${res.statusCode}`);

        let dataObject = "";

        res.on("data", chunk => {
            dataObject += chunk;
        });

        res.on("end", () => {
            // console.log(JSON.parse(dataObject));
            const token = JSON.parse(dataObject).access_token;
            if (token) callback(token);
            if (!token) callback("Something went wrong!");
        });
    });

    req.on("error", error => {
        console.log(`Error : ${error.message}`);
        callback(error);
    });

    req.write(postData);
    req.end();
}

/**
 * Gets settings schema (metadata) for your Zuora tenant.
 *
 * @param {string} token access token retrieved from Zuora
 * @param {function} callback callback function
 */

function getSettingsSchema(token, callback) {
    const options = {
        hostname: config.Zuora.hostName,
        path: "/settings/listing",
        method: "GET",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Bearer ${token}`,
        },
    };

    const req = https.request(options, res => {
        console.log(`statusCode: ${res.statusCode}`);

        let dataObject = "";

        res.on("data", chunk => {
            dataObject += chunk;
        });

        res.on("end", () => {
            // console.log(JSON.parse(dataObject));
            callback(JSON.parse(dataObject));
        });
    });

    req.on("error", error => {
        console.log(`Error : ${error.message}`);
        callback(error);
    });

    req.end();
}

/**
 * Retrieves actual settings data from your Zuora tenant based on the API path provided.
 *
 * @param {string} token access token retrieved from Zuora
 * @param {string} pathUrl Zuora API path
 * @param {function} callback callback function
 */

async function getSettingsData(token, pathUrl, callback) {
    const options = {
        hostname: config.Zuora.hostName,
        path: pathUrl,
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
    };

    const req = https
        .request(options, res => {
            console.log(`statusCode: ${res.statusCode}`);

            let dataObject = "";

            res.on("data", chunk => {
                dataObject += chunk;
            });

            res.on("end", () => {
                completedRequests += 1;
                callback({
                    statusCode: res.statusCode,
                    body: JSON.parse(dataObject),
                });
            });
        })
        .on("error", error => {
            console.log(`Error : ${error.message}`);
            callback(error);
        });

    req.end();
}

/**
 * Increments created report count.
 */
const incrementReportCount = () => (reportCount += 1);

/**
 * Creates report JSON files in reports directory.
 *
 * @param {object} report JSON representation of report data
 * @param {string} name file name with directory
 */

async function createReportFile(report, name) {
    // stringify content before writing to file
    const content = JSON.stringify(report, null, 4);
    // write file
    fs.writeFile(name, content, "utf8", function(error) {
        if (error) {
            console.log("An error occured while writing JSON Object to File.");
            console.log(error);
            incrementReportCount();
            if (reportCount === 2) console.log("Execution Finished");
        } else {
            console.log("Report saved succesfully!");
            incrementReportCount();
            if (reportCount === 2) console.log("Execution Finished");
        }
    });
}

/**
 * Called when all API requests have finished. Controls the creation of reports.
 */
async function complete() {
    console.log("Creating Reports");
    await createReportFile(
        settingsReport,
        "./reports/Zuora_Settings_Report.json",
    );
    await createReportFile(
        errorsReport,
        "./reports/Zuora_Error_Messages_Report.json",
    );
}

/**
 * Used to build out settings report JSON file.
 */

async function buildSettingsReport() {
    getAccessToken(
        config.Zuora.clientID,
        config.Zuora.clientSecret,
        async function(token) {
            getSettingsSchema(token, async function(settingsObject) {
                const values = Object.values(settingsObject.settings);
                const keys = Object.keys(settingsObject.settings);
                for (let i = 0; i < keys.length; i += 1) {
                    const httpOperations = values[i].httpOperations;
                    for (let j = 0; j < httpOperations.length; j += 1) {
                        if (
                            httpOperations[j].method === "GET" &&
                            httpOperations[j].parameters.length === 0
                        ) {
                            const path = httpOperations[j].url;
                            requests += 1;
                            await getSettingsData(token, path, function(data) {
                                if (data.statusCode === 200) {
                                    settingsReport.push({
                                        "Zuora Path": path,
                                        "Returned Values": data.body,
                                    });
                                } else {
                                    errorsReport.push({
                                        "Zuora Path": path,
                                        "Error Message": data.body,
                                    });
                                }
                                if (completedRequests === requests) {
                                    complete();
                                }
                            });
                        }
                    }
                }
            });
        },
    );
}

/**
 * Main function runs on execution.
 */
async function run() {
    await buildSettingsReport();
}

run();
