export function parseRepoUrl(url: string) {
  const value = url.trim()

  const scpMatch = value.match(
    /^git@github\.com:([^/]+)\/([^/]+?)(?:\.git)?\/?$/
  )
  if (scpMatch) {
    return {
      owner: scpMatch[1],
      repo: scpMatch[2],
    }
  }

  const normalized = value.startsWith("http://") || value.startsWith("https://")
    ? value
    : `https://${value}`

  let parsed: URL
  try {
    parsed = new URL(normalized)
  } catch {
      throw new Error("Invalid Github URL")
  }

  if (parsed.hostname !== "github.com" && parsed.hostname !== "www.github.com") {
    throw new Error("Invalid Github URL")
  }

  const [owner, repoWithMaybeGit] = parsed.pathname.split("/").filter(Boolean)

  if (!owner || !repoWithMaybeGit) {
    throw new Error("Invalid Github URL")
  }

  return {
    owner,
    repo: repoWithMaybeGit.replace(/\.git$/, ""),
  }
}

export { parseRepoUrl as parseGithubURL }
