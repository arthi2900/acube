import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TimePickerEnhanced } from '@/components/ui/time-picker-enhanced';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export default function TimePickerDemo() {
  const [time12Hour, setTime12Hour] = useState('09:30 AM');
  const [time24Hour, setTime24Hour] = useState('14:45');
  const { toast } = useToast();

  const handleSubmit = () => {
    toast({
      title: 'Time Selected',
      description: (
        <div className="space-y-1">
          <p>12-hour format: {time12Hour}</p>
          <p>24-hour format: {time24Hour}</p>
        </div>
      ),
    });
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Enhanced Time Picker</h1>
        <p className="text-muted-foreground">
          Dual-mode time input with text field and scrollable pads
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* 12-Hour Format */}
        <Card>
          <CardHeader>
            <CardTitle>12-Hour Format</CardTitle>
            <CardDescription>
              Type time or scroll to select (HH:MM AM/PM)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TimePickerEnhanced
              label="Select Time"
              value={time12Hour}
              onChange={setTime12Hour}
              use24Hour={false}
            />
            <div className="mt-4 p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium">Selected Time:</p>
              <p className="text-lg font-bold text-primary">{time12Hour}</p>
            </div>
          </CardContent>
        </Card>

        {/* 24-Hour Format */}
        <Card>
          <CardHeader>
            <CardTitle>24-Hour Format</CardTitle>
            <CardDescription>
              Type time or scroll to select (HH:MM)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TimePickerEnhanced
              label="Select Time"
              value={time24Hour}
              onChange={setTime24Hour}
              use24Hour={true}
            />
            <div className="mt-4 p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium">Selected Time:</p>
              <p className="text-lg font-bold text-primary">{time24Hour}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Features Card */}
      <Card>
        <CardHeader>
          <CardTitle>Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <h3 className="font-semibold flex items-center gap-2">
                ⌨️ Text Input
              </h3>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>Type time directly in the input field</li>
                <li>Real-time validation as you type</li>
                <li>Auto-format with colons and AM/PM</li>
                <li>Supports partial input (e.g., "9" → "09:00 AM")</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold flex items-center gap-2">
                🖱️ Scroll Pads
              </h3>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>Scroll through hours, minutes, and period</li>
                <li>Click to select specific values</li>
                <li>Visual highlighting of selected time</li>
                <li>Smooth scrolling animation</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold flex items-center gap-2">
                🔄 Bidirectional Sync
              </h3>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>Type in input → pads auto-scroll to match</li>
                <li>Scroll pads → input field updates instantly</li>
                <li>Both methods stay synchronized</li>
                <li>No conflicts between input methods</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold flex items-center gap-2">
                ✨ User Experience
              </h3>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>Flexible input - choose your preferred method</li>
                <li>Quick typing for speed users</li>
                <li>Precise scrolling for accuracy</li>
                <li>Supports both 12-hour and 24-hour formats</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Usage Examples */}
      <Card>
        <CardHeader>
          <CardTitle>Usage Examples</CardTitle>
          <CardDescription>
            How to use the enhanced time picker in your forms
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm font-medium mb-2">Example 1: Exam Start Time</p>
              <pre className="text-xs overflow-x-auto">
{`<TimePickerEnhanced
  label="Exam Start Time"
  value={startTime}
  onChange={setStartTime}
  use24Hour={false}
/>`}
              </pre>
            </div>
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm font-medium mb-2">Example 2: 24-Hour Format</p>
              <pre className="text-xs overflow-x-auto">
{`<TimePickerEnhanced
  label="Meeting Time"
  value={meetingTime}
  onChange={setMeetingTime}
  use24Hour={true}
/>`}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Button */}
      <div className="flex justify-center">
        <Button onClick={handleSubmit} size="lg">
          Submit Selected Times
        </Button>
      </div>
    </div>
  );
}
