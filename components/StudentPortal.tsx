import React, { useState, useEffect, useRef } from 'react';
import { Icons } from './Icons';
import { Student, PickupAuthStatus, SurveyData, StudentActivity } from '../types';
import { MOCK_USER } from '../constants';
import { SurveyForm } from './SurveyForm';

interface StudentPortalProps {
  student: Student;
  onLogout: () => void;
  onRespondPickup: (approved: boolean) => void;
  onSubmitSurvey?: (data: SurveyData) => void;
  onUpdateActivity?: (activity: StudentActivity) => void;
  requestingParentName?: string; // Prop nueva para el nombre del padre
}

export const StudentPortal: React.FC<StudentPortalProps> = ({ 
  student, 
  onLogout, 
  onRespondPickup, 
  onSubmitSurvey,
  onUpdateActivity,
  requestingParentName = "Tu Apoderado"
}) => {
  const [activeTab, setActiveTab] = useState('home');
  const lastStatusRef = useRef(student.pickupAuthorization);

  useEffect(() => {
    if ('Notification' in window && Notification.permission !== 'granted') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    if (student.pickupAuthorization === PickupAuthStatus.PENDING && lastStatusRef.current !== PickupAuthStatus.PENDING) {
      triggerAlert();
    }
    lastStatusRef.current = student.pickupAuthorization;
  }, [student.pickupAuthorization]);

  const triggerAlert = () => {
    if (typeof navigator.vibrate === 'function') {
      navigator.vibrate([500, 200, 500, 200, 1000]); 
    }

    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification("¡SOLICITUD DE SALIDA!", {
          body: `${requestingParentName} está solicitando tu salida.`, // Usa el nombre real
          icon: '/vite.svg',
          tag: 'pickup-alert',
          requireInteraction: true
        });
      } catch (e) {
        console.error("Error al enviar notificación:", e);
      }
    }
  };

  const renderActivityButton = (type: StudentActivity, label: string, icon: any, colorClass: string, activeBgClass: string) => {
    const isActive = student.currentActivity === type;
    return (
      <button
        onClick={() => onUpdateActivity && onUpdateActivity(type)}
        className={`flex-1 p-4 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-2 ${
          isActive 
            ? `${activeBgClass} border-transparent text-white shadow-lg scale-105 ring-2 ring-offset-2 ring-blue-100` 
            : `bg-white border-gray-100 text-gray-400 hover:border-gray-200 hover:bg-gray-50`
        }`}
      >
        {React.createElement(icon, { className: `w-6 h-6 ${isActive ? 'text-white' : colorClass}` })}
        <span className="text-[10px] font-bold uppercase tracking-wide">{label}</span>
      </button>
    );
  };

  // --- VISTA MODAL: SOLICITUD PENDIENTE (CON NOMBRE REAL) ---
  if (student.pickupAuthorization === PickupAuthStatus.PENDING) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/90 backdrop-blur-sm animate-in fade-in duration-300">
        <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden scale-100 transform transition-all">
           
           <div className="bg-blue-600 p-8 text-center relative overflow-hidden">
              <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
              
              <h2 className="text-white font-bold text-lg uppercase tracking-widest animate-pulse mb-4 relative z-10 flex items-center justify-center gap-2">
                 <Icons.Notification className="w-6 h-6 animate-bounce" /> SOLICITUD DE SALIDA
              </h2>
              
              <div className="w-24 h-24 rounded-full border-4 border-white shadow-xl mx-auto mb-3 relative z-10">
                 <img src={MOCK_USER.avatarUrl} alt="Parent" className="w-full h-full object-cover" />
              </div>
              
              {/* AQUÍ SE MUESTRA EL NOMBRE DEL PADRE QUE ENVIASTE DESDE APP.TSX */}
              <p className="text-white font-bold text-xl relative z-10">{requestingParentName}</p>
              <p className="text-blue-200 text-sm relative z-10">Está en portería esperándote</p>
           </div>
           
           <div className="p-8 space-y-6">
              <div className="text-center">
                 <h3 className="text-xl font-bold text-gray-900">¿Cuál es tu estado?</h3>
                 <p className="text-gray-500 text-sm mt-2">Responde para avisar a tu apoderado.</p>
              </div>
              
              <div className="grid gap-3">
                 <button 
                   onClick={() => onRespondPickup(true)} 
                   className="py-4 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold shadow-lg shadow-green-200 flex items-center justify-center gap-2 transition-transform active:scale-95"
                 >
                   <Icons.Check className="w-5 h-5" /> ESTOY LISTO
                 </button>
                 
                 <button 
                   onClick={() => onRespondPickup(false)} 
                   className="py-4 bg-white border-2 border-orange-100 text-orange-600 hover:bg-orange-50 rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
                 >
                   <Icons.Layers className="w-5 h-5" /> ESTOY EN CLASES
                 </button>
              </div>
           </div>
        </div>
      </div>
    );
  }

  // --- VISTA TICKET: PASE DE SALIDA ---
  if (student.pickupAuthorization === PickupAuthStatus.APPROVED) {
    return (
      <div className="min-h-screen bg-green-600 flex items-center justify-center p-4 relative">
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        
        <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden relative flex flex-col z-10">
           <div className="bg-green-500 p-6 text-center text-white relative overflow-hidden">
              <div className="flex items-center justify-center gap-2 font-bold text-xl">
                <Icons.Check className="w-6 h-6" /> PASE AUTORIZADO
              </div>
           </div>

           <div className="p-8 flex flex-col items-center bg-gray-50">
              <div className="w-full bg-white rounded-2xl shadow-sm border border-gray-200 relative overflow-hidden">
                 <div className="h-4 bg-green-500 w-full"></div>
                 <div className="p-6 text-center border-b border-dashed border-gray-200 relative">
                    <div className="absolute -left-3 bottom-[-12px] w-6 h-6 bg-gray-50 rounded-full"></div>
                    <div className="absolute -right-3 bottom-[-12px] w-6 h-6 bg-gray-50 rounded-full"></div>
                    
                    <h2 className="text-2xl font-black text-gray-900">{student.name}</h2>
                    <p className="text-sm text-gray-500 mt-1">{student.grade} "{student.section}"</p>
                    <p className="text-xs font-mono text-gray-400 mt-2">{student.dni}</p>
                 </div>
                 <div className="p-8 flex justify-center bg-white">
                    <div className="w-48 h-48 bg-gray-900 rounded-lg p-2 flex items-center justify-center">
                        <div className="w-full h-full border-2 border-white bg-white flex items-center justify-center">
                             <div className="grid grid-cols-6 gap-1 opacity-80 w-32 h-32">
                                {[...Array(36)].map((_, i) => (
                                   <div key={i} className={`w-full h-full rounded-sm ${Math.random() > 0.4 ? 'bg-black' : 'bg-transparent'}`}></div>
                                ))}
                             </div>
                        </div>
                    </div>
                 </div>
                 <div className="bg-gray-50 p-3 text-center border-t border-gray-100">
                    <p className="text-xl font-mono font-bold text-green-600">
                       {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </p>
                 </div>
              </div>

              <button onClick={onLogout} className="mt-8 text-gray-400 text-sm hover:text-gray-600 underline">
                Cerrar Sesión
              </button>
           </div>
        </div>
      </div>
    );
  }

  // --- DASHBOARD PRINCIPAL ---
  return (
    <div className="flex h-screen w-full bg-[#F3F5F7] overflow-hidden">
      
      <aside className="hidden lg:flex w-72 bg-white border-r border-gray-200 flex-col z-20 shadow-sm">
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
            <Icons.Shield className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 leading-tight">COAR Puno</h1>
            <p className="text-xs font-medium text-gray-500">Portal Estudiante</p>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
           <p className="px-4 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Menú Principal</p>
           <button 
             onClick={() => setActiveTab('home')}
             className={`w-full flex items-center px-4 py-3.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'home' ? 'bg-blue-50 text-blue-700 shadow-sm' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}
           >
             <Icons.Dashboard className={`w-5 h-5 mr-3 ${activeTab === 'home' ? 'text-blue-600' : 'text-gray-400'}`} /> Panel de Control
           </button>
           <button 
             onClick={() => setActiveTab('survey')}
             className={`w-full flex items-center px-4 py-3.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'survey' ? 'bg-purple-50 text-purple-700 shadow-sm' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}
           >
             <Icons.Survey className={`w-5 h-5 mr-3 ${activeTab === 'survey' ? 'text-purple-600' : 'text-gray-400'}`} /> Encuesta Semanal
           </button>
        </nav>

        <div className="p-4 border-t border-gray-100">
           <div className="bg-gray-50 rounded-xl p-3 flex items-center gap-3 mb-3">
              <img src={student.avatarUrl} alt="User" className="w-10 h-10 rounded-full border border-gray-200" />
              <div className="overflow-hidden">
                 <p className="text-sm font-bold text-gray-900 truncate">{student.name}</p>
                 <p className="text-xs text-gray-500">{student.dni}</p>
              </div>
           </div>
           <button onClick={onLogout} className="w-full flex items-center justify-center px-4 py-2 text-red-500 text-xs font-bold hover:bg-red-50 rounded-lg transition-colors">
              <Icons.Close className="w-4 h-4 mr-2" /> Cerrar Sesión
           </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 h-full relative">
        <header className="bg-white border-b border-gray-200 h-16 lg:h-20 px-4 lg:px-8 flex items-center justify-between z-10 flex-shrink-0">
           <div className="lg:hidden flex items-center gap-2">
              <div className="bg-blue-600 p-1.5 rounded-lg text-white"><Icons.Shield className="w-4 h-4" /></div>
              <span className="font-bold text-gray-900">COAR</span>
           </div>
           <div className="hidden lg:block">
              <h2 className="text-xl font-bold text-gray-900">{activeTab === 'home' ? 'Hola, ' + student.name.split(' ')[0] : 'Encuesta de Salida'}</h2>
              <p className="text-xs text-gray-500">{activeTab === 'home' ? 'Bienvenido a tu panel estudiantil.' : 'Completa tus datos.'}</p>
           </div>
           <div className="flex items-center gap-3">
              <span className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-xs font-bold border border-green-100">
                 <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span></span>
                 Sistema En Línea
              </span>
              
              {Notification.permission !== 'granted' && (
                 <button onClick={() => Notification.requestPermission()} className="text-[10px] text-blue-500 font-bold hover:underline">
                   Activar Notificaciones
                 </button>
              )}
           </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 lg:p-8 pb-24 lg:pb-8">
           <div className="max-w-5xl mx-auto">
              {activeTab === 'home' && (
                <div className="space-y-6">
                  <div className="w-full bg-gradient-to-r from-blue-700 to-indigo-800 rounded-3xl p-6 lg:p-10 text-white shadow-xl relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
                         <div>
                            <span className="inline-block px-3 py-1 bg-white/10 backdrop-blur-md rounded-lg text-[10px] font-bold uppercase tracking-widest mb-3 border border-white/10">Credencial Digital</span>
                            <h1 className="text-2xl lg:text-4xl font-bold mb-2">{student.name}</h1>
                            <div className="flex flex-wrap gap-2 text-sm text-blue-100">
                               <span className="font-medium">{student.grade} Grado</span><span>•</span>
                               <span className="font-medium">Sección "{student.section}"</span><span>•</span>
                               <span className="font-mono opacity-80">{student.dni}</span>
                            </div>
                         </div>
                         <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 min-w-[160px] text-center">
                            <p className="text-[10px] text-blue-200 uppercase font-bold mb-1">Código Familiar</p>
                            <p className="text-2xl font-mono font-bold tracking-widest">{student.linkCode}</p>
                         </div>
                      </div>
                  </div>

                  <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
                     <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Icons.Refresh className={`w-4 h-4 ${student.currentActivity ? 'text-green-500' : 'text-gray-400'}`} />
                        ¿Qué estás haciendo en este momento?
                     </h3>
                     <div className="flex gap-4">
                        {renderActivityButton('CLASSES', 'En Clases', Icons.Layers, 'text-blue-500', 'bg-blue-500')}
                        {renderActivityButton('FREE', 'Libre', Icons.Sun, 'text-green-500', 'bg-green-500')}
                        {renderActivityButton('EXIT', 'Salida', Icons.Bus, 'text-orange-500', 'bg-orange-500')}
                     </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                     <div className={`col-span-1 rounded-3xl p-6 border transition-all ${!student.weeklySurvey.completed ? 'bg-purple-600 text-white border-purple-500 shadow-lg shadow-purple-200' : 'bg-white border-gray-100 shadow-sm'}`}>
                        <div className="flex justify-between items-start mb-4">
                           <div className={`p-3 rounded-2xl ${!student.weeklySurvey.completed ? 'bg-white/20' : 'bg-green-50 text-green-600'}`}>
                              {!student.weeklySurvey.completed ? <Icons.Survey className="w-6 h-6" /> : <Icons.Check className="w-6 h-6" />}
                           </div>
                           {!student.weeklySurvey.completed && <span className="px-2 py-1 bg-white/20 rounded text-[10px] font-bold uppercase">Pendiente</span>}
                        </div>
                        <h3 className="text-lg font-bold mb-1">{!student.weeklySurvey.completed ? 'Encuesta Semanal' : 'Todo Listo'}</h3>
                        <p className={`text-sm ${!student.weeklySurvey.completed ? 'text-purple-100' : 'text-gray-500'}`}>
                           {!student.weeklySurvey.completed ? 'Debes completarla para autorizar tu salida.' : 'Has completado el registro de esta semana.'}
                        </p>
                        {!student.weeklySurvey.completed && (
                           <button onClick={() => setActiveTab('survey')} className="mt-4 w-full py-2 bg-white text-purple-600 rounded-xl font-bold text-sm shadow-sm hover:bg-gray-50 transition-colors">Completar Ahora</button>
                        )}
                     </div>

                     <div className="col-span-1 bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
                        <div className="flex justify-between items-center mb-4">
                           <h3 className="font-bold text-gray-900 flex items-center gap-2"><Icons.Menu className="w-5 h-5 text-orange-500" /> Menú</h3>
                           <span className="text-[10px] bg-orange-100 text-orange-700 px-2 py-1 rounded-full font-bold">Hoy</span>
                        </div>
                        <div className="bg-orange-50/50 rounded-2xl p-4">
                           <p className="text-xs text-gray-400 uppercase font-bold mb-1">Almuerzo</p>
                           <p className="font-bold text-gray-800 text-sm">Lentejas con Arroz y Pollo</p>
                           <p className="text-xs text-gray-500 mt-1">Refresco: Chicha Morada</p>
                        </div>
                     </div>

                     <div className="col-span-1 bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col justify-center">
                        <div className="flex items-center gap-4 mb-4">
                           <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-600"><Icons.MapPin className="w-5 h-5" /></div>
                           <div>
                              <p className="text-xs text-gray-400 font-bold uppercase">Ubicación Actual</p>
                              <p className="font-bold text-gray-900 text-sm">Campus COAR Puno</p>
                           </div>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2 mb-2 overflow-hidden"><div className="bg-green-500 h-full w-[85%]"></div></div>
                        <p className="text-xs text-right text-gray-400">Batería: 85%</p>
                     </div>
                  </div>
                </div>
              )}

              {activeTab === 'survey' && (
                 <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden min-h-[600px]">
                    <SurveyForm studentCode={student.linkCode} onSubmit={(data) => { onSubmitSurvey?.(data); setActiveTab('home'); }} onCancel={() => setActiveTab('home')} />
                 </div>
              )}
           </div>
        </div>

        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-3 pb-6 flex justify-around items-center z-30 shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
           <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${activeTab === 'home' ? 'text-blue-600 scale-105' : 'text-gray-400'}`}>
              <Icons.Dashboard className={`w-6 h-6 ${activeTab === 'home' && 'fill-current opacity-20'}`} /><span className="text-[10px] font-bold">Inicio</span>
           </button>
           <div className="w-px h-8 bg-gray-100"></div>
           <button onClick={() => setActiveTab('survey')} className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${activeTab === 'survey' ? 'text-purple-600 scale-105' : 'text-gray-400'}`}>
              <Icons.Survey className={`w-6 h-6 ${activeTab === 'survey' && 'fill-current opacity-20'}`} /><span className="text-[10px] font-bold">Encuesta</span>
           </button>
           <div className="w-px h-8 bg-gray-100"></div>
           <button onClick={onLogout} className="flex flex-col items-center gap-1 p-2 rounded-xl text-gray-400 hover:text-red-500 transition-colors">
              <Icons.Close className="w-6 h-6" /><span className="text-[10px] font-bold">Salir</span>
           </button>
        </div>
      </main>
    </div>
  );
};