/**
 * 视频嵌入 — 校验、播放器 URL 与 Facade HTML 构建（Bilibili + YouTube）。
 *
 * Facade 模式（与 Shirone 对齐）：SSR 只渲染「封面占位 + 播放按钮 + 题注」，
 * 构建期零请求、零 iframe；用户点击（或 `preload="auto"` 视口临近）后才由
 * 客户端创建播放器 iframe（见 runtime.ts initVideoFacades）。
 *
 * 共用属性：`title` 必填（无障碍描述与题注）、`preload` ∈ `none`（默认）| `auto`。
 * - Bilibili：`bvid`（`^BV[1-9A-HJ-NP-Za-km-z]{10}$`）、`p`（正整数，默认 1）
 * - YouTube：`id`（`^[A-Za-z0-9_-]{11}$`）
 */

export const BILIBILI_BVID_PATTERN = /^BV[1-9A-HJ-NP-Za-km-z]{10}$/;
export const YOUTUBE_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;

const POSITIVE_INTEGER_PATTERN = /^[1-9]\d*$/;

export type VideoPreload = 'none' | 'auto';

export interface BilibiliEmbedData {
  bvid: string;
  title: string;
  part: number;
  preload: VideoPreload;
}

export interface YouTubeEmbedData {
  id: string;
  title: string;
  preload: VideoPreload;
}

export type VideoEmbedData = BilibiliEmbedData | YouTubeEmbedData;

function getText(value: string | null | undefined): string {
  return typeof value === 'string' ? value.trim() : '';
}

function getPart(value: string | null | undefined): number | null {
  const part = getText(value);
  if (!part) return 1;
  if (!POSITIVE_INTEGER_PATTERN.test(part)) return null;
  const parsedPart = Number.parseInt(part, 10);
  return Number.isSafeInteger(parsedPart) ? parsedPart : null;
}

function getPreload(value: string | null | undefined): VideoPreload | null {
  const preload = getText(value);
  if (!preload) return 'none';
  if (preload !== 'none' && preload !== 'auto') return null;
  return preload;
}

/** 归一化 Bilibili 作者可控字段；非法输入返回 null（调用方回退为字面量文本）。 */
export function getBilibiliEmbedData(
  attributes: Record<string, string | null | undefined> = {},
): BilibiliEmbedData | null {
  const bvid = getText(attributes.bvid);
  const title = getText(attributes.title);
  const part = getPart(attributes.p);
  const preload = getPreload(attributes.preload);
  if (!BILIBILI_BVID_PATTERN.test(bvid) || !title || part === null || preload === null) {
    return null;
  }

  return { bvid, title, part, preload };
}

/** 归一化 YouTube 作者可控字段；非法输入返回 null。 */
export function getYouTubeEmbedData(
  attributes: Record<string, string | null | undefined> = {},
): YouTubeEmbedData | null {
  const id = getText(attributes.id);
  const title = getText(attributes.title);
  const preload = getPreload(attributes.preload);
  if (!YOUTUBE_ID_PATTERN.test(id) || !title || preload === null) {
    return null;
  }

  return { id, title, preload };
}

/** 显式用户动作之后才允许创建的 Bilibili 播放器地址。 */
export function getBilibiliPlayerUrl(bvid: string, part: number | string): string | null {
  if (!BILIBILI_BVID_PATTERN.test(bvid)) return null;
  const partText = String(part);
  if (!POSITIVE_INTEGER_PATTERN.test(partText)) return null;
  const parsedPart = Number.parseInt(partText, 10);
  if (!Number.isSafeInteger(parsedPart)) return null;

  const url = new URL('https://player.bilibili.com/player.html');
  url.searchParams.set('bvid', bvid);
  url.searchParams.set('p', String(parsedPart));
  url.searchParams.set('high_quality', '1');
  url.searchParams.set('danmaku', '0');
  return url.toString();
}

/** 显式用户动作之后才允许创建的 YouTube（nocookie）播放器地址。 */
export function getYouTubePlayerUrl(id: string): string | null {
  if (!YOUTUBE_ID_PATTERN.test(id)) return null;
  const url = new URL(`https://www.youtube-nocookie.com/embed/${id}`);
  url.searchParams.set('rel', '0');
  url.searchParams.set('modestbranding', '1');
  return url.toString();
}

/** 运行时按 provider 分派的播放器地址入口。 */
export function getVideoPlayerUrl(
  provider: string | null,
  data: Record<string, string | null | undefined>,
): string | null {
  if (provider === 'youtube') return getYouTubePlayerUrl(getText(data.id));
  return getBilibiliPlayerUrl(getText(data.bvid), getText(data.part) || '1');
}

function escapeAttr(value: string): string {
  return value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');
}

/** 视频页外链（题注「在 Bilibili / YouTube 打开」）。 */
export function getBilibiliWatchUrl(bvid: string, part: number): string {
  const url = new URL(`https://www.bilibili.com/video/${bvid}/`);
  url.searchParams.set('p', String(part));
  return url.toString();
}

export function getYouTubeWatchUrl(id: string): string {
  return `https://www.youtube.com/watch?v=${id}`;
}

function facadeFigure(options: {
  provider: 'bilibili' | 'youtube';
  key: string;
  title: string;
  preload: VideoPreload;
  watchUrl: string;
  sourceLabel: string;
  extraAttrs?: string;
}): string {
  const { provider, key, title, preload, watchUrl, sourceLabel, extraAttrs } = options;
  return [
    `<figure class="cpd-video" data-cpd-video data-cpd-video-provider="${provider}"`,
    ` data-cpd-video-${provider === 'bilibili' ? 'bvid' : 'id'}="${escapeAttr(key)}"`,
    ` data-cpd-video-title="${escapeAttr(title)}"`,
    extraAttrs ?? '',
    ` data-video-preload="${preload}">`,
    '<div class="cpd-video-stage">',
    `<button type="button" class="cpd-video-play" data-cpd-video-activate aria-label="${escapeAttr(title)}">`,
    '<span class="cpd-video-play-icon" aria-hidden="true"></span>',
    '</button>',
    '</div>',
    '<figcaption class="cpd-video-caption">',
    `<strong class="cpd-video-title">${escapeAttr(title)}</strong>`,
    `<a class="cpd-video-source" href="${watchUrl}" target="_blank" rel="noopener noreferrer">${sourceLabel}</a>`,
    '</figcaption>',
    '</figure>',
  ].join('');
}

/** 渲染 Bilibili 静态 Facade（`figure.cpd-video[data-cpd-video]`）。 */
export function bilibiliFacade(embed: BilibiliEmbedData): string {
  return facadeFigure({
    provider: 'bilibili',
    key: embed.bvid,
    title: embed.title,
    preload: embed.preload,
    watchUrl: getBilibiliWatchUrl(embed.bvid, embed.part),
    sourceLabel: 'Bilibili',
    extraAttrs: ` data-cpd-video-part="${embed.part}"`,
  });
}

/** 渲染 YouTube 静态 Facade（nocookie 播放器；题注外链指向 watch 页）。 */
export function youtubeFacade(embed: YouTubeEmbedData): string {
  return facadeFigure({
    provider: 'youtube',
    key: embed.id,
    title: embed.title,
    preload: embed.preload,
    watchUrl: getYouTubeWatchUrl(embed.id),
    sourceLabel: 'YouTube',
  });
}
