/**
 * CelestPlume Docs Kit — TypeTable 参数契约表格构建器（纯 TS）
 *
 * Fumadocs `TypeTable` 的无框架移植：Props / REST 参数 / 配置项等
 * 结构化契约的专用表格（替代松散的 markdown 表格）。
 * - 属性名等宽加粗，必填带 `*` 星标，废弃带删除线 + 徽标
 * - 类型以行内等宽标签呈现
 * - 详情（说明 / 完整类型签名 / 默认值）用原生 `<details>` 折叠，零客户端 JS
 *
 * 输出纯 HTML 字符串。
 */

import { el, raw } from './html';
import { Icon } from './icons';

export interface TypeNode {
  /** 字段说明（允许行内 HTML，如 `<code>`） */
  description?: string;
  /** 短类型签名（摘要行等宽标签，必填） */
  type: string;
  /** 完整类型签名（展开后显示；多行/复杂类型用） */
  typeDescription?: string;
  /** 类型签名的跳转链接（配合 typeDescription） */
  typeDescriptionLink?: string;
  /** 默认值（展开后显示） */
  default?: string;
  /** 是否必填（名字后加 `*` 星标） */
  required?: boolean;
  /** 是否已废弃（名字加删除线 + 徽标） */
  deprecated?: boolean;
}

export type TypeTableData = Record<string, TypeNode>;

export interface TypeTableLabels {
  /** 表头列名（默认 "Prop" / "Type"） */
  prop?: string;
  type?: string;
  /** 键值行标签（默认 "Type" / "Default"） */
  default?: string;
}

/**
 * 渲染参数契约表格。
 *
 * @example
 * typeTable({
 *   variant: { type: "'solid' | 'ghost'", default: "'solid'", description: '视觉变体。' },
 *   size: { type: "'sm' | 'md'", required: true },
 * })
 */
export function typeTable(type: TypeTableData, labels: TypeTableLabels = {}): string {
  const rows = Object.entries(type).map(([name, node]) => renderRow(name, node, labels));

  return el('div', { class: 'cpd-type-table', 'data-cpd-type-table': '' }, [
    el('div', { class: 'cpd-type-table-head', 'aria-hidden': 'true' }, [
      el('span', {}, labels.prop ?? 'Prop'),
      el('span', {}, labels.type ?? 'Type'),
    ]),
    ...rows,
  ]);
}

function renderRow(name: string, node: TypeNode, labels: TypeTableLabels): string {
  const summary = [
    el('span', { class: 'cpd-type-table-name-wrap' }, [
      el('code', { class: 'cpd-type-table-name' }, name),
      node.required ? el('span', { class: 'cpd-type-table-star', title: 'required' }, '*') : '',
      node.deprecated ? el('span', { class: 'cpd-type-table-deprecated' }, 'deprecated') : '',
    ]),
    el('code', { class: 'cpd-type-table-type' }, node.type),
    Icon.chevronDown({ class: 'cpd-type-table-chevron' }),
  ].join('');

  const details = [
    node.description ? el('div', { class: 'cpd-type-table-desc' }, raw(node.description)) : '',
    node.typeDescription ? renderKv(labels.type ?? 'Type', node.typeDescription, node.typeDescriptionLink) : '',
    node.default ? renderKv(labels.default ?? 'Default', node.default) : '',
  ]
    .filter(Boolean)
    .join('');

  return el(
    'details',
    {
      class: 'cpd-type-table-item',
      'data-cpd-type-table-item': '',
      ...(node.deprecated ? { 'data-deprecated': '' } : {}),
    },
    [el('summary', {}, summary), el('div', { class: 'cpd-type-table-body' }, details)],
  );
}

/** 键值行：左侧大写小标签 + 右侧等宽值（可带链接） */
function renderKv(key: string, value: string, href?: string): string {
  const valueEl = href
    ? el('a', { class: 'cpd-type-table-value-link', href }, el('code', { class: 'cpd-type-table-value' }, value))
    : el('code', { class: 'cpd-type-table-value' }, value);
  return el('div', { class: 'cpd-type-table-kv' }, [
    el('span', { class: 'cpd-type-table-key' }, key),
    valueEl,
  ]);
}
