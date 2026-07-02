//------------------------------------------------------------------------------
// KernelProtocol — types and helpers for the dotnet-interactive stdio protocol.
//
// The kernel exchanges newline-delimited JSON envelopes over stdin/stdout:
//   command:  { token, id, commandType, command: {...} }
//   event:    { eventType, event: {...}, command: <originating envelope> }
// Events are correlated back to the originating command through `token`.
//------------------------------------------------------------------------------

export interface XKernelCommandEnvelope {
    token: string;
    id: string;
    commandType: string;
    command: Record<string, unknown>;
}

export interface XKernelEventEnvelope {
    eventType: string;
    event: Record<string, unknown>;
    command?: XKernelCommandEnvelope & { command: Record<string, unknown> };
}

// ─── Command types ──────────────────────────────────────────────────────────

export const CommandTypes = {
    SubmitCode: "SubmitCode",
    RequestCompletions: "RequestCompletions",
    RequestHoverText: "RequestHoverText",
    RequestSignatureHelp: "RequestSignatureHelp",
    RequestValueInfos: "RequestValueInfos",
    RequestValue: "RequestValue",
    Cancel: "Cancel",
    Quit: "Quit"
} as const;

// ─── Event types ────────────────────────────────────────────────────────────

export const EventTypes = {
    KernelReady: "KernelReady",
    CommandSucceeded: "CommandSucceeded",
    CommandFailed: "CommandFailed",
    ReturnValueProduced: "ReturnValueProduced",
    StandardOutputValueProduced: "StandardOutputValueProduced",
    StandardErrorValueProduced: "StandardErrorValueProduced",
    DisplayedValueProduced: "DisplayedValueProduced",
    DisplayedValueUpdated: "DisplayedValueUpdated",
    ErrorProduced: "ErrorProduced",
    DiagnosticsProduced: "DiagnosticsProduced",
    CompletionsProduced: "CompletionsProduced",
    HoverTextProduced: "HoverTextProduced",
    SignatureHelpProduced: "SignatureHelpProduced",
    ValueInfosProduced: "ValueInfosProduced",
    ValueProduced: "ValueProduced"
} as const;

// ─── Event payload shapes (only the fields Nheengetá consumes) ──────────────

export interface XFormattedValue {
    mimeType: string;
    value: string;
}

export interface XValueProducedEvent {
    formattedValues?: XFormattedValue[];
}

export interface XDiagnostic {
    linePositionSpan: {
        start: { line: number; character: number };
        end: { line: number; character: number };
    };
    severity: "hidden" | "info" | "warning" | "error";
    code: string;
    message: string;
}

export interface XDiagnosticsProducedEvent {
    diagnostics?: XDiagnostic[];
    formattedDiagnostics?: XFormattedValue[];
}

export interface XCommandFailedEvent {
    message?: string;
}

// ─── Envelope helpers ───────────────────────────────────────────────────────

let _TokenCounter = 0;

/** Build a SubmitCode command envelope targeting an optional kernel name. */
export function CreateSubmitCode(pCode: string, pTargetKernelName?: string): XKernelCommandEnvelope {
    return CreateCommand(CommandTypes.SubmitCode, { code: pCode, targetKernelName: pTargetKernelName });
}

export function CreateCommand(pCommandType: string, pCommand: Record<string, unknown>): XKernelCommandEnvelope {
    _TokenCounter++;
    return {
        token: `nheengeta-${_TokenCounter}`,
        id: `nheengeta-cmd-${_TokenCounter}`,
        commandType: pCommandType,
        command: pCommand
    };
}

/** Token of the command an event answers to, or undefined for kernel-wide events. */
export function EventToken(pEvent: XKernelEventEnvelope): string | undefined {
    return pEvent.command?.token;
}

/** True when the event terminates the command (success or failure). */
export function IsTerminalEvent(pEventType: string): boolean {
    return pEventType === EventTypes.CommandSucceeded || pEventType === EventTypes.CommandFailed;
}
