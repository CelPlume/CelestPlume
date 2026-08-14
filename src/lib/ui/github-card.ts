/**
 * CelestPlume Docs Kit — GitHub 仓库卡片（纯 TS，无框架）
 *
 * 整卡为可点击链接；标题显示 owner/repo。描述、语言（色点）与 star/fork 数
 * 在构建期抓取 GitHub REST API；运行时会话内刷新并缓存于 localStorage
 * （见 runtime.ts 的 initGithubCards）。
 */

import { el } from './html';
import { Icon } from './icons';

/** 语言名 → linguist 色值（常用子集，未收录回退灰） */
const GITHUB_LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: '#3178c6',
  JavaScript: '#f1e05a',
  Python: '#3572a5',
  Astro: '#ff5a03',
  MDX: '#fcb32c',
  Markdown: '#083fa1',
  Vue: '#41b883',
  Svelte: '#ff3e00',
  SCSS: '#c6538c',
  CSS: '#563d7c',
  HTML: '#e34c26',
  Shell: '#89e051',
  Rust: '#dea584',
  Go: '#00add8',
  JSON: '#292929',
  'C++': '#f34b7d',
  C: '#555555',
  'C#': '#178600',
  Java: '#b07219',
  PHP: '#4f5d95',
  Ruby: '#701516',
  Swift: '#f05138',
  Kotlin: '#a97bff',
  Dart: '#00b4ab',
  Zig: '#ec915c',
  Dockerfile: '#384d54',
  PowerShell: '#012456',
  Perl: '#0298c3',
  Lua: '#000080',
  R: '#198ce7',
  Haskell: '#5e5086',
  Elixir: '#6e4a7e',
  Erlang: '#b83998',
  'Jupyter Notebook': '#da5b0b',
  YAML: '#cb171e',
  XML: '#0060ac',
  TeX: '#3d6117',
  Elm: '#60b5cc',
  Nix: '#7e7eff',
  Assembly: '#6e4c13',
  Clojure: '#db5855',
  Scala: '#c22d40',
  Groovy: '#4298b8',
  Nim: '#ffc200',
};
const GITHUB_LANGUAGE_COLOR_FALLBACK = '#8b949e';

/** GitHub 仓库静态数据（构建期 / 运行时通用形状） */
export interface GithubRepoData {
  description: string;
  language: string;
  stargazersCount: number;
  forksCount: number;
}

export interface GithubCardOptions {
  /** 仓库所有者（用户或组织） */
  owner: string;
  /** 仓库名 */
  repo: string;
  /** 仓库链接的打开方式 */
  target?: string;
  /** 构建期请求使用的 GitHub token（可选，如来自环境变量） */
  auth?: string;
}

/** 语言名 → linguist 色值（未收录回退灰）；构建期与运行时共用 */
export function githubLanguageColor(language: string): string {
  return language
    ? GITHUB_LANGUAGE_COLORS[language] ?? GITHUB_LANGUAGE_COLOR_FALLBACK
    : GITHUB_LANGUAGE_COLOR_FALLBACK;
}

/** 构建期抓取 GitHub 仓库元数据；失败返回 null（卡片仍渲染为纯链接） */
export async function fetchGithubRepo(
  owner: string,
  repo: string,
  auth = '',
): Promise<GithubRepoData | null> {
  try {
    const res = await fetch(
      `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`,
      auth ? { headers: { Authorization: `Bearer ${auth}` } } : undefined,
    );
    if (!res.ok) return null;
    const data: Record<string, unknown> = await res.json();
    return {
      description: typeof data.description === 'string' ? data.description : '',
      language: typeof data.language === 'string' && data.language ? data.language : 'Other',
      stargazersCount:
        typeof data.stargazers_count === 'number' ? data.stargazers_count : 0,
      forksCount: typeof data.forks_count === 'number' ? data.forks_count : 0,
    };
  } catch {
    return null;
  }
}

function stat(icon: string, kind: 'stars' | 'forks', count: number): string {
  return el('span', { class: 'cpd-github-card-stat' }, [
    icon,
    el('span', { class: 'cpd-github-card-num', [`data-cpd-github-${kind}-num`]: '' }, String(count)),
  ]);
}

/**
 * GitHub 仓库卡片（整卡可点击；标题为 owner/repo）。
 * 同步构建器：静态数据（描述/语言/计数）由 fetchGithubRepo 注入，缺省为纯链接卡片。
 * 返回 HTML 字符串，用 set:html 渲染；卡片上带 data-cpd-github-* 供运行时刷新。
 */
export function githubCard(
  options: GithubCardOptions,
  data: GithubRepoData | null = null,
): string {
  const { owner, repo, target = '_blank' } = options;
  const iconClass = 'cpd-github-card-icon';
  return el(
    'a',
    {
      class: 'cpd-github-card',
      href: `https://github.com/${owner}/${repo}`,
      target,
      rel: target === '_blank' ? 'noopener noreferrer' : undefined,
      'data-cpd-github-card': '',
      'data-cpd-github-owner': owner,
      'data-cpd-github-repo': repo,
    },
    [
      el('span', { class: 'cpd-github-card-head' }, [
        Icon.bookOpen({ class: iconClass }),
        el('span', { class: 'cpd-github-card-name' }, `${owner}/${repo}`),
      ]),
      el(
        'span',
        { class: 'cpd-github-card-desc', 'data-cpd-github-desc': '' },
        data?.description ?? '',
      ),
      el('span', { class: 'cpd-github-card-meta' }, [
        el('span', { class: 'cpd-github-card-lang' }, [
          el(
            'span',
            {
              class: 'cpd-github-card-dot',
              'data-cpd-github-lang-color': '',
              style: { backgroundColor: githubLanguageColor(data?.language ?? '') },
            },
            '',
          ),
          el('span', { 'data-cpd-github-lang': '' }, data?.language ?? 'Other'),
        ]),
        stat(Icon.star({ class: iconClass }), 'stars', data?.stargazersCount ?? 0),
        stat(Icon.gitFork({ class: iconClass }), 'forks', data?.forksCount ?? 0),
      ]),
    ],
  );
}

/** githubCards 网格布局：默认双列；stack 为每行一卡铺满整行 */
export type GithubCardsLayout = 'grid' | 'stack';

/**
 * 多张 GitHub 卡片网格（2 列；`layout: 'stack'` 时为每行一卡铺满整行）。
 * 每张卡片在网格单元内铺满（不再 480px 居中），行高取同列最高卡片。
 * 同步构建器：静态数据由 fetchGithubRepo 逐项注入。
 */
export function githubCards(
  items: GithubCardOptions[],
  dataList: (GithubRepoData | null)[] = [],
  options: { layout?: GithubCardsLayout } = {},
): string {
  const inner = items
    .map((item, i) => githubCard(item, dataList[i] ?? null))
    .join('');
  return el(
    'div',
    {
      class:
        options.layout === 'stack'
          ? 'cpd-github-cards cpd-github-cards-stack'
          : 'cpd-github-cards',
    },
    inner,
  );
}
