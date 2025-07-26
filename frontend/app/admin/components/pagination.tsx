// components/Pagination.tsx
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  nextPage: number | null;
  prevPage: number | null;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  hasNextPage,
  hasPrevPage,
  nextPage,
  prevPage,
  onPageChange,
  className,
}: PaginationProps) {
  return (
    <div className={`flex items-center justify-between ${className}`}>
      <div className="text-sm text-gray-500">
        Página {currentPage} de {totalPages}
      </div>
      <div className="flex items-center space-x-2">

        <Button
          variant="outline"
          size="sm"
          onClick={() => prevPage && onPageChange(prevPage)}
          disabled={!hasPrevPage}
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="sr-only">Página anterior</span>
        </Button>

        {/* Mostrar siempre la primera página */}
        <Button
          variant={currentPage === 1 ? "default" : "outline"}
          size="sm"
          onClick={() => onPageChange(1)}
        >
          1
        </Button>

        {/* Mostrar puntos suspensivos si hay páginas intermedias */}
        {currentPage > 3 && (
          <Button variant="ghost" size="sm" disabled>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        )}

        {/* Mostrar página actual y adyacentes */}
        {currentPage > 2 && currentPage - 1 !== 1 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
          >
            {currentPage - 1}
          </Button>
        )}

        {currentPage !== 1 && currentPage !== totalPages && (
          <Button variant="default" size="sm">
            {currentPage}
          </Button>
        )}

        {currentPage < totalPages - 1 && currentPage + 1 !== totalPages && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
          >
            {currentPage + 1}
          </Button>
        )}

        {/* Mostrar puntos suspensivos si hay páginas intermedias */}
        {currentPage < totalPages - 2 && (
          <Button variant="ghost" size="sm" disabled>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        )}

        {/* Mostrar siempre la última página */}
        {totalPages > 1 && (
          <Button
            variant={currentPage === totalPages ? "default" : "outline"}
            size="sm"
            onClick={() => onPageChange(totalPages)}
          >
            {totalPages}
          </Button>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={() => nextPage && onPageChange(nextPage)}
          disabled={!hasNextPage}
        >
          <ChevronRight className="h-4 w-4" />
          <span className="sr-only">Página siguiente</span>
        </Button>
      </div>
    </div>
  );
}