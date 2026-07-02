//------------------------------------------------------------------------------
// PlotRenderer — renders "application/vnd.nheengeta.plot+json" outputs with
// function-plot (d3): interactive zoom/pan math plots. Bundled by esbuild.
//------------------------------------------------------------------------------

import functionPlot from "function-plot";
import type { ActivationFunction } from "vscode-notebook-renderer";

interface XPlotSpec {
    data: Array<Record<string, unknown>>;
    options: {
        title?: string;
        xDomain?: [number, number];
        yDomain?: [number, number];
        width?: number;
        height?: number;
        grid?: boolean;
    };
}

const Style = `
.function-plot text { fill: var(--vscode-foreground, #ccc); }
.function-plot path.line { stroke-width: 1.5px; }
.function-plot .axis path, .function-plot .axis line { stroke: var(--vscode-editorWidget-border, #555); }
.function-plot .title { fill: var(--vscode-foreground, #ccc); }
`;

export const activate: ActivationFunction = () => {
    return {
        renderOutputItem(pItem, pElement) {
            const spec = pItem.json() as XPlotSpec;
            pElement.replaceChildren();

            const style = document.createElement("style");
            style.textContent = Style;
            pElement.appendChild(style);

            const target = document.createElement("div");
            pElement.appendChild(target);
            try {
                functionPlot({
                    target,
                    width: spec.options.width ?? 640,
                    height: spec.options.height ?? 360,
                    grid: spec.options.grid !== false,
                    title: spec.options.title,
                    xAxis: spec.options.xDomain ? { domain: spec.options.xDomain } : undefined,
                    yAxis: spec.options.yDomain ? { domain: spec.options.yDomain } : undefined,
                    data: spec.data as never
                });
            }
            catch (err) {
                const pre = document.createElement("pre");
                pre.style.color = "var(--vscode-errorForeground, #f48771)";
                pre.textContent = `Plot: ${err instanceof Error ? err.message : String(err)}`;
                pElement.replaceChildren(pre);
            }
        }
    };
};
