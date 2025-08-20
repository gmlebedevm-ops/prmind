'use client';

import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { 
  SortAsc, 
  SortDesc, 
  Grid, 
  List
} from 'lucide-react';

interface TaskListControlsProps {
  sortField: 'title' | 'priority' | 'dueDate' | 'status' | 'createdAt';
  sortDirection: 'asc' | 'desc';
  viewMode: 'grid' | 'list';
  onSortFieldChange: (field: 'title' | 'priority' | 'dueDate' | 'status' | 'createdAt') => void;
  onSortDirectionToggle: () => void;
  onViewModeChange: (mode: 'grid' | 'list') => void;
}

export function TaskListControls({
  sortField,
  sortDirection,
  viewMode,
  onSortFieldChange,
  onSortDirectionToggle,
  onViewModeChange
}: TaskListControlsProps) {
  return (
    <Card>
      <CardContent className="pt-4 pb-4">
        <div className="flex items-center justify-between">
          {/* Сортировка */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground whitespace-nowrap">Сортировка:</span>
            <Select value={sortField} onValueChange={onSortFieldChange}>
              <SelectTrigger className="w-40 h-8 text-sm">
                <SelectValue placeholder="Сортировка" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="priority">По приоритету</SelectItem>
                <SelectItem value="dueDate">По сроку</SelectItem>
                <SelectItem value="status">По статусу</SelectItem>
                <SelectItem value="title">По названию</SelectItem>
                <SelectItem value="createdAt">По дате создания</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={onSortDirectionToggle}
              className="px-2 h-8"
            >
              {sortDirection === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
            </Button>
          </div>

          {/* Режим отображения */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground whitespace-nowrap">Режим:</span>
            <div className="flex border rounded-md">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                className="rounded-r-none h-8 px-2"
                onClick={() => onViewModeChange('grid')}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                className="rounded-l-none h-8 px-2"
                onClick={() => onViewModeChange('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}