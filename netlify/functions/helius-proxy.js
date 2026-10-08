// Item Banc Explorer - Helius proxy
// Server-side proxy so the Helius API key never reaches the browser - the
// page's client-side JS talks to this function instead of
// mainnet.helius-rpc.com / api.helius.xyz directly. Key comes from the
// HELIUS_API_KEY Netlify environment variable - never hardcoded, never
// committed.
//
// ?kind=rpc   -> forwards the POST body as-is to Helius's JSON-RPC endpoint
//                (getAccountInfo, getSignaturesForAddress, getAssetsByCreator,
//                searchAssets, etc. - whatever body the page sends).
// ?kind=parse -> forwards the POST body as-is to Helius's enhanced
//                transactions ("parseTransactions") endpoint.
const HELIUS_API_KEY = process.env.HELIUS_API_KEY;

exports.handler = async function (event) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (!HELIUS_API_KEY) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Server misconfigured: HELIUS_API_KEY not set' }),
    };
  }

  const kind = (event.queryStringParameters || {}).kind;
  const targetUrl =
    kind === 'parse'
      ? `https://api.helius.xyz/v0/transactions/?api-key=${HELIUS_API_KEY}`
      : `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;

  try {
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: event.body,
    });
    const text = await response.text();
    return { statusCode: response.status, headers, body: text };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
