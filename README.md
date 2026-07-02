<h1 align="center">Nheengetá Notebooks</h1>

<p align="center">
  <i>Polyglot notebooks powered by the .NET Interactive kernel — many tongues,
  one notebook.</i>
</p>

<p align="center">
  <b>C# · F# · PowerShell · JavaScript · T-SQL · KQL · Python · R · Math · HTML · Mermaid · Markdown</b>
</p>

---

## About the name

> **Nheengetá** — "many tongues", in Old Tupi.
>
> Before Portuguese ever existed in Brazil, there was already the *nheenga*:
> speech, the word, the tongue. The ancients said *Nheengatu* — "the good
> tongue" — to name the language that bound different peoples into a single
> understanding.
>
> **Nheengetá** is born of the same spirit, turned inside out: instead of one
> good tongue, many tongues at once, all running together under the same roof.
> C#, F#, T-SQL, KQL, PowerShell, JavaScript, Python, R, HTML, Mermaid — and
> the developer's own thinking out loud while experimenting — everything
> speaking, everything being heard, everything answering on the spot.
>
> A *nheengatu* polyglot is not someone who memorized words in several
> languages. It is someone who can stand between them — translating, testing,
> playing with an idea until it becomes certainty. That is the place
> **Nheengetá** occupies in your editor: the interval between thinking and
> confirming.

### Why it exists

> In 2026, Microsoft announced the deprecation of Polyglot Notebooks and .NET Interactive
> — the only reasonably serious tool that existed for running C# interactively inside VS Code,
> with rich output and database connectivity. No new features, no bug fixes, end of the line.
>
> Nheengetá was born out of that gap — not as an official successor (it is an independent project,
> with no affiliation to Microsoft), but as the answer of someone who missed having that kind of
> scratchpad right there, inside the editor, and decided to build it again, from scratch, with a
> more ambitious idea: not one interactive tongue, but several.

## Twelve tongues, one notebook

Write each cell in the language that says it best — variables flow between the
.NET tongues, and every cell runs with a `Shift+Enter`:

| Tongue | What you get |
|---|---|
| **C#** / **F#** | Full .NET scripting with NuGet packages one line away |
| **PowerShell** | Real automation, with the modules you already use |
| **JavaScript** | Runs in Node — same runtime the debugger uses |
| **T-SQL** | `#!connect mssql` once, query away (connector auto-installs) |
| **KQL** | Kusto clusters, same one-line connect |
| **Python** / **R** | Your local Jupyter kernels, bridged in |
| **Math** | A CAS-flavored language: symbolic derivatives, matrices, units, complex numbers — results typeset in **LaTeX (KaTeX)**, plots by **Plotly** |
| **HTML / Mermaid / Markdown** | Rendered inline, instantly, offline |

## What makes it different

- 🐞 **Debug your cells.** Set a breakpoint in the gutter, click the ladybug:
  step, watch, inspect and **edit values live** — for JavaScript, Python and
  PowerShell cells. (Notebook debugging: the thing notebook users always
  wanted and rarely get.)
- ➗ **Mathematics that looks like mathematics.** `derivative("x^3+2x^2","x")`
  answers in typeset LaTeX; `plot(["sin(x)","f(x)"])` gives an interactive
  Plotly chart — hover values, zoom, PNG export. Functions persist across
  cells. Zero setup, fully offline.
- 📦 **One way to install anything.** `#!use <package>` at the top of a cell —
  Nheengetá translates it to NuGet, npm, pip, PowerShell Gallery or CRAN
  depending on the cell's language. There is a toolbar button for it too.
- ✨ **AI on the cell, not in the way.** One click sends the cell *and its
  error* to the model of your choice (any Copilot/Language-Model provider);
  apply the fix to the cell, insert it below, or read the full answer.
- 🧭 **A toolbar that works for you.** Colored, purpose-built buttons on every
  code cell: language picker (with debuggable badges), run-to-here, debug,
  ask-AI, add-package, copy/export output.
- 👁️ **Live variables.** A Variables panel per kernel — inspect, refresh on
  every run, **set values** in the running session, and hover any variable in
  a cell to see its current value.
- 📄 **Plain-text notebooks.** `.nhg` is diff-friendly text (same cell layout
  as `.dib`) — version control and code review just work.
- 🧩 **Dual delivery.** Standalone extension *and* embedded engine inside
  [DASE](https://github.com/hermessilva/DASE50), where notebooks meet visual
  data modeling.

## Getting started

1. Run **`Nheengetá: New Nheengetá Notebook`** from the Command Palette.
2. Write C# in the first cell and press `Shift+Enter`.
3. If the kernel is missing, accept the one-click install and run again.

Then open the guided samples in the repository: `samples/hello.nhg`
(all languages), `samples/math-demo.nhg` (CAS + plots),
`samples/debug-demo.nhg` (breakpoints), `samples/deps-demo.nhg` (`#!use`).

## Requirements

- [.NET SDK](https://dotnet.microsoft.com/download) 8.0 or later.
- The `Microsoft.dotnet-interactive` global tool — Nheengetá detects and
  installs it for you on first run.
- Optional: a local Jupyter (`pip install jupyter`) for Python/R cells;
  GitHub Copilot (or another Language Model provider) for Ask AI.

## License

MIT
