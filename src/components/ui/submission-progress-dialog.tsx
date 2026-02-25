import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Loader2, Circle } from 'lucide-react';

interface SubmissionStep {
  id: string;
  label: string;
  status: 'pending' | 'in-progress' | 'completed' | 'error';
}

interface SubmissionProgressDialogProps {
  open: boolean;
  steps: SubmissionStep[];
  currentStep: number;
  progress?: number; // Allow custom progress value
  error?: string;
}

export function SubmissionProgressDialog({
  open,
  steps,
  currentStep,
  progress: customProgress,
  error,
}: SubmissionProgressDialogProps) {
  // Use custom progress if provided, otherwise calculate based on current step
  const progress = customProgress !== undefined ? customProgress : ((currentStep + 1) / steps.length) * 100;

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md [&>button]:hidden">
        <DialogHeader>
          <DialogTitle className="text-center">
            {error ? 'Submission Error' : 'Submitting Exam'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          {/* Progress Bar */}
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <p className="text-sm text-muted-foreground text-center">
              {error ? 'An error occurred' : `${Math.round(progress)}% - Step ${currentStep + 1} of ${steps.length}`}
            </p>
          </div>

          {/* Steps List */}
          <div className="space-y-3">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center gap-3">
                {/* Status Icon */}
                <div className="flex-shrink-0">
                  {step.status === 'completed' && (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  )}
                  {step.status === 'in-progress' && (
                    <Loader2 className="h-5 w-5 text-primary animate-spin" />
                  )}
                  {step.status === 'pending' && (
                    <Circle className="h-5 w-5 text-muted-foreground" />
                  )}
                  {step.status === 'error' && (
                    <Circle className="h-5 w-5 text-destructive" />
                  )}
                </div>

                {/* Step Label */}
                <div className="flex-1">
                  <p
                    className={`text-sm font-medium ${
                      step.status === 'completed'
                        ? 'text-green-600'
                        : step.status === 'in-progress'
                        ? 'text-primary'
                        : step.status === 'error'
                        ? 'text-destructive'
                        : 'text-muted-foreground'
                    }`}
                  >
                    {step.label}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded-md bg-destructive/10 p-3">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Info Message */}
          {!error && (
            <div className="rounded-md bg-muted p-3">
              <p className="text-xs text-muted-foreground text-center">
                Please wait while we process your submission. Do not close this window.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
