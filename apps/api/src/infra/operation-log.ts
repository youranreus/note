export function toLogIdentifierHint(value: string | null | undefined) {
  const normalized = value?.trim()

  if (!normalized) {
    return null
  }

  if (normalized.length <= 6) {
    return `${normalized.slice(0, 1)}***${normalized.slice(-1)}`
  }

  return `${normalized.slice(0, 3)}...${normalized.slice(-3)}`
}

export function sanitizeReturnToPathForLog(returnTo: string) {
  return returnTo.replace(/(\/note\/(?:o|l)\/)[^/?#]+/u, '$1:sid')
}

export function logOperation(message: string) {
  console.info(`[note-api] ${new Date().toISOString()} ${message}`)
}
