---
title: Privacy Policy
description: How ChronoSync (SDNUChronoSync) collects, uses, and protects your personal information, and the rights you have.
sidebar:
  order: 2
---

# Privacy Policy

> Effective date: August 9, 2026

Welcome to **ChronoSync (SDNUChronoSync)**. We take your personal information and privacy seriously. This Privacy Policy (the "Policy") explains what information we collect, how we use and protect it, and the rights you have. Please read it carefully before using the Service.

## 1. Scope

1. This Policy applies to the processing of your personal information by **CelPlume (Celest Plume)**, as the operator, in connection with the online Service (<https://sxtj.hxcn.space>) and self-hosted instances of ChronoSync.
2. When you navigate to third-party websites or services (such as the educational administration system, WebVPN, or AList), their privacy policies apply separately and are outside this Policy.

## 2. Information We Collect

### 1. Registration and account information

- **Required**: student ID, real name, class, grade, and login password (stored in irreversibly hashed form; we cannot retrieve your plaintext password);
- **Optional**: college, bio, avatar, and a bound email address (used for password recovery and security verification).

### 2. Information you generate while using the Service

- **Schedule and calendar data**: schedule names; event titles, descriptions, locations, and start/end times; adjustment and swap records;
- **Team data**: team name, description, icon, member relationships, invite codes, shift schedules, and batch operation records;
- **Sharing data**: share links for schedules, temporary appointments, and team heatmaps, including expiry, permissions, and view counts.

### 3. Login and security information

- Login time, IP address, browser type and version, operating system, and User-Agent, used for login history, security monitoring, and abuse prevention;
- IP and related data used for rate limiting and bans (account, IP, or email bans).

### 4. Information stored locally on your device

- Login credentials (JWT token), theme preference, sidebar collapse state, and avatar cache are stored in your browser's `localStorage` on your own device.

### 5. Email verification data

- When binding or changing an email address, or recovering a password, we send a verification code to your email and record the code, send time, and verification status (stored short-term).

### 6. Information we do **not** collect

- **Educational administration / WebVPN credentials**: the username, password, and captcha you enter for schedule import or empty-classroom lookup are **used only for the current request, are not written to the database or logs, and are cleared from memory when the session expires**;
- Payment information: the Service has no paid features and collects no payment information;
- By default we deploy no third-party analytics scripts. If the operator enables an analytics script (e.g., Umami) through controlled code injection, the data collected is governed by that script's own description.

## 3. How We Use Information

We use your information only to the extent necessary for the following purposes:

1. **Providing the Service**: timetable and schedule management, adjustments, team collaboration, sharing, and empty-classroom lookup;
2. **Account and security**: authentication, login records, rate limiting, bans, and anomaly detection;
3. **Notifications and support**: sending email verification codes and responding to your inquiries;
4. **Improving the Service**: analyzing feature usage on a de-identified basis to improve the product;
5. **Legal compliance**: providing information as required by laws and regulations or competent authorities.

## 4. Sharing and Entrusted Processing

1. **No sale of data**: we do not sell or rent your personal information.
2. **Necessary interactions to provide the Service**:
   - Zhengfang educational administration system and WebVPN: to import schedules or query empty classrooms, the server interacts with upstream systems using the credentials you provided for that session; credentials are not persisted;
   - AList (if enabled): avatars you upload may be stored on that self-hosted storage service;
   - SMTP mail service: used to send verification-code emails.
3. **Legal requirements**: we may provide your information as required by applicable laws or regulations, or when necessary to protect your or others' lawful rights.

## 5. Storage and Security

1. **Storage location**: data for the online Service is stored on the operator's self-hosted servers (SQLite or PostgreSQL databases), under the operator's independent control.
2. **Security measures**: passwords are stored as hashes; authentication uses JWT with token-version invalidation; transmission is encrypted with HTTPS; login/registration endpoints are rate-limited; bans at the account/IP/email level are supported; administrators can monitor login records.
3. **Retention**: we retain your information only as long as necessary to fulfill the purposes in this Policy. When you delete schedules, events, or other content, the related data is removed (except where retention is required by law).

## 6. Your Rights

Under the Personal Information Protection Law of the People's Republic of China and other applicable laws, you have the following rights:

1. **Access and correction**: view and edit your personal information on the profile page;
2. **Export**: export schedules as PNG images or ICS files;
3. **Security settings**: change your password, bind or change your email, and view login history;
4. **Deletion**: delete schedules, calendar events, team profiles, and share links you created. To delete your account and all associated data, contact us (the Service has no self-service account deletion; we will verify your identity and process the request);
5. **Withdrawing consent**: you may stop using the Service and ask us to delete the information collected;
6. **Complaints**: if you believe we have infringed your rights in processing personal information, you may contact us or file a complaint with the competent authorities.

To exercise these rights or ask questions, contact <excnies@yeah.net>; we will verify and respond within a reasonable period.

## 7. Minors

The Service is intended for university students and faculty. If you are under 18, please use the Service under the guidance of a guardian. If you are under 14, we will obtain your guardian's consent before processing your personal information. If we discover that personal information of a child under 14 has been processed without guardian consent, we will delete the related data promptly.

## 8. Local Storage and Tracking Technologies

We store login credentials and interface preferences (theme, sidebar state, etc.) in your browser's `localStorage` for functional purposes only; they are not used for cross-site tracking. We set no third-party advertising or analytics cookies by default.

## 9. Changes to This Policy

We may revise this Policy from time to time. Material changes will be announced in advance via on-site notices or page announcements. Continuing to use the Service after the revised Policy takes effect constitutes acceptance of the revised Policy.

## 10. Contact Us

- Email: <excnies@yeah.net>
- Project homepage: <https://github.com/CelPlume/SDNUChronoSync>
- Feedback: [Issues](https://github.com/CelPlume/SDNUChronoSync/issues)
