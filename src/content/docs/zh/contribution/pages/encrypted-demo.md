---
title: 加密演示
description: '一个真实的密码保护页面——正文仅以 AES-256-GCM 密文发布。密码：celplume'
encrypted: true
password: 'celplume'
passwordHint: '本站品牌缩写（小写）——就是你正在读的这个名字'
---

# 解锁成功

本页是[页面加密](/zh/contribution/pages/encrypted/)的实机演示。frontmatter
之下的一切都在构建期加密，并在你的浏览器本地解密——没有向任何服务器发送数据。

## 你应当看到

- 马克笔高亮：==解密后的内容==。
- 隐秘文本：密码就是 :spoiler[`celplume`]。
- 带语法高亮的代码块：

```ts showLineNumbers
const payload = await decryptProtectedContent(payload, password, scope);
console.log('unlocked'); // 构建期由 Expressive Code 渲染
```

## 为什么这是安全的

你下载到的静态 HTML 只包含密文、随机盐与随机 IV。解锁前查看页面源码——
找不到任何明文。
