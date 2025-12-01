
export enum StudentStatus {
  READY = 'READY',       // Verde: Listo para recoger
  ON_WAY = 'ON_WAY',     // Amarillo: En camino / En clase
  DELAYED = 'DELAYED',   // Rojo: Retraso
  NORMAL = 'NORMAL'      // Estado base (Conectado)
}

export enum PickupAuthStatus {
  NONE = 'NONE',           // No solicitado
  PENDING = 'PENDING',     // Solicitado, esperando aprobación del alumno
  APPROVED = 'APPROVED',   // Alumno aceptó
  REJECTED = 'REJECTED'    // Alumno rechazó
}

export type UserRole = 'PARENT' | 'STUDENT' | null;
export type Theme = 'light' | 'dark';

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface SurveyData {
  completed: boolean;
  destination: string;
  transportMethod: 'BUS' | 'PARENT_CAR' | 'WALK' | 'OTHER';
  healthStatus: 'GOOD' | 'SICK';
  comments: string;
  submittedAt?: string;
}

export interface Parent {
  id: string;
  name: string;
  dni: string;
  phone: string;
  address: string;
  familyCode: string; // The code they use to login
  avatarUrl: string;
  role: 'Apoderado';
}

export interface Student {
  id: string;
  name: string;
  grade: '3ro' | '4to' | '5to';
  section: 'A' | 'B' | 'C' | 'D';
  avatarUrl: string;
  status: StudentStatus;
  statusText: string; 
  deviceId: string; // Phone ID
  batteryLevel: number;
  pickupAuthorization: PickupAuthStatus;
  location: Coordinates;
  linkCode: string; // Code for parent to link
  
  // Survey Data
  weeklySurvey: SurveyData;
  
  // Personal Info
  dni: string;
  originCity: string; // Donde viene
  address: string;
  birthDate: string;
  bloodType: string;
  
  // AI Analysis Data
  stressLevel: 'Bajo' | 'Medio' | 'Alto';
  lastActivity: string;
}

export interface Notification {
  id: string;
  title: string;
  time: string;
  type: 'info' | 'alert' | 'success';
}

export interface UserProfile {
  name: string;
  role: string;
  avatarUrl: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export interface AIInsight {
  title: string;
  value: string;
  trend: 'up' | 'down' | 'stable';
  description: string;
  color: string;
}
