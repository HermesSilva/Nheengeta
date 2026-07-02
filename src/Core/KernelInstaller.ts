//------------------------------------------------------------------------------
// KernelInstaller — detects the .NET SDK and the Microsoft.dotnet-interactive
// global tool, and drives the one-click guided install.
//------------------------------------------------------------------------------

import * as vscode from "vscode";
import { execFile } from "child_process";

const MinimumSdkMajor = 8;
const KernelToolPackageId = "microsoft.dotnet-interactive";

export interface XKernelEnvironment {
    DotnetPath: string;
    SdkVersion?: string;
    SdkSupported: boolean;
    KernelToolInstalled: boolean;
}

export class XKernelInstaller {

    /** Configured dotnet executable (setting `nheengeta.dotnetPath`). */
    public static DotnetPath(): string {
        const configured = vscode.workspace.getConfiguration("nheengeta").get<string>("dotnetPath");
        return configured && configured.trim().length > 0 ? configured : "dotnet";
    }

    /** Probe SDK presence/version and kernel tool installation. */
    public static async Detect(): Promise<XKernelEnvironment> {
        const dotnetPath = this.DotnetPath();
        const result: XKernelEnvironment = {
            DotnetPath: dotnetPath,
            SdkSupported: false,
            KernelToolInstalled: false
        };

        try {
            const version = (await this.Run(dotnetPath, ["--version"])).trim();
            result.SdkVersion = version;
            const major = parseInt(version.split(".")[0], 10);
            result.SdkSupported = Number.isFinite(major) && major >= MinimumSdkMajor;
        }
        catch {
            return result; // no dotnet at all
        }

        try {
            const tools = await this.Run(dotnetPath, ["tool", "list", "-g"]);
            result.KernelToolInstalled = tools.toLowerCase().includes(KernelToolPackageId);
        }
        catch {
            // tool listing failed — treat as not installed
        }
        return result;
    }

    /**
     * Ensure the kernel can run: SDK present and tool installed.
     * Prompts and installs when needed. Returns true when ready.
     */
    public static async EnsureReady(): Promise<boolean> {
        const env = await this.Detect();

        if (!env.SdkVersion) {
            const open = "Download .NET SDK";
            const choice = await vscode.window.showErrorMessage(
                "Nheengetá needs the .NET SDK (8.0 or later) to run notebook cells, but `dotnet` was not found.",
                open);
            if (choice === open)
                void vscode.env.openExternal(vscode.Uri.parse("https://dotnet.microsoft.com/download"));
            return false;
        }
        if (!env.SdkSupported) {
            void vscode.window.showErrorMessage(
                `Nheengetá needs .NET SDK ${MinimumSdkMajor}.0 or later; found ${env.SdkVersion}.`);
            return false;
        }
        if (env.KernelToolInstalled)
            return true;

        const install = "Install kernel";
        const choice = await vscode.window.showInformationMessage(
            "Nheengetá needs the .NET Interactive kernel (`Microsoft.dotnet-interactive` global tool). Install it now?",
            install);
        if (choice !== install)
            return false;
        return this.Install(env.DotnetPath);
    }

    /** Run `dotnet tool install -g Microsoft.dotnet-interactive` with progress UI. */
    public static Install(pDotnetPath: string): Promise<boolean> {
        return new Promise<boolean>((pResolve) => {
            void vscode.window.withProgress(
                {
                    location: vscode.ProgressLocation.Notification,
                    title: "Installing .NET Interactive kernel…",
                    cancellable: false
                },
                async () => {
                    try {
                        await this.Run(pDotnetPath, ["tool", "install", "-g", "Microsoft.dotnet-interactive"], 300000);
                        void vscode.window.showInformationMessage("Nheengetá: .NET Interactive kernel installed.");
                        pResolve(true);
                    }
                    catch (err) {
                        void vscode.window.showErrorMessage(`Nheengetá: kernel install failed — ${err}`);
                        pResolve(false);
                    }
                });
        });
    }

    private static Run(pFile: string, pArgs: string[], pTimeoutMs = 30000): Promise<string> {
        return new Promise<string>((pResolve, pReject) => {
            execFile(pFile, pArgs, { timeout: pTimeoutMs, windowsHide: true }, (pErr, pStdout, pStderr) => {
                if (pErr)
                    pReject(new Error(pStderr || pErr.message));
                else
                    pResolve(pStdout);
            });
        });
    }
}
