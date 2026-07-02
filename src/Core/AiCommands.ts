//------------------------------------------------------------------------------
// AiCommands — "Ask AI" on the cell toolbar. Sends the cell code (and its
// error output, when present) plus a user prompt to a chat model picked from
// the ones available through the VS Code Language Model API (Copilot models),
// then offers to apply the answer back to the notebook.
//------------------------------------------------------------------------------

import * as vscode from "vscode";

export class XAiCommands {

    public static Register(pContext: vscode.ExtensionContext): void {
        pContext.subscriptions.push(
            vscode.commands.registerCommand("Nheengeta.AskAi", (pCell?: vscode.NotebookCell) => this.AskAi(pCell)));
    }

    private static async AskAi(pCell?: vscode.NotebookCell): Promise<void> {
        const cell = pCell ?? this.SelectedCell();
        if (!cell)
            return;

        // ── pick a model ────────────────────────────────────────────────────
        const models = await vscode.lm.selectChatModels({});
        if (models.length === 0) {
            void vscode.window.showErrorMessage(
                "Nheengetá: no AI model available. Sign in to GitHub Copilot (or another Language Model provider) and try again.");
            return;
        }
        const modelPick = await vscode.window.showQuickPick(
            models.map((m) => ({
                label: m.name,
                description: `${m.vendor} · ${m.family}`,
                Model: m
            })),
            { title: "Nheengetá — choose the AI model", placeHolder: "Model that will answer" });
        if (!modelPick)
            return;

        // ── gather context ──────────────────────────────────────────────────
        const code = cell.document.getText();
        const language = cell.document.languageId;
        const error = this.ErrorText(cell);

        const prompt = await vscode.window.showInputBox({
            title: `Nheengetá — ask ${modelPick.label}`,
            prompt: "What do you want? (cell code and its error are sent as context)",
            value: error ? "Fix the error in this cell." : "",
            placeHolder: "e.g. Fix the error / Explain this code / Optimize this query"
        });
        if (prompt === undefined || prompt.trim().length === 0)
            return;

        const context: string[] = [
            `You are helping inside a polyglot notebook (Nheengetá). The current cell is written in ${language}.`,
            "Answer concisely. When you propose corrected code, put the complete cell replacement in a single fenced code block.",
            "",
            "CELL CODE:",
            "```" + language,
            code,
            "```"
        ];
        if (error) {
            context.push("", "CELL ERROR OUTPUT:", "```", error, "```");
        }
        context.push("", "REQUEST:", prompt);

        // ── send and stream ─────────────────────────────────────────────────
        let answer = "";
        try {
            await vscode.window.withProgress(
                {
                    location: vscode.ProgressLocation.Notification,
                    title: `Nheengetá: asking ${modelPick.label}…`,
                    cancellable: true
                },
                async (_pProgress, pToken) => {
                    const response = await modelPick.Model.sendRequest(
                        [vscode.LanguageModelChatMessage.User(context.join("\n"))],
                        {},
                        pToken);
                    for await (const fragment of response.text)
                        answer += fragment;
                });
        }
        catch (err) {
            void vscode.window.showErrorMessage(`Nheengetá: AI request failed — ${err instanceof Error ? err.message : String(err)}`);
            return;
        }
        if (answer.trim().length === 0)
            return;

        await this.OfferActions(cell, answer);
    }

    // ─── response actions ────────────────────────────────────────────────────

    private static async OfferActions(pCell: vscode.NotebookCell, pAnswer: string): Promise<void> {
        const codeBlock = /```[\w#+-]*\r?\n([\s\S]*?)```/.exec(pAnswer)?.[1]?.replace(/\s+$/, "");

        interface XAction extends vscode.QuickPickItem { Id: string; }
        const actions: XAction[] = [];
        if (codeBlock) {
            actions.push({ Id: "apply", label: "$(replace-all) Apply code to cell", description: "Replace the cell content with the proposed code" });
            actions.push({ Id: "insert", label: "$(insert) Insert as new cell below", description: "Keep this cell; add the proposed code after it" });
        }
        actions.push({ Id: "view", label: "$(book) Open full answer", description: "Open the complete response in an editor" });
        actions.push({ Id: "copy", label: "$(copy) Copy answer", description: "Copy the full response to the clipboard" });

        const preview = pAnswer.replace(/\s+/g, " ").slice(0, 120);
        const pick = await vscode.window.showQuickPick(actions, {
            title: "Nheengetá — AI answered",
            placeHolder: preview
        });
        if (!pick)
            return;

        switch (pick.Id) {
            case "apply": {
                const edit = new vscode.WorkspaceEdit();
                const fullRange = new vscode.Range(
                    new vscode.Position(0, 0),
                    pCell.document.lineAt(pCell.document.lineCount - 1).range.end);
                edit.replace(pCell.document.uri, fullRange, codeBlock!);
                await vscode.workspace.applyEdit(edit);
                break;
            }
            case "insert": {
                const cellData = new vscode.NotebookCellData(
                    vscode.NotebookCellKind.Code, codeBlock!, pCell.document.languageId);
                const edit = new vscode.WorkspaceEdit();
                edit.set(pCell.notebook.uri, [
                    vscode.NotebookEdit.insertCells(pCell.index + 1, [cellData])
                ]);
                await vscode.workspace.applyEdit(edit);
                break;
            }
            case "view": {
                const document = await vscode.workspace.openTextDocument({ language: "markdown", content: pAnswer });
                await vscode.window.showTextDocument(document, { preview: true, viewColumn: vscode.ViewColumn.Beside });
                break;
            }
            case "copy":
                await vscode.env.clipboard.writeText(pAnswer);
                void vscode.window.showInformationMessage("Nheengetá: answer copied.");
                break;
        }
    }

    // ─── helpers ─────────────────────────────────────────────────────────────

    /** Concatenated error outputs of the cell, if any. */
    private static ErrorText(pCell: vscode.NotebookCell): string | undefined {
        const decoder = new TextDecoder("utf-8");
        const parts: string[] = [];
        for (const output of pCell.outputs) {
            for (const item of output.items) {
                if (item.mime !== "application/vnd.code.notebook.error")
                    continue;
                try {
                    const parsed = JSON.parse(decoder.decode(item.data)) as { message?: string; stack?: string };
                    parts.push(parsed.message ?? parsed.stack ?? "");
                }
                catch {
                    parts.push(decoder.decode(item.data));
                }
            }
        }
        const text = parts.filter((p) => p.length > 0).join("\n");
        return text.length > 0 ? text : undefined;
    }

    private static SelectedCell(): vscode.NotebookCell | undefined {
        const editor = vscode.window.activeNotebookEditor;
        if (!editor || editor.selection.isEmpty)
            return undefined;
        return editor.notebook.cellAt(editor.selection.start);
    }
}
