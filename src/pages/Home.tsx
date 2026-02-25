import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, Users, FileQuestion, Award, Zap, Shield, Smartphone, Clock, TrendingUp, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="space-y-0">
      {/* Hero Section */}
      <section className="gradient-hero py-12 px-6 relative overflow-hidden rounded-3xl mx-6 shadow-2xl elegant-shadow">
        <div className="max-w-6xl mx-auto text-center space-y-4 relative z-10">
          <h1 className="text-2xl md:text-4xl font-bold text-white tracking-tight">
            A Cube – Student Performance &amp; Skill Analysis
          </h1>
          <p className="text-xl md:text-2xl text-white/90 font-medium">
            Smart • Secure • Scalable Online Exams
          </p>
          <p className="text-base text-white/80 max-w-3xl mx-auto">
            Create, conduct &amp; analyse exams – all in one place
          </p>
        </div>
      </section>

      {/* Feature Cards */}
      <section className="py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 smooth-gradient-text">
            Comprehensive Exam Management
          </h2>
          <div className="grid gap-6 md:grid-cols-2 2xl:grid-cols-4">
            <Card className="glass-card border-primary/20 text-white rounded-3xl">
              <CardHeader>
                <BookOpen className="w-12 h-12 text-white mb-3" />
                <CardTitle className="text-xl text-white">Create Exam</CardTitle>
                <CardDescription className="text-base text-white/90">
                  Design and schedule exams
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-white/80">
                  Create comprehensive exams with multiple question types, set schedules, and manage exam settings effortlessly.
                </p>
              </CardContent>
            </Card>

            <Card className="glass-card border-secondary/20 text-white rounded-3xl">
              <CardHeader>
                <FileQuestion className="w-12 h-12 text-white mb-3" />
                <CardTitle className="text-xl text-white">Question Bank</CardTitle>
                <CardDescription className="text-base text-white/90">
                  Rich question repository
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-white/80">
                  Build and maintain an extensive question bank with MCQ, True/False, and Short Answer questions for NEET and school exams.
                </p>
              </CardContent>
            </Card>

            <Card className="glass-card border-accent/20 text-white rounded-3xl">
              <CardHeader>
                <Users className="w-12 h-12 text-white mb-3" />
                <CardTitle className="text-xl text-white">User Management</CardTitle>
                <CardDescription className="text-base text-white/90">
                  Role-based access control
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-white/80">
                  Manage students, teachers, and administrators with secure role-based permissions and school-level isolation.
                </p>
              </CardContent>
            </Card>

            <Card className="glass-card border-primary/20 text-white rounded-3xl">
              <CardHeader>
                <Award className="w-12 h-12 text-white mb-3" />
                <CardTitle className="text-xl text-white">Reports &amp; Analytics</CardTitle>
                <CardDescription className="text-base text-white/90">
                  Detailed performance insights
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-white/80">
                  Generate comprehensive reports, track student performance, and gain valuable insights with advanced analytics.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-8 px-6 gradient-hero rounded-3xl mx-6 shadow-2xl elegant-shadow my-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-6" style={{ color: '#D1F8EF' }}>
            Why Choose A Cube?
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 mx-auto rounded-full bg-blue-500/20 flex items-center justify-center">
                <Zap className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-base font-semibold" style={{ color: '#D1F8EF' }}>Fast Evaluation</h3>
              <p className="text-sm" style={{ color: '#D1F8EF', opacity: 0.8 }}>
                Instant auto-grading for objective questions with detailed performance analysis
              </p>
            </div>

            <div className="text-center space-y-2">
              <div className="w-12 h-12 mx-auto rounded-full bg-blue-500/20 flex items-center justify-center">
                <Shield className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-base font-semibold" style={{ color: '#D1F8EF' }}>Secure Exams</h3>
              <p className="text-sm" style={{ color: '#D1F8EF', opacity: 0.8 }}>
                Bank-level security with role-based access and school-level data isolation
              </p>
            </div>

            <div className="text-center space-y-2">
              <div className="w-12 h-12 mx-auto rounded-full bg-blue-500/20 flex items-center justify-center">
                <Smartphone className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-base font-semibold" style={{ color: '#D1F8EF' }}>Mobile Friendly</h3>
              <p className="text-sm" style={{ color: '#D1F8EF', opacity: 0.8 }}>
                Responsive design works seamlessly on desktop, tablet, and mobile devices
              </p>
            </div>

            <div className="text-center space-y-2">
              <div className="w-12 h-12 mx-auto rounded-full bg-blue-500/20 flex items-center justify-center">
                <Clock className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-base font-semibold" style={{ color: '#D1F8EF' }}>Time Saving</h3>
              <p className="text-sm" style={{ color: '#D1F8EF', opacity: 0.8 }}>
                Automated workflows reduce administrative overhead and save valuable time
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-16 px-6 rounded-3xl mx-6 shadow-xl my-6 bg-white/30 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 smooth-gradient-text">
            Trusted by Educational Institutions
          </h2>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            <Card className="glass-card elegant-shadow text-center p-8 border-primary/20 rounded-3xl">
              <TrendingUp className="w-12 h-12 text-primary mx-auto mb-4" />
              <div className="text-4xl font-bold text-primary mb-2">1200+</div>
              <div className="text-lg text-muted-foreground">Students</div>
            </Card>

            <Card className="glass-card elegant-shadow text-center p-8 border-secondary/20 rounded-3xl">
              <CheckCircle className="w-12 h-12 text-secondary mx-auto mb-4" />
              <div className="text-4xl font-bold text-secondary mb-2">350+</div>
              <div className="text-lg text-muted-foreground">Exams Conducted</div>
            </Card>

            <Card className="glass-card elegant-shadow text-center p-8 border-accent/20 rounded-3xl">
              <FileQuestion className="w-12 h-12 text-accent mx-auto mb-4" />
              <div className="text-4xl font-bold text-accent mb-2">15,000+</div>
              <div className="text-lg text-muted-foreground">Questions</div>
            </Card>

            <Card className="glass-card elegant-shadow text-center p-8 border-primary/20 rounded-3xl">
              <Award className="w-12 h-12 text-primary mx-auto mb-4" />
              <div className="text-4xl font-bold text-primary mb-2">25+</div>
              <div className="text-lg text-muted-foreground">Schools</div>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="gradient-hero py-8 px-6 rounded-3xl mx-6 shadow-2xl elegant-shadow my-6">
        <div className="max-w-4xl mx-auto text-center space-y-3">
          <h2 className="text-2xl md:text-3xl font-bold text-white">
            Ready to Transform Your Exam Management?
          </h2>
          <p className="text-base text-white/80">
            Join thousands of educators and students using A Cube for seamless online examinations
          </p>
          <div className="flex flex-wrap gap-4 justify-center pt-2">
            <Link to="/register">
              <Button size="lg" className="bg-white text-primary hover:bg-white/90 glow-primary text-base px-6 py-4 rounded-3xl">
                Get Started Free
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="outline" className="glass-card text-white border-white/30 hover:bg-white/10 text-base px-6 py-4 rounded-3xl">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
