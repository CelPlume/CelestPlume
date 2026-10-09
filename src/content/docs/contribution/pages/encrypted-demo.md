---
title: Encrypted Demo
description: 'A live password-protected page — the body ships as AES-256-GCM ciphertext only. Password: celplume'
encrypted: true
password: 'celplume'
passwordHint: 'The site brand, lowercase: the name you are reading right now'
---

# You unlocked it

This page is a live demo of [page encryption](/contribution/pages/encrypted/).
Everything below the frontmatter was encrypted at build time and decrypted
locally in your browser — nothing was sent to any server.

## What you should see

- A marker highlight: ==decrypted content==.
- A spoiler: the password was :spoiler[`celplume`].
- A code block with syntax highlighting:

```ts showLineNumbers
const payload = await decryptProtectedContent(payload, password, scope);
console.log('unlocked'); // rendered by Expressive Code at build time
```

## Why this is safe

The static HTML you downloaded contained only ciphertext, a random salt, and
a random IV. Try viewing the page source before unlocking — there is no
plaintext to find.
