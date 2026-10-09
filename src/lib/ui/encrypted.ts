/**
 * CelestPlume Docs Kit — 受保护内容解锁门（纯 TS 构建器）
 *
 * 页面级加密（frontmatter `encrypted/password/passwordHint`）在构建期把正文
 * 渲染为 AES-256-GCM 密文（见 src/lib/crypto/protected-content.ts 与
 * src/components/kit/EncryptedContent.astro），本构建器输出解锁 UI：
 * 密码输入 + 显隐切换 + 解锁按钮 + 提示/错误行。交互由 runtime.ts 的
 * initEncrypted 接管（data-cpd-encrypted-* 钩子）。
 */

import { el } from './html';
import { Icon } from './icons';

/** 门内文案（页面按 locale 传入 EN/ZH） */
export interface EncryptedGateLabels {
  /** 标题（如 "Protected content" / "受保护的内容"） */
  title: string;
  /** 说明行 */
  description: string;
  /** 密码输入框 placeholder / aria-label */
  placeholder: string;
  /** 解锁按钮文案 */
  unlock: string;
  /** 显示密码（aria-label） */
  showPassword: string;
  /** 隐藏密码（aria-label） */
  hidePassword: string;
  /** 解锁失败的错误文案（runtime 填充） */
  errorMessage: string;
}

export interface EncryptedGateOptions {
  labels: EncryptedGateLabels;
  /** 密码提示（展示在表单下方；不传则不渲染该行） */
  hint?: string;
}

/**
 * 渲染解锁门。`data-cpd-encrypted-gate` 容器由 initEncrypted 接管；
 * 错误文案由 runtime 写入 [data-cpd-encrypted-error]。
 */
export function encryptedGate(options: EncryptedGateOptions): string {
  const { labels, hint } = options;
  const iconClass = 'cpd-encrypted-icon';

  const form = el(
    'form',
    { class: 'cpd-encrypted-form', 'data-cpd-encrypted-form': '' },
    [
      el('div', { class: 'cpd-encrypted-field' }, [
        el('input', {
          type: 'password',
          class: 'cpd-encrypted-input',
          'data-cpd-encrypted-input': '',
          placeholder: labels.placeholder,
          autocomplete: 'current-password',
          'aria-label': labels.placeholder,
        }, ''),
        el('button', {
          type: 'button',
          class: 'cpd-encrypted-eye',
          'data-cpd-encrypted-toggle': '',
          'aria-label': labels.showPassword,
          'data-cpd-encrypted-label-show': labels.showPassword,
          'data-cpd-encrypted-label-hide': labels.hidePassword,
        }, Icon.eye({ class: iconClass })),
      ]),
      el(
        'button',
        { type: 'submit', class: 'cpd-encrypted-submit' },
        `${Icon.lock({ class: iconClass })}<span>${labels.unlock}</span>`,
      ),
    ],
  );

  return el('div', { class: 'cpd-encrypted-gate', 'data-cpd-encrypted-gate': '' }, [
    el('div', { class: 'cpd-encrypted-seal', 'aria-hidden': 'true' }, Icon.lock({ class: 'cpd-encrypted-seal-icon' })),
    el('p', { class: 'cpd-encrypted-title' }, labels.title),
    el('p', { class: 'cpd-encrypted-desc' }, labels.description),
    form,
    hint
      ? el('p', { class: 'cpd-encrypted-hint' }, [
          Icon.lightbulb({ class: `${iconClass} cpd-encrypted-hint-icon` }),
          el('span', {}, hint),
        ])
      : null,
    el('p', { class: 'cpd-encrypted-error', 'data-cpd-encrypted-error': '', hidden: true }, labels.errorMessage),
  ]);
}
