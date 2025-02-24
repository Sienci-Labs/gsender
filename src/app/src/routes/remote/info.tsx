import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/remote/info')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/remote/info"!</div>
}
