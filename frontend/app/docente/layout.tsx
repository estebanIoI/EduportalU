"use client"

import { ProtectedRoute } from "@/components/ProtectedRoute"

export default function DocenteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProtectedRoute allowedRoles={["docente", "Director Programa"]}>
      <div className="min-h-screen bg-gray-50">
        {children}
      </div>
    </ProtectedRoute>
  )
}
