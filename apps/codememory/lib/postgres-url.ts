const legacySslModes = new Set(["prefer", "require", "verify-ca"]);

export function normalizePostgresUrl(connectionString: string | undefined) {
  if (!connectionString) {
    return connectionString;
  }

  const url = new URL(connectionString);
  const sslmode = url.searchParams.get("sslmode");

  if (sslmode && legacySslModes.has(sslmode)) {
    url.searchParams.set("sslmode", "verify-full");
  }

  return url.toString();
}
