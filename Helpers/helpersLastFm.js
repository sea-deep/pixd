import { client } from "../index.js";

export async function handleLastFmAuth(req,res) {
  try {
    const params = new URLSearchParams({
      method: 'auth.getSession',
      api_key: process.env.LASTFM_KEY,
      token: req.query.token,
      format: 'json'
    });

    const response = await fetch(`http://ws.audioscrobbler.com/2.0/?${params.toString()}`);
    const data = await response.json();

    const { session } = data;
    let accessToken;
    if (session && session.key) {
      accessToken = session.key;
    } else {
      throw new Error('Access token not found in response');
    }
    await client.lastFmDb.set(req.query.userid, accessToken);
    console.log(req.query.userid);
  } catch (error) {
    console.error('Error exchanging token for access token:', error);
  }
  
}