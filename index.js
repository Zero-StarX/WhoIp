"use strict";

const fetch = require("node-fetch");

const get = ip => fetch(`http://ip-api.com/json/${ip}?fields=60549115`).then(r => r.json()),
    ipRegex = /^(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}(?:\:(?:\d{1,4}|[1-6](?:[0-4]\d{3}|5[0-4]\d{2}|55[0-2]\d|553[0-5])))?$/;

/** @typedef APIResponse
 * @type {object}
 * @property {String} city City name
 * @property {String} continent Continent
 * @property {String} country Country Name
 * @property {String} countryCode Two-Letter ISO 3166-1 alpha-2 country code
 * @property {String} currency  National currency
 * @property {String} district District (subdivision of city)
 * @property {Boolean} hosting Is the IP Hosting, colocated, or a data center?
 * @property {String} isp Internet Service Provider name
 * @property {Number} lat Latitude
 * @property {Number} lon Longitude
 * @property {Boolean} mobile Is the IP a mobile deivce?
 * @property {Number} offset Timezone UTC DST offset in seconds
 * @property {String} org Organization name
 * @property {Boolean} proxy Is the IP a proxy, VPN or Tor exit address?
 * @property {String} query IP address
 * @property {String} regionName Region/state
 * @property {String} status `success` or `fail`
 * @property {String} message Message indicating why `stats` was `fail`
 * 
 * Can be one of the following: `private range`, `reserved range`, `invalid query`
 * @property {String} timezone Timezone
 * @property {String} zip ZIP Code
 **/

class WhoIP {
    /**
     * Lookup IP address information
     * @param {string|string[]} ip - IP address or array of IP addresses
     * @returns {Promise<APIResponse|APIResponse[]>}
     */
    static async lookup(ip) {
        if (Array.isArray(ip)) {
            // Validate all IPs first
            ip.forEach(ipAddr => {
                if (!ipRegex.test(ipAddr)) {
                    throw new Error(`Invalid IP address: ${ipAddr}`);
                }
            });
            return Promise.all(ip.map(get));
        } else {
            if (!ipRegex.test(ip)) {
                throw new Error(`Invalid IP address: ${ip}`);
            }
            return get(ip);
        }
    }

    /**
     * Validate IP address format
     * @param {string} ip - IP address to validate
     * @returns {boolean}
     */
    static validateIP(ip) {
        return ipRegex.test(ip);
    }

    /**
     * Get information about current IP
     * @returns {Promise<APIResponse>}
     */
    static async myIP() {
        return get("");
    }
}

module.exports = WhoIP;
