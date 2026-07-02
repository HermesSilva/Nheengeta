//------------------------------------------------------------------------------
// MagicCompletionProvider — completes "#!" magic lines inside Nheengetá
// notebook cells with the languages the kernel speaks plus utility magics.
//------------------------------------------------------------------------------

import * as vscode from "vscode";

interface XMagicItem {
    Magic: string;
    Detail: string;
    Kind: vscode.CompletionItemKind;
    /** Languages first, utilities after. */
    Sort: string;
}

const MagicItems: XMagicItem[] = [
    { Magic: "csharp", Detail: "C# cell", Kind: vscode.CompletionItemKind.Value, Sort: "1csharp" },
    { Magic: "fsharp", Detail: "F# cell", Kind: vscode.CompletionItemKind.Value, Sort: "1fsharp" },
    { Magic: "pwsh", Detail: "PowerShell cell", Kind: vscode.CompletionItemKind.Value, Sort: "1pwsh" },
    { Magic: "javascript", Detail: "JavaScript cell", Kind: vscode.CompletionItemKind.Value, Sort: "1javascript" },
    { Magic: "sql", Detail: "SQL cell (needs #!connect mssql)", Kind: vscode.CompletionItemKind.Value, Sort: "1sql" },
    { Magic: "kql", Detail: "KQL cell (needs #!connect kusto)", Kind: vscode.CompletionItemKind.Value, Sort: "1kql" },
    { Magic: "html", Detail: "HTML cell", Kind: vscode.CompletionItemKind.Value, Sort: "1html" },
    { Magic: "mermaid", Detail: "Mermaid diagram cell", Kind: vscode.CompletionItemKind.Value, Sort: "1mermaid" },
    { Magic: "math", Detail: "Math cell (mathjs + plot)", Kind: vscode.CompletionItemKind.Value, Sort: "1math" },
    { Magic: "markdown", Detail: "Markdown cell", Kind: vscode.CompletionItemKind.Value, Sort: "1markdown" },
    { Magic: "python", Detail: "Python cell (needs #!connect jupyter --kernel-name python)", Kind: vscode.CompletionItemKind.Value, Sort: "1python" },
    { Magic: "r", Detail: "R cell (needs #!connect jupyter --kernel-name r)", Kind: vscode.CompletionItemKind.Value, Sort: "1r" },
    { Magic: "use", Detail: "Install packages for this cell's language (nuget/npm/pip/PSGallery/CRAN)", Kind: vscode.CompletionItemKind.Function, Sort: "2a-use" },
    { Magic: "set", Detail: "Share a variable between kernels", Kind: vscode.CompletionItemKind.Function, Sort: "2set" },
    { Magic: "import", Detail: "Run another notebook/script", Kind: vscode.CompletionItemKind.Function, Sort: "2import" },
    { Magic: "connect", Detail: "Connect a subkernel (mssql, kusto, jupyter…)", Kind: vscode.CompletionItemKind.Function, Sort: "2connect" },
    { Magic: "time", Detail: "Measure cell execution time", Kind: vscode.CompletionItemKind.Function, Sort: "2time" },
    { Magic: "who", Detail: "List variable names", Kind: vscode.CompletionItemKind.Function, Sort: "2who" },
    { Magic: "whos", Detail: "List variables with values", Kind: vscode.CompletionItemKind.Function, Sort: "2whos" },
    { Magic: "about", Detail: "Kernel info", Kind: vscode.CompletionItemKind.Function, Sort: "2about" },
    { Magic: "lsmagic", Detail: "List all magic commands", Kind: vscode.CompletionItemKind.Function, Sort: "2lsmagic" }
];

export class XMagicCompletionProvider implements vscode.CompletionItemProvider {

    /** Register for notebook cells of every language Nheengetá supports. */
    public static Register(pContext: vscode.ExtensionContext): void {
        const selector: vscode.DocumentSelector = { scheme: "vscode-notebook-cell" };
        pContext.subscriptions.push(
            vscode.languages.registerCompletionItemProvider(selector, new XMagicCompletionProvider(), "#", "!"));
    }

    public provideCompletionItems(
        pDocument: vscode.TextDocument,
        pPosition: vscode.Position
    ): vscode.CompletionItem[] | undefined {
        if (!this.IsNheengetaCell(pDocument))
            return undefined;

        const linePrefix = pDocument.lineAt(pPosition.line).text.slice(0, pPosition.character);
        const match = /^(#!?)(\w*)$/.exec(linePrefix);
        if (!match)
            return undefined;

        const replaceRange = new vscode.Range(
            new vscode.Position(pPosition.line, 0),
            pPosition);

        return MagicItems.map((item) => {
            const completion = new vscode.CompletionItem(`#!${item.Magic}`, item.Kind);
            completion.detail = item.Detail;
            completion.range = replaceRange;
            completion.sortText = item.Sort;
            completion.filterText = `${match[1]}${item.Magic}`;
            return completion;
        });
    }

    private IsNheengetaCell(pDocument: vscode.TextDocument): boolean {
        for (const notebook of vscode.workspace.notebookDocuments) {
            if (notebook.notebookType !== "nheengeta")
                continue;
            for (const cell of notebook.getCells()) {
                if (cell.document.uri.toString() === pDocument.uri.toString())
                    return true;
            }
        }
        return false;
    }
}
