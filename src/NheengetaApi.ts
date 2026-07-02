//------------------------------------------------------------------------------
// NheengetaApi — the single activation entry point, shared by the standalone
// extension and by hosts that embed Nheengetá (e.g. DASE).
//------------------------------------------------------------------------------

import * as vscode from "vscode";
import { XNheengetaSerializer } from "./Core/NheengetaSerializer";
import { XNheengetaController, NotebookType } from "./Core/NheengetaController";
import { XSubkernelRegistry, XSubkernel } from "./Core/SubkernelRegistry";
import { XKernelInstaller } from "./Core/KernelInstaller";
import { XMagicCompletionProvider } from "./Core/MagicCompletionProvider";
import { XCellCommands } from "./Core/CellCommands";
import { XDebugCommands } from "./Core/DebugCommands";
import { XVariablesView } from "./Core/VariablesView";
import { XAiCommands } from "./Core/AiCommands";
import { XDependencyManager } from "./Core/DependencyManager";

export { XSubkernel, XSubkernelRegistry } from "./Core/SubkernelRegistry";
export { NotebookType } from "./Core/NheengetaController";

export interface XNheengetaOptions {
    /** Host-provided subkernels (e.g. DASE registers #!dase). */
    Subkernels?: XSubkernel[];
}

export interface XNheengetaApi {
    /** Register additional subkernels after activation. */
    RegisterSubkernel(pSubkernel: XSubkernel): void;
    RestartKernel(): Promise<void>;
}

const NewNotebookTemplate = `#!markdown

# New Nheengetá notebook

Run the C# cell below with \`Shift+Enter\`.

#!csharp

Console.WriteLine("Nheengetá speaks!");
1 + 1
`;

/** Activate Nheengetá inside `pContext`. Idempotent per extension host. */
export function ActivateNheengeta(pContext: vscode.ExtensionContext, pOptions?: XNheengetaOptions): XNheengetaApi {
    XDependencyManager.Initialize(pContext);
    const subkernels = new XSubkernelRegistry();
    for (const subkernel of pOptions?.Subkernels ?? [])
        subkernels.Register(subkernel);

    pContext.subscriptions.push(
        vscode.workspace.registerNotebookSerializer(NotebookType, new XNheengetaSerializer()));

    const controller = new XNheengetaController(pContext, subkernels);
    XMagicCompletionProvider.Register(pContext);

    pContext.subscriptions.push(
        vscode.commands.registerCommand("Nheengeta.New", () => NewNotebook()),
        vscode.commands.registerCommand("Nheengeta.Open", () => OpenNotebook()),
        vscode.commands.registerCommand("Nheengeta.RestartKernel", () => controller.RestartKernel()),
        vscode.commands.registerCommand("Nheengeta.InstallKernel", () => XKernelInstaller.EnsureReady()));
    XCellCommands.Register(pContext);
    XDebugCommands.Register(pContext);
    XVariablesView.Register(pContext, controller);
    XAiCommands.Register(pContext);

    return {
        RegisterSubkernel: (pSubkernel) => subkernels.Register(pSubkernel),
        RestartKernel: () => controller.RestartKernel()
    };
}

async function NewNotebook(): Promise<void> {
    const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri;
    const defaultUri = workspaceRoot
        ? vscode.Uri.joinPath(workspaceRoot, "Untitled.nhg")
        : undefined;
    const target = await vscode.window.showSaveDialog({
        defaultUri,
        filters: { "Nheengetá Notebook": ["nhg"] },
        title: "New Nheengetá Notebook"
    });
    if (!target)
        return;
    await vscode.workspace.fs.writeFile(target, new TextEncoder().encode(NewNotebookTemplate));
    await vscode.commands.executeCommand("vscode.openWith", target, "nheengeta");
}

async function OpenNotebook(): Promise<void> {
    const picked = await vscode.window.showOpenDialog({
        canSelectMany: false,
        filters: { "Nheengetá Notebook": ["nhg"] },
        title: "Open Nheengetá Notebook"
    });
    if (!picked || picked.length === 0)
        return;
    await vscode.commands.executeCommand("vscode.openWith", picked[0], "nheengeta");
}
