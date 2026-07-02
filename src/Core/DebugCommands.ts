//------------------------------------------------------------------------------
// DebugCommands — "Debug Cell" for languages with a ready-made VS Code debug
// adapter: JavaScript (built-in js-debug), Python (ms-python/debugpy) and
// PowerShell (PowerShell extension).
//
// v1 model: the cell body is mirrored to a temp file (identical content, so
// line numbers match), breakpoints set on the cell are copied to the file, and
// a platform debug session is launched on it. The cell runs isolated — kernel
// variables from other cells are not visible inside the debug session.
//------------------------------------------------------------------------------

import * as vscode from "vscode";
import * as os from "os";
import * as path from "path";

interface XDebugTarget {
    FileExtension: string;
    /** Build the launch configuration for a mirrored cell file. */
    Configuration(pFile: string, pStopOnEntry: boolean): vscode.DebugConfiguration;
    /** Extension id required, or undefined when built-in. */
    RequiredExtension?: { Id: string; Name: string };
}

const DebugTargets: Record<string, XDebugTarget> = {
    javascript: {
        FileExtension: "js",
        Configuration: (pFile, pStopOnEntry) => ({
            type: "pwa-node",
            request: "launch",
            name: "Nheengetá: Debug JavaScript cell",
            program: pFile,
            stopOnEntry: pStopOnEntry,
            console: "integratedTerminal"
        })
    },
    python: {
        FileExtension: "py",
        RequiredExtension: { Id: "ms-python.python", Name: "Python (ms-python.python)" },
        Configuration: (pFile, pStopOnEntry) => ({
            type: "debugpy",
            request: "launch",
            name: "Nheengetá: Debug Python cell",
            program: pFile,
            stopOnEntry: pStopOnEntry,
            console: "integratedTerminal"
        })
    },
    powershell: {
        FileExtension: "ps1",
        RequiredExtension: { Id: "ms-vscode.powershell", Name: "PowerShell (ms-vscode.powershell)" },
        Configuration: (pFile, pStopOnEntry) => ({
            type: "PowerShell",
            request: "launch",
            name: "Nheengetá: Debug PowerShell cell",
            script: pFile,
            stopOnEntry: pStopOnEntry
        })
    }
};

export class XDebugCommands {

    public static Register(pContext: vscode.ExtensionContext): void {
        pContext.subscriptions.push(
            vscode.commands.registerCommand("Nheengeta.DebugCell", (pCell?: vscode.NotebookCell) => this.DebugCell(pCell)));
    }

    private static async DebugCell(pCell?: vscode.NotebookCell): Promise<void> {
        const cell = pCell ?? this.SelectedCell();
        if (!cell)
            return;

        const language = cell.document.languageId;
        const target = DebugTargets[language];
        if (!target) {
            void vscode.window.showInformationMessage(
                `Nheengetá: debugging is available for JavaScript, Python and PowerShell cells (this cell is ${language}).`);
            return;
        }
        if (target.RequiredExtension && !vscode.extensions.getExtension(target.RequiredExtension.Id)) {
            void vscode.window.showErrorMessage(
                `Nheengetá: debugging ${language} cells needs the ${target.RequiredExtension.Name} extension.`);
            return;
        }

        // Mirror the cell into a temp file — identical content, same line numbers.
        const directory = path.join(os.tmpdir(), "nheengeta-debug");
        await vscode.workspace.fs.createDirectory(vscode.Uri.file(directory));
        const file = path.join(directory, `cell-${cell.index + 1}.${target.FileExtension}`);
        const fileUri = vscode.Uri.file(file);
        await vscode.workspace.fs.writeFile(fileUri, new TextEncoder().encode(cell.document.getText()));

        // Copy breakpoints set on the cell to the mirrored file.
        const cellUri = cell.document.uri.toString();
        const mirrored: vscode.SourceBreakpoint[] = [];
        for (const breakpoint of vscode.debug.breakpoints) {
            if (!(breakpoint instanceof vscode.SourceBreakpoint))
                continue;
            if (breakpoint.location.uri.toString() !== cellUri)
                continue;
            mirrored.push(new vscode.SourceBreakpoint(
                new vscode.Location(fileUri, breakpoint.location.range),
                breakpoint.enabled, breakpoint.condition, breakpoint.hitCondition, breakpoint.logMessage));
        }
        if (mirrored.length > 0)
            vscode.debug.addBreakpoints(mirrored);

        // No breakpoints -> stop on entry so the session is visibly interactive.
        const config = target.Configuration(file, mirrored.length === 0);
        const started = await vscode.debug.startDebugging(undefined, config);
        if (!started) {
            if (mirrored.length > 0)
                vscode.debug.removeBreakpoints(mirrored);
            void vscode.window.showErrorMessage("Nheengetá: could not start the debug session.");
            return;
        }

        // Drop the mirrored breakpoints when the session ends.
        if (mirrored.length > 0) {
            const subscription = vscode.debug.onDidTerminateDebugSession((pSession) => {
                if (pSession.name === config.name) {
                    vscode.debug.removeBreakpoints(mirrored);
                    subscription.dispose();
                }
            });
        }
    }

    private static SelectedCell(): vscode.NotebookCell | undefined {
        const editor = vscode.window.activeNotebookEditor;
        if (!editor || editor.selection.isEmpty)
            return undefined;
        return editor.notebook.cellAt(editor.selection.start);
    }
}
