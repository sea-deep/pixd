import { client } from "../index.js";
const crypto = require('crypto');


export async function handleLastFmAuth(req,res) {
  try {
    const params = new URLSearchParams({
      method: 'auth.getSession',
      api_key: process.env.LASTFM_KEY,
      token: req.query.token,
      api_sig: getApiSig(res.query.token, 'auth.getSession'),
      format: 'json'
    });

    const response = await fetch(`http://ws.audioscrobbler.com/2.0/?${params.toString()}`);
    const data = await response.json();
   console.log(data)
    const { session } = data;
    let accessToken;
    if (session && session.key) {
      accessToken = session.key;
    } else {
      throw new Error('Access token not found in response');
    }
    await client.lastFmDb.connect();
    await client.lastFmDb.set(req.query.userid, accessToken);
    console.log(req.query.userid, accessToken);
    await client.lastFmDb.close();
  } catch (error) {
    console.error('Error exchanging token for access token:', error);
  }
  
}


function getApiSig(method, token) {
  const apiKey = process.env.LASTFM_KEY;
  const apiSecret = process.env.LASTFM_SECRET;

  const params = {
    api_key: apiKey,
    method: method,
    token: token,
  };

  const sortedParams = Object.keys(params).sort().map(key => `${key}${params[key]}`);
  const paramString = sortedParams.join('');
  const paramStringWithSecret = paramString + apiSecret;
  const apiSig = crypto.createHash('md5').update(paramStringWithSecret).digest('hex');

  return apiSig;
}

