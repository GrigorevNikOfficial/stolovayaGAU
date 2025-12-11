export type WorkApplicationStatus = 'pending' | 'accepted' | 'declined';

export type WorkApplication = {
  user: string | { _id: string; first_name?: string; last_name?: string };
  message?: string;
  status: WorkApplicationStatus;
  createdAt?: string;
};

export type WorkItem = {
  _id: string;
  title: string;
  description: string;
  location?: string;
  salaryText?: string;
  status: 'open' | 'closed';
  createdBy: { _id: string; first_name?: string; last_name?: string } | string;
  applications: WorkApplication[];
  createdAt?: string;
};