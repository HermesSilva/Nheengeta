//------------------------------------------------------------------------------
// MathEngine — evaluates #!math cells with mathjs (symbolic-lite CAS: algebra,
// derivatives, matrices, complex numbers, units, bignumbers) and samples
// expressions into plot specs consumed by the PlotRenderer.
// Bundled by esbuild into out/Math/MathEngine.js (mathjs inlined).
//------------------------------------------------------------------------------

import { create, all } from "mathjs";

const _Math = create(all);
const DefaultSamples = 300;

export interface XPlotSpec {
    data: Array<Record<string, unknown>>;
    options: Record<string, unknown>;
}

export interface XMathOutput {
    Results: string[];
    Plots: XPlotSpec[];
    Error?: string;
}

interface XPlotOptions {
    from?: number;
    to?: number;
    samples?: number;
    title?: string;
    yDomain?: [number, number];
    width?: number;
    height?: number;
    grid?: boolean;
}

/**
 * Evaluate a math cell. `pScope` persists across cells of the same notebook,
 * so variables and functions defined earlier stay available.
 */
export function EvaluateMath(pCode: string, pScope: Record<string, unknown>): XMathOutput {
    const results: string[] = [];
    const plots: XPlotSpec[] = [];

    // plot("sin(x)") · plot(["sin(x)","cos(x)"], { from:-pi, to:pi, title:"..." })
    (pScope as Record<string, unknown>).plot = (pExpressions: unknown, pOptions?: XPlotOptions): string => {
        const options = pOptions ?? {};
        const from = Number(options.from ?? -10);
        const to = Number(options.to ?? 10);
        const samples = Math.min(Math.max(Number(options.samples ?? DefaultSamples), 10), 5000);
        const expressions = Array.isArray(pExpressions) ? pExpressions : [pExpressions];

        const data = expressions.map((pExpr) => {
            const source = String(pExpr);
            const compiled = _Math.compile(source);
            const points: Array<[number, number]> = [];
            const step = (to - from) / (samples - 1);
            const local = Object.create(pScope) as Record<string, unknown>;
            for (let i = 0; i < samples; i++) {
                const x = from + i * step;
                local["x"] = x;
                try {
                    const y = compiled.evaluate(local) as unknown;
                    const value = typeof y === "number" ? y : Number(y);
                    if (Number.isFinite(value))
                        points.push([x, value]);
                }
                catch {
                    // singularities/domain errors: skip the sample
                }
            }
            return { points, fnType: "points", graphType: "polyline", label: source };
        });

        plots.push({
            data,
            options: {
                title: options.title,
                xDomain: [from, to],
                yDomain: options.yDomain,
                width: options.width,
                height: options.height,
                grid: options.grid
            }
        });
        return `plot: ${expressions.map(String).join(", ")}`;
    };

    try {
        const outcome = _Math.evaluate(pCode, pScope) as unknown;
        Collect(outcome, results);
        return { Results: results, Plots: plots };
    }
    catch (err) {
        return { Results: results, Plots: plots, Error: err instanceof Error ? err.message : String(err) };
    }
}

function Collect(pValue: unknown, pResults: string[]): void {
    if (pValue === undefined)
        return;
    const typed = pValue as { type?: string; entries?: unknown[] };
    if (typed && typed.type === "ResultSet" && Array.isArray(typed.entries)) {
        for (const entry of typed.entries)
            Collect(entry, pResults);
        return;
    }
    if (typeof pValue === "string") {
        pResults.push(pValue);
        return;
    }
    if (typeof pValue === "function")
        return; // function definitions produce no output
    pResults.push(_Math.format(pValue, { precision: 14 }));
}
