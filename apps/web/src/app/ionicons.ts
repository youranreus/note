import { addIcons } from 'ionicons'
import {
  arrowBackOutline,
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
    'arrow-back-outline': arrowBackOutline,
    'close-outline': closeOutline,
    'copy-outline': copyOutline,
    'star-outline': starOutline,
    'lock-closed-outline': lockClosedOutline,
    'save-outline': saveOutline,
    'trash-outline': trashOutline
  })

  isIoniconsReady = true
}
