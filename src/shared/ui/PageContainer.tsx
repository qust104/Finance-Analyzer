import type { ReactNode } from 'react'

export function PageContainer({ children }: { children?: ReactNode }) {
  return <section>{children}</section>
}
