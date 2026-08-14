/**
 * CelestPlume Docs Kit — 图标汇总（一个文件一个图标）
 *
 * 新增图标：在 src/lib/ui/icons/ 下单独创建 <name>.ts（见 AGENTS.md），
 * 本文件聚合为 `Icon` 对象；禁止把所有图标塞进单个文件。
 */

import { chevronDown } from './chevronDown';
import { chevronRight } from './chevronRight';
import { chevronLeft } from './chevronLeft';
import { chevronsUpDown } from './chevronsUpDown';
import { externalLink } from './externalLink';
import { info } from './info';
import { triangleAlert } from './triangleAlert';
import { circleX } from './circleX';
import { circleCheck } from './circleCheck';
import { lightbulb } from './lightbulb';
import { link } from './link';
import { copy } from './copy';
import { check } from './check';
import { file } from './file';
import { folder } from './folder';
import { folderOpen } from './folderOpen';
import { text } from './text';
import { panelLeft } from './panelLeft';
import { search } from './search';
import { x } from './x';
import { sun } from './sun';
import { moon } from './moon';
import { monitor } from './monitor';
import { languages } from './languages';
import { github } from './github';
import { gitFork } from './gitFork';
import { arrowRight } from './arrowRight';
import { bookOpen } from './bookOpen';
import { list } from './list';
import { compass } from './compass';
import { code } from './code';
import { palette } from './palette';
import { zap } from './zap';
import { star } from './star';
import { layoutGrid } from './layoutGrid';
import { listOrdered } from './listOrdered';
import { panelsTopLeft } from './panelsTopLeft';
import { chevronsDownUp } from './chevronsDownUp';
import { chevronsRight } from './chevronsRight';
import { moveLeft } from './moveLeft';
import { arrowUpRight } from './arrowUpRight';
import { sunMoon } from './sunMoon';
import { heading } from './heading';
import { tag } from './tag';
import { keyboard } from './keyboard';

export const Icon = {
  chevronDown: chevronDown,
  chevronRight: chevronRight,
  chevronLeft: chevronLeft,
  chevronsUpDown: chevronsUpDown,
  externalLink: externalLink,
  info: info,
  triangleAlert: triangleAlert,
  circleX: circleX,
  circleCheck: circleCheck,
  lightbulb: lightbulb,
  link: link,
  copy: copy,
  check: check,
  file: file,
  folder: folder,
  folderOpen: folderOpen,
  text: text,
  panelLeft: panelLeft,
  search: search,
  x: x,
  sun: sun,
  moon: moon,
  monitor: monitor,
  languages: languages,
  github: github,
  gitFork: gitFork,
  arrowRight: arrowRight,
  bookOpen: bookOpen,
  list: list,
  compass: compass,
  code: code,
  palette: palette,
  zap: zap,
  star: star,
  layoutGrid: layoutGrid,
  listOrdered: listOrdered,
  panelsTopLeft: panelsTopLeft,
  chevronsDownUp: chevronsDownUp,
  chevronsRight: chevronsRight,
  moveLeft: moveLeft,
  arrowUpRight: arrowUpRight,
  sunMoon: sunMoon,
  heading: heading,
  tag: tag,
  keyboard: keyboard,
} as const;

export type IconName = keyof typeof Icon;
