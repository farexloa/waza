import { Student, StudentStatus, PickupAuthStatus, Parent } from './types';

// CONFIGURATION FROM EXCEL / GOOGLE FORMS
export const GOOGLE_SHEET_URL = "https://docs.google.com/spreadsheets/d/1SeGFezS6ni9DaO0D1dUwMGl95vJTmkuqYYfZKJfIlIo/edit?usp=sharing";
export const GOOGLE_FORM_BASE_URL = "https://docs.google.com/forms/d/e/1FAIpQLSf_placeholder/viewform"; 

// --- DATABASE SIMULATION ---

// 1. PARENTS DATABASE
export const INITIAL_PARENTS: Parent[] = [
  {
    id: 'p1',
    name: 'María López',
    dni: '40405050',
    phone: '951000111',
    address: 'Jr. Los Andes 123, Juliaca',
    familyCode: 'admin', // Code used for login
    avatarUrl: 'https://picsum.photos/seed/maria/100/100',
    role: 'Apoderado'
  },
  {
    id: 'p2',
    name: 'Juan Perez',
    dni: '41416060',
    phone: '950222333',
    address: 'Av. Floral 500, Puno',
    familyCode: 'COAR-FAM-001',
    avatarUrl: 'https://picsum.photos/seed/juan/100/100',
    role: 'Apoderado'
  }
];

// 2. STUDENTS DATABASE
export const INITIAL_STUDENTS: Student[] = [
  {
    id: '1',
    name: 'Ana Quispe',
    grade: '5to',
    section: 'A',
    avatarUrl: 'https://picsum.photos/seed/ana/100/100',
    status: StudentStatus.NORMAL,
    statusText: 'En línea',
    deviceId: 'IPhone-12',
    batteryLevel: 85,
    pickupAuthorization: PickupAuthStatus.NONE,
    stressLevel: 'Bajo',
    lastActivity: 'Conectado hace 5 min',
    location: { lat: -15.885500, lng: -69.893000 },
    linkCode: 'COAR-ANA5678', 
    weeklySurvey: { completed: false, destination: '', transportMethod: 'OTHER', healthStatus: 'GOOD', comments: '' },
    dni: '72345678',
    originCity: 'Juliaca',
    address: 'Jr. Los Andes 123, Juliaca',
    birthDate: '12/05/2007',
    bloodType: 'O+'
  },
  {
    id: '2',
    name: 'Luis Mamani',
    grade: '3ro',
    section: 'C',
    avatarUrl: 'https://picsum.photos/seed/luis/100/100',
    status: StudentStatus.NORMAL,
    statusText: 'En línea',
    deviceId: 'Samsung-S21',
    batteryLevel: 42,
    pickupAuthorization: PickupAuthStatus.NONE,
    stressLevel: 'Medio',
    lastActivity: 'Activo recientemente',
    location: { lat: -15.887000, lng: -69.891500 },
    linkCode: 'COAR-LUI1234',
    weeklySurvey: { completed: false, destination: '', transportMethod: 'OTHER', healthStatus: 'GOOD', comments: '' },
    dni: '71239876',
    originCity: 'Puno',
    address: 'Av. Simóm Bolivar 450, Puno',
    birthDate: '24/08/2009',
    bloodType: 'A+'
  },
  {
    id: '3',
    name: 'Sofía Apaza',
    grade: '4to',
    section: 'B',
    avatarUrl: 'https://picsum.photos/seed/sofia/100/100',
    status: StudentStatus.DELAYED,
    statusText: 'Sin señal reciente',
    deviceId: 'Xiaomi-Redmi',
    batteryLevel: 15,
    pickupAuthorization: PickupAuthStatus.NONE,
    stressLevel: 'Bajo',
    lastActivity: 'Hace 20 min',
    location: { lat: -15.885200, lng: -69.892800 },
    linkCode: 'COAR-SOF9012',
    weeklySurvey: { completed: false, destination: '', transportMethod: 'OTHER', healthStatus: 'GOOD', comments: '' },
    dni: '73451234',
    originCity: 'Ilave',
    address: 'Jr. Puno 88, Ilave',
    birthDate: '03/11/2008',
    bloodType: 'O+'
  },
  {
    id: '4',
    name: 'Carlos Condori',
    grade: '5to',
    section: 'D',
    avatarUrl: 'https://picsum.photos/seed/carlos/100/100',
    status: StudentStatus.NORMAL,
    statusText: 'En línea',
    deviceId: 'Moto-G60',
    batteryLevel: 67,
    pickupAuthorization: PickupAuthStatus.NONE,
    stressLevel: 'Bajo',
    lastActivity: 'Conectado ahora',
    location: { lat: -15.885500, lng: -69.893000 },
    linkCode: 'COAR-CAR3456',
    weeklySurvey: { completed: false, destination: '', transportMethod: 'OTHER', healthStatus: 'GOOD', comments: '' },
    dni: '60294894',
    originCity: 'Azángaro',
    address: 'Jr. Melgar 202, Puno',
    birthDate: '15/02/2007',
    bloodType: 'B+'
  },
  {
    id: '5',
    name: 'Diego Vargas',
    grade: '3ro',
    section: 'A',
    avatarUrl: 'https://picsum.photos/seed/diego/100/100',
    status: StudentStatus.ON_WAY,
    statusText: 'En camino',
    deviceId: 'iPhone-SE',
    batteryLevel: 92,
    pickupAuthorization: PickupAuthStatus.NONE,
    stressLevel: 'Alto',
    lastActivity: 'Hace 2 min',
    location: { lat: -15.886000, lng: -69.892000 },
    linkCode: 'COAR-DIE1122',
    weeklySurvey: { completed: true, destination: 'Puno Centro', transportMethod: 'BUS', healthStatus: 'GOOD', comments: 'Todo bien' },
    dni: '70010022',
    originCity: 'Puno',
    address: 'Av. El Sol 404, Puno',
    birthDate: '01/04/2009',
    bloodType: 'O-'
  }
];

export const SCHEDULE_ITEMS = [
  { time: '15:30', title: 'Salida General', subtitle: 'Portón Principal', status: 'En proceso', statusType: 'normal' },
  { time: '16:15', title: 'Talleres', subtitle: 'Áreas Comunes', status: 'Pendiente', statusType: 'warning' }
];

export const AI_SYSTEM_INSTRUCTION = `
Eres "COAR AI", un asistente virtual inteligente diseñado para los padres del Colegio de Alto Rendimiento (COAR) Puno.
Tu objetivo es proveer información sobre el colegio y los estudiantes.
Responde de manera concisa y clara.
`;

// --- MAP & LOCATION DATA ---

export const MAP_BOUNDS = {
  minLat: -15.888000,
  maxLat: -15.884000,
  minLng: -69.895000,
  maxLng: -69.890000
};

export const SCHOOL_ZONES = [
  {
    id: 'zone-main',
    name: 'Campus Central',
    color: 'rgba(59, 130, 246, 0.1)', 
    polygon: [
      { lat: -15.885000, lng: -69.894000 },
      { lat: -15.887000, lng: -69.894000 },
      { lat: -15.887000, lng: -69.891000 },
      { lat: -15.885000, lng: -69.891000 }
    ]
  },
  {
    id: 'zone-parking',
    name: 'Estacionamiento',
    color: 'rgba(34, 197, 94, 0.2)', 
    polygon: [
      { lat: -15.884200, lng: -69.893000 },
      { lat: -15.885000, lng: -69.893000 },
      { lat: -15.885000, lng: -69.892000 },
      { lat: -15.884200, lng: -69.892000 }
    ]
  }
];

// --- MOCK DATA FOR UI SIMULATION ---

export const MOCK_USER = {
  name: 'María López',
  role: 'Apoderado',
  avatarUrl: 'https://picsum.photos/seed/maria/100/100'
};
