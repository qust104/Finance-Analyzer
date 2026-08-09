import type { ReactNode } from 'react'

export function PageContainer({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <section>
      <h1 className="page-title">{title}</h1>
      {children}
    </section>
  )
}
