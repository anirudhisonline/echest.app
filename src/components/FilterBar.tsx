// src/components/FilterBar.tsx
import { useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search, X, Filter } from 'lucide-react'

interface FilterBarProps {
  items: any[]
  searchQuery: string
  setSearchQuery: (query: string) => void
  selectedTags: string[]
  setSelectedTags: (tags: string[]) => void
  typeFilter: string
  setTypeFilter: (type: string) => void
  viewMode: 'all' | 'today' | 'week' | 'month'
  setViewMode: (mode: 'all' | 'today' | 'week' | 'month') => void
}

export function FilterBar({
  items,
  searchQuery,
  setSearchQuery,
  selectedTags,
  setSelectedTags,
  typeFilter,
  setTypeFilter,
  viewMode,
  setViewMode,
}: FilterBarProps) {
  // Extract all unique tags
  const allTags = useMemo(() => {
    const tagSet = new Set<string>()
    items.forEach((item) => {
      item.tags?.forEach((tag: string) => tagSet.add(tag))
    })
    return Array.from(tagSet).sort()
  }, [items])

  const toggleTag = (tag: string) => {
    setSelectedTags(
      selectedTags.includes(tag)
        ? selectedTags.filter((t) => t !== tag)
        : [...selectedTags, tag],
    )
  }

  const hasActiveFilters =
    selectedTags.length > 0 ||
    searchQuery.trim() ||
    typeFilter !== 'all' ||
    viewMode !== 'all'

  const clearFilters = () => {
    setSelectedTags([])
    setSearchQuery('')
    setTypeFilter('all')
    setViewMode('all')
  }

  return (
    <div className="space-y-4">
      {/* Search and Time Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="today">Today</TabsTrigger>
            <TabsTrigger value="week">Week</TabsTrigger>
            <TabsTrigger value="month">Month</TabsTrigger>
          </TabsList>
        </Tabs>

        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="note">Notes</SelectItem>
            <SelectItem value="link">Links</SelectItem>
            <SelectItem value="image">Images</SelectItem>
            <SelectItem value="file">Files</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tag Filters */}
      {allTags.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Filter className="h-4 w-4" />
            <span>Filter by tags:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {allTags.map((tag) => (
              <Badge
                key={tag}
                variant={selectedTags.includes(tag) ? 'default' : 'outline'}
                className="cursor-pointer hover:bg-primary/80 transition-colors"
                onClick={() => toggleTag(tag)}
              >
                #{tag}
                {selectedTags.includes(tag) && <X className="ml-1 h-3 w-3" />}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
          <span className="text-sm font-medium">Active filters:</span>
          <div className="flex flex-wrap gap-2 flex-1">
            {viewMode !== 'all' && (
              <Badge variant="secondary">
                {viewMode === 'today'
                  ? 'Today'
                  : viewMode === 'week'
                    ? 'This Week'
                    : 'This Month'}
              </Badge>
            )}
            {typeFilter !== 'all' && (
              <Badge variant="secondary">
                {typeFilter.charAt(0).toUpperCase() + typeFilter.slice(1)}s
              </Badge>
            )}
            {selectedTags.map((tag) => (
              <Badge key={tag} variant="secondary">
                #{tag}
              </Badge>
            ))}
            {searchQuery && (
              <Badge variant="secondary">Search: "{searchQuery}"</Badge>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Clear All
          </Button>
        </div>
      )}
    </div>
  )
}
