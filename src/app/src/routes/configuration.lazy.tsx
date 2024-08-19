import { createLazyFileRoute } from '@tanstack/react-router'

export const Route = createLazyFileRoute('/configuration')({
  component: Configuration
})

function Configuration() {
  return (
      <div>
        Configuration tools
      </div>
  );
}
