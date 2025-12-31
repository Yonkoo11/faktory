'use client'

import React, { useState, useMemo } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './table'
import { Input } from './input'
import { Button } from './button'
import { Skeleton } from './skeleton'
import { Search, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ColumnDef<T> {
  id: string
  header: string
  accessorKey?: keyof T
  cell?: (row: T) => React.ReactNode
  sortable?: boolean
  searchable?: boolean
}

export interface DataTableProps<T> {
  data: T[]
  columns: ColumnDef<T>[]
  isLoading?: boolean
  error?: Error
  emptyState?: React.ReactNode
  searchable?: boolean
  searchPlaceholder?: string
  sortable?: boolean
  mobileCardRender?: (row: T) => React.ReactNode
  className?: string
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  isLoading = false,
  error,
  emptyState,
  searchable = false,
  searchPlaceholder = 'Search...',
  sortable = true,
  mobileCardRender,
  className,
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState('')
  const [sortConfig, setSortConfig] = useState<{
    key: string
    direction: 'asc' | 'desc'
  } | null>(null)

  // Filter data based on search
  const filteredData = useMemo(() => {
    if (!searchQuery) return data

    const searchLower = searchQuery.toLowerCase()
    return data.filter((row) => {
      return columns.some((column) => {
        if (!column.searchable) return false
        const value = column.accessorKey ? row[column.accessorKey] : null
        return value?.toString().toLowerCase().includes(searchLower)
      })
    })
  }, [data, searchQuery, columns])

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortConfig) return filteredData

    return [...filteredData].sort((a, b) => {
      const column = columns.find((col) => col.id === sortConfig.key)
      if (!column?.accessorKey) return 0

      const aValue = a[column.accessorKey]
      const bValue = b[column.accessorKey]

      if (aValue === bValue) return 0

      const comparison = aValue > bValue ? 1 : -1
      return sortConfig.direction === 'asc' ? comparison : -comparison
    })
  }, [filteredData, sortConfig, columns])

  const handleSort = (columnId: string) => {
    if (!sortable) return

    setSortConfig((current) => {
      if (current?.key === columnId) {
        if (current.direction === 'asc') {
          return { key: columnId, direction: 'desc' }
        }
        return null // Remove sort
      }
      return { key: columnId, direction: 'asc' }
    })
  }

  const getSortIcon = (columnId: string) => {
    if (sortConfig?.key !== columnId) {
      return <ChevronsUpDown className="ml-2 h-4 w-4 text-muted-foreground" />
    }
    return sortConfig.direction === 'asc' ? (
      <ChevronUp className="ml-2 h-4 w-4" />
    ) : (
      <ChevronDown className="ml-2 h-4 w-4" />
    )
  }

  // Loading state
  if (isLoading) {
    return (
      <div className={cn('space-y-4', className)}>
        {searchable && <Skeleton className="h-10 w-full max-w-sm" />}
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((column) => (
                  <TableHead key={column.id}>
                    <Skeleton className="h-4 w-24" />
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  {columns.map((column) => (
                    <TableCell key={column.id}>
                      <Skeleton className="h-4 w-32" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className={cn('rounded-lg border border-destructive/20 bg-destructive/5 p-8 text-center', className)}>
        <p className="text-sm font-medium text-destructive">Error loading data</p>
        <p className="mt-1 text-sm text-muted-foreground">{error.message}</p>
      </div>
    )
  }

  // Empty state
  if (sortedData.length === 0 && !searchQuery) {
    return (
      <div className={cn('rounded-lg border p-8 text-center', className)}>
        {emptyState || (
          <p className="text-sm text-muted-foreground">No data available</p>
        )}
      </div>
    )
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Search */}
      {searchable && (
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      )}

      {/* Desktop table */}
      <div className="hidden md:block rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column.id}>
                  {column.sortable && sortable ? (
                    <button
                      onClick={() => handleSort(column.id)}
                      className="flex items-center font-medium hover:text-foreground transition-colors"
                    >
                      {column.header}
                      {getSortIcon(column.id)}
                    </button>
                  ) : (
                    column.header
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center">
                  <p className="text-sm text-muted-foreground">
                    No results found for &quot;{searchQuery}&quot;
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              sortedData.map((row, rowIndex) => (
                <TableRow key={rowIndex}>
                  {columns.map((column) => (
                    <TableCell key={column.id}>
                      {column.cell
                        ? column.cell(row)
                        : column.accessorKey
                        ? row[column.accessorKey]
                        : null}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile cards */}
      {mobileCardRender && (
        <div className="md:hidden space-y-4">
          {sortedData.length === 0 ? (
            <div className="rounded-lg border p-8 text-center">
              <p className="text-sm text-muted-foreground">
                No results found for &quot;{searchQuery}&quot;
              </p>
            </div>
          ) : (
            sortedData.map((row, index) => (
              <div key={index}>{mobileCardRender(row)}</div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
