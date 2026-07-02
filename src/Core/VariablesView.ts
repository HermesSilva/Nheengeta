//------------------------------------------------------------------------------
// VariablesView — live kernel variables: tree view (watch), value editing, and
// hover hints inside notebook cells.
//------------------------------------------------------------------------------

import * as vscode from "vscode";
import { XNheengetaController, XVariableInfo } from "./NheengetaController";
import { KernelNameForLanguage } from "./NheengetaSerializer";

const KernelLabels: Record<string, string> = {
    csharp: "C#",
    fsharp: "F#",
    pwsh: "PowerShell",
    javascript: "JavaScript"
};

interface XVariableNode {
    Kernel: string;
    Variable?: XVariableInfo;
}

export class XVariablesView implements vscode.TreeDataProvider<XVariableNode>, vscode.HoverProvider {
    private readonly _OnDidChange = new vscode.EventEmitter<void>();
    public readonly onDidChangeTreeData = this._OnDidChange.event;

    /** kernel -> (name -> info); also feeds hover hints. */
    private readonly _Cache = new Map<string, Map<string, XVariableInfo>>();

    public static Register(pContext: vscode.ExtensionContext, pController: XNheengetaController): XVariablesView {
        const view = new XVariablesView(pController);
        pContext.subscriptions.push(
            vscode.window.registerTreeDataProvider("nheengetaVariables", view),
            vscode.languages.registerHoverProvider({ scheme: "vscode-notebook-cell" }, view),
            vscode.commands.registerCommand("Nheengeta.RefreshVariables", () => view.Refresh()),
            vscode.commands.registerCommand("Nheengeta.EditVariable", (pNode?: XVariableNode) => view.EditVariable(pNode)),
            pController.OnDidExecute(() => view.Refresh()));
        return view;
    }

    private constructor(private readonly _Controller: XNheengetaController) {
    }

    public Refresh(): void {
        this._OnDidChange.fire();
    }

    // ─── TreeDataProvider ────────────────────────────────────────────────────

    public getTreeItem(pNode: XVariableNode): vscode.TreeItem {
        if (!pNode.Variable) {
            const item = new vscode.TreeItem(
                KernelLabels[pNode.Kernel] ?? pNode.Kernel,
                vscode.TreeItemCollapsibleState.Expanded);
            item.iconPath = new vscode.ThemeIcon("server-process");
            item.contextValue = "nheengeta-kernel";
            return item;
        }
        const variable = pNode.Variable;
        const item = new vscode.TreeItem(variable.Name, vscode.TreeItemCollapsibleState.None);
        item.description = `${variable.Value}`;
        item.tooltip = new vscode.MarkdownString(
            `**${variable.Name}** \`${variable.TypeName}\`\n\n\`\`\`\n${variable.Value}\n\`\`\``);
        item.iconPath = new vscode.ThemeIcon("symbol-variable");
        item.contextValue = "nheengeta-variable";
        return item;
    }

    public async getChildren(pNode?: XVariableNode): Promise<XVariableNode[]> {
        if (!pNode) {
            const kernels = this._Controller.KernelsUsed;
            return kernels.map((k) => ({ Kernel: k }));
        }
        if (pNode.Variable)
            return [];
        const variables = await this._Controller.QueryVariables(pNode.Kernel);
        const map = new Map<string, XVariableInfo>();
        for (const variable of variables)
            map.set(variable.Name, variable);
        this._Cache.set(pNode.Kernel, map);
        return variables.map((v) => ({ Kernel: pNode.Kernel, Variable: v }));
    }

    // ─── Edit value ──────────────────────────────────────────────────────────

    public async EditVariable(pNode?: XVariableNode): Promise<void> {
        if (!pNode?.Variable)
            return;
        const current = await this._Controller.QueryVariableValue(pNode.Kernel, pNode.Variable.Name)
            ?? pNode.Variable.Value;
        const language = KernelLabels[pNode.Kernel] ?? pNode.Kernel;
        const expression = await vscode.window.showInputBox({
            title: `Nheengetá — set ${pNode.Variable.Name} (${language})`,
            prompt: "New value as a source expression (strings need quotes)",
            value: current
        });
        if (expression === undefined)
            return;
        const result = await this._Controller.SetVariable(pNode.Kernel, pNode.Variable.Name, expression);
        if (!result.Succeeded)
            void vscode.window.showErrorMessage(`Nheengetá: could not set value — ${result.Error ?? "unknown error"}`);
    }

    // ─── Hover hints in cells ────────────────────────────────────────────────

    public provideHover(pDocument: vscode.TextDocument, pPosition: vscode.Position): vscode.Hover | undefined {
        const kernel = KernelNameForLanguage(pDocument.languageId);
        if (!kernel)
            return undefined;
        const cache = this._Cache.get(kernel);
        if (!cache || cache.size === 0)
            return undefined;

        const range = pDocument.getWordRangeAtPosition(pPosition, /[A-Za-z_$][\w$]*/);
        if (!range)
            return undefined;
        const word = pDocument.getText(range).replace(/^\$/, "");
        const variable = cache.get(word) ?? cache.get(`$${word}`);
        if (!variable)
            return undefined;

        const markdown = new vscode.MarkdownString();
        markdown.appendMarkdown(`**${variable.Name}** \`${variable.TypeName}\``);
        markdown.appendCodeblock(variable.Value, pDocument.languageId);
        return new vscode.Hover(markdown, range);
    }
}
