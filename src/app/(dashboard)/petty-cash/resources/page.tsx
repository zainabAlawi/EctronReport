import React from 'react';
import ResourcesManagement from '@/components/petty-cash/ResourcesManagement';
import { 
  getAllEmployeesWithStatus, 
  getProjects, 
  getCategories, 
  getRecurringDescriptions 
} from '@/app/(dashboard)/petty-cash/actions/resourcesActions';

export default async function PettyCashResourcesPage() {
  const [employees, projects, categories, descriptions] = await Promise.all([
    getAllEmployeesWithStatus(),
    getProjects(),
    getCategories(),
    getRecurringDescriptions()
  ]);

  return (
    <ResourcesManagement
      initialEmployees={employees}
      initialProjects={projects}
      initialCategories={categories}
      initialDescriptions={descriptions}
    />
  );
}
