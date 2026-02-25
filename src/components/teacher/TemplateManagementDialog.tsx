import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Save, Trash2, FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { questionPaperTemplateApi } from '@/db/api';
import type { QuestionPaperTemplate, QuestionPaperTemplateWithDetails, Class, Subject } from '@/types/types';

interface TemplateManagementDialogProps {
  teacherId: string;
  schoolId: string;
  classes: Class[];
  subjects: Subject[];
  onTemplateSelect?: (template: QuestionPaperTemplate) => void;
}

export function TemplateManagementDialog({
  teacherId,
  schoolId,
  classes,
  subjects,
  onTemplateSelect,
}: TemplateManagementDialogProps) {
  const [open, setOpen] = useState(false);
  const [templates, setTemplates] = useState<QuestionPaperTemplateWithDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [totalMarks, setTotalMarks] = useState('100');
  const [easyPercent, setEasyPercent] = useState('40');
  const [mediumPercent, setMediumPercent] = useState('40');
  const [hardPercent, setHardPercent] = useState('20');
  const [shuffleQuestions, setShuffleQuestions] = useState(false);
  const [shuffleMcqOptions, setShuffleMcqOptions] = useState(false);

  useEffect(() => {
    if (open) {
      loadTemplates();
    }
  }, [open]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const data = await questionPaperTemplateApi.getTemplatesByTeacher(teacherId);
      setTemplates(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading templates:', error);
      toast.error('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTemplate = async () => {
    if (!templateName.trim()) {
      toast.error('Please enter a template name');
      return;
    }

    if (!selectedClass || !selectedSubject) {
      toast.error('Please select class and subject');
      return;
    }

    const percentTotal = parseInt(easyPercent) + parseInt(mediumPercent) + parseInt(hardPercent);
    if (percentTotal !== 100) {
      toast.error('Difficulty percentages must add up to 100%');
      return;
    }

    try {
      setSaving(true);
      await questionPaperTemplateApi.createTemplate({
        school_id: schoolId,
        name: templateName,
        description: templateDescription || null,
        class_id: selectedClass,
        subject_id: selectedSubject,
        difficulty_distribution: {
          easy: parseInt(easyPercent),
          medium: parseInt(mediumPercent),
          hard: parseInt(hardPercent),
        },
        total_marks: parseInt(totalMarks),
        shuffle_questions: shuffleQuestions,
        shuffle_mcq_options: shuffleMcqOptions,
        created_by: teacherId,
      });

      toast.success('Template saved successfully');
      resetForm();
      loadTemplates();
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error('Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    try {
      await questionPaperTemplateApi.deleteTemplate(id);
      toast.success('Template deleted successfully');
      loadTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('Failed to delete template');
    }
  };

  const handleUseTemplate = (template: QuestionPaperTemplate) => {
    if (onTemplateSelect) {
      onTemplateSelect(template);
      setOpen(false);
      toast.success(`Template "${template.name}" applied`);
    }
  };

  const resetForm = () => {
    setTemplateName('');
    setTemplateDescription('');
    setSelectedClass('');
    setSelectedSubject('');
    setTotalMarks('100');
    setEasyPercent('40');
    setMediumPercent('40');
    setHardPercent('20');
    setShuffleQuestions(false);
    setShuffleMcqOptions(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <FileText className="mr-2 h-4 w-4" />
          Templates
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Question Paper Templates</DialogTitle>
          <DialogDescription>
            Save and reuse question paper configurations for faster preparation
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Create New Template */}
          <Card>
            <CardHeader>
              <CardTitle>Create New Template</CardTitle>
              <CardDescription>Save current configuration as a template</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="template-name">Template Name *</Label>
                <Input
                  id="template-name"
                  placeholder="e.g., Mid-term Format"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="template-description">Description</Label>
                <Textarea
                  id="template-description"
                  placeholder="Optional description"
                  value={templateDescription}
                  onChange={(e) => setTemplateDescription(e.target.value)}
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="template-class">Class *</Label>
                  <Select value={selectedClass} onValueChange={setSelectedClass}>
                    <SelectTrigger id="template-class">
                      <SelectValue placeholder="Select class" />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map((cls) => (
                        <SelectItem key={cls.id} value={cls.id}>
                          {cls.class_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="template-subject">Subject *</Label>
                  <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                    <SelectTrigger id="template-subject">
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map((subject) => (
                        <SelectItem key={subject.id} value={subject.id}>
                          {subject.subject_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="template-marks">Total Marks</Label>
                <Input
                  id="template-marks"
                  type="number"
                  value={totalMarks}
                  onChange={(e) => setTotalMarks(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Difficulty Distribution (%)</Label>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label htmlFor="easy-percent" className="text-xs">Easy</Label>
                    <Input
                      id="easy-percent"
                      type="number"
                      min="0"
                      max="100"
                      value={easyPercent}
                      onChange={(e) => setEasyPercent(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="medium-percent" className="text-xs">Medium</Label>
                    <Input
                      id="medium-percent"
                      type="number"
                      min="0"
                      max="100"
                      value={mediumPercent}
                      onChange={(e) => setMediumPercent(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="hard-percent" className="text-xs">Hard</Label>
                    <Input
                      id="hard-percent"
                      type="number"
                      min="0"
                      max="100"
                      value={hardPercent}
                      onChange={(e) => setHardPercent(e.target.value)}
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Total: {parseInt(easyPercent) + parseInt(mediumPercent) + parseInt(hardPercent)}% (must be 100%)
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="shuffle-questions"
                  checked={shuffleQuestions}
                  onChange={(e) => setShuffleQuestions(e.target.checked)}
                  className="rounded"
                />
                <Label htmlFor="shuffle-questions" className="text-sm">Shuffle questions</Label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="shuffle-mcq"
                  checked={shuffleMcqOptions}
                  onChange={(e) => setShuffleMcqOptions(e.target.checked)}
                  className="rounded"
                />
                <Label htmlFor="shuffle-mcq" className="text-sm">Shuffle MCQ options</Label>
              </div>

              <Button onClick={handleSaveTemplate} disabled={saving} className="w-full">
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Template
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Saved Templates */}
          <Card>
            <CardHeader>
              <CardTitle>Saved Templates</CardTitle>
              <CardDescription>Click to use a template</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : templates.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No templates saved yet
                </p>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {templates.map((template) => (
                    <Card
                      key={template.id}
                      className="cursor-pointer hover:bg-accent transition-colors"
                      onClick={() => handleUseTemplate(template)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium">{template.name}</h4>
                            {template.description && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {template.description}
                              </p>
                            )}
                            <div className="flex flex-wrap gap-2 mt-2">
                              <Badge variant="outline">
                                {template.class?.class_name}
                              </Badge>
                              <Badge variant="outline">
                                {template.subject?.subject_name}
                              </Badge>
                              <Badge variant="secondary">
                                {template.total_marks} marks
                              </Badge>
                            </div>
                            <div className="flex gap-2 mt-2 text-xs text-muted-foreground">
                              <span>Easy: {template.difficulty_distribution.easy}%</span>
                              <span>Medium: {template.difficulty_distribution.medium}%</span>
                              <span>Hard: {template.difficulty_distribution.hard}%</span>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteTemplate(template.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
