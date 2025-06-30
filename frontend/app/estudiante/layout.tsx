"use client"

import type React from "react"
import { Header } from "./components/Header"

export default function EstudianteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header fijo */}
      <Header />

      {/* Contenido principal con margen para evitar solapamiento con el header */}
      <main className="pt-16 transition-all duration-300 ease-in-out min-h-screen">
        <div className="p-4 lg:p-0">
          {children}
        </div>
      </main>
    </div>
  )
}
