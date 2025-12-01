
import React, { useState } from 'react';
import { Icons } from './Icons';
import { Student, PickupAuthStatus, SurveyData } from '../types';
import { MOCK_USER } from '../constants';
import { SurveyForm } from './SurveyForm';

interface StudentPortalProps {
  student: Student;
  onLogout: () => void;
  onRespondPickup: (approved: boolean) => void;
  onSubmitSurvey?: (data: SurveyData) => void;
}

export const StudentPortal: React.FC<StudentPortalProps> = ({ student, onLogout, onRespondPickup, onSubmitSurvey }) => {
  const [activeTab, setActiveTab] = useState('home');

  // --- RENDER: INCOMING REQUEST (PENDING) ---
  if (student.pickupAuthorization === PickupAuthStatus.PENDING) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Background Pulse Animation */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-600/30 rounded-full animate-ping opacity-20"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-blue-500/40 rounded-full animate-ping opacity-40 animation-delay-200"></div>
        </div>

        <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl border-8 border-gray-800 overflow-hidden relative h-[800px] flex flex-col z-10">
           {/* Header */}
           <div className="bg-blue-600 h-1/3 relative flex flex-col items-center justify-center pt-10 rounded-b-[3rem] shadow-lg">
              <div className="absolute top-0 left-0 right-0 h-8 bg-gray-900 flex justify-center">
                 <div className="w-32 h-4 bg-black rounded-b-xl"></div>
              </div>
              <h2 className="text-white font-bold text-lg uppercase tracking-widest animate-pulse mb-2">Solicitud de Salida</h2>
              <div className="w-32 h-32 rounded-full border-4 border-white shadow-xl overflow-hidden relative">
                 <img src={MOCK_USER.avatarUrl} alt="Parent" className="w-full h-full object-cover" />
              </div>
              <p className="text-white font-bold text-xl mt-3">{MOCK_USER.name}</p>
              <p className="text-blue-200 text-sm">{MOCK_USER.role}</p>
           </div>

           {/* Body */}
           <div className="flex-1 bg-white flex flex-col items-center justify-between p-8 pt-12">
              <div className="text-center space-y-2">
                 <h3 className="text-2xl font-bold text-gray-900">¿Estás listo para salir?</h3>
                 <p className="text-gray-500 text-sm px-4">
                   Tu apoderado se encuentra en la <span className="font-bold text-blue-600">Zona de Espera A</span>.
                   Confirma tu salida para notificar al portón.
                 </p>
              </div>

              <div className="w-full space-y-4 mb-8">
                 <button 
                   onClick={() => onRespondPickup(true)}
                   className="w-full py-5 bg-green-500 hover:bg-green-600 text-white rounded-2xl font-bold text-lg shadow-lg shadow-green-200 flex items-center justify-center gap-3 transition-transform active:scale-95"
                 >
                   <div className="p-1 bg-white/20 rounded-full">
                     <Icons.Shield className="w-6 h-6" />
                   </div>
                   CONFIRMAR SALIDA
                 </button>

                 <button 
                   onClick={() => onRespondPickup(false)}
                   className="w-full py-4 bg-white border-2 border-red-100 text-red-500 hover:bg-red-50 rounded-2xl font-bold text-md transition-colors"
                 >
                   Rechazar / Aún en clase
                 </button>
              </div>
           </div>
        </div>
      </div>
    );
  }

  // --- RENDER: APPROVED PASS (EXIT TICKET) ---
  if (student.pickupAuthorization === PickupAuthStatus.APPROVED) {
    return (
      <div className="min-h-screen bg-green-800 flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl border-8 border-gray-900 overflow-hidden relative h-[800px] flex flex-col">
           <div className="bg-green-500 h-24 relative flex items-center justify-center rounded-b-[3rem] shadow-md z-10">
              <div className="absolute top-0 left-0 right-0 h-8 bg-gray-900 flex justify-center">
                 <div className="w-32 h-4 bg-black rounded-b-xl"></div>
              </div>
              <h2 className="text-white font-bold text-xl flex items-center gap-2 mt-4">
                <Icons.Shield className="w-6 h-6" /> PASE DE SALIDA
              </h2>
           </div>

           <div className="flex-1 bg-gray-50 p-6 flex flex-col items-center">
              {/* TICKET VISUAL */}
              <div className="w-full bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-200 relative">
                 {/* Perforation Dots */}
                 <div className="absolute top-1/2 -left-3 w-6 h-6 bg-gray-50 rounded-full"></div>
                 <div className="absolute top-1/2 -right-3 w-6 h-6 bg-gray-50 rounded-full"></div>
                 <div className="absolute top-1/2 left-4 right-4 border-b-2 border-dashed border-gray-200"></div>

                 {/* Top Section */}
                 <div className="p-6 text-center bg-blue-50">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">COAR PUNO - SALIDA AUTORIZADA</p>
                    <h1 className="text-3xl font-black text-gray-900">{student.name.split(' ')[0]} {student.name.split(' ')[1]?.charAt(0)}.</h1>
                    <p className="text-sm font-medium text-gray-500 mt-1">{student.grade} "{student.section}" - {student.dni}</p>
                 </div>

                 {/* Bottom Section (QR) */}
                 <div className="p-8 flex flex-col items-center bg-white">
                    <div className="w-48 h-48 bg-gray-900 rounded-xl p-2 mb-4 flex items-center justify-center">
                        <div className="w-full h-full border-4 border-white flex items-center justify-center">
                             {/* Simulated QR */}
                             <div className="grid grid-cols-6 gap-1 opacity-80">
                                {[...Array(36)].map((_, i) => (
                                   <div key={i} className={`w-full h-full rounded-sm ${Math.random() > 0.5 ? 'bg-white' : 'bg-transparent'}`}></div>
                                ))}
                             </div>
                        </div>
                    </div>
                    <p className="text-xs text-gray-400 text-center px-4">
                      Muestra este código en el Portón Principal al personal de seguridad.
                    </p>
                    <p className="mt-4 text-lg font-mono font-bold text-green-600">
                       {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </p>
                 </div>
              </div>

              <div className="mt-8 text-center">
                 <p className="text-gray-500 text-sm mb-4">Tu apoderado ha sido notificado.</p>
                 <button onClick={onLogout} className="text-gray-400 font-medium text-sm hover:text-gray-600 underline">
                   Cerrar Sesión
                 </button>
              </div>
           </div>
        </div>
      </div>
    );
  }

  // --- RENDER: PHONE FRAME (WRAPPER) ---
return (
    <div className="min-h-screen bg-gray-50 flex justify-center">
      {/* Contenedor principal: En móvil ocupa todo, en PC se centra como una app móvil moderna */}
      <div className="w-full max-w-md bg-white shadow-xl min-h-screen flex flex-col relative">
        
        {/* CONTENIDO (Sin Notch, sin bordes negros) */}
        {activeTab === 'survey' ? (
           <SurveyForm 
             studentCode={student.linkCode}
             onSubmit={(data) => {
               onSubmitSurvey?.(data);
               setActiveTab('home');
             }} 
             onCancel={() => setActiveTab('home')}
           />
        ) : (
          /* HOME DASHBOARD */
          <>
            <header className="bg-gradient-to-br from-blue-700 to-blue-900 p-6 text-white pt-8 pb-12 rounded-b-[2rem] shadow-lg relative z-10">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <p className="text-blue-200 text-xs uppercase tracking-wider font-bold mb-1">Estudiante COAR</p>
                  <h1 className="text-2xl font-bold">{student.name}</h1>
                </div>
                <div className="bg-white/10 p-1 rounded-full backdrop-blur-md border border-white/20">
                  <img src={student.avatarUrl} alt="Profile" className="w-12 h-12 rounded-full object-cover" />
                </div>
              </div>
              
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 flex justify-between border border-white/10">
                <div className="text-center border-r border-white/10 pr-4 flex-1">
                  <p className="text-blue-200 text-[10px] uppercase">DNI</p>
                  <p className="font-mono font-bold text-lg">{student.dni}</p>
                </div>
                <div className="text-center pl-4 flex-1">
                  <p className="text-blue-200 text-[10px] uppercase">Aula</p>
                  <p className="font-bold text-lg">{student.grade} {student.section}</p>
                </div>
              </div>
            </header>

            <div className="flex-1 p-6 -mt-6 z-20 overflow-y-auto space-y-6 pb-24">
              
              {/* SURVEY ALERT */}
              {!student.weeklySurvey.completed && (
                <button 
                  onClick={() => setActiveTab('survey')}
                  className="w-full bg-purple-600 rounded-2xl p-5 shadow-lg shadow-purple-200 text-white relative overflow-hidden flex items-center justify-between group transform transition-all active:scale-95"
                >
                   <div className="absolute -left-4 -bottom-4 w-20 h-20 bg-purple-500 rounded-full opacity-50"></div>
                   <div className="relative z-10 text-left">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="bg-white/20 px-2 py-0.5 rounded text-[10px] font-bold uppercase">Pendiente</span>
                        <Icons.Check className="w-4 h-4" />
                      </div>
                      <h3 className="font-bold text-lg">Encuesta de Salida</h3>
                      <p className="text-purple-100 text-xs">Obligatorio los miércoles</p>
                   </div>
                   <div className="w-10 h-10 bg-white text-purple-600 rounded-full flex items-center justify-center shadow-sm">
                      <Icons.Survey className="w-5 h-5" />
                   </div>
                </button>
              )}

              {/* Link Code Card */}
              <div className="bg-indigo-600 rounded-2xl p-5 shadow-lg shadow-indigo-200 text-white relative overflow-hidden">
                <div className="absolute -right-6 -top-6 w-24 h-24 bg-indigo-500 rounded-full opacity-50"></div>
                <div className="relative z-10">
                  <h3 className="text-xs font-bold text-indigo-200 uppercase tracking-wider mb-1">Vinculación Familiar</h3>
                  <p className="text-sm text-indigo-100 mb-3">Comparte este código con tu apoderado.</p>
                  <div className="bg-white/20 backdrop-blur-md rounded-xl p-3 text-center border border-white/30">
                    <span className="font-mono text-2xl font-bold tracking-widest">{student.linkCode}</span>
                  </div>
                </div>
              </div>

              {/* Menu del dia */}
              <div className="bg-orange-50 rounded-2xl p-5 border border-orange-100">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-orange-800 text-sm">Menú de Hoy</h3>
                  <Icons.Menu className="w-4 h-4 text-orange-400" />
                </div>
                <div className="bg-white rounded-xl p-3 shadow-sm">
                  <p className="text-sm font-medium text-gray-800">🥘 Lentejas con Arroz y Pollo</p>
                  <p className="text-xs text-gray-400 mt-1">Refresco: Chicha Morada</p>
                </div>
              </div>

            </div>
          </>
        )}

        {/* Bottom Nav - Fijo en la parte inferior */}
        <div className="bg-white border-t border-gray-100 p-4 px-8 pb-6 flex justify-between sticky bottom-0 z-30">
           <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'home' ? 'text-blue-600' : 'text-gray-300 hover:text-gray-500'}`}>
              <Icons.Dashboard className="w-6 h-6" />
              <span className="text-[10px] font-bold">Inicio</span>
           </button>
           <button onClick={() => setActiveTab('survey')} className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'survey' ? 'text-purple-600' : 'text-gray-300 hover:text-gray-500'}`}>
              <Icons.Survey className="w-6 h-6" />
              <span className="text-[10px] font-bold">Encuesta</span>
           </button>
           <button onClick={onLogout} className="text-gray-300 flex flex-col items-center gap-1 hover:text-red-500 transition-colors">
              <Icons.Close className="w-6 h-6" />
              <span className="text-[10px] font-bold">Salir</span>
           </button>
        </div>

      </div>
    </div>
  );
};
