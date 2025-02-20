import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/remote/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/remote/"!</div>
}
