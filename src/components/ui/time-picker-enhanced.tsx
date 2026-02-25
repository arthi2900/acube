import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Clock } from 'lucide-react';

interface TimePickerEnhancedProps {
  value?: string; // Format: "HH:MM AM/PM" or "HH:MM" (24-hour)
  onChange?: (time: string) => void;
  label?: string;
  className?: string;
  use24Hour?: boolean;
}

export function TimePickerEnhanced({
  value = '',
  onChange,
  label,
  className,
  use24Hour = false,
}: TimePickerEnhancedProps) {
  const [inputValue, setInputValue] = useState('');
  const [hour, setHour] = useState(12);
  const [minute, setMinute] = useState(0);
  const [period, setPeriod] = useState<'AM' | 'PM'>('AM');
  const [isTyping, setIsTyping] = useState(false);

  const hourRef = useRef<HTMLDivElement>(null);
  const minuteRef = useRef<HTMLDivElement>(null);
  const periodRef = useRef<HTMLDivElement>(null);

  // Generate hour options (01-12 for 12-hour, 00-23 for 24-hour)
  const hours = use24Hour
    ? Array.from({ length: 24 }, (_, i) => i)
    : Array.from({ length: 12 }, (_, i) => i + 1);

  // Generate minute options (00-59)
  const minutes = Array.from({ length: 60 }, (_, i) => i);

  // Parse initial value
  useEffect(() => {
    if (value) {
      parseTimeString(value);
    }
  }, [value]);

  // Parse time string and update state
  const parseTimeString = (timeStr: string) => {
    const trimmed = timeStr.trim();
    
    if (use24Hour) {
      // 24-hour format: "HH:MM"
      const match = trimmed.match(/^(\d{1,2}):(\d{2})$/);
      if (match) {
        const h = parseInt(match[1], 10);
        const m = parseInt(match[2], 10);
        if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
          setHour(h);
          setMinute(m);
          setInputValue(formatTime24(h, m));
        }
      }
    } else {
      // 12-hour format: "HH:MM AM/PM"
      const match = trimmed.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
      if (match) {
        let h = parseInt(match[1], 10);
        const m = parseInt(match[2], 10);
        const p = match[3].toUpperCase() as 'AM' | 'PM';
        
        if (h >= 1 && h <= 12 && m >= 0 && m <= 59) {
          setHour(h);
          setMinute(m);
          setPeriod(p);
          setInputValue(formatTime12(h, m, p));
        }
      }
    }
  };

  // Format time in 12-hour format
  const formatTime12 = (h: number, m: number, p: 'AM' | 'PM'): string => {
    const hourStr = h.toString().padStart(2, '0');
    const minuteStr = m.toString().padStart(2, '0');
    return `${hourStr}:${minuteStr} ${p}`;
  };

  // Format time in 24-hour format
  const formatTime24 = (h: number, m: number): string => {
    const hourStr = h.toString().padStart(2, '0');
    const minuteStr = m.toString().padStart(2, '0');
    return `${hourStr}:${minuteStr}`;
  };

  // Update input value when hour/minute/period changes (from scroll pads)
  useEffect(() => {
    if (!isTyping) {
      const formatted = use24Hour
        ? formatTime24(hour, minute)
        : formatTime12(hour, minute, period);
      setInputValue(formatted);
      onChange?.(formatted);
    }
  }, [hour, minute, period, isTyping, use24Hour]);

  // Scroll pads to match current values
  useEffect(() => {
    if (hourRef.current) {
      scrollToValue(hourRef.current, hour, use24Hour ? 24 : 12);
    }
    if (minuteRef.current) {
      scrollToValue(minuteRef.current, minute, 60);
    }
    if (!use24Hour && periodRef.current) {
      const periodIndex = period === 'AM' ? 0 : 1;
      scrollToValue(periodRef.current, periodIndex, 2);
    }
  }, [hour, minute, period, use24Hour]);

  // Scroll helper function
  const scrollToValue = (element: HTMLDivElement, value: number, total: number) => {
    const itemHeight = 40; // Height of each item
    const containerHeight = element.clientHeight;
    const scrollPosition = value * itemHeight - containerHeight / 2 + itemHeight / 2;
    element.scrollTop = Math.max(0, scrollPosition);
  };

  // Handle input change (typing)
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    setIsTyping(true);

    // Auto-format as user types
    const cleaned = val.replace(/[^\d:APMapm\s]/g, '');
    
    if (use24Hour) {
      // Try to parse 24-hour format
      const match = cleaned.match(/^(\d{1,2}):?(\d{0,2})$/);
      if (match) {
        const h = parseInt(match[1], 10);
        const m = match[2] ? parseInt(match[2], 10) : 0;
        
        if (h >= 0 && h <= 23) {
          setHour(h);
          if (match[2] && m >= 0 && m <= 59) {
            setMinute(m);
          }
        }
      }
    } else {
      // Try to parse 12-hour format
      const match = cleaned.match(/^(\d{1,2}):?(\d{0,2})?\s*(AM|PM)?$/i);
      if (match) {
        const h = parseInt(match[1], 10);
        const m = match[2] ? parseInt(match[2], 10) : 0;
        const p = match[3] ? (match[3].toUpperCase() as 'AM' | 'PM') : period;
        
        if (h >= 1 && h <= 12) {
          setHour(h);
          if (match[2] && m >= 0 && m <= 59) {
            setMinute(m);
          }
          if (match[3]) {
            setPeriod(p);
          }
        }
      }
    }

    // Clear typing flag after a delay
    setTimeout(() => setIsTyping(false), 500);
  };

  // Handle input blur (validate and format)
  const handleInputBlur = () => {
    setIsTyping(false);
    parseTimeString(inputValue);
    
    // Format the final value
    const formatted = use24Hour
      ? formatTime24(hour, minute)
      : formatTime12(hour, minute, period);
    setInputValue(formatted);
    onChange?.(formatted);
  };

  // Handle scroll pad selection
  const handleHourClick = (h: number) => {
    setHour(h);
    const formatted = use24Hour
      ? formatTime24(h, minute)
      : formatTime12(h, minute, period);
    onChange?.(formatted);
  };

  const handleMinuteClick = (m: number) => {
    setMinute(m);
    const formatted = use24Hour
      ? formatTime24(hour, m)
      : formatTime12(hour, m, period);
    onChange?.(formatted);
  };

  const handlePeriodClick = (p: 'AM' | 'PM') => {
    setPeriod(p);
    const formatted = formatTime12(hour, minute, p);
    onChange?.(formatted);
  };

  return (
    <div className={cn('space-y-3', className)}>
      {label && <Label>{label}</Label>}
      
      {/* Text Input Field */}
      <div className="relative">
        <Input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          placeholder={use24Hour ? 'HH:MM' : 'HH:MM AM/PM'}
          className="pr-10"
        />
        <Clock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      </div>

      {/* Scrollable Pads */}
      <div className="grid grid-cols-3 gap-2 border rounded-lg p-2 bg-muted/30">
        {/* Hour Pad */}
        <div className="space-y-1">
          <div className="text-xs font-medium text-center text-muted-foreground">
            Hour
          </div>
          <div
            ref={hourRef}
            className="h-40 overflow-y-auto scroll-smooth scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent"
          >
            <div className="py-16">
              {hours.map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => handleHourClick(h)}
                  className={cn(
                    'w-full h-10 flex items-center justify-center text-sm transition-colors rounded',
                    hour === h
                      ? 'bg-primary text-primary-foreground font-semibold'
                      : 'hover:bg-muted text-foreground'
                  )}
                >
                  {use24Hour ? h.toString().padStart(2, '0') : h}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Minute Pad */}
        <div className="space-y-1">
          <div className="text-xs font-medium text-center text-muted-foreground">
            Minute
          </div>
          <div
            ref={minuteRef}
            className="h-40 overflow-y-auto scroll-smooth scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent"
          >
            <div className="py-16">
              {minutes.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => handleMinuteClick(m)}
                  className={cn(
                    'w-full h-10 flex items-center justify-center text-sm transition-colors rounded',
                    minute === m
                      ? 'bg-primary text-primary-foreground font-semibold'
                      : 'hover:bg-muted text-foreground'
                  )}
                >
                  {m.toString().padStart(2, '0')}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Period Pad (12-hour only) */}
        {!use24Hour && (
          <div className="space-y-1">
            <div className="text-xs font-medium text-center text-muted-foreground">
              Period
            </div>
            <div
              ref={periodRef}
              className="h-40 overflow-y-auto scroll-smooth scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent"
            >
              <div className="py-16">
                {['AM', 'PM'].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => handlePeriodClick(p as 'AM' | 'PM')}
                    className={cn(
                      'w-full h-10 flex items-center justify-center text-sm transition-colors rounded',
                      period === p
                        ? 'bg-primary text-primary-foreground font-semibold'
                        : 'hover:bg-muted text-foreground'
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Helper Text */}
      <p className="text-xs text-muted-foreground">
        Type time directly or use scroll pads to select
      </p>
    </div>
  );
}
