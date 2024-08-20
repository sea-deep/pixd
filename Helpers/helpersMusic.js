/**
 * Given a number, parses it into the form of mm:ss
 * @param {number} input number to parse.
 * @returns {object} object containing the parsed data.
 */
export function parse(input) {
  if (typeof input === "string" && input.indexOf(":") !== -1) {
    const time = input.split(":");
    if (!isNaN(time[0]) && !isNaN(time[1]) && time[0] >= 0 && time[1] >= 0) {
      const minutes = Number(time[0] * 60);
      const seconds = Number(time[1]);
      return minutes + seconds;
    }
  } else if (typeof input === "number") {
    const minutes = Math.floor(input / 60);
    const seconds = input % 60 < 10 ? "0" + (input % 60) : input % 60;
    return { minutes, seconds };
  } else {
    return 0;
  }
}

export async function soundCloudUrl(url) {
  if (!url.includes("on.soundcloud")) return url;

  try {
    const response = await fetch(url);
    const html = await response.text();
    const originalTrackUrlRegex =
      /<meta\s+property=["']og:url["']\s+content=["'](https:\/\/soundcloud\.com\/[^"']+)["']>/;
    const match = html.match(originalTrackUrlRegex);

    if (match && match[1]) {
      return match[1];
    } else {
      throw new Error("Original track URL not found");
    }
  } catch (error) {
    console.error("Error extracting track URL:", error);
    return null;
  }
}

async function deleteMessage(msg) {
  try {
    return await msg.delete();
  } catch (e) {
    console.error("Error while deleting message:", e.message);
  }
}
