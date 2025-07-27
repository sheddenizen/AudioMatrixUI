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
  [role: string]:  number; // e.g., { left: 123, right: 456 } where numbers are port IDs
}

export interface LinePortAssignment {
  [role: string]:  [number, string]; // e.g., { left: [123, "portstring56", right: [124, "portstring57"] } where numbers are port IDs
}

export interface LineItem {
  id: number;
  name: string;
  description?: string;
  ports: LinePortAssignment; // Or more specific if roles are fixed e.g., { left?: number; right?: number; }
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

export type LineType = "src" | "dst";

// --- Add Matrix-specific interfaces ---
export interface MatrixItem {
  id: number;
  name: string;
  description: string;
  mode: number;
}

// Destination details in matrix state
export interface MatrixDestination {
  id: number;
  name: string;
  state: 'patched' | 'partial' | 'inactive' | 'overpatched' | 'unpatched';
  desired?: { src: number; [role: string]: any; };
  others?: { src: number; [role: string]: any; }[];
}

export interface MatrixSource {
  id: number;
  name: string;
}

// --- Add Metering-specific interfaces ---
export interface MeterChannelData {
  left: [number, number];  // [peak, rms]
  right: [number, number]; // [peak, rms]
}
export interface MeterLevels {
  [sourceId: string]: MeterChannelData;
}

// For the GET /matrix/:id response
export interface MatrixDetails extends Omit<MatrixItem, 'description'> { // Omit desc as it's not in the base GET /matrix/:id response
  name: string;
  description: string;
  meterurl?: string; // Add the optional meterurl
  mode: number;
  srcs: MatrixSource[]; // Ordered list of sources in the matrix
  dsts: MatrixDestination[]; // Using the rich MatrixDestination type from before
  // The active/desired fields are also there, but not needed for the edit modal
}

// For the POST /matrix payload
export interface CreateMatrixPayload {
  name: string;
  description?: string;
  mode?: number;
  srcs: number[]; // Ordered list of source IDs
  dsts: number[]; // Ordered list of destination IDs
}

// For the PUT /matrix/:id payload
export interface UpdateMatrixPayload {
  name?: string;
  description?: string;
  mode?: number;
  srcs?: number[]; // Ordered list of source IDs
  dsts?: number[]; // Ordered list of destination IDs
}


// --- Generic Line Endpoints ---
export const getLines = (lineType: LineType): Promise<AxiosResponse<LineItem[]>> => apiClient.get(`/${lineType}`);
export const getLineById = (lineType: LineType, id: number): Promise<AxiosResponse<LineItem>> => apiClient.get(`/${lineType}/${id}`);
export const createLine = (lineType: LineType, data: CreateLinePayload): Promise<AxiosResponse<{ id: number }>> => apiClient.put(`/${lineType}`, data);
export const updateLine = (lineType: LineType, id: number, data: UpdateLinePayload): Promise<AxiosResponse<string>> => apiClient.put(`/${lineType}/${id}`, data);
export const deleteLine = (lineType: LineType, id: number): Promise<AxiosResponse<string>> => apiClient.delete(`/${lineType}/${id}`);

// --- Port Endpoints ---
export const getUnassignedSrcPorts = (): Promise<AxiosResponse<Port[]>> => apiClient.get('/port/src/unassigned');
export const getUnassignedDstPorts = (): Promise<AxiosResponse<Port[]>> => apiClient.get('/port/dst/unassigned');

export const getUnassignedLinePorts = (lineType: LineType): Promise<AxiosResponse<Port[]>> => apiClient.get(`/port/${lineType}/unassigned`);

// --- Matrix Endpoints ---
export const getMatrices = (): Promise<AxiosResponse<MatrixItem[]>> => apiClient.get('/matrix');
export const getMatrixDetails = (id: number): Promise<AxiosResponse<MatrixDetails>> => apiClient.get(`/matrix/${id}`);
export const createMatrix = (data: CreateMatrixPayload): Promise<AxiosResponse<MatrixItem>> => apiClient.post('/matrix', data);
export const updateMatrix = (id: number, data: UpdateMatrixPayload): Promise<AxiosResponse<{ id: number, message: string }>> => apiClient.put(`/matrix/${id}`, data);
export const deleteMatrix = (id: number): Promise<AxiosResponse<{ message: string }>> => apiClient.delete(`/matrix/${id}`);

// --- Patching Endpoint Functions ---
export const patchConnection = (dstId: number, srcId: number): Promise<AxiosResponse<string>> => 
  apiClient.put(`/patch/${dstId}/${srcId}`);

export const unpatchConnection = (dstId: number): Promise<AxiosResponse<string>> => 
  apiClient.delete(`/patch/${dstId}`);

// --- Add Metering Endpoint Function ---
// This function takes the relative path from the API response
export const getMeterLevels = (url: string): Promise<AxiosResponse<MeterLevels>> => apiClient.get(url);


export default {
  getLines,
  getLineById,
  createLine,
  updateLine,
  deleteLine,
  getUnassignedLinePorts,
  getMatrices,
  getMatrixDetails,
  createMatrix,
  updateMatrix,
  deleteMatrix,
  patchConnection,
  unpatchConnection,
  getMeterLevels,
};
