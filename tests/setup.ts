process.env.TOKEN ??= "test-token";
process.env.CLIENT_ID ??= "test-client";
process.env.MONGODB_URL ??= "mongodb://127.0.0.1:27017/pixd-test";
process.env.ENVIRONMENT = "test";
process.env.LASTFM_SECRET ??= "test-lastfm-secret";
delete process.env.YT_DLP_COOKIES;
delete process.env.YT_DLP_COOKIES_PATH;
delete process.env.YT_API_KEY;
delete process.env.YOUTUBE_API_KEY;

