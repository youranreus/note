import type { RouteLocationRaw } from 'vue-router'

import type { NoteMode } from '@note/shared-types'

const GENERATED_SID_ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789'
export const GENERATED_SID_LENGTH = 10

export function normalizeEntrySid(rawSid: string) {
  return rawSid.trim()
}

function fillRandomBytes(length: number) {
  if (!globalThis.crypto?.getRandomValues) {
    throw new Error('Secure random source is unavailable for sid generation.')
  }

  return globalThis.crypto.getRandomValues(new Uint8Array(length))
}

export function generateEntrySid(
  randomBytesFactory: (length: number) => Uint8Array = fillRandomBytes
) {
  const randomBytes = randomBytesFactory(GENERATED_SID_LENGTH)

  return Array.from(randomBytes, (randomByte) => {
    const alphabetIndex = randomByte % GENERATED_SID_ALPHABET.length
    return GENERATED_SID_ALPHABET[alphabetIndex]
  }).join('')
}

export function resolveEntrySid(
  draftSid: string,
  fallbackSid: string,
  nextSidFactory: () => string = generateEntrySid
) {
  const normalizedDraftSid = normalizeEntrySid(draftSid)

  if (normalizedDraftSid !== '') {
    return {
      sid: normalizedDraftSid,
      nextFallbackSid: fallbackSid,
      usedFallback: false
    }
  }

  const normalizedFallbackSid = normalizeEntrySid(fallbackSid)
  const sid = normalizedFallbackSid === '' ? nextSidFactory() : normalizedFallbackSid

  return {
    sid,
    nextFallbackSid: nextSidFactory(),
    usedFallback: true
  }
}

export function createEntryLocation(mode: NoteMode, sid: string): RouteLocationRaw {
  return {
    name: mode === 'online' ? 'online-note' : 'local-note',
    params: { sid }
  }
}
