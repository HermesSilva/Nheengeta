//------------------------------------------------------------------------------
// DependencyManager — one simple, uniform way to install per-language
// dependencies: a `#!use <package> [package...]` line at the top of any cell.
//
//   C# / F#      -> rewritten to `#r "nuget:Pkg"` (kernel downloads/caches)
//   JavaScript   -> npm install into the extension's global storage; the cell
//                   process gets NODE_PATH so require()/import resolves
//   Python       -> python -m pip install --user (once per session)
//   PowerShell   -> prepended Install-Module -Scope CurrentUser snippet
//   R            -> prepended install.packages() snippet
//   math         -> nothing to install (mathjs is batteries-included)
//------------------------------------------------------------------------------

import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import { spawn } from "child_process";

export interface XPreparedCell {
    Code: string;
    Env?: Record<string, string>;
    Notes: string[];
}

export class XDependencyManager {

    private static _StorageDir: string;
    private static readonly _SessionInstalled = new Set<string>();

    public static Initialize(pContext: vscode.ExtensionContext): void {
        this._StorageDir = pContext.globalStorageUri.fsPath;
    }

    /** Extract `#!use` lines and make sure the packages are available. */
    public static async Prepare(pLanguage: string, pCode: string): Promise<XPreparedCell> {
        const packages: string[] = [];
        const code = pCode.replace(/^[ \t]*#!use[ \t]+(.+)$/gm, (_pMatch, pList: string) => {
            packages.push(...pList.trim().split(/[\s,]+/).filter((p) => p.length > 0));
            return "";
        }).replace(/^\n+/, "");

        if (packages.length === 0)
            return { Code: pCode, Notes: [] };

        switch (pLanguage) {
            case "csharp":
            case "fsharp": {
                const refs = packages.map((p) => `#r "nuget:${p}"`).join("\n");
                return { Code: `${refs}\n${code}`, Notes: [`nuget: ${packages.join(", ")}`] };
            }
            case "javascript":
                return this.PrepareNode(packages, code);
            case "python":
                return this.PreparePython(packages, code);
            case "powershell": {
                const installs = packages.map((p) =>
                    `if (-not (Get-Module -ListAvailable -Name '${p}')) { Install-Module '${p}' -Scope CurrentUser -Force -AllowClobber }`
                ).join("\n");
                return { Code: `${installs}\n${code}`, Notes: [`PSGallery: ${packages.join(", ")}`] };
            }
            case "r": {
                const installs = packages.map((p) =>
                    `if (!requireNamespace("${p}", quietly = TRUE)) install.packages("${p}", repos = "https://cloud.r-project.org")`
                ).join("\n");
                return { Code: `${installs}\n${code}`, Notes: [`CRAN: ${packages.join(", ")}`] };
            }
            case "math":
                return { Code: code, Notes: ["math cells need no packages (mathjs is built in)"] };
            default:
                return { Code: code, Notes: [`#!use is not supported for ${pLanguage} cells`] };
        }
    }

    // ─── node (npm) ──────────────────────────────────────────────────────────

    private static async PrepareNode(pPackages: string[], pCode: string): Promise<XPreparedCell> {
        const notes: string[] = [];
        const prefix = path.join(this._StorageDir, "deps", "node");
        const modules = path.join(prefix, "node_modules");
        fs.mkdirSync(prefix, { recursive: true });

        for (const pkg of pPackages) {
            const bare = pkg.replace(/@[^/]*$/, ""); // strip version for the existence check
            const key = `npm:${pkg}`;
            if (this._SessionInstalled.has(key) || fs.existsSync(path.join(modules, bare)))
                continue;
            notes.push(`npm install ${pkg}…`);
            await this.Run("npm", ["install", pkg, "--prefix", prefix, "--no-audit", "--no-fund"], 180000);
            this._SessionInstalled.add(key);
        }
        return {
            Code: pCode,
            Env: { NODE_PATH: modules },
            Notes: notes.length > 0 ? notes : [`npm: ${pPackages.join(", ")} (cached)`]
        };
    }

    // ─── python (pip) ────────────────────────────────────────────────────────

    private static async PreparePython(pPackages: string[], pCode: string): Promise<XPreparedCell> {
        const notes: string[] = [];
        for (const pkg of pPackages) {
            const key = `pip:${pkg}`;
            if (this._SessionInstalled.has(key))
                continue;
            notes.push(`pip install ${pkg}…`);
            await this.Run("python", ["-m", "pip", "install", "--user", pkg], 300000);
            this._SessionInstalled.add(key);
        }
        return { Code: pCode, Notes: notes.length > 0 ? notes : [`pip: ${pPackages.join(", ")} (cached)`] };
    }

    // ─── helpers ─────────────────────────────────────────────────────────────

    private static Run(pCommand: string, pArgs: string[], pTimeoutMs: number): Promise<void> {
        return new Promise<void>((pResolve, pReject) => {
            const proc = spawn(pCommand, pArgs, { shell: true, windowsHide: true, timeout: pTimeoutMs });
            let stderr = "";
            proc.stderr?.setEncoding("utf8");
            proc.stderr?.on("data", (pChunk: string) => { stderr += pChunk; });
            proc.on("error", (pErr) => pReject(new Error(`${pCommand} failed: ${pErr.message}`)));
            proc.on("exit", (pCodeExit) => {
                if (pCodeExit === 0)
                    pResolve();
                else
                    pReject(new Error(`${pCommand} ${pArgs.slice(0, 2).join(" ")} exited with ${pCodeExit}: ${stderr.slice(0, 400)}`));
            });
        });
    }
}
