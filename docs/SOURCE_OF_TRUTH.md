# Source of Truth Policy

## Rule

The private GitHub repository `kaitehtao/learn-what-you-own`, on the `main` branch, is the master source of truth for LearnWhatYouOwn.

## Operating Standard

1. Material decisions made in ChatGPT, on a phone, on a desktop, in meetings, or in working notes must be captured in GitHub.
2. Strategy, product requirements, architecture, brand positioning, legal guidance, investor materials, and implementation plans should live under `docs/`.
3. GitHub issues track open decisions, requests, and implementation work.
4. Markdown documents contain the current approved narrative and operating guidance.
5. Code and documentation changes should reference the relevant issue when practical.
6. When two versions conflict, the latest committed version on `main` governs unless a newer approved pull request or issue explicitly supersedes it.
7. Chat conversations are working sessions, not the permanent record.

## Device Synchronization

The same repository must be used from phone and desktop. Changes made through ChatGPT, GitHub, or a local desktop checkout must ultimately be committed and pushed to `main` so every device sees the same master version.

## Documentation Principle

> Nothing important should exist only inside a conversation.

Every meaningful company decision should become one of the following:

- a permanent document;
- a GitHub issue;
- a code change;
- a documented decision record.

## Status

Effective immediately.
