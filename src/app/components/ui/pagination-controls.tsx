import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from './button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select'

type PaginationControlsProps = {
  page: number
  totalPages: number
  pageSize: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  pageSizeOptions?: number[]
  className?: string
}

export function PaginationControls({
  page,
  totalPages,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50],
  className,
}: PaginationControlsProps) {
  const safeTotal = Math.max(1, totalPages)
  const safePage = Math.min(Math.max(1, page), safeTotal)

  return (
    <div className={className}>
      <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 shadow-sm">
        <Select value={String(pageSize)} onValueChange={(value) => onPageSizeChange(Number(value))}>
          <SelectTrigger className="h-8 w-[104px] rounded-lg border-slate-200 bg-slate-50 text-xs font-medium text-slate-600">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {pageSizeOptions.map((size) => (
              <SelectItem key={size} value={String(size)}>{size} / page</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          className="h-8 rounded-lg border-slate-200 px-2.5 text-xs text-slate-600 hover:bg-slate-50"
          onClick={() => onPageChange(Math.max(1, safePage - 1))}
          disabled={safePage === 1}
        >
          <ChevronLeft size={14} className="mr-1" />
          Prec.
        </Button>

        <span className="min-w-[76px] rounded-lg bg-slate-50 px-2 py-1 text-center text-xs font-semibold text-slate-600">
          {safePage} / {safeTotal}
        </span>

        <Button
          variant="outline"
          className="h-8 rounded-lg border-slate-200 px-2.5 text-xs text-slate-600 hover:bg-slate-50"
          onClick={() => onPageChange(Math.min(safeTotal, safePage + 1))}
          disabled={safePage === safeTotal}
        >
          Suiv.
          <ChevronRight size={14} className="ml-1" />
        </Button>
      </div>
    </div>
  )
}
