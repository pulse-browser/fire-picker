// This file is responsible for providing type definitions for the content file.
// Only used for intelisense.

export type EmojiList = EmojiItem[]
export type EmojiItem = {
  emoji: string
  description: string
  category: string
  aliases: string[]
  tags: string[]
  unicode_version: string
  ios_version: string
}
