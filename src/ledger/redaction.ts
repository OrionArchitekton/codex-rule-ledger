import { createHash } from "node:crypto";

const SECRET_LIKE_MARKER =
  /\b(?:[A-Za-z][A-Za-z0-9]*[_-])*(?:SECRET|TOKEN|PASSWORD|PASSWD|API[_-]?KEY|PRIVATE[_-]?KEY)(?:[_:=.-][A-Za-z0-9_./+=:-]+)*\b/gi;
const CREDENTIAL_LIKE_VALUE =
  /\b(?:sk|ghp|github_pat|xox[baprs])[-_][A-Za-z0-9_-]{8,}\b/g;
const BEARER_VALUE = /\bBearer\s+[A-Za-z0-9._~+\/-]+=*\b/gi;
const ABSOLUTE_POSIX_PATH =
  /(^|[\s"'`(=])\/(?:[A-Za-z0-9._~+-]+\/)*[A-Za-z0-9._~+-]+/g;

function shortDigest(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex").slice(0, 12);
}

export function redactUntrustedString(
  value: string,
  aliases: readonly { captured: string; replacement: string }[] = [],
): string {
  let redacted = value;
  for (const alias of [...aliases].sort(
    (left, right) => right.captured.length - left.captured.length,
  )) {
    if (alias.captured !== "") {
      redacted = redacted.replaceAll(alias.captured, alias.replacement);
    }
  }

  redacted = redacted
    .replace(BEARER_VALUE, "[REDACTED_CREDENTIAL_LIKE_VALUE]")
    .replace(CREDENTIAL_LIKE_VALUE, "[REDACTED_CREDENTIAL_LIKE_VALUE]")
    .replace(SECRET_LIKE_MARKER, "[REDACTED_SECRET_LIKE_VALUE]");

  return redacted.replace(
    ABSOLUTE_POSIX_PATH,
    (match, prefix: string) => {
      const path = match.slice(prefix.length);
      return `${prefix}$CAPTURED_PATH/${shortDigest(path)}`;
    },
  );
}

export function redactUntrustedValue(
  value: unknown,
  aliases: readonly { captured: string; replacement: string }[] = [],
): unknown {
  if (typeof value === "string") {
    return redactUntrustedString(value, aliases);
  }
  if (Array.isArray(value)) {
    return value.map((entry) => redactUntrustedValue(entry, aliases));
  }
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, entry]) => [
        key,
        redactUntrustedValue(entry, aliases),
      ]),
    );
  }
  return value;
}
