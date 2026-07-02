// Smoke test: spawn the kernel, submit C# code, expect stdout + return value.
const { XKernelProcess } = require("./out/Core/KernelProcess");
const { CreateSubmitCode } = require("./out/Core/KernelProtocol");

async function main() {
    const kernel = new XKernelProcess({
        DotnetPath: "dotnet",
        ExtraArgs: [],
        OnStderr: (t) => process.stderr.write("[kernel-err] " + t)
    });

    console.log("starting kernel...");
    await kernel.Start();
    console.log("kernel ready");

    const events = [];
    const result = await kernel.Execute(
        CreateSubmitCode('Console.WriteLine("Nheengeta speaks!");\n40 + 2', "csharp"),
        (e) => {
            events.push(e.eventType);
            const fv = e.event && e.event.formattedValues;
            if (fv) console.log(`  ${e.eventType}: ${JSON.stringify(fv)}`);
        });

    console.log("succeeded:", result.Succeeded, result.Error ? "error: " + result.Error : "");
    console.log("events:", events.join(", "));

    const ok = result.Succeeded
        && events.includes("StandardOutputValueProduced")
        && events.includes("ReturnValueProduced");
    kernel.Dispose();
    console.log(ok ? "SMOKE TEST PASSED" : "SMOKE TEST FAILED");
    process.exit(ok ? 0 : 1);
}

main().catch((e) => { console.error("FAILED:", e.message); process.exit(1); });
