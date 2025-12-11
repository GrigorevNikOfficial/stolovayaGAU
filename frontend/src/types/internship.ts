export type InternshipApplicationStatus = 'pending' | 'accepted' | 'declined';

export type InternshipApplication = {
  user: string | { _id: string; first_name?: string; last_name?: string };
  message?: string;
  status: InternshipApplicationStatus;
  createdAt?: string;
};

export type InternshipItem = {
  _id: string;
  title: string;
  description: string;
  company?: string;
  location?: string;
  workFormat?: 'onsite' | 'remote' | 'hybrid' | 'unspecified';
  employmentType?: 'full' | 'part' | 'intern' | 'unspecified';
  hoursPerDay?: number;
  expectedSalary?: string;
  skills?: string[];
  experienceLevel?: string;
  status: 'open' | 'closed';
  createdBy: { _id: string; first_name?: string; last_name?: string } | string;
  applications: InternshipApplication[];
  createdAt?: string;
};