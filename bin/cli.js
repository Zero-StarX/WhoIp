#!/usr/bin/env node

"use strict";

const WhoIP = require("../index"),
    colors = require("colors/safe"),
    cliTable = require("cli-table"),
    {inspect} = require("util");

const fail = (msg, detail = null) => {
    console.log(colors.bgRed.white("ERROR: " + msg));
    if (detail !== null) console.log(detail);
    process.exit(0);
};

const explain = {
    "private range": "IP is in the private range",
    "reserved range": "IP is in the reserved range",
    "invalid query": "Invalid IP Address"
};

const formatters = {
    /** @param {import("../index").APIResponse} obj */
    json: obj => inspect(obj, {depth: Infinity, colors: true}),
    /** @param {import("../index").APIResponse} obj */
    csv: obj => Object.keys(obj).join(",")+"\n"+Object.values(obj).join(","),
    /** @param {import("../index").APIResponse} obj */
    newline: obj => Object.entries(obj).map(([key, value]) => `${key}: ${value}`).join("\n"),
    
    /** @param {import("../index").APIResponse} obj */
    pretty: obj => {
        if (obj.status === "fail") {
            return colors.red(`Failed to locate '${obj.query}': ${explain[obj.message]}`);
        }

        const table = new cliTable({
            head: [colors.yellow("Field Name"), colors.yellow("Value")]
        });
        
        let ip_type = "Normal";
        if (obj.proxy) ip_type = "Proxy";
        if (obj.mobile) ip_type = "Mobile";
        if (obj.hosting) ip_type = "Hosting";

        table.push({City: obj.city});
        if (obj.district !== "") table.push({District: obj.district});
        table.push({Region: obj.regionName});
        table.push({"ZIP Code": obj.zip});

        table.push({Country: `${obj.country} (${obj.countryCode})`});
        table.push({Continent: obj.continent});

        table.push({Latitude: obj.lat});
        table.push({Longitude: obj.lon});

        const offsetMS = new Date() - new Date(new Date().toLocaleString("en-US", {timeZone: obj.timezone}));
        const offsetHours = (offsetMS / 3600000).toFixed(1).replace(/\.?0+$/, "");
        table.push({Timezone: obj.timezone});
        table.push({Offset: `${offsetHours} hour${offsetHours === "1" ? "" : "s"} behind`});
        if (offsetHours !== "0") {
            table.push({Time: new Date().toLocaleString("en-US", {
                dateStyle: "long",
                timeStyle: "short",
                timeZone: obj.timezone
            })});
        }
        
        table.push({Currency: obj.currency});
        table.push({"":""});
        table.push({ISP: obj.isp});
        table.push({"IP Type": ip_type});
        if (obj.org !== "") table.push({Organization: obj.org});
        

        return table.toString();
    }
};

// Parse arguments
const argv = process.argv.slice(2);
const options = {ip: [], flags: {}};

const flagNames = {
    "-h": "help",
    "-help": "help",
    "?": "help",
    help: "help",
    h: "help",
    v: "version",
    version: "version",
    format: "format",
    f: "format",
    "-format": "format"
};

for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.indexOf("-") === 0) {
        const equalsPos = arg.indexOf("=");
        const flagName = (equalsPos === -1 ? arg.slice(1) : arg.slice(1, equalsPos)).toLowerCase();
        if (!(flagName in flagNames)) fail(`Unrecognized flag ${flagName}`);
        const flagValue = equalsPos === -1 ? true : arg.slice(equalsPos + 1);
        options.flags[flagNames[flagName]] = flagValue;
    } else if (WhoIP.validateIP(arg)) {
        options.ip.push(arg);
    } else {
        fail(`Invalid IP '${arg}'`);
    }
}

// Validate arguments
if (typeof options.flags.format !== "undefined") {
    if (typeof options.flags.format === "string") {
        if (!(options.flags.format in formatters)) {
            fail(`Unrecognized format type '${options.flags.format}'`, `Try one of: ${Object.keys(formatters).join(", ")}`);
        }
    } else {
        fail("Format type not specified");
    }
} else {
    options.flags.format = "pretty";
}

// Basic flags
if (options.flags.version) {
    console.log("WhoIP v1.0.0");
    process.exit();
} else if (options.flags.help) {
    console.log("Usage: whoip <IP address> [-help] [-version] [-format=...]");
    console.log(`Acceptable values for -format: ${Object.keys(formatters).join(", ")}`);
    process.exit();
} else if (options.ip.length === 0) {
    fail("Please specify at least one IP address");
}

// Main
WhoIP.lookup(options.ip).then(responses => {
    const results = Array.isArray(responses) ? responses : [responses];
    results.forEach(response => 
        console.log(formatters[options.flags.format](response))
    );
}).catch(error => {
    fail(error.message);
});
