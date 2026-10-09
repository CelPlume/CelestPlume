/**
 * CelestPlume Docs Kit — Bilibili 视频链接卡片（纯 TS，无框架）
 *
 * 与 GitHubCard 同构：构建期经 Bilibili view API 抓取标题、简介、UP主
 * （头像）与时长；整卡为可点击链接，封面在左（16:9）、信息在右。
 * 抓取失败时退化为纯链接卡片（BV 号作标题）。
 */

import { el } from './html';

export interface BilibiliCardOptions {
  /** Bilibili 视频 BV 号 */
  bvid: string;
  /** 链接打开方式 */
  target?: string;
}

/** Bilibili 视频静态数据（构建期抓取） */
export interface BilibiliVideoData {
  title: string;
  desc: string;
  uploader: string;
  uploaderFace: string;
  cover: string;
  /** 秒 */
  duration: number;
}

const BILIBILI_BVID_PATTERN = /^BV[1-9A-HJ-NP-Za-km-z]{10}$/;

/** 构建期抓取 Bilibili 视频元数据；失败返回 null（卡片仍渲染为纯链接） */
export async function fetchBilibiliVideo(bvid: string): Promise<BilibiliVideoData | null> {
  if (!BILIBILI_BVID_PATTERN.test(bvid)) return null;
  try {
    const res = await fetch(
      `https://api.bilibili.com/x/web-interface/view?bvid=${encodeURIComponent(bvid)}`,
      { headers: { 'User-Agent': 'CelPlume-Docs-Build' } },
    );
    if (!res.ok) return null;
    const json: Record<string, unknown> = await res.json();
    const data = json.data as Record<string, unknown> | undefined;
    if (json.code !== 0 || !data) return null;
    const owner = data.owner as Record<string, unknown> | undefined;
    return {
      title: typeof data.title === 'string' ? data.title : '',
      desc: typeof data.desc === 'string' ? data.desc : '',
      uploader: typeof owner?.name === 'string' ? owner.name : '',
      uploaderFace: typeof owner?.face === 'string' ? owner.face.replace(/^http:/, 'https:') : '',
      cover: typeof data.pic === 'string' ? data.pic.replace(/^http:/, 'https:') : '',
      duration: typeof data.duration === 'number' ? data.duration : 0,
    };
  } catch {
    return null;
  }
}

/** 秒 → mm:ss / h:mm:ss */
function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return '';
  const s = Math.round(seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = String(s % 60).padStart(2, '0');
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${sec}` : `${m}:${sec}`;
}

function escapeAttr(value: string): string {
  return value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');
}

/**
 * Bilibili 视频链接卡片（整卡可点击；标题、简介、UP主）。
 * 同步构建器：静态数据由 fetchBilibiliVideo 注入，缺省为纯链接卡片。
 * 返回 HTML 字符串，用 set:html 渲染。
 */
export function bilibiliCard(options: BilibiliCardOptions, data: BilibiliVideoData | null = null): string {
  const { bvid, target = '_blank' } = options;

  const cover = data?.cover
    ? el('span', { class: 'cpd-bili-card-cover' }, [
        `<img src="${escapeAttr(data.cover)}" alt="" loading="lazy" referrerpolicy="no-referrer" />`,
        data.duration > 0
          ? el('span', { class: 'cpd-bili-card-duration' }, formatDuration(data.duration))
          : null,
      ])
    : null;

  const title = data?.title || bvid;
  const uploader = data?.uploader
    ? el('span', { class: 'cpd-bili-card-up' }, [
        data.uploaderFace
          ? `<img class="cpd-bili-card-avatar" src="${escapeAttr(data.uploaderFace)}" alt="" loading="lazy" referrerpolicy="no-referrer" />`
          : null,
        el('span', {}, data.uploader),
      ])
    : null;

  return el('a', {
    class: 'cpd-bili-card',
    href: `https://www.bilibili.com/video/${bvid}`,
    target,
    rel: target === '_blank' ? 'noopener noreferrer' : undefined,
    'data-cpd-bili-card': '',
  }, [
    cover,
    el('span', { class: 'cpd-bili-card-body' }, [
      el('span', { class: 'cpd-bili-card-title' }, title),
      data?.desc ? el('span', { class: 'cpd-bili-card-desc' }, data.desc) : null,
      el('span', { class: 'cpd-bili-card-meta' }, [
        uploader,
        el('span', { class: 'cpd-bili-card-source' }, 'Bilibili'),
      ]),
    ]),
  ]);
}
