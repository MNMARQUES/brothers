import { createFileRoute, redirect } from "@tanstack/react-router";

// Havia duas telas de login (esta e "/"). Mantivemos "/" como a tela real
// (visual com fundo e cartão); esta rota só existe para não quebrar links
// antigos que ainda apontam para /login.
export const Route = createFileRoute("/login")({
  beforeLoad: () => {
    throw redirect({ to: "/" });
  },
});
