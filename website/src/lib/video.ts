// Replaces YouTube iframes with a preview so nothing loads from YouTube until the visitor presses play.
const EMBED = /<div class="video-embed">\s*<iframe[^>]*?src="https:\/\/www\.youtube\.com\/embed\/([\w-]{11})[^"]*"[^>]*><\/iframe>\s*<\/div>/g;

const facade = (id: string) => {
  const thumb = encodeURIComponent(`https://i.ytimg.com/vi/${id}/hqdefault.jpg`);
  return (
    `<div class="video-embed video-facade" data-yt="${id}">` +
    `<button type="button" class="video-facade-btn" aria-label="Play video from YouTube">` +
    `<img src="/_next/image?url=${thumb}&amp;w=640&amp;q=75" alt="" loading="lazy">` +
    `<span class="video-facade-play" aria-hidden="true"></span>` +
    `<span class="video-facade-note">Play video. Loads from YouTube.</span>` +
    `</button></div>`
  );
};

export const withVideoFacades = (html: string) => html.replace(EMBED, (_, id: string) => facade(id));
