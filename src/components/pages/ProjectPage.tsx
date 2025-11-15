import React, { useEffect, useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { Card } from '../ui/card';
import { createClient } from '../../utils/supabase/client';
import { ProjectPhase } from '../../types';
import { CheckCircle2, Circle } from 'lucide-react';
import { ImageWithFallback } from '../figma/ImageWithFallback';

const defaultPhases: ProjectPhase[] = [
  {
    phase_id: '1',
    title: 'Analysis',
    title_ar: 'التحليل',
    description: 'System requirements analysis and documentation',
    description_ar: 'تحليل متطلبات النظام وتوثيقها',
    order: 1,
  },
  {
    phase_id: '2',
    title: 'Design',
    title_ar: 'التصميم',
    description: 'UI/UX design and database schema design',
    description_ar: 'تصميم الواجهات وتصميم قاعدة البيانات',
    order: 2,
  },
  {
    phase_id: '3',
    title: 'Implementation',
    title_ar: 'التنفيذ',
    description: 'Development of frontend and backend components',
    description_ar: 'تطوير مكونات الواجهة الأمامية والخلفية',
    order: 3,
  },
  {
    phase_id: '4',
    title: 'Testing',
    title_ar: 'الاختبار',
    description: 'System testing, bug fixing, and quality assurance',
    description_ar: 'اختبار النظام وإصلاح الأخطاء وضمان الجودة',
    order: 4,
  },
  {
    phase_id: '5',
    title: 'Deployment',
    title_ar: 'النشر',
    description: 'System deployment and documentation',
    description_ar: 'نشر النظام وتوثيقه',
    order: 5,
  },
];

export const ProjectPage: React.FC = () => {
  const { language, t } = useApp();
  const [phases, setPhases] = useState<ProjectPhase[]>(defaultPhases);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPhases = async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('project_phases')
          .select('*')
          .order('order', { ascending: true });

        if (!error && data && data.length > 0) {
          setPhases(data);
        }
      } catch (error) {
        console.error('Error fetching project phases:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPhases();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-kku-green border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t('loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 relative">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-kku-green/5 via-background to-kku-gold/5 -z-10" />
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1646059526194-a5fb83134aca?w=1200')] bg-cover bg-center opacity-5 -z-10" />
      <div className="absolute top-0 left-1/3 w-96 h-96 bg-kku-gold/10 rounded-full blur-3xl animate-pulse-soft -z-10" />
      <div className="absolute bottom-0 right-1/3 w-96 h-96 bg-kku-green/10 dark:bg-primary/10 rounded-full blur-3xl animate-pulse-soft -z-10" style={{ animationDelay: '1s' }} />
      
      <div className="text-center animate-fade-in relative z-10">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 gradient-text">
          {t('project')}
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
          {language === 'ar'
            ? 'المراحل التطويرية للمشروع من التحليل إلى النشر'
            : 'Development phases of the project from analysis to deployment'}
        </p>
      </div>

      <div className="max-w-4xl mx-auto">
        {phases.map((phase, index) => (
          <div key={phase.phase_id} className="relative animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
            {/* Connection Line */}
            {index < phases.length - 1 && (
              <div
                className={`absolute ${ language === 'ar' ? 'right-[27px]' : 'left-[27px]'
                } top-[60px] w-0.5 h-[calc(100%-20px)] bg-gradient-to-b from-kku-green via-kku-gold to-kku-green dark:from-primary dark:via-secondary dark:to-primary`}
              />
            )}

            <div className="flex items-start gap-4 mb-8">
              {/* Phase Number/Icon */}
              <div className="relative z-10 flex-shrink-0">
                <div className="h-14 w-14 rounded-full bg-gradient-to-br from-kku-green to-kku-gold dark:from-primary dark:to-secondary flex items-center justify-center text-white shadow-lg animate-scale-in" style={{ animationDelay: `${index * 0.1 + 0.05}s` }}>
                  {index < 3 ? (
                    <CheckCircle2 className="h-6 w-6" />
                  ) : (
                    <Circle className="h-6 w-6" />
                  )}
                </div>
              </div>

              {/* Phase Content */}
              <Card className="flex-1 p-6 hover-lift pattern-bg animate-slide-in-right" style={{ animationDelay: `${index * 0.1 + 0.1}s` }}>
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-2xl font-bold gradient-text">
                    {language === 'ar' ? phase.title_ar : phase.title}
                  </h3>
                  <span className="text-sm text-muted-foreground px-3 py-1 bg-muted rounded-full">
                    {language === 'ar' ? `المرحلة ${index + 1}` : `Phase ${index + 1}`}
                  </span>
                </div>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  {language === 'ar' ? phase.description_ar : phase.description}
                </p>
                
                {/* Status Badge */}
                <div className="mt-4">
                  <span
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium shadow-sm ${
                      index < 3
                        ? 'bg-gradient-to-r from-green-500 to-green-600 text-white'
                        : 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white'
                    }`}
                  >
                    {index < 3 ? (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        {language === 'ar' ? 'مكتمل ✓' : 'Completed ✓'}
                      </>
                    ) : (
                      <>
                        <Circle className="h-4 w-4" />
                        {language === 'ar' ? 'قيد العمل...' : 'In Progress...'}
                      </>
                    )}
                  </span>
                </div>
              </Card>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};