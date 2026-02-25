import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { examApi, profileApi, academicApi, examAttemptApi } from '@/db/api';
import type { ExamWithDetails, ExamAttempt } from '@/types/types';
import { hasExamStarted, hasExamEnded } from '@/utils/timezone';

interface ExamCounts {
  current: number;
  upcoming: number;
  completed: number;
}

interface StudentDataContextType {
  exams: ExamWithDetails[];
  attempts: Record<string, ExamAttempt>;
  examCounts: ExamCounts;
  loading: boolean;
  error: string | null;
  loadData: () => Promise<void>;
  refreshData: () => Promise<void>;
  lastUpdated: number | null;
}

const StudentDataContext = createContext<StudentDataContextType | undefined>(undefined);

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function StudentDataProvider({ children }: { children: ReactNode }) {
  const [exams, setExams] = useState<ExamWithDetails[]>([]);
  const [attempts, setAttempts] = useState<Record<string, ExamAttempt>>({});
  const [examCounts, setExamCounts] = useState<ExamCounts>({
    current: 0,
    upcoming: 0,
    completed: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const profile = await profileApi.getCurrentProfile();
      if (!profile || !profile.school_id) {
        setExams([]);
        setAttempts({});
        setExamCounts({ current: 0, upcoming: 0, completed: 0 });
        setLoading(false);
        return;
      }

      const studentMapping = await academicApi.getStudentClassSection(profile.id, '2024-2025');
      if (!studentMapping) {
        setExams([]);
        setAttempts({});
        setExamCounts({ current: 0, upcoming: 0, completed: 0 });
        setLoading(false);
        return;
      }

      const classId = studentMapping.class_id;
      const data = await examApi.getExamsForStudent(profile.id, classId);
      
      const publishedExams = data.filter(exam => exam.status === 'published');
      setExams(publishedExams);

      // Fetch all exam attempts in one batch query
      const examIds = publishedExams.map(exam => exam.id);
      const attemptsData = await examAttemptApi.getAllAttemptsForStudent(profile.id, examIds);
      
      // Convert array to map for easy lookup
      const attemptsMap: Record<string, ExamAttempt> = {};
      attemptsData.forEach(attempt => {
        attemptsMap[attempt.exam_id] = attempt;
      });
      setAttempts(attemptsMap);

      // Calculate counts
      let currentCount = 0;
      let upcomingCount = 0;
      let completedCount = 0;
      
      publishedExams.forEach((exam: ExamWithDetails) => {
        const attempt = attemptsMap[exam.id];
        const started = hasExamStarted(exam.start_time);
        const ended = hasExamEnded(exam.end_time);
        
        // Completed: submitted, evaluated, or time has ended
        if (attempt && (attempt.status === 'submitted' || attempt.status === 'evaluated')) {
          completedCount++;
        } else if (ended) {
          completedCount++;
        }
        // Current: exam has started but not ended
        else if (started && !ended) {
          currentCount++;
        }
        // Upcoming: exam hasn't started yet
        else if (!started) {
          upcomingCount++;
        }
      });

      setExamCounts({
        current: currentCount,
        upcoming: upcomingCount,
        completed: completedCount,
      });

      setLastUpdated(Date.now());
    } catch (err: any) {
      console.error('Error loading student data:', err);
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadData = useCallback(async () => {
    // Check if cache is still valid
    if (lastUpdated && Date.now() - lastUpdated < CACHE_DURATION) {
      // Cache is still valid, no need to fetch
      return;
    }
    
    // Cache expired or doesn't exist, fetch new data
    await fetchData();
  }, [lastUpdated, fetchData]);

  const refreshData = useCallback(async () => {
    // Force refresh regardless of cache
    await fetchData();
  }, [fetchData]);

  return (
    <StudentDataContext.Provider
      value={{
        exams,
        attempts,
        examCounts,
        loading,
        error,
        loadData,
        refreshData,
        lastUpdated,
      }}
    >
      {children}
    </StudentDataContext.Provider>
  );
}

export function useStudentData() {
  const context = useContext(StudentDataContext);
  if (context === undefined) {
    throw new Error('useStudentData must be used within a StudentDataProvider');
  }
  return context;
}
