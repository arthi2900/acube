import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Download, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { questionPaperVersionApi, academicApi } from '@/db/api';
import type { Question, QuestionPaperVersion, VersionLabel } from '@/types/types';

interface VersionGenerationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paperId: string;
  questions: Question[];
  paperTitle: string;
}

export function VersionGenerationDialog({
  open,
  onOpenChange,
  paperId,
  questions,
  paperTitle,
}: VersionGenerationDialogProps) {
  const [generating, setGenerating] = useState(false);
  const [selectedVersions, setSelectedVersions] = useState<VersionLabel[]>(['A', 'B']);
  const [generatedVersions, setGeneratedVersions] = useState<QuestionPaperVersion[]>([]);

  const versionOptions: VersionLabel[] = ['A', 'B', 'C', 'D'];

  const toggleVersion = (version: VersionLabel) => {
    setSelectedVersions((prev) =>
      prev.includes(version)
        ? prev.filter((v) => v !== version)
        : [...prev, version].sort()
    );
  };

  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const generateAnswerKey = (questions: Question[], shuffledOrder: string[]): Record<string, string | string[]> => {
    const answerKey: Record<string, string | string[]> = {};
    
    shuffledOrder.forEach((questionId, index) => {
      const question = questions.find(q => q.id === questionId);
      if (!question) return;

      const questionNumber = `Q${index + 1}`;
      
      if (question.question_type === 'mcq') {
        answerKey[questionNumber] = question.correct_answer || '';
      } else if (question.question_type === 'true_false') {
        answerKey[questionNumber] = question.correct_answer || '';
      } else if (question.question_type === 'multiple_response') {
        // For multiple response, correct_answer might be comma-separated string
        const answer = question.correct_answer || '';
        answerKey[questionNumber] = answer.includes(',') ? answer.split(',').map(a => a.trim()) : [answer];
      } else {
        answerKey[questionNumber] = question.correct_answer || 'Subjective answer required';
      }
    });

    return answerKey;
  };

  const handleGenerateVersions = async () => {
    if (selectedVersions.length === 0) {
      toast.error('Please select at least one version');
      return;
    }

    try {
      setGenerating(true);

      // Delete existing versions first
      await questionPaperVersionApi.deleteVersionsByPaper(paperId);

      const versions: QuestionPaperVersion[] = [];

      for (const versionLabel of selectedVersions) {
        // Shuffle question order for each version
        const shuffledOrder = shuffleArray(questions.map(q => q.id));
        
        // Generate answer key based on shuffled order
        const answerKey = generateAnswerKey(questions, shuffledOrder);

        // Create version in database
        const version = await questionPaperVersionApi.createVersion({
          question_paper_id: paperId,
          version_label: versionLabel,
          shuffled_question_order: shuffledOrder,
          answer_key: answerKey,
        });

        if (version) {
          versions.push(version);
        }
      }

      // Update question paper to mark it has versions
      await academicApi.updateQuestionPaper(paperId, { has_versions: true });

      setGeneratedVersions(versions);
      toast.success(`Generated ${versions.length} version(s) successfully`);
    } catch (error) {
      console.error('Error generating versions:', error);
      toast.error('Failed to generate versions');
    } finally {
      setGenerating(false);
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Generate Multiple Versions</DialogTitle>
          <DialogDescription>
            Create different versions (A, B, C, D) with shuffled question order and automatic answer keys
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Version Selection */}
          <div>
            <h3 className="text-sm font-medium mb-3">Select Versions to Generate</h3>
            <div className="grid grid-cols-4 gap-3">
              {versionOptions.map((version) => (
                <Card
                  key={version}
                  className={`cursor-pointer transition-all ${
                    selectedVersions.includes(version)
                      ? 'border-primary bg-primary/5'
                      : 'hover:border-primary/50'
                  }`}
                  onClick={() => toggleVersion(version)}
                >
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold">Version {version}</div>
                    {selectedVersions.includes(version) && (
                      <Badge className="mt-2">Selected</Badge>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Generate Button */}
          <Button
            onClick={handleGenerateVersions}
            disabled={generating || selectedVersions.length === 0}
            className="w-full"
            size="lg"
          >
            {generating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Versions...
              </>
            ) : (
              <>
                <FileText className="mr-2 h-4 w-4" />
                Generate {selectedVersions.length} Version(s)
              </>
            )}
          </Button>

          {/* Generated Versions */}
          {generatedVersions.length > 0 && (
            <div>
              <h3 className="text-sm font-medium mb-3">Generated Versions</h3>
              <div className="space-y-2">
                {generatedVersions.map((version) => (
                  <Card key={version.id}>
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Version {version.version_label}</h4>
                        <p className="text-sm text-muted-foreground">
                          {version.shuffled_question_order.length} questions with answer key
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleExportVersion(version)}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Export
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Info */}
          <div className="bg-muted p-4 rounded-lg text-sm">
            <h4 className="font-medium mb-2">How it works:</h4>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Each version has questions in different order</li>
              <li>Answer keys are automatically generated for each version</li>
              <li>MCQ options remain the same (can be shuffled separately)</li>
              <li>Export includes both questions and answer key</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
