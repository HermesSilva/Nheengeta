# Changelog

All notable changes to **Nheengetá Notebooks** are documented here.
The format follows [Keep a Changelog](https://keepachangelog.com) and the
project adheres to [Semantic Versioning](https://semver.org).

## [0.1.25] — 2026-07-02

First public preview. Everything below shipped across the 0.1.x series.

### Zero-setup (novice-friendly)
- SQL cells with no connection **auto-connect** to the default LocalDB
  instance (discovered via `sqllocaldb`); manual `#!connect` always wins.
- Python cells with no connection auto-detect the Jupyter kernelspec and,
  when missing, **install jupyter + ipykernel automatically via pip**
  (progress reported in the cell output). The pip user Scripts directory is
  added to the kernel PATH automatically; ipykernel is pinned to 6.x
  (version 7 hangs the dotnet-interactive jupyter connector).
- sql/kql/python/r cells route automatically to the kernel created by their
  `#!connect`; when nothing can be resolved, the error is a copy-ready
  connect instruction instead of a stack trace.
- Language validation suite (`test-languages.js`) exercising every tongue
  end-to-end, with `--strict` mode for fully-equipped machines.

### Notebook core
- `.nhg` notebooks: plain-text, diff-friendly cells (same layout as `.dib`),
  opened in the native VS Code notebook editor.
- Execution through the open-source `dotnet-interactive` kernel over stdio,
  with guided one-click install of the .NET Interactive global tool.
- Kernel lifecycle: restart command, zombie-process cleanup, controller
  auto-selected as soon as a notebook opens.
- Magic completions: type `#!` and pick from every language and utility magic.

### Languages
- C#, F#, PowerShell — full kernel execution with shared variables (`#!set`).
- JavaScript — runs locally in Node (same runtime the debugger uses).
- T-SQL and KQL — `#!connect mssql` / `#!connect kusto`, with the connector
  NuGet packages preloaded automatically on first use.
- Python and R — bridged to local Jupyter kernels via `#!connect jupyter`.
- HTML and Mermaid — rendered inline, offline (bundled Mermaid renderer).
- **Math** — mathjs-powered cell language: symbolic derivatives, `simplify`,
  matrices, complex numbers, units, big numbers; per-notebook persistent
  scope; results typeset in LaTeX via a bundled KaTeX renderer; `plot()`
  samples any expression (including user-defined functions) into interactive
  Plotly charts with hover, zoom and PNG export.

### Cell toolbar (left side, colored icons)
- Language picker with brand-colored icons and debuggable badges.
- Run to Here — execute from the top through the current cell.
- **Debug Cell** (red ladybug) — breakpoints set in the cell, watch, step,
  live value editing, for JavaScript, Python and PowerShell.
- Ask AI — sends the cell and its error to a chosen Language Model
  (model picker); apply the proposed code to the cell, insert below, open or
  copy the full answer.
- Add Package — inserts a `#!use` line for the cell's language.
- Copy Output and Export Output (`.html`/`.txt`).

### Dependencies
- Universal `#!use <package>` magic: resolved per cell language to NuGet,
  npm (extension-managed cache + `NODE_PATH`), pip, PowerShell Gallery or
  CRAN; installs cached per session.

### Variables
- Variables panel per kernel: inspect, auto-refresh after every execution,
  Set Value into the live session.
- Hover a variable inside a cell to see its current kernel value.

### Editor defaults
- Cell toolbar on the left, line numbers on, cell status bar hidden,
  breakpoints allowed everywhere, inline values during debug.
