export function getYouTubeEmbedUrl(videoUrl: string | null | undefined) {
  if (!videoUrl) return null;

  try {
    const url = new URL(videoUrl);

    if (url.hostname.includes("youtu.be")) {
      const videoId = url.pathname.replace("/", "");
      return videoId
        ? `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`
        : null;
    }

    if (url.hostname.includes("youtube.com")) {
      const videoId = url.searchParams.get("v");
      if (!videoId) return null;
      return `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`;
    }

    return null;
  } catch {
    return null;
  }
}
