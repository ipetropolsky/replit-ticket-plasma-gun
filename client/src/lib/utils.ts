import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getEstimationBgColor = (estimation: string | null): string => {
  if (!estimation || estimation === '?') return 'bg-gray-100';

  switch (estimation) {
    case 'XS': return 'bg-blue-100';
    case 'S': return 'bg-green-100';
    case 'M': return 'bg-orange-100';
    case 'L': return 'bg-red-100';
    case 'XL': return 'bg-purple-100';
    default: return 'bg-gray-100';
  }
};

export const getRepositoryCategory = (repository: string | null): { label: string; bg: string; text: string } => {
  if (!repository) return { label: 'Задача', bg: 'bg-gray-100', text: 'text-gray-800' };

  for (const [category, config] of Object.entries(repositoryCategories)) {
    if (config.repos.includes(repository.toLowerCase())) {
      return { label: category, bg: config.bg, text: config.text };
    }
  }

  return { label: 'Задача', bg: 'bg-gray-100', text: 'text-gray-800' };
};

export const getRiskBgColor = (risk: string | null): string => {
  if (!risk) return 'bg-gray-100';

  switch (risk) {
    case 'XS': return 'bg-orange-100';
    case 'S': return 'bg-red-100';
    case 'M': return 'bg-red-200';
    default: return 'bg-gray-100';
  }
};

export const repositoryCategories = {
  'Frontend': {
    repos: ['frontend', 'xhh', 'docs', 'magritte', 'bloko', 'front-packages'],
    bg: 'bg-yellow-200',
    text: 'text-yellow-900'
  },
  'Configs': {
    repos: ['configs', 'deploy', 'deploy-dev-secure'],
    bg: 'bg-green-100',
    text: 'text-green-800'
  },
  'DB': {
    repos: ['db', 'dbscripts'],
    bg: 'bg-purple-100',
    text: 'text-purple-800'
  },
  'Backend': {
    repos: ['backend', 'hh.ru', 'hhru', 'xmlback', 'billing', 'billing-price', 'mm', 'monetization-manager', 'vacancy-creation', 'vc'],
    bg: 'bg-blue-500',
    text: 'text-white'
  }
};
