//------------------------------------------------------------------------------
// CellCommands — commands behind Nheengetá's own cell-toolbar buttons.
// Menu invocations pass the target NotebookCell; palette invocations fall back
// to the active notebook selection.
//------------------------------------------------------------------------------

import * as vscode from "vscode";

export class XCellCommands {

    public static Register(pContext: vscode.ExtensionContext): void {
        pContext.subscriptions.push(
            vscode.commands.registerCommand("Nheengeta.CopyCellOutput", (pCell?: vscode.NotebookCell) => this.CopyOutput(pCell)),
            vscode.commands.registerCommand("Nheengeta.SelectCellLanguage", (pCell?: vscode.NotebookCell) => this.SelectLanguage(pCell)),
            vscode.commands.registerCommand("Nheengeta.RunToHere", (pCell?: vscode.NotebookCell) => this.RunToHere(pCell)),
            vscode.commands.registerCommand("Nheengeta.ExportCellOutput", (pCell?: vscode.NotebookCell) => this.ExportOutput(pCell)));
    }

    /** Cell from the menu context, or the active selection as fallback. */
    private static TargetCell(pCell?: vscode.NotebookCell): vscode.NotebookCell | undefined {
        if (pCell)
            return pCell;
        const editor = vscode.window.activeNotebookEditor;
        if (!editor || editor.selection.isEmpty)
            return undefined;
        return editor.notebook.cellAt(editor.selection.start);
    }

    // ─── Select language ─────────────────────────────────────────────────────

    private static async SelectLanguage(pCell?: vscode.NotebookCell): Promise<void> {
        const cell = this.TargetCell(pCell);
        if (!cell)
            return;
        // Focus the cell, then delegate to the native picker (proper language
        // icons from the icon theme; same UI as the status-bar language mode).
        const editor = vscode.window.activeNotebookEditor;
        if (editor && editor.notebook === cell.notebook)
            editor.selection = new vscode.NotebookRange(cell.index, cell.index + 1);
        await vscode.commands.executeCommand("notebook.cell.changeLanguage");
    }

    // ─── Run to here ─────────────────────────────────────────────────────────

    private static async RunToHere(pCell?: vscode.NotebookCell): Promise<void> {
        const cell = this.TargetCell(pCell);
        if (!cell)
            return;
        await vscode.commands.executeCommand("notebook.cell.execute", {
            ranges: [{ start: 0, end: cell.index + 1 }],
            document: cell.notebook.uri
        });
    }

    // ─── Copy / export output ────────────────────────────────────────────────

    /** Preferred textual representation of a cell's outputs. */
    private static OutputText(pCell: vscode.NotebookCell): { Text: string; IsHtml: boolean } | undefined {
        const decoder = new TextDecoder("utf-8");
        const parts: string[] = [];
        let isHtml = false;
        for (const output of pCell.outputs) {
            const plain = output.items.find((i) => i.mime === "text/plain");
            const html = output.items.find((i) => i.mime === "text/html");
            const item = plain ?? html ?? output.items[0];
            if (!item)
                continue;
            if (!plain && item === html)
                isHtml = true;
            parts.push(decoder.decode(item.data));
        }
        if (parts.length === 0)
            return undefined;
        return { Text: parts.join("\n"), IsHtml: isHtml };
    }

    private static async CopyOutput(pCell?: vscode.NotebookCell): Promise<void> {
        const cell = this.TargetCell(pCell);
        if (!cell)
            return;
        const output = this.OutputText(cell);
        if (!output) {
            void vscode.window.showInformationMessage("Nheengetá: cell has no output to copy.");
            return;
        }
        await vscode.env.clipboard.writeText(output.Text);
        void vscode.window.showInformationMessage("Nheengetá: cell output copied.");
    }

    private static async ExportOutput(pCell?: vscode.NotebookCell): Promise<void> {
        const cell = this.TargetCell(pCell);
        if (!cell)
            return;
        const output = this.OutputText(cell);
        if (!output) {
            void vscode.window.showInformationMessage("Nheengetá: cell has no output to export.");
            return;
        }
        const extension = output.IsHtml ? "html" : "txt";
        const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri;
        const target = await vscode.window.showSaveDialog({
            defaultUri: workspaceRoot ? vscode.Uri.joinPath(workspaceRoot, `cell-output.${extension}`) : undefined,
            filters: output.IsHtml
                ? { "HTML": ["html"], "Text": ["txt"] }
                : { "Text": ["txt"], "HTML": ["html"] },
            title: "Export Cell Output"
        });
        if (!target)
            return;
        await vscode.workspace.fs.writeFile(target, new TextEncoder().encode(output.Text));
        void vscode.window.showInformationMessage(`Nheengetá: output exported to ${target.fsPath}`);
    }
}
