import { access } from 'node:fs/promises'
import { resolve } from 'node:path'

import {
  loadLegacyMemoDump,
  migrateLegacyMemoDump,
  summarizeLegacyMemoDump
} from '../src/services/legacy-note-migration-service.js'

interface CliOptions {
  inputPath: string
  validateOnly: boolean
  allowNonEmpty: boolean
  resetTarget: boolean
}

function printUsage() {
  console.log(`Usage:
  pnpm --filter @note/api db:migrate-legacy -- --input <sql-dump-path>

Options:
  --input <path>       Legacy MySQL dump path
  --validate-only      Only parse and validate the dump without writing data
  --allow-non-empty    Skip the empty target database check
  --reset-target       Clear users, notes, note_favorites before importing
`)
}

function parseCliOptions(argv: string[]): CliOptions {
  let inputPath = ''
  let validateOnly = false
  let allowNonEmpty = false
  let resetTarget = false

  for (let index = 0; index < argv.length; index += 1) {
    const currentArgument = argv[index]

    if (currentArgument === '--') {
      continue
    }

    if (currentArgument === '--input') {
      inputPath = argv[index + 1] ?? ''
      index += 1
      continue
    }

    if (currentArgument === '--validate-only') {
      validateOnly = true
      continue
    }

    if (currentArgument === '--allow-non-empty') {
      allowNonEmpty = true
      continue
    }

    if (currentArgument === '--reset-target') {
      resetTarget = true
      continue
    }

    if (currentArgument === '--help' || currentArgument === '-h') {
      printUsage()
      process.exit(0)
    }

    throw new Error(`Unknown argument: ${currentArgument}`)
  }

  if (!inputPath) {
    throw new Error('Missing required argument: --input <sql-dump-path>')
  }

  return {
    inputPath: resolve(process.cwd(), inputPath),
    validateOnly,
    allowNonEmpty,
    resetTarget
  }
}

async function ensureInputFileExists(inputPath: string) {
  try {
    await access(inputPath)
  } catch {
    throw new Error(`Legacy SQL dump file was not found: ${inputPath}`)
  }
}

async function main() {
  const options = parseCliOptions(process.argv.slice(2))

  await ensureInputFileExists(options.inputPath)

  const dump = await loadLegacyMemoDump(options.inputPath)
  const summary = summarizeLegacyMemoDump(dump)

  console.log('Legacy dump validation passed.')
  console.log(
    `Users=${summary.userCount}, Notes=${summary.noteCount}, NoteOnUsers=${summary.noteOnUserCount}, KeysToHash=${summary.hashedKeyCount}`
  )

  if (options.validateOnly) {
    console.log('Validation only mode enabled, migration skipped.')
    return
  }

  const migrationSummary = await migrateLegacyMemoDump({
    inputPath: options.inputPath,
    requireEmptyTarget: !options.allowNonEmpty,
    resetTarget: options.resetTarget
  })

  console.log('Legacy migration completed.')
  console.log(
    `Target users=${migrationSummary.targetUserCount}, notes=${migrationSummary.targetNoteCount}, note_favorites=${migrationSummary.targetFavoriteCount}, hashedKeys=${migrationSummary.hashedKeyCount}`
  )
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error)

  console.error(`Legacy migration failed: ${message}`)
  process.exitCode = 1
})
