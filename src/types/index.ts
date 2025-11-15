export interface Student {
  student_id: string;
  name: string;
  email: string;
  major: string;
  advisor_id?: string;
  created_at?: string;
}

export interface Advisor {
  advisor_id: string;
  name: string;
  email: string;
}

export interface Admin {
  admin_id: string;
  name: string;
  email: string;
}

export interface Course {
  course_id: string;
  title: string;
  title_ar: string;
  credits: number;
  prerequisites?: string;
  description?: string;
  description_ar?: string;
}

export interface Registration {
  reg_id: string;
  student_id: string;
  course_id: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at?: string;
}

export interface News {
  news_id: string;
  title: string;
  title_ar: string;
  content: string;
  content_ar: string;
  created_at: string;
  category?: 'Registration' | 'System Update' | 'Advisory Notice';
}

export interface Contact {
  contact_id: string;
  student_id: string;
  message: string;
  created_at: string;
  status?: 'pending' | 'replied';
}

export interface ProjectPhase {
  phase_id: string;
  title: string;
  title_ar: string;
  description: string;
  description_ar: string;
  order: number;
}

export type Language = 'ar' | 'en';
export type Theme = 'light' | 'dark';