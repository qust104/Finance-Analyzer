// Screens keep their form open until the server confirms a write, so the
// mutation state (pending + error text) is part of every data hook's
// public contract, not an internal detail. Mutations are consumed
// structurally: their generic parameters differ per hook, but the
// pending/error surface is always the same.
export function anyMutationPending(...mutations: Array<{ isPending: boolean }>): boolean {
  return mutations.some((mutation) => mutation.isPending)
}

export function mutationErrorMessage(
  ...mutations: Array<{ isError: boolean; error: unknown }>
): string | null {
  for (const mutation of mutations) {
    if (mutation.isError) {
      return mutation.error instanceof Error ? mutation.error.message : null
    }
  }
  return null
}
