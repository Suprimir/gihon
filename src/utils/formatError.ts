const DEFAULT_FALLBACK = "An unknown error occurred";

const KIND_MESSAGES: Record<string, string> = {
  io: "There was a problem accessing the file system.",
  serde: "Failed to parse application data.",
  tauri: "The application could not complete the requested action.",
  file_not_found: "The requested file could not be found.",
  general: DEFAULT_FALLBACK,
};

type ErrorRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is ErrorRecord =>
  typeof value === "object" && value !== null;

const pickMessage = (value: unknown): string | undefined => {
  if (!value) return undefined;
  if (typeof value === "string") return value;
  if (value instanceof Error) return value.message;
  if (isRecord(value) && typeof value.message === "string")
    return value.message;
  return undefined;
};

const pickKind = (...values: Array<unknown>): string | undefined => {
  for (const value of values) {
    if (isRecord(value) && typeof value.kind === "string") {
      return value.kind;
    }
  }
  return undefined;
};

export function formatErrorMessage(
  error: unknown,
  fallback = DEFAULT_FALLBACK
): string {
  const payload = isRecord(error) ? error.payload : undefined;

  const message =
    pickMessage(payload) ??
    pickMessage(error) ??
    (isRecord(error) ? pickMessage(error.error) : undefined);

  if (typeof message === "string" && message.trim()) {
    return message;
  }

  const kind = pickKind(payload, error);
  if (kind && KIND_MESSAGES[kind]) {
    return KIND_MESSAGES[kind];
  }

  return fallback;
}
