const args = require("args");
const yaml = require('js-yaml');
const fs = require('fs');
const { default: axios } = require('axios');

args
  .option('siteName', 'Name of the site (or localhost) to run smoke test against')
  .option('basicUsername', 'Username to be used for HTTP basic authentication')
  .option('basicPassword', 'Password to be used for HTTP basic authentication');

const showHelp = (missingArgs) => {
    console.log(`Invalid or missing required argument(s) ${missingArgs.join(", ")}, see help:\n`);

    args.showHelp() && process.exit(1);
}

const findMissingArgs = (parsedArgs) => {
    const argNames = [
        "siteName",
        "basicUsername",
        "basicPassword",
    ];

    const missingArgs = [];
    for (const name of argNames) {
        if (!(name in parsedArgs)) {
            missingArgs.push(name);
        }
    }

    return missingArgs;
}

const parsedArgs = args.parse(process.argv);
const missingArgs = findMissingArgs(parsedArgs);

if (missingArgs.length !== 0) {
    showHelp(missingArgs);
}

const replacePathPlaceholders = (path) => {
    const placeholders = [
        "asnID",
        "returnID",
        "inboundLineID",
        "shipmentID",
        "productID",
        "snapshotId"
    ];

    let output = path;
    for (const placeholder of placeholders) {
        output = output.replace(`{${placeholder}}`, "1");
    }

    return output;
}

const verifyEndpointIsReachable = async (siteName, endpointConfig) => {
    const url = siteName !== "localhost" ? `https://${siteName}.6river.org` : "localhost";
    const fullUrl = `${url}${replacePathPlaceholders(endpointConfig.path)}`;
    const requestStr = `${endpointConfig.method.toUpperCase()} ${fullUrl}`;
    const expectedStatusCodes = [400, 404, 415];

    try {
        await axios.request({
            method: endpointConfig.method,
            url: fullUrl,
            auth: {
                username: endpointConfig.basicCredentials.username,
                password: endpointConfig.basicCredentials.password,
            }
        });

    } catch (e) {
        if (!(expectedStatusCodes.includes(e?.response?.status))) {
            console.log(`POSSIBLY NOT REACHABLE: request ${requestStr} failed with error ${e}`);
        }
    }
}

const readOpenAPISpec = () => {
    return yaml.load(fs.readFileSync("node_modules/@sixriver/standard-api/openapi.yaml", "utf8"));
}

const doc = readOpenAPISpec();
for (const [path, spec] of Object.entries(doc.paths)) {
    const [requestMethod, details] = Object.entries(spec).pop();

    if (!details.tags.includes("Southbound")) {
        continue;
    }

    void verifyEndpointIsReachable(parsedArgs.siteName, {
        path,
        method: requestMethod,
        basicCredentials: {
            username: parsedArgs.basicUsername,
            password: parsedArgs.basicPassword,
        }
    });
}