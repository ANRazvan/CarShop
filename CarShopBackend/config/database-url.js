const dns = require('dns');
const { promisify } = require('util');

const lookup = promisify(dns.lookup);

async function getIPv4Address(hostname) {
    try {
        const { address } = await lookup(hostname, { family: 4 });
        return address;
    } catch (error) {
        console.error('DNS lookup failed:', error);
        return hostname; // fallback to hostname if lookup fails
    }
}

async function buildDatabaseURL() {
    const host = process.env.PGHOST || 'db.rjlewidauwbneruxdspn.supabase.co';
    const ipv4Address = await getIPv4Address(host);
    
    return `postgresql://postgres:${process.env.PG_PASSWORD}@${ipv4Address}:5432/postgres?sslmode=require`;
}

module.exports = { buildDatabaseURL };
