import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangle } from 'lucide-react';

interface ForceDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title: string;
  itemName: string;
  warningMessage?: string;
  details?: React.ReactNode;
  isDeleting?: boolean;
}

export function ForceDeleteDialog({
  open,
  onOpenChange,
  onConfirm,
  title,
  itemName,
  warningMessage = 'This will permanently delete the exam and all associated student attempts, answers, and results. This action cannot be undone.',
  details,
  isDeleting = false,
}: ForceDeleteDialogProps) {
  const [confirmText, setConfirmText] = useState('');
  const isConfirmValid = confirmText === 'DELETE';

  const handleConfirm = () => {
    if (isConfirmValid) {
      onConfirm();
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setConfirmText('');
    }
    onOpenChange(newOpen);
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent className="max-w-2xl">
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <AlertDialogTitle className="text-xl">{title}</AlertDialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {itemName}
              </p>
            </div>
          </div>
        </AlertDialogHeader>

        <AlertDialogDescription asChild>
          <div className="space-y-4">
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
              <p className="text-sm text-destructive font-medium">
                ⚠️ Warning: Permanent Deletion
              </p>
              <p className="text-sm text-foreground mt-2">
                {warningMessage}
              </p>
            </div>

            {details && (
              <div className="bg-muted p-4 rounded-lg space-y-2 text-sm">
                {details}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="confirm-text" className="text-sm font-medium">
                Type <span className="font-mono font-bold text-destructive">DELETE</span> to confirm
              </Label>
              <Input
                id="confirm-text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="Type DELETE to confirm"
                className="font-mono"
                autoComplete="off"
                disabled={isDeleting}
              />
              {confirmText && !isConfirmValid && (
                <p className="text-xs text-muted-foreground">
                  Please type exactly "DELETE" (in capital letters)
                </p>
              )}
            </div>
          </div>
        </AlertDialogDescription>

        <AlertDialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={!isConfirmValid || isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Force Delete'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
