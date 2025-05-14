-- Create applications table
create table applications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  company_name text not null,
  position text not null,
  job_url text,
  application_date timestamp with time zone default timezone('utc'::text, now()) not null,
  status text not null check (status in ('applied', 'interview', 'rejected', 'stale', 'offered', 'accepted')),
  notes text,
  salary_range text,
  location text,
  job_type text check (job_type in ('full-time', 'part-time', 'contract', 'internship', 'remote')),
  interview_date timestamp with time zone,
  interview_type text check (interview_type in ('phone', 'video', 'onsite', 'technical', 'behavioral')),
  follow_up_date timestamp with time zone,
  contact_name text,
  contact_email text,
  contact_phone text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add RLS policies
alter table applications enable row level security;

create policy "Users can only access their own applications"
  on applications for all
  using (auth.uid() = user_id);

-- Create indexes for faster queries
create index applications_user_id_idx on applications(user_id);
create index applications_status_idx on applications(status);
create index applications_company_name_idx on applications(company_name);
create index applications_interview_date_idx on applications(interview_date);
create index applications_follow_up_date_idx on applications(follow_up_date); 