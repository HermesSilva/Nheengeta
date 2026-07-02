//------------------------------------------------------------------------------
// SubkernelRegistry — extension point for hosts (e.g. DASE) to plug custom
// subkernels such as #!dase. A subkernel intercepts cells whose magic matches
// its name and handles execution itself instead of the dotnet-interactive
// kernel.
//------------------------------------------------------------------------------

import * as vscode from "vscode";

export interface XSubkernel {
    /** Magic name without "#!" (e.g. "dase"). */
    Name: string;
    /** Execute the cell body; return outputs to render. */
    Execute(pCode: string, pCell: vscode.NotebookCell): Promise<vscode.NotebookCellOutput[]>;
}

export class XSubkernelRegistry {
    private readonly _Subkernels = new Map<string, XSubkernel>();

    public Register(pSubkernel: XSubkernel): void {
        this._Subkernels.set(pSubkernel.Name, pSubkernel);
    }

    /**
     * When the cell starts with a registered magic (e.g. "#!dase"), returns the
     * subkernel and the remaining body; otherwise undefined.
     */
    public Match(pCode: string): { Subkernel: XSubkernel; Body: string } | undefined {
        const match = /^#!(\w+)\s*\r?\n?/.exec(pCode);
        if (!match)
            return undefined;
        const subkernel = this._Subkernels.get(match[1]);
        if (!subkernel)
            return undefined;
        return { Subkernel: subkernel, Body: pCode.slice(match[0].length) };
    }
}
