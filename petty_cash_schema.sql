-- 1. Projects Table
CREATE TABLE IF NOT EXISTS public.projects (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Petty Cash Categories
CREATE TABLE IF NOT EXISTS public.petty_cash_categories (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Petty Cash Expenses
CREATE TABLE IF NOT EXISTS public.petty_cash_expenses (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  expense_no text NOT NULL UNIQUE,
  expense_date date NOT NULL,
  request_description text NOT NULL,
  category_id uuid REFERENCES public.petty_cash_categories(id),
  employee_id uuid REFERENCES public.profiles(id),
  amount numeric NOT NULL CHECK (amount > 0),
  project_id uuid REFERENCES public.projects(id),
  attachment_url text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_by uuid REFERENCES auth.users(id),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Petty Cash Reimbursements
CREATE TABLE IF NOT EXISTS public.petty_cash_reimbursements (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id uuid REFERENCES public.profiles(id),
  reimbursement_date date NOT NULL,
  amount numeric NOT NULL CHECK (amount > 0),
  reference_no text,
  notes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Insert Default Data
INSERT INTO public.projects (name) VALUES 
('Head Office'),
('Ectron'),
('Sagemcom'),
('Tadoom'),
('ECT Project'),
('Tadoom & Ectron 50%'),
('Ectron 80%, AAMU 20%'),
('Ectron 50%, AAMU 50%'),
('Ectron 90%, Tadoom 10%'),
('Ectron 85%, NEC 5%, AAMU 10%'),
('General / Factory Operations')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.petty_cash_categories (name) VALUES 
('Office Supplies'), ('Stationery'), ('Transportation'), ('Fuel'), 
('Delivery Services'), ('Postage'), ('Refreshments'), ('Hospitality'), 
('Maintenance'), ('Cleaning'), ('Small Tools'), ('Employee Expenses'), 
('IT Supplies'), ('Electrical Supplies'), ('Safety Items'), 
('Warehouse Equipment'), ('Business Gifts'), ('Employee Welfare'), 
('Kitchen Tools'), ('External Labor'), ('Other')
ON CONFLICT (name) DO NOTHING;

-- 5. Recurring Descriptions
CREATE TABLE IF NOT EXISTS public.petty_cash_recurring_descriptions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  description text NOT NULL UNIQUE,
  active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Policies
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations for projects" ON public.projects FOR ALL USING (true);

ALTER TABLE public.petty_cash_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations for petty_cash_categories" ON public.petty_cash_categories FOR ALL USING (true);

ALTER TABLE public.petty_cash_expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations for petty_cash_expenses" ON public.petty_cash_expenses FOR ALL USING (true);

ALTER TABLE public.petty_cash_reimbursements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations for petty_cash_reimbursements" ON public.petty_cash_reimbursements FOR ALL USING (true);

ALTER TABLE public.petty_cash_recurring_descriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations for petty_cash_recurring_descriptions" ON public.petty_cash_recurring_descriptions FOR ALL USING (true);
