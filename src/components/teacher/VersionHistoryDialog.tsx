import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, History, Download, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { questionPaperVersionApi } from '@/db/api';
import type { QuestionPaperVersion, Question } from '@/types/types';

interface VersionHistoryDialogProps {
  paperId: string;
  paperTitle: string;
  questions: Question[];
}

export function VersionHistoryDialog({ paperId, paperTitle, questions }: VersionHistoryDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [versions, setVersions] = useState<QuestionPaperVersion[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<QuestionPaperVersion | null>(null);

  useEffect(() => {
    if (open) {
      loadVersions();
    }
  }, [open]);

  const loadVersions = async () => {
    try {
      setLoading(true);
      const data = await questionPaperVersionApi.getVersionsByPaper(paperId);
      setVersions(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading versions:', error);
      toast.error('Failed to load versions');
    } finally {
      setLoading(false);
    }
  };

  const handleExportVersion = (version: QuestionPaperVersion) => {
    const versionQuestions = version.shuffled_question_order
      .map((qId, index) => {
        const question = questions.find(q => q.id === qId);
        if (!question) return null;

        let text = `Q${index + 1}. ${question.question_text} (${question.marks} marks)\n`;

        if (question.question_type === 'mcq' || question.question_type === 'multiple_response') {
          const options = Array.isArray(question.options) ? question.options as string[] : [];
          options.forEach((opt, i) => {
            text += `   ${String.fromCharCode(65 + i)}. ${opt}\n`;
          });
        } else if (question.question_type === 'true_false') {
          text += `   A. True\n   B. False\n`;
        }

        return text;
      })
      .filter(Boolean)
      .join('\n');

    const answerKeyText = Object.entries(version.answer_key)
      .map(([q, ans]) => `${q}: ${Array.isArray(ans) ? ans.join(', ') : ans}`)
      .join('\n');

    const content = `${paperTitle} - Version ${version.version_label}\n\n${versionQuestions}\n\n--- ANSWER KEY ---\n${answerKeyText}`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${paperTitle}_Version_${version.version_label}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success(`Version ${version.version_label} exported`);
  };

  const handleViewAnswerKey = (version: QuestionPaperVersion) => {
    setSelectedVersion(version);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <History className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Version History</DialogTitle>
          <DialogDescription>
            View and manage all versions of "{paperTitle}"
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : versions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <History className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No versions generated yet</p>
            <p className="text-sm mt-1">Generate versions from the Question Paper Preparation page</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {versions.map((version) => (
                <Card key={version.id} className="hover:border-primary/50 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-semibold">Version {version.version_label}</h3>
                        <p className="text-sm text-muted-foreground">
                          {version.shuffled_question_order.length} questions
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Created: {new Date(version.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant="secondary">
                        {Object.keys(version.answer_key).length} answers
                      </Badge>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewAnswerKey(version)}
                        className="flex-1"
                      >
                        <Eye className="mr-2 h-3 w-3" />
                        View Key
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleExportVersion(version)}
                        className="flex-1"
                      >
                        <Download className="mr-2 h-3 w-3" />
                        Export
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Answer Key Preview */}
            {selectedVersion && (
              <Card className="border-primary/50 bg-primary/5">
                <CardContent className="p-4">
                  <h4 className="font-medium mb-3">
                    Answer Key - Version {selectedVersion.version_label}
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-[300px] overflow-y-auto">
                    {Object.entries(selectedVersion.answer_key).map(([question, answer]) => (
                      <div key={question} className="text-sm p-2 bg-background rounded border">
                        <span className="font-medium">{question}:</span>{' '}
                        <span className="text-primary">
                          {Array.isArray(answer) ? answer.join(', ') : answer}
                        </span>
                      </div>
                    ))}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedVersion(null)}
                    className="mt-3"
                  >
                    Close Preview
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
