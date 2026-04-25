# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Personal blog of Eduardo Hitek built with [Hugo](https://gohugo.io/). Published at https://eduardohitek.dev/. Uses a forked `hello-friend` theme as a git submodule (`themes/hello-friend`).

## Key Commands

```bash
# Start local dev server (with drafts visible)
hugo server -D

# Build the site
hugo

# Create a new Portuguese post
hugo new posts/YYYY-MM-DD-post-slug.md

# Create a new English post
hugo new posts-en/YYYY-MM-DD-post-slug.md
```

## Content Structure

| Path | Purpose |
|---|---|
| `content/posts/` | Portuguese blog posts |
| `content/posts-en/` | English blog posts |
| `content/talks/` | Talks/presentations |
| `content/about/` | About page |
| `static/images/` | Post cover images and assets |
| `layouts/partials/` | Custom Hugo template overrides |

## Post Front Matter

Every post uses this front matter structure:

```yaml
---
title: "Post Title"
date: YYYY-MM-DDTHH:MM:SS-03:00
draft: false
cover: "images/YYYY-MM-DD-post-slug/1.png"
coverAlt: "Alt text for cover image"
coverCaption: "Caption for cover image"
tags: ["tag1", "tag2"]
categories: ["category1", "category2"]
---
```

Post filenames follow the convention `YYYY-MM-DD-post-slug.md`. Cover images go in `static/images/YYYY-MM-DD-post-slug/`.

## Configuration

Main site config is `config.toml`. The theme is loaded from `themes/hello-friend` (a git submodule — run `git submodule update --init` if the theme directory is empty).
