import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText, Users, TrendingUp, BarChart3 } from 'lucide-react';

export default function Analyses() {
  const navigate = useNavigate();

  const analysisOptions = [
    {
      title: 'Exam Analysis',
      description: 'Analyze exam performance across classes and subjects. View attendance rates, average marks, and detailed exam statistics.',
      icon: FileText,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      path: '/principal/analyses/exam',
      features: [
        'Filter by Class, Section, and Subject',
        'View exam attendance statistics',
        'Track average marks and performance',
        'Access detailed exam results',
      ],
    },
    {
      title: 'Student Analysis',
      description: 'Track individual student performance across all exams. Monitor completion rates, pass rates, and average scores.',
      icon: Users,
      color: 'text-secondary',
      bgColor: 'bg-secondary/10',
      path: '/principal/analyses/student',
      features: [
        'Filter by Class, Section, and Student',
        'View completed and missed exams',
        'Track average scores and pass rates',
        'Access detailed student exam history',
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Analyses</h1>
          <p className="text-muted-foreground mt-1">
            Comprehensive analysis tools for exams and student performance
          </p>
        </div>
      </div>

      {/* Overview Card */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-primary/10">
              <BarChart3 className="h-8 w-8 text-primary" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold mb-2">Performance Analytics</h2>
              <p className="text-muted-foreground">
                Access comprehensive analytics to track exam performance and student progress. 
                Use filters to drill down into specific classes, sections, subjects, or individual students. 
                Make data-driven decisions to improve educational outcomes.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analysis Options */}
      <div className="grid gap-6 md:grid-cols-2">
        {analysisOptions.map((option) => {
          const Icon = option.icon;
          return (
            <Card key={option.path} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg ${option.bgColor}`}>
                    <Icon className={`h-6 w-6 ${option.color}`} />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-xl">{option.title}</CardTitle>
                    <CardDescription className="mt-2">
                      {option.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-muted-foreground">Key Features:</p>
                    <ul className="space-y-1">
                      {option.features.map((feature, index) => (
                        <li key={index} className="text-sm flex items-start gap-2">
                          <TrendingUp className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <Button 
                    className="w-full" 
                    onClick={() => navigate(option.path)}
                  >
                    Open {option.title}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Help Section */}
      <Card>
        <CardHeader>
          <CardTitle>How to Use</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <h3 className="font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                Exam Analysis
              </h3>
              <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground ml-6">
                <li>Select filters (Class, Section, Subject)</li>
                <li>Click "Apply Filter" to view results</li>
                <li>Review exam statistics and attendance</li>
                <li>Click "View Detailed Results" for more information</li>
              </ol>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold flex items-center gap-2">
                <Users className="h-4 w-4 text-secondary" />
                Student Analysis
              </h3>
              <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground ml-6">
                <li>Select Class and Section (required)</li>
                <li>Optionally select a specific student</li>
                <li>Click "Apply Filter" to view results</li>
                <li>Click "View Detailed Results" to see exam history</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
