//------------------------------------------------------------------------------
// NheengetaSerializer — .nhg <-> vscode.NotebookData.
//
// .nhg uses the .dib textual layout: cells are separated by kernel-chooser
// magic lines (#!csharp, #!markdown, ...). Round-trips must be lossless so the
// file stays diff-friendly.
//------------------------------------------------------------------------------

import * as vscode from "vscode";

interface XLanguageInfo {
    Magic: string;
    VsCodeLanguage: string;
    KernelName?: string;
}

const Languages: XLanguageInfo[] = [
    { Magic: "csharp", VsCodeLanguage: "csharp", KernelName: "csharp" },
    { Magic: "fsharp", VsCodeLanguage: "fsharp", KernelName: "fsharp" },
    { Magic: "pwsh", VsCodeLanguage: "powershell", KernelName: "pwsh" },
    { Magic: "javascript", VsCodeLanguage: "javascript", KernelName: "javascript" },
    { Magic: "sql", VsCodeLanguage: "sql", KernelName: "sql" },
    { Magic: "kql", VsCodeLanguage: "kql", KernelName: "kql" },
    { Magic: "html", VsCodeLanguage: "html", KernelName: "html" },
    { Magic: "mermaid", VsCodeLanguage: "mermaid", KernelName: "mermaid" },
    { Magic: "python", VsCodeLanguage: "python", KernelName: "python" },
    { Magic: "r", VsCodeLanguage: "r", KernelName: "r" },
    { Magic: "math", VsCodeLanguage: "math" },
    { Magic: "markdown", VsCodeLanguage: "markdown" }
];

const DefaultLanguage = Languages[0];

function ByMagic(pMagic: string): XLanguageInfo | undefined {
    return Languages.find((l) => l.Magic === pMagic);
}

function ByVsCodeLanguage(pLanguage: string): XLanguageInfo {
    return Languages.find((l) => l.VsCodeLanguage === pLanguage) ?? DefaultLanguage;
}

/** Kernel name the controller should target for a cell language. */
export function KernelNameForLanguage(pLanguage: string): string | undefined {
    return ByVsCodeLanguage(pLanguage).KernelName;
}

export class XNheengetaSerializer implements vscode.NotebookSerializer {

    public deserializeNotebook(pContent: Uint8Array): vscode.NotebookData {
        const text = new TextDecoder("utf-8").decode(pContent);
        const cells: vscode.NotebookCellData[] = [];

        let currentLanguage: XLanguageInfo | undefined;
        let currentLines: string[] = [];

        const flush = (): void => {
            if (!currentLanguage)
                return;
            const source = currentLines.join("\n").replace(/^\n+/, "").replace(/\n+$/, "");
            const kind = currentLanguage.Magic === "markdown"
                ? vscode.NotebookCellKind.Markup
                : vscode.NotebookCellKind.Code;
            cells.push(new vscode.NotebookCellData(kind, source, currentLanguage.VsCodeLanguage));
        };

        for (const line of text.split(/\r?\n/)) {
            const match = /^#!(\w+)\s*$/.exec(line);
            const language = match ? ByMagic(match[1]) : undefined;
            if (language) {
                flush();
                currentLanguage = language;
                currentLines = [];
            }
            else if (currentLanguage) {
                currentLines.push(line);
            }
            else if (line.trim().length > 0) {
                // content before any magic line: treat as C#
                currentLanguage = DefaultLanguage;
                currentLines = [line];
            }
        }
        flush();

        if (cells.length === 0)
            cells.push(new vscode.NotebookCellData(vscode.NotebookCellKind.Code, "", DefaultLanguage.VsCodeLanguage));
        return new vscode.NotebookData(cells);
    }

    public serializeNotebook(pData: vscode.NotebookData): Uint8Array {
        const parts: string[] = [];
        for (const cell of pData.cells) {
            const language = cell.kind === vscode.NotebookCellKind.Markup
                ? ByMagic("markdown")!
                : ByVsCodeLanguage(cell.languageId);
            parts.push(`#!${language.Magic}\n\n${cell.value.replace(/\s+$/, "")}\n`);
        }
        return new TextEncoder().encode(parts.join("\n"));
    }
}
