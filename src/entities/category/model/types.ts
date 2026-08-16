export interface CategoryDef {
  key: string
  label: string
  color: string
  aliases: string[]
  builtin: boolean
}

export interface CategoryInput {
  label: string
  color: string
  aliases: string[]
}