/**
 * YouTube links in an explanation become a card with the video's thumbnail;
 * clicking it plays the video in place (youtube-nocookie). Runs on HTML that is
 * already sanitized; the cards are built here, from a checked video id only.
 */

/** The video id of a YouTube link (watch, youtu.be, shorts, embed), or null. */
export function youTubeId(href) {
  let url;
  try {
    url = new URL(href);
  } catch {
    return null;
  }
  const host = url.hostname.replace(/^(www\.|m\.)/, "");
  let id = null;
  if (host === "youtu.be") id = url.pathname.slice(1);
  else if (host === "youtube.com" || host === "youtube-nocookie.com") {
    id = url.searchParams.get("v") || url.pathname.match(/^\/(?:shorts|embed|live)\/([^/]+)/)?.[1] || null;
  }
  return id && /^[\w-]{11}$/.test(id) ? id : null;
}

export const thumbnailUrl = (id) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
export const embedUrl = (id) => `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`;

function card(doc, id, href, label, playLabel) {
  const box = doc.createElement("div");
  box.className = "yt-card";
  const thumb = doc.createElement("button");
  thumb.type = "button";
  thumb.className = "yt-thumb";
  thumb.dataset.yt = id;
  thumb.setAttribute("aria-label", `${playLabel}: ${label}`);
  const img = doc.createElement("img");
  img.src = thumbnailUrl(id);
  img.alt = "";
  img.loading = "lazy";
  const play = doc.createElement("span");
  play.className = "yt-play";
  play.setAttribute("aria-hidden", "true");
  thumb.append(img, play);
  const link = doc.createElement("a");
  link.href = href;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.className = "yt-link";
  link.textContent = label;
  box.append(thumb, link);
  return box;
}

/**
 * A YouTube link alone on its line is replaced by a card; one inside a sentence
 * stays a link and gets a card under its paragraph.
 */
export function withVideoCards(html, { playLabel = "Play" } = {}) {
  if (!html || !/youtu/i.test(html)) return html;
  const doc = new DOMParser().parseFromString(`<div>${html}</div>`, "text/html");
  const root = doc.body.firstChild;
  root.querySelectorAll("a[href]").forEach((a) => {
    const id = youTubeId(a.getAttribute("href"));
    if (!id || a.closest(".yt-card")) return;
    const label = a.textContent.trim() || a.getAttribute("href");
    const box = card(doc, id, a.getAttribute("href"), label, playLabel);
    const block = a.closest("p, li, div") || a;
    const alone = block !== a && block.textContent.trim() === a.textContent.trim() && block.tagName === "P";
    if (alone) block.replaceWith(box);
    else block.after(box);
  });
  return root.innerHTML;
}

/** Click on a card's thumbnail: swap it for the player. Returns true when handled. */
export function playVideoCard(target) {
  const thumb = target.closest?.(".yt-thumb");
  if (!thumb) return false;
  const frame = document.createElement("iframe");
  frame.className = "yt-frame";
  frame.src = embedUrl(thumb.dataset.yt);
  frame.title = thumb.getAttribute("aria-label") || "YouTube";
  frame.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
  frame.allowFullscreen = true;
  thumb.replaceWith(frame);
  return true;
}
