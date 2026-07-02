//------------------------------------------------------------------------------
// ExtensionMain — entry point of the standalone Nheengetá extension.
// Embedded hosts (e.g. DASE) call ActivateNheengeta directly instead.
//------------------------------------------------------------------------------

import * as vscode from "vscode";
import { ActivateNheengeta, XNheengetaApi } from "./NheengetaApi";

export function activate(pContext: vscode.ExtensionContext): XNheengetaApi {
    // The returned API is exposed to other extensions (DASE uses it to add the
    // #!dase subkernel when the standalone extension owns the notebook type).
    return ActivateNheengeta(pContext, {});
}

export function deactivate(): void {
    // Kernel processes are killed through context.subscriptions disposal.
}
