export function createOnlineNoteShareLink(sid: string, origin = window.location.origin) {
  return new URL(`/note/o/${encodeURIComponent(sid)}`, origin).toString()
}
