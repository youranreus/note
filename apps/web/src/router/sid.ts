export function resolveSidParam(rawSid: unknown) {
  if (typeof rawSid !== 'string') {
    return null
  }

  const normalizedSid = rawSid.trim()
  return normalizedSid === '' ? null : normalizedSid
}
