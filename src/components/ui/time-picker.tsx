import { useState, useEffect, useRef } from "react";
import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TimePickerProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  id?: string;
}

export function TimePicker({ value, onChange, className, id }: TimePickerProps) {
  const [open, setOpen] = useState(false);
  const [selectedHour, setSelectedHour] = useState<string>("");
  const [selectedMinute, setSelectedMinute] = useState<string>("");
  const [selectedPeriod, setSelectedPeriod] = useState<"AM" | "PM">("AM");
  const [hourInput, setHourInput] = useState<string>("");
  const [minuteInput, setMinuteInput] = useState<string>("");
  const hourRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});
  const minuteRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});
  const hourInputRef = useRef<HTMLInputElement>(null);
  const minuteInputRef = useRef<HTMLInputElement>(null);

  // Convert 24-hour format to 12-hour format with AM/PM
  const convert24To12 = (hour24: string): { hour12: string; period: "AM" | "PM" } => {
    const hourNum = parseInt(hour24, 10);
    if (hourNum === 0) return { hour12: "12", period: "AM" };
    if (hourNum < 12) return { hour12: hourNum.toString().padStart(2, "0"), period: "AM" };
    if (hourNum === 12) return { hour12: "12", period: "PM" };
    return { hour12: (hourNum - 12).toString().padStart(2, "0"), period: "PM" };
  };

  // Convert 12-hour format to 24-hour format
  const convert12To24 = (hour12: string, period: "AM" | "PM"): string => {
    const hourNum = parseInt(hour12, 10);
    if (period === "AM") {
      if (hourNum === 12) return "00";
      return hourNum.toString().padStart(2, "0");
    } else {
      if (hourNum === 12) return "12";
      return (hourNum + 12).toString().padStart(2, "0");
    }
  };

  // Update time value
  const updateTimeValue = (hour: string, minute: string, period: "AM" | "PM") => {
    if (hour && minute) {
      const hour24 = convert12To24(hour, period);
      const newTime = `${hour24}:${minute}`;
      onChange(newTime);
    }
  };

  // Parse the value prop to set initial hour and minute
  useEffect(() => {
    if (value) {
      const [hour24, minute] = value.split(":");
      const { hour12, period } = convert24To12(hour24);
      setSelectedHour(hour12 || "");
      setSelectedMinute(minute || "");
      setSelectedPeriod(period);
      setHourInput(hour12 || "");
      setMinuteInput(minute || "");
    }
  }, [value]);

  // Set current system time as default when popover opens and no value is set
  useEffect(() => {
    if (open && !value) {
      const now = new Date();
      const currentHour24 = now.getHours().toString().padStart(2, "0");
      const currentMinute = now.getMinutes().toString().padStart(2, "0");
      const { hour12, period } = convert24To12(currentHour24);
      setSelectedHour(hour12);
      setSelectedMinute(currentMinute);
      setSelectedPeriod(period);
      setHourInput(hour12);
      setMinuteInput(currentMinute);
    }
  }, [open, value]);

  // Scroll selected time into view when popover opens
  useEffect(() => {
    if (open && selectedHour && selectedMinute) {
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        hourRefs.current[selectedHour]?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
        minuteRefs.current[selectedMinute]?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 100);
    }
  }, [open, selectedHour, selectedMinute]);

  // Generate hours (01-12)
  const hours = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, "0"));
  
  // Generate minutes (00-59)
  const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, "0"));

  // Handle hour input change
  const handleHourInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, ""); // Only digits
    if (val.length <= 2) {
      setHourInput(val);
      
      // Validate and update if valid
      const hourNum = parseInt(val, 10);
      if (hourNum >= 1 && hourNum <= 12) {
        const formattedHour = hourNum.toString().padStart(2, "0");
        setSelectedHour(formattedHour);
        updateTimeValue(formattedHour, selectedMinute, selectedPeriod);
      }
    }
  };

  // Handle hour input blur
  const handleHourInputBlur = () => {
    if (hourInput) {
      const hourNum = parseInt(hourInput, 10);
      if (hourNum >= 1 && hourNum <= 12) {
        const formattedHour = hourNum.toString().padStart(2, "0");
        setHourInput(formattedHour);
        setSelectedHour(formattedHour);
        updateTimeValue(formattedHour, selectedMinute, selectedPeriod);
      } else {
        // Reset to selected hour if invalid
        setHourInput(selectedHour);
      }
    }
  };

  // Handle hour input key down
  const handleHourInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      minuteInputRef.current?.focus();
    }
  };

  // Handle minute input change
  const handleMinuteInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, ""); // Only digits
    if (val.length <= 2) {
      setMinuteInput(val);
      
      // Validate and update if valid
      const minuteNum = parseInt(val, 10);
      if (minuteNum >= 0 && minuteNum <= 59) {
        const formattedMinute = minuteNum.toString().padStart(2, "0");
        setSelectedMinute(formattedMinute);
        updateTimeValue(selectedHour, formattedMinute, selectedPeriod);
      }
    }
  };

  // Handle minute input blur
  const handleMinuteInputBlur = () => {
    if (minuteInput) {
      const minuteNum = parseInt(minuteInput, 10);
      if (minuteNum >= 0 && minuteNum <= 59) {
        const formattedMinute = minuteNum.toString().padStart(2, "0");
        setMinuteInput(formattedMinute);
        setSelectedMinute(formattedMinute);
        updateTimeValue(selectedHour, formattedMinute, selectedPeriod);
      } else {
        // Reset to selected minute if invalid
        setMinuteInput(selectedMinute);
      }
    }
  };

  // Handle minute input key down
  const handleMinuteInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      // Focus will naturally move to period select on Tab
      (e.target as HTMLInputElement).blur();
    }
  };

  const handleHourSelect = (hour: string) => {
    setSelectedHour(hour);
    setHourInput(hour);
    updateTimeValue(hour, selectedMinute, selectedPeriod);
  };

  const handleMinuteSelect = (minute: string) => {
    setSelectedMinute(minute);
    setMinuteInput(minute);
    updateTimeValue(selectedHour, minute, selectedPeriod);
  };

  const handlePeriodSelect = (period: "AM" | "PM") => {
    setSelectedPeriod(period);
    updateTimeValue(selectedHour, selectedMinute, period);
  };

  const handlePeriodChange = (period: string) => {
    const newPeriod = period as "AM" | "PM";
    setSelectedPeriod(newPeriod);
    updateTimeValue(selectedHour, selectedMinute, newPeriod);
  };

  // Format display value in 12-hour format with AM/PM
  const displayValue = value 
    ? (() => {
        const [hour24, minute] = value.split(":");
        const { hour12, period } = convert24To12(hour24);
        return `${hour12}:${minute} ${period}`;
      })()
    : "Select time";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal bg-background hover:bg-accent hover:text-accent-foreground text-foreground",
            className
          )}
        >
          <Clock className="mr-2 h-4 w-4" />
          {displayValue}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        {/* Three Separate Input Fields at Top */}
        <div className="p-3 border-b bg-muted/30">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Enter Time</span>
          </div>
          <div className="flex items-center gap-2">
            {/* Hour Input */}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">Hour</label>
              <Input
                ref={hourInputRef}
                type="text"
                placeholder="12"
                value={hourInput}
                onChange={handleHourInputChange}
                onBlur={handleHourInputBlur}
                onKeyDown={handleHourInputKeyDown}
                className="h-9 w-16 text-center text-sm"
                maxLength={2}
              />
            </div>
            
            <span className="text-lg font-semibold text-muted-foreground mt-5">:</span>
            
            {/* Minute Input */}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">Minute</label>
              <Input
                ref={minuteInputRef}
                type="text"
                placeholder="00"
                value={minuteInput}
                onChange={handleMinuteInputChange}
                onBlur={handleMinuteInputBlur}
                onKeyDown={handleMinuteInputKeyDown}
                className="h-9 w-16 text-center text-sm"
                maxLength={2}
              />
            </div>
            
            {/* Period Select */}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">Period</label>
              <Select value={selectedPeriod} onValueChange={handlePeriodChange}>
                <SelectTrigger className="h-9 w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AM">AM</SelectItem>
                  <SelectItem value="PM">PM</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Use Tab to navigate between fields
          </p>
        </div>

        {/* Scrollable Pads */}
        <div className="flex">
          {/* Hour Column */}
          <div className="flex flex-col">
            <div className="text-xs font-medium text-muted-foreground px-4 py-2 bg-background border-b sticky top-0 z-10">
              Hour
            </div>
            <ScrollArea className="h-[200px]">
              <div className="flex flex-col p-2">
                {hours.map((hour) => (
                  <Button
                    key={hour}
                    ref={(el) => {
                      hourRefs.current[hour] = el;
                    }}
                    variant={selectedHour === hour ? "default" : "ghost"}
                    className="h-8 w-16 justify-center"
                    onClick={() => handleHourSelect(hour)}
                  >
                    {hour}
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </div>
          
          {/* Minute Column */}
          <div className="flex flex-col">
            <div className="text-xs font-medium text-muted-foreground px-4 py-2 bg-background border-b sticky top-0 z-10">
              Minute
            </div>
            <ScrollArea className="h-[200px]">
              <div className="flex flex-col p-2">
                {minutes.map((minute) => (
                  <Button
                    key={minute}
                    ref={(el) => {
                      minuteRefs.current[minute] = el;
                    }}
                    variant={selectedMinute === minute ? "default" : "ghost"}
                    className="h-8 w-16 justify-center"
                    onClick={() => handleMinuteSelect(minute)}
                  >
                    {minute}
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* AM/PM Column */}
          <div className="flex flex-col">
            <div className="text-xs font-medium text-muted-foreground px-4 py-2 bg-background border-b sticky top-0 z-10">
              Period
            </div>
            <div className="flex flex-col p-2 gap-2 justify-center h-[200px]">
              <Button
                variant={selectedPeriod === "AM" ? "default" : "ghost"}
                className="h-10 w-16 justify-center"
                onClick={() => handlePeriodSelect("AM")}
              >
                AM
              </Button>
              <Button
                variant={selectedPeriod === "PM" ? "default" : "ghost"}
                className="h-10 w-16 justify-center"
                onClick={() => handlePeriodSelect("PM")}
              >
                PM
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
