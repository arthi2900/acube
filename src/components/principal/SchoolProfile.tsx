import { useEffect, useState } from 'react';
import { School } from '@/types/types';
import { schoolApi } from '@/db/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, Mail, Phone, MapPin, GraduationCap, BookOpen, Award } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SchoolProfileProps {
  principalId: string;
}

export default function SchoolProfile({ principalId }: SchoolProfileProps) {
  const [school, setSchool] = useState<School | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadSchool();
  }, [principalId]);

  const loadSchool = async () => {
    try {
      setLoading(true);
      const data = await schoolApi.getSchoolByPrincipalId(principalId);
      setSchool(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load school information',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex items-center justify-center">
            <div className="text-lg">Loading school information...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!school) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center text-center">
            <Building2 className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No School Assigned</p>
            <p className="text-sm text-muted-foreground mt-2">
              You have not been assigned to any school yet. Please contact the administrator.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="w-5 h-5" />
          School Profile
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-2xl font-bold">{school.school_name}</h3>
              <Badge variant="outline" className="mt-2">{school.school_code}</Badge>
            </div>

            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">Address</p>
                <p className="text-sm text-muted-foreground">{school.school_address}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Contact Number</p>
                <p className="text-sm text-muted-foreground">{school.contact_number}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Email</p>
                <p className="text-sm text-muted-foreground">{school.email}</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Award className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Affiliation/Board</p>
                <p className="text-sm text-muted-foreground">{school.affiliation_board}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <GraduationCap className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Class Range</p>
                <p className="text-sm text-muted-foreground">
                  Class {school.class_range_from} to Class {school.class_range_to}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <BookOpen className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="font-medium mb-2">Subjects Offered</p>
                <div className="flex flex-wrap gap-2">
                  {school.subjects_offered.map(subject => (
                    <Badge key={subject} variant="secondary">
                      {subject}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            <strong>Note:</strong> School information is managed by the administrator. 
            If you need to update any details, please contact the admin.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
