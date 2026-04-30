'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/app/_lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { Calendar } from './calendar';

interface DatePickerProps {
  value: string;       // ISO date string YYYY-MM-DD or ''
  onChange: (value: string) => void;
  placeholder?: string;
  fromYear?: number;
  toYear?: number;
}

export function DatePicker({
  value,
  onChange,
  placeholder = 'Select date',
  fromYear = 1980,
  toYear = new Date().getFullYear() - 5,
}: DatePickerProps) {
  const selected = value ? new Date(value + 'T00:00:00') : undefined;
  const [open, setOpen] = useState(false);

  function handleSelect(day: Date | undefined) {
    if (!day) return;
    onChange(format(day, 'yyyy-MM-dd'));
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className={cn(
          'input flex items-center justify-between cursor-pointer',
          !selected && '[color:var(--text-dim)]'
        )}
      >
        <span>{selected ? format(selected, 'MMMM d, yyyy') : placeholder}</span>
        <CalendarIcon style={{ width: 15, height: 15, color: 'var(--text-muted)', flexShrink: 0 }} />
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-0"
        align="start"
        sideOffset={6}
      >
        <Calendar
          mode="single"
          selected={selected}
          onSelect={handleSelect}
          captionLayout="dropdown"
          startMonth={new Date(fromYear, 0)}
          endMonth={new Date(toYear, 11)}
          defaultMonth={selected ?? new Date(toYear - 10, 0)}
          disabled={{ after: new Date(toYear, 11, 31) }}
        />
      </PopoverContent>
    </Popover>
  );
}
