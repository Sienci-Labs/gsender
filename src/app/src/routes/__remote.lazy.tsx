import { createLazyFileRoute } from '@tanstack/react-router'

export const Route = createLazyFileRoute('/__remote')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/__remote"!</div>
}
