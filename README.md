<h1 align="center">Nheengetá Notebooks</h1>

<p align="center">
  <i>Polyglot notebooks powered by the .NET Interactive kernel — many tongues,
  one notebook.</i>
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

## Features

- **`.nhg` notebooks** — plain-text, diff-friendly notebook files (same cell
  layout as `.dib`), opened in the native VS Code notebook editor.
- **.NET Interactive kernel** — cells are executed by the open-source
  [`dotnet-interactive`](https://github.com/dotnet/interactive) kernel.
- **Guided kernel install** — Nheengetá detects the .NET SDK and the kernel
  tool, and installs the kernel for you in one click.
- **Dual delivery** — published as a standalone extension *and* embedded inside
  [DASE](https://github.com/hermessilva/DASE50).

## Requirements

- [.NET SDK](https://dotnet.microsoft.com/download) 8.0 or later.
- The `Microsoft.dotnet-interactive` global tool (Nheengetá offers to install
  it on first run).

## Getting started

1. Run **`Nheengetá: New Nheengetá Notebook`** from the Command Palette.
2. Write C# in the first cell and press `Shift+Enter`.
3. If the kernel is missing, accept the install prompt and run the cell again.

## License

MIT
