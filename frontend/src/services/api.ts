// API Service — communicates with FastAPI backend
// API key is NEVER handled in the frontend.

const BASE_URL = '/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }

  return response.json();
}

// Cases
export const getCases = () => request('/cases');
export const getCase = (id: string) => request(`/cases/${id}`);
export const analyzeCase = (id: string, additional_context?: string) =>
  request(`/cases/${id}/analyze`, {
    method: 'POST',
    body: JSON.stringify({ additional_context }),
  });
export const escalateCase = (id: string) =>
  request(`/cases/${id}/escalate`, { method: 'POST' });
export const approveResolution = (id: string) =>
  request(`/cases/${id}/approve`, { method: 'POST' });

// Customers
export const getCustomers = () => request('/customers');
export const getCustomer = (id: string) => request(`/customers/${id}`);

// Knowledge
export const getKnowledgeArticles = () => request('/knowledge');
export const getKnowledgeArticle = (id: string) => request(`/knowledge/${id}`);

// Analytics
export const getAnalytics = () => request('/analytics');

// Escalations
export const getEscalations = () => request('/escalations');

// System
export const getHealth = () => request('/health');
export const getRagHealth = () => request('/rag/health');
export const getDashboard = () => request('/dashboard');
