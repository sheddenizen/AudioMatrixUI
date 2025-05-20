// services/Api.ts
import axios, { AxiosResponse } from 'axios';
import { API_URL } from '../constants/Config'; // Assuming API_URL is in Config.ts

// Define interfaces for your data structures
// (These should ideally match what your backend actually returns/expects)
export interface Port {
  id: number;
  name: string;
  lastseen?: number; // Optional for unassigned ports
}

export interface LinePortConfiguration {
  [role: string]: number; // e.g., { left: 123, right: 456 } where numbers are port IDs
}

export interface LineItem {
  id: number;
  name: string;
  description?: string;
  ports: LinePortConfiguration; // Or more specific if roles are fixed e.g., { left?: number; right?: number; }
}

export interface CreateLinePayload {
  name: string;
  description?: string;
  ports?: LinePortConfiguration;
}

export interface UpdateLinePayload {
  name?: string;
  description?: string;
  ports?: LinePortConfiguration;
}

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// --- Source Endpoints ---
export const getSources = (): Promise<AxiosResponse<LineItem[]>> => apiClient.get('/src');
export const getSourceById = (id: number): Promise<AxiosResponse<LineItem>> => apiClient.get(`/src/${id}`);
// Backend uses PUT for create. The payload matches CreateLinePayload.
export const createSource = (data: CreateLinePayload): Promise<AxiosResponse<{ id: number }>> => apiClient.put('/src', data);
export const updateSource = (id: number, data: UpdateLinePayload): Promise<AxiosResponse<string>> => apiClient.put(`/src/${id}`, data);
export const deleteSource = (id: number): Promise<AxiosResponse<string>> => apiClient.delete(`/src/${id}`);

// --- Destination Endpoints ---
export const getDestinations = (): Promise<AxiosResponse<LineItem[]>> => apiClient.get('/dst');
export const getDestinationById = (id: number): Promise<AxiosResponse<LineItem>> => apiClient.get(`/dst/${id}`);
export const createDestination = (data: CreateLinePayload): Promise<AxiosResponse<{ id: number }>> => apiClient.put('/dst', data);
export const updateDestination = (id: number, data: UpdateLinePayload): Promise<AxiosResponse<string>> => apiClient.put(`/dst/${id}`, data);
export const deleteDestination = (id: number): Promise<AxiosResponse<string>> => apiClient.delete(`/dst/${id}`);

// --- Port Endpoints ---
export const getUnassignedSrcPorts = (): Promise<AxiosResponse<Port[]>> => apiClient.get('/port/src/unassigned');
export const getUnassignedDstPorts = (): Promise<AxiosResponse<Port[]>> => apiClient.get('/port/dst/unassigned');

export default {
  getSources,
  getSourceById,
  createSource,
  updateSource,
  deleteSource,
  getDestinations,
  getDestinationById,
  createDestination,
  updateDestination,
  deleteDestination,
  getUnassignedSrcPorts,
  getUnassignedDstPorts,
};
