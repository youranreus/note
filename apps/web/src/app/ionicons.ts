import { addIcons } from 'ionicons'
import {
  closeOutline,
  copyOutline,
  lockClosedOutline,
  saveOutline,
  starOutline,
  trashOutline
} from 'ionicons/icons'
import { defineCustomElements } from 'ionicons/loader'

let isIoniconsReady = false

export function setupIonicons() {
  if (isIoniconsReady || typeof window === 'undefined') {
    return
  }

  defineCustomElements(window)
  addIcons({
    'close-outline': closeOutline,
    'copy-outline': copyOutline,
    'star-outline': starOutline,
    'lock-closed-outline': lockClosedOutline,
    'save-outline': saveOutline,
    'trash-outline': trashOutline
  })

  isIoniconsReady = true
}
