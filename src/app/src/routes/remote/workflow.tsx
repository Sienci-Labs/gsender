import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/remote/workflow')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/remote/workflow"!</div>
}
