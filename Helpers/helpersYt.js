import { google } from "googleapis";

const API_KEY = process.env.GOOGLE_KEY;
const youtube = google.youtube({
  version: "v3",
  auth: API_KEY,
});

export async function getVideoInfo(videoUrl) {
  const videoId = extractVideoId(videoUrl);

  const response = await youtube.videos.list({
    part: "snippet,contentDetails",
    id: videoId,
  });

  const videoInfo = response.data.items[0]?.snippet || {};
  const channelInfo = videoInfo?.channelTitle || "";
  const thumbnails = videoInfo?.thumbnails || {};
  const thumbnailUrl = thumbnails.default?.url || "";

  const duration = convertDurationToSeconds(
    response.data.items[0]?.contentDetails?.duration || "",
  );

  return {
    title: videoInfo.title || "",
    description: videoInfo.description || "",
    channelName: channelInfo,
    duration: duration,
    id: videoId,
    thumbnail: thumbnailUrl,
    url: `https://www.youtube.com/watch?v=${videoId}`,
  };
}

export async function searchVideo(query) {
  try {
    const response = await youtube.search.list({
      part: "snippet",
      q: query,
      type: "video",
      maxResults: 1,
    });

    const videoIds = response.data.items
      .map((item) => item.id.videoId)
      .join(",");

    const videosResponse = await youtube.videos.list({
      part: "contentDetails",
      id: videoIds,
    });

    const videos = response.data.items.map((item, index) => {
      const videoInfo = videosResponse.data.items[index] || {};
      return {
        title: item.snippet.title,
        url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
        duration: convertDurationToSeconds(
          videoInfo.contentDetails?.duration || "",
        ),
      };
    });

    return videos[0];
  } catch (error) {
    console.error("Error searching videos:", error.message);
    throw error;
  }
}

export async function getPlaylistTracks(playlistUrl) {
  try {
    const playlistId = extractPlaylistId(playlistUrl);
    const tracks = [];

    let nextPageToken = null;
    do {
      const response = await youtube.playlistItems.list({
        part: "snippet,contentDetails",
        playlistId: playlistId,
        maxResults: 50,
        pageToken: nextPageToken,
      });

      const videoIds = response.data.items
        .map((item) => item.contentDetails.videoId)
        .join(",");

      const videosResponse = await youtube.videos.list({
        part: "contentDetails",
        id: videoIds,
      });

      response.data.items.forEach((item, index) => {
        const videoInfo = videosResponse.data.items[index] || {};
        const trackInfo = {
          title: item.snippet.title,
          url: `https://www.youtube.com/watch?v=${item.contentDetails.videoId}`,
          duration: convertDurationToSeconds(
            videoInfo.contentDetails?.duration || "",
          ),
        };
        tracks.push(trackInfo);
      });

      nextPageToken = response.data.nextPageToken;
    } while (nextPageToken);

    return tracks;
  } catch (error) {
    console.error("Error fetching playlist tracks:", error.message);
    throw error;
  }
}

function extractVideoId(url) {
  const match = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([^?&]+)/,
  );
  return match && match[1];
}

function convertDurationToSeconds(duration) {
  if (!duration) return 0;
  const regex = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/;
  const match = duration.match(regex);
  const hours = match?.[1] ? parseInt(match[1]) : 0;
  const minutes = match?.[2] ? parseInt(match[2]) : 0;
  const seconds = match?.[3] ? parseInt(match[3]) : 0;
  return hours * 3600 + minutes * 60 + seconds;
}

function extractPlaylistId(url) {
  const match = url.match(/(?:list=)([^\s&]+)/);
  return match && match[1];
}
