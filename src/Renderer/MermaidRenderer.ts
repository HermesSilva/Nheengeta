//------------------------------------------------------------------------------
// MermaidRenderer — notebook output renderer for "text/vnd.mermaid".
// Bundled with esbuild (mermaid inlined); runs inside the outputs webview.
//------------------------------------------------------------------------------

import mermaid from "mermaid";
import type { ActivationFunction } from "vscode-notebook-renderer";

export const activate: ActivationFunction = () => {
    const dark = document.body.classList.contains("vscode-dark")
        || document.body.classList.contains("vscode-high-contrast");
    mermaid.initialize({ startOnLoad: false, theme: dark ? "dark" : "default", securityLevel: "loose" });

    let counter = 0;
    return {
        async renderOutputItem(pItem, pElement) {
            const code = pItem.text();
            try {
                const { svg } = await mermaid.render(`nheengeta-mermaid-${++counter}`, code);
                pElement.innerHTML = svg;
            }
            catch (err) {
                const pre = document.createElement("pre");
                pre.style.color = "var(--vscode-errorForeground, #f48771)";
                pre.textContent = `Mermaid: ${err instanceof Error ? err.message : String(err)}`;
                pElement.replaceChildren(pre);
            }
        }
    };
};
