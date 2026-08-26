import { createFileRoute, redirect } from "@tanstack/react-router"

export const Route = createFileRoute("/_layout/items")({
  beforeLoad: () => {
    throw redirect({ to: "/clients" })
  },
  component: () => null,
})
