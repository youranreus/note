export function createOnlineNoteShareLink(sid: string, origin = window.location.origin) {
  return new URL(`/o/${encodeURIComponent(sid)}`, origin).toString()
}
