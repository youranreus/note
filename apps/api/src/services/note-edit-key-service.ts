import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto'

const EDIT_KEY_SALT_BYTES = 16
const EDIT_KEY_DERIVED_KEY_BYTES = 64
const EDIT_KEY_SCHEME = 'scrypt'

export interface NoteEditKeyService {
  hashKey(key: string): Promise<string>
  verifyKey(key: string, storedHash: string): Promise<boolean>
}

function deriveKey(key: string, salt: Buffer) {
  return new Promise<Buffer>((resolve, reject) => {
    scryptCallback(key, salt, EDIT_KEY_DERIVED_KEY_BYTES, (error, derivedKey) => {
      if (error) {
        reject(error)
        return
      }

      resolve(Buffer.from(derivedKey))
    })
  })
}

function serializeStoredHash(salt: Buffer, derivedKey: Buffer) {
  return `${EDIT_KEY_SCHEME}$${salt.toString('hex')}$${derivedKey.toString('hex')}`
}

function parseStoredHash(storedHash: string) {
  const [scheme, saltHex, derivedKeyHex] = storedHash.split('$')

  if (scheme !== EDIT_KEY_SCHEME || !saltHex || !derivedKeyHex) {
    return null
  }

  try {
    return {
      salt: Buffer.from(saltHex, 'hex'),
      derivedKey: Buffer.from(derivedKeyHex, 'hex')
    }
  } catch {
    return null
  }
}

export function createNoteEditKeyService(): NoteEditKeyService {
  return {
    async hashKey(key) {
      const salt = randomBytes(EDIT_KEY_SALT_BYTES)
      const derivedKey = await deriveKey(key, salt)

      return serializeStoredHash(salt, derivedKey)
    },
    async verifyKey(key, storedHash) {
      const parsed = parseStoredHash(storedHash)

      if (!parsed) {
        return false
      }

      const derivedKey = await deriveKey(key, parsed.salt)

      if (derivedKey.length !== parsed.derivedKey.length) {
        return false
      }

      return timingSafeEqual(derivedKey, parsed.derivedKey)
    }
  }
}
