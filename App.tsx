import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { AIPanel } from './components/AIPanel';
import { Icons } from './components/Icons';
import { StudentPortal } from './components/StudentPortal';
import { StudentDetailModal } from './components/StudentDetailModal';
import { INITIAL_STUDENTS, SCHEDULE_ITEMS, INITIAL_PARENTS } from './constants';
import { Student, StudentStatus, PickupAuthStatus, UserRole, SurveyData, Parent, StudentActivity } from './types';
import { db } from './firebaseConfig';
// IMPORTANTE: Agregamos onSnapshot para escuchar cambios en tiempo real
import { collection, addDoc, query, where, getDocs, updateDoc, doc, onSnapshot } from 'firebase/firestore';

const App: React.FC = () => {
  // --- DATABASE STATE (Simulated Persistence) ---
  const [parents, setParents] = useState<Parent[]>(INITIAL_PARENTS);
  const [students, setStudents] = useState<Student[]>(INITIAL_STUDENTS);

  // --- AUTH & USER STATE ---
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [currentUserParent, setCurrentUserParent] = useState<Parent | null>(null);
  const [currentStudentId, setCurrentStudentId] = useState<string>('');
  
  // --- UI STATE (PERSISTENCIA MODO OSCURO) ---
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('coar_theme');
    return savedTheme === 'dark';
  });

  const [loginTab, setLoginTab] = useState<'PARENT' | 'STUDENT'>('PARENT');
  const [isRegistering, setIsRegistering] = useState(false); 
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // --- FORMS STATE ---
  const [authInput, setAuthInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [registerSuccess, setRegisterSuccess] = useState(false);
  const [keepSession, setKeepSession] = useState(false);

  // Parent Register Form
  const [parentRegData, setParentRegData] = useState({
    name: '',
    dni: '',
    phone: '',
    address: '',
    familyCode: '' 
  });

  // Student Register Form
  const [studentRegData, setStudentRegData] = useState({
    name: '',
    dni: '',
    grade: '3ro',
    section: 'A',
    originCity: '',
    address: '',
    birthDate: '',
    bloodType: 'O+'
  });

  // Parent Functionality State
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [phoneCode, setPhoneCode] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // --- EFECTOS (Side Effects) ---

  // 1. RECUPERAR SESIÓN AL CARGAR
  useEffect(() => {
    const savedSession = localStorage.getItem('coar_session');
    if (savedSession) {
      try {
        const session = JSON.parse(savedSession);
        
        if (session.students && session.students.length > 0) {
          setStudents(session.students);
        }
        
        if (session.role === 'PARENT') {
           setCurrentUserParent(session.userData);
           setUserRole('PARENT');
        } else if (session.role === 'STUDENT') {
           setCurrentStudentId(session.userData.id);
           setUserRole('STUDENT');
        }
      } catch (e) {
        console.error("Error al restaurar sesión", e);
        localStorage.removeItem('coar_session');
      }
    }
  }, []);

  // 2. ESCUCHAR CAMBIOS EN TIEMPO REAL (NUEVO)
  // Si soy padre y tengo un hijo vinculado, escucho sus cambios en la BD
  useEffect(() => {
    let unsubscribe: () => void;

    if (userRole === 'PARENT' && currentUserParent && (currentUserParent as any).linkedStudentId) {
      const studentId = (currentUserParent as any).linkedStudentId;
      console.log("Escuchando cambios para el estudiante:", studentId);

      const studentRef = doc(db, "students", studentId);
      
      unsubscribe = onSnapshot(studentRef, (docSnapshot) => {
        if (docSnapshot.exists()) {
          const updatedStudent = { ...docSnapshot.data(), id: docSnapshot.id } as Student;
          
          // Actualizamos la lista local de estudiantes
          setStudents(prev => {
             // Reemplazamos el estudiante actualizado en la lista
             const otherStudents = prev.filter(s => s.id !== updatedStudent.id);
             // Lo ponemos primero
             return [updatedStudent, ...otherStudents];
          });
        }
      });
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [userRole, currentUserParent]);


  // 3. GUARDAR PREFERENCIA DE TEMA
  useEffect(() => {
    localStorage.setItem('coar_theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);


  // --- FUNCIONES AUXILIARES ---
  
  const saveSession = (role: UserRole, userData: any, currentStudents: Student[]) => {
    localStorage.setItem('coar_session', JSON.stringify({
      role,
      userData,
      students: currentStudents
    }));
  };

  const handleLogout = () => {
    localStorage.removeItem('coar_session');
    setUserRole(null);
    setCurrentUserParent(null);
    setCurrentStudentId('');
    setLoginTab('PARENT');
    setStudents(INITIAL_STUDENTS); 
  };

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  // --- HANDLER: ACTUALIZAR ACTIVIDAD ESTUDIANTE (CON GUARDADO EN BD) ---
  const handleUpdateActivity = async (activity: StudentActivity) => {
    // 1. Actualizar estado local (feedback inmediato)
    const updatedStudents = students.map(s => 
       s.id === currentStudentId ? { ...s, currentActivity: activity } : s
    );
    setStudents(updatedStudents);

    // 2. Persistir en localStorage si es necesario
    const myStudent = updatedStudents.find(s => s.id === currentStudentId);
    const savedSession = localStorage.getItem('coar_session');
    if (savedSession && userRole === 'STUDENT' && myStudent) {
       saveSession('STUDENT', myStudent, updatedStudents);
    }
    
    // 3. ACTUALIZAR FIREBASE (CRÍTICO)
    if (currentStudentId) {
      try {
        const studentRef = doc(db, "students", currentStudentId);
        await updateDoc(studentRef, { 
          currentActivity: activity,
          // Actualizamos también el texto para que sea consistente
          statusText: activity === 'CLASSES' ? 'En Clases' : activity === 'FREE' ? 'Libre' : activity === 'EXIT' ? 'Salida' : 'En línea'
        });
      } catch (error) {
        console.error("Error al guardar actividad en BD:", error);
      }
    }
  };

  // --- HANDLERS AUTH ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setIsLoggingIn(true);

    try {
      if (loginTab === 'PARENT') {
        // --- LOGIN PADRES ---
        const q = query(collection(db, "parents"), where("dni", "==", authInput));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const docSnap = querySnapshot.docs[0];
          const parentData = { ...docSnap.data(), id: docSnap.id } as Parent; 
          
          let updatedStudents = [...students];
          
          // Lógica de vinculación inicial
          if ((parentData as any).linkedStudentId) {
             const studentId = (parentData as any).linkedStudentId;
             // Obtenemos los datos más frescos posible
             const studentRef = doc(db, "students", studentId);
             // Usamos getDoc para obtener un solo documento por ID si es posible, pero query funciona bien
             const qStudent = query(collection(db, "students"), where("__name__", "==", studentId));
             const studentSnap = await getDocs(qStudent);
             
             if (!studentSnap.empty) {
                const sDoc = studentSnap.docs[0];
                const linkedStudent = { ...sDoc.data(), id: sDoc.id } as Student;
                updatedStudents = [linkedStudent, ...students.filter(s => s.id !== linkedStudent.id)];
                setStudents(updatedStudents);
             }
          }
          
          setCurrentUserParent(parentData);
          setUserRole('PARENT');

          if (keepSession) {
            saveSession('PARENT', parentData, updatedStudents);
          }

        } else {
          // Intento por Código de Familia (Legacy)
          const qCode = query(collection(db, "parents"), where("familyCode", "==", authInput));
          const codeSnapshot = await getDocs(qCode);
          
          if (!codeSnapshot.empty) {
             const docSnap = codeSnapshot.docs[0];
             const parentData = { ...docSnap.data(), id: docSnap.id } as Parent;
             setCurrentUserParent(parentData);
             setUserRole('PARENT');
             
             if (keepSession) saveSession('PARENT', parentData, students);
          } else {
             setAuthError('Usuario no encontrado. Verifique su DNI.');
          }
        }

      } else {
        // --- LOGIN ESTUDIANTES ---
        const q = query(collection(db, "students"), where("dni", "==", authInput));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const docSnap = querySnapshot.docs[0];
          const studentData = { ...docSnap.data(), id: docSnap.id } as Student;
          
          const newStudentList = [studentData];
          setStudents(newStudentList); 
          setCurrentStudentId(docSnap.id);
          setUserRole('STUDENT');

          if (keepSession) {
             saveSession('STUDENT', studentData, newStudentList);
          }
        } else {
          setAuthError('Estudiante no encontrado. Regístrate primero.');
        }
      }
    } catch (error) {
      console.error("Error Login:", error);
      setAuthError('Error de conexión. Intente nuevamente.');
    } finally {
      setIsLoggingIn(false);
    }
  };

 const handleRegisterParent = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setIsLoggingIn(true);

    if (parentRegData.dni.length !== 8) {
      setAuthError('El DNI debe tener 8 dígitos.');
      setIsLoggingIn(false);
      return;
    }

    try {
      const q = query(collection(db, "parents"), where("dni", "==", parentRegData.dni));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        setAuthError('Este DNI ya está registrado.');
        setIsLoggingIn(false);
        return;
      }

      let linkedStudentData: Student | null = null;
      if (parentRegData.familyCode) {
         const cleanCode = parentRegData.familyCode.trim().toUpperCase();
         const qStudent = query(collection(db, "students"), where("linkCode", "==", cleanCode));
         const studentSnapshot = await getDocs(qStudent);
         
         if (!studentSnapshot.empty) {
            const sDoc = studentSnapshot.docs[0];
            linkedStudentData = { ...sDoc.data(), id: sDoc.id } as Student;
         } else {
            setAuthError('El código familiar no existe. Verifíquelo.');
            setIsLoggingIn(false);
            return;
         }
      }

      const newCode = `FAM-${Math.floor(1000 + Math.random() * 9000)}`;
      const newParent = {
        name: parentRegData.name,
        dni: parentRegData.dni,
        phone: parentRegData.phone,
        address: parentRegData.address,
        familyCode: newCode,
        avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(parentRegData.name)}&background=random`,
        role: 'Apoderado',
        linkedStudentId: linkedStudentData ? linkedStudentData.id : null,
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, "parents"), newParent);

      let updatedStudents = [...students];
      if (linkedStudentData) {
         updatedStudents = [linkedStudentData, ...students.filter(s => s.id !== linkedStudentData!.id)];
         setStudents(updatedStudents);
      }

      setCurrentUserParent(newParent as any);
      setUserRole('PARENT');
      
      saveSession('PARENT', newParent, updatedStudents);

      setRegisterSuccess(true);
      
      setTimeout(() => {
         setIsLoggingIn(false);
         setRegisterSuccess(false);
         setIsRegistering(false);
         if (linkedStudentData) {
            alert(`¡Cuenta creada y vinculada con ${linkedStudentData.name}!`);
         }
      }, 1500);

    } catch (error) {
      console.error("Error Registro:", error);
      setAuthError("No se pudo guardar en la base de datos.");
      setIsLoggingIn(false);
    }
  };
  
const handleRegisterStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setIsLoggingIn(true);

    if (studentRegData.dni.length !== 8) {
      setAuthError('El DNI debe tener 8 dígitos.');
      setIsLoggingIn(false);
      return;
    }

    try {
      const q = query(collection(db, "students"), where("dni", "==", studentRegData.dni));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        setAuthError('Este estudiante ya existe.');
        setIsLoggingIn(false);
        return;
      }

      const linkCodeSuffix = Math.floor(1000 + Math.random() * 9000);
      const namePrefix = studentRegData.name.substring(0, 3).toUpperCase().replace(/\s/g, 'X');
      const generatedLinkCode = `COAR-${namePrefix}${linkCodeSuffix}`;

      const newStudent = {
        name: studentRegData.name,
        dni: studentRegData.dni,
        grade: studentRegData.grade,
        section: studentRegData.section,
        originCity: studentRegData.originCity,
        address: studentRegData.address || '',
        birthDate: studentRegData.birthDate || '',
        bloodType: studentRegData.bloodType || 'O+',
        avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(studentRegData.name)}&background=random&size=128`,
        status: 'NORMAL',
        statusText: 'En línea',
        deviceId: 'Web-App',
        batteryLevel: 100,
        pickupAuthorization: 'NONE',
        linkCode: generatedLinkCode,
        weeklySurvey: { completed: false, destination: '', transportMethod: 'OTHER', healthStatus: 'GOOD', comments: '' },
        currentActivity: null,
        createdAt: new Date().toISOString()
      };

      const docRef = await addDoc(collection(db, "students"), newStudent);

      const studentWithId = { ...newStudent, id: docRef.id };
      const newStudentList = [studentWithId as any];
      
      setStudents(newStudentList);
      setCurrentStudentId(docRef.id);
      setUserRole('STUDENT');
      
      saveSession('STUDENT', studentWithId, newStudentList);

      setRegisterSuccess(true);
      setTimeout(() => {
        setIsLoggingIn(false);
        setIsRegistering(false);
        setRegisterSuccess(false);
      }, 1000);

    } catch (error) {
      console.error("Error Registro Estudiante:", error);
      setAuthError("Error al guardar datos.");
      setIsLoggingIn(false);
    }
  };

  // --- LOGIN VIEW ---
  if (!userRole) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center p-4 transition-colors duration-300 ${isDarkMode ? 'bg-gray-900' : 'bg-[#F0F4F8]'}`}>
        
        <button onClick={toggleTheme} className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-gray-500 hover:text-blue-500 transition-colors">
          {isDarkMode ? <Icons.Sun /> : <Icons.Moon />}
        </button>

        <div className={`rounded-3xl shadow-2xl max-w-[480px] w-full overflow-hidden relative ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
          
          <div className="bg-blue-900 p-8 text-center relative overflow-hidden">
             <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
             <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg relative z-10">
                <Icons.Shield className="w-8 h-8 text-blue-900" />
             </div>
             <h1 className="text-xl font-bold text-white relative z-10">COAR Puno</h1>
             <p className="text-blue-200 text-xs relative z-10">Acceso Seguro</p>
          </div>

          {registerSuccess ? (
             <div className="p-12 text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Icons.Check className="w-10 h-10 text-green-600" />
                </div>
                <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>¡Bienvenido!</h2>
                <p className="text-gray-500 mt-2">Cuenta creada correctamente.</p>
             </div>
          ) : !isRegistering ? (
            <>
              <div className={`flex border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                <button 
                  onClick={() => { setLoginTab('PARENT'); setAuthError(''); setAuthInput(''); }}
                  className={`flex-1 py-4 text-sm font-bold transition-colors ${loginTab === 'PARENT' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-400'}`}
                >
                  Familiares
                </button>
                <button 
                  onClick={() => { setLoginTab('STUDENT'); setAuthError(''); setAuthInput(''); }}
                  className={`flex-1 py-4 text-sm font-bold transition-colors ${loginTab === 'STUDENT' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-400'}`}
                >
                  Estudiantes
                </button>
              </div>

              <div className="p-8">
                 <form onSubmit={handleLogin}>
                   <div className="space-y-2">
                     <label className={`text-xs font-bold ml-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-700'}`}>
                       {loginTab === 'PARENT' ? 'CÓDIGO DE FAMILIA O DNI' : 'DNI ESTUDIANTE'}
                     </label>
                     <input 
                       type="text" 
                       value={authInput}
                       onChange={(e) => setAuthInput(e.target.value)}
                       placeholder={loginTab === 'PARENT' ? 'Ej: DNI o FAM-1234' : 'Ej: 70012345'}
                       className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 font-bold text-center text-lg"
                     />
                   </div>

                   {/* Checkbox "Mantener sesión" */}
                   <div className="mt-4 flex items-center justify-center">
                      <label className="flex items-center cursor-pointer select-none">
                        <input 
                          type="checkbox"
                          checked={keepSession}
                          onChange={(e) => setKeepSession(e.target.checked)}
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className={`ml-2 text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                          Mantener sesión iniciada
                        </span>
                      </label>
                   </div>
                   
                   {authError && <p className="text-xs text-red-500 font-medium mt-2 text-center">{authError}</p>}
                   
                   <button 
                     type="submit" 
                     disabled={isLoggingIn || !authInput}
                     className="w-full mt-4 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-900/20 transition-all disabled:opacity-50"
                   >
                     {isLoggingIn ? <Icons.Refresh className="w-5 h-5 animate-spin mx-auto" /> : 'Ingresar'}
                   </button>
                 </form>

                 <div className={`mt-6 pt-4 border-t text-center ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                    <p className="text-xs text-gray-500 mb-2">¿Primera vez aquí?</p>
                    <button 
                      onClick={() => setIsRegistering(true)}
                      className={`w-full py-2 rounded-lg text-sm font-bold transition-colors ${isDarkMode ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}
                    >
                      Crear Cuenta {loginTab === 'PARENT' ? 'de Familia' : 'de Estudiante'}
                    </button>
                 </div>
              </div>
            </>
          ) : (
            <div className="p-6 h-[500px] overflow-y-auto custom-scrollbar">
               <div className={`flex items-center gap-2 mb-4 sticky top-0 z-10 py-2 border-b ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                 <button onClick={() => setIsRegistering(false)} className={`p-2 rounded-full ${isDarkMode ? 'hover:bg-gray-700 text-white' : 'hover:bg-gray-100 text-gray-500'}`}>
                   <Icons.Close className="w-4 h-4" />
                 </button>
                 <h2 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                   Registro {loginTab === 'PARENT' ? 'Familiar' : 'Estudiante'}
                 </h2>
               </div>

               {loginTab === 'PARENT' ? (
                 /* Parent Reg Form */
                 <form onSubmit={handleRegisterParent} className="space-y-4">
                   {/* CAMPO: CÓDIGO FAMILIAR */}
                   <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
                      <label className="text-[10px] font-bold text-blue-800 ml-1 flex items-center gap-1">
                        <Icons.Shield className="w-3 h-3"/> CÓDIGO FAMILIAR (DEL ESTUDIANTE)
                      </label>
                      <input 
                        type="text" 
                        value={parentRegData.familyCode}
                        onChange={(e) => setParentRegData({...parentRegData, familyCode: e.target.value})}
                        className="w-full p-2 mt-2 bg-white border border-blue-200 rounded-lg text-sm text-gray-900 font-bold outline-none focus:border-blue-500 uppercase tracking-wider text-center"
                        placeholder="EJ: COAR-JUAN1234"
                      />
                      <p className="text-[10px] text-blue-600 mt-2 ml-1 leading-tight">
                        * Pide este código a tu hijo (está en su credencial digital) para vincularlo automáticamente.
                      </p>
                   </div>

                   <div>
                      <label className="text-[10px] font-bold text-gray-500 ml-1">NOMBRE COMPLETO</label>
                      <input 
                        type="text" 
                        value={parentRegData.name}
                        onChange={(e) => setParentRegData({...parentRegData, name: e.target.value})}
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 font-medium outline-none focus:border-blue-500"
                        required
                      />
                   </div>
                   <div>
                      <label className="text-[10px] font-bold text-gray-500 ml-1">DNI (SERÁ TU ACCESO)</label>
                      <input 
                        type="text" 
                        value={parentRegData.dni}
                        onChange={(e) => setParentRegData({...parentRegData, dni: e.target.value})}
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 font-medium outline-none focus:border-blue-500"
                        maxLength={8}
                        required
                      />
                   </div>
                   <div>
                      <label className="text-[10px] font-bold text-gray-500 ml-1">CELULAR</label>
                      <input 
                        type="text" 
                        value={parentRegData.phone}
                        onChange={(e) => setParentRegData({...parentRegData, phone: e.target.value})}
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 font-medium outline-none focus:border-blue-500"
                        required
                      />
                   </div>
                   <div>
                      <label className="text-[10px] font-bold text-gray-500 ml-1">DIRECCIÓN</label>
                      <input 
                        type="text" 
                        value={parentRegData.address}
                        onChange={(e) => setParentRegData({...parentRegData, address: e.target.value})}
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 font-medium outline-none focus:border-blue-500"
                        required
                      />
                   </div>
                   
                   {authError && <p className="text-xs text-red-500 font-medium text-center">{authError}</p>}
                   <button type="submit" className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold mt-4">
                     {isLoggingIn ? 'Guardando...' : 'Crear Cuenta Familiar'}
                   </button>
                 </form>
               ) : (
                 <form onSubmit={handleRegisterStudent} className="space-y-4">
                   <div className="grid grid-cols-2 gap-3">
                     <div>
                        <label className="text-[10px] font-bold text-gray-500 ml-1">DNI</label>
                        <input 
                          type="text" 
                          value={studentRegData.dni}
                          onChange={(e) => setStudentRegData({...studentRegData, dni: e.target.value})}
                          className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 font-medium outline-none"
                          maxLength={8} required
                        />
                     </div>
                     <div>
                        <label className="text-[10px] font-bold text-gray-500 ml-1">NOMBRE</label>
                        <input 
                          type="text" 
                          value={studentRegData.name}
                          onChange={(e) => setStudentRegData({...studentRegData, name: e.target.value})}
                          className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 font-medium outline-none"
                          required
                        />
                     </div>
                   </div>
                   <div className="grid grid-cols-2 gap-3">
                     <div>
                       <label className="text-[10px] font-bold text-gray-500 ml-1">GRADO</label>
                       <select 
                         value={studentRegData.grade}
                         onChange={(e) => setStudentRegData({...studentRegData, grade: e.target.value})}
                         className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 outline-none"
                       >
                         <option value="3ro">3ro</option>
                         <option value="4to">4to</option>
                         <option value="5to">5to</option>
                       </select>
                     </div>
                     <div>
                       <label className="text-[10px] font-bold text-gray-500 ml-1">SECCIÓN</label>
                       <select 
                         value={studentRegData.section}
                         onChange={(e) => setStudentRegData({...studentRegData, section: e.target.value})}
                         className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 outline-none"
                       >
                         <option value="A">A</option>
                         <option value="B">B</option>
                         <option value="C">C</option>
                         <option value="D">D</option>
                       </select>
                     </div>
                   </div>
                   <div>
                     <label className="text-[10px] font-bold text-gray-500 ml-1">CIUDAD DE ORIGEN</label>
                     <input 
                       type="text" 
                       value={studentRegData.originCity}
                       onChange={(e) => setStudentRegData({...studentRegData, originCity: e.target.value})}
                       className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 font-medium outline-none"
                       required
                     />
                   </div>
                   
                   {authError && <p className="text-xs text-red-500 font-medium text-center">{authError}</p>}
                   <button type="submit" className="w-full py-3 bg-gray-900 hover:bg-black text-white rounded-xl font-bold mt-4">
                     {isLoggingIn ? 'Guardando...' : 'Registrar Estudiante'}
                   </button>
                 </form>
               )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // --- STUDENT PORTAL VIEW ---
  if (userRole === 'STUDENT') {
    const myData = students.find(s => s.id === currentStudentId);
    if (!myData) { setUserRole(null); return null; }

    const handleStudentResponse = (approved: boolean) => {
       setStudents(prev => prev.map(s => s.id === currentStudentId ? { ...s, pickupAuthorization: approved ? PickupAuthStatus.APPROVED : PickupAuthStatus.REJECTED } : s));
    };

    const handleSurveySubmit = (data: SurveyData) => {
      setStudents(prev => prev.map(s => s.id === currentStudentId ? { ...s, weeklySurvey: data } : s));
      alert("Encuesta enviada.");
    };

    return (
      <StudentPortal 
        student={myData} 
        onLogout={handleLogout}
        onRespondPickup={handleStudentResponse}
        onSubmitSurvey={handleSurveySubmit}
        onUpdateActivity={handleUpdateActivity}
      />
    );
  }

  // --- PARENT DASHBOARD VIEW ---

  // Connect Phone Handler
  const handleConnectPhone = (e: React.FormEvent) => {
    e.preventDefault();
    const matchedStudent = students.find(s => s.linkCode === phoneCode.trim().toUpperCase());
    if (matchedStudent) {
      alert(`¡Vinculado! Has conectado con: ${matchedStudent.name}.`);
      setPhoneCode('');
      setShowConnectModal(false);
    } else {
      alert("Código inválido.");
    }
  };

  const handleRequestPickup = (studentId: string) => {
    setStudents(prev => prev.map(s => s.id === studentId ? { ...s, pickupAuthorization: PickupAuthStatus.PENDING } : s));
    alert("Solicitud enviada.");
  };

  return (
    <div className={`flex h-screen overflow-hidden transition-colors duration-300 ${isDarkMode ? 'bg-gray-900' : 'bg-[#F3F5F7]'}`}>
      
      <Sidebar 
        isOpen={isSidebarOpen} 
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isDarkMode={isDarkMode}
      />

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Header */}
        <header className={`border-b px-6 py-3 flex items-center justify-between shadow-sm z-20 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
          <div className="flex items-center flex-1">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className={`mr-4 lg:hidden ${isDarkMode ? 'text-white' : 'text-gray-500'}`}>
              <Icons.Menu size={24} />
            </button>
            <h2 className={`font-bold text-lg hidden md:block ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              {activeTab === 'dashboard' ? 'Panel Principal' : 'Ajustes de Cuenta'}
            </h2>
          </div>

          <div className="flex items-center space-x-4">
             <button onClick={handleLogout} className="flex items-center space-x-3 pl-4 border-l border-gray-200 hover:opacity-70 transition-opacity">
               <img src={currentUserParent?.avatarUrl || ''} alt="Profile" className="w-9 h-9 rounded-full object-cover border-2 border-white shadow-sm" />
               <div className="hidden sm:block text-left">
                 <p className={`text-sm font-bold leading-none ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{currentUserParent?.name}</p>
                 <p className="text-xs text-gray-500 mt-1">Apoderado</p>
               </div>
             </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-4 lg:p-6">
          {activeTab === 'settings' ? (
             <div className="max-w-2xl mx-auto space-y-6">
                <div className={`p-6 rounded-2xl border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                   <h3 className={`font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Apariencia</h3>
                   <div className="flex items-center justify-between">
                      <span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Modo Oscuro</span>
                      <button 
                        onClick={toggleTheme}
                        className={`w-14 h-8 rounded-full p-1 transition-colors flex items-center ${isDarkMode ? 'bg-blue-600 justify-end' : 'bg-gray-200 justify-start'}`}
                      >
                         <div className="w-6 h-6 bg-white rounded-full shadow-sm"></div>
                      </button>
                   </div>
                </div>

                <div className={`p-6 rounded-2xl border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                   <h3 className={`font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Mi Perfil (Base de Datos)</h3>
                   <div className="space-y-3 text-sm">
                      <div className="flex justify-between border-b border-gray-100 py-2">
                         <span className="text-gray-500">Nombre</span>
                         <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>{currentUserParent?.name}</span>
                      </div>
                      <div className="flex justify-between border-b border-gray-100 py-2">
                         <span className="text-gray-500">DNI</span>
                         <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>{currentUserParent?.dni}</span>
                      </div>
                      <div className="flex justify-between border-b border-gray-100 py-2">
                         <span className="text-gray-500">Teléfono</span>
                         <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>{currentUserParent?.phone}</span>
                      </div>
                      <div className="flex justify-between py-2">
                         <span className="text-gray-500">Código de Familia</span>
                         <span className="font-mono bg-blue-100 text-blue-800 px-2 rounded">{currentUserParent?.familyCode}</span>
                      </div>
                   </div>
                </div>

                <button 
                  onClick={handleLogout}
                  className="w-full py-3 text-red-500 bg-red-50 hover:bg-red-100 rounded-xl font-bold transition-colors"
                >
                  Cerrar Sesión
                </button>
             </div>
          ) : (
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Column: Students & Schedule */}
              <div className="lg:col-span-7 space-y-6">
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className={`text-2xl font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Mis Hijos</h2>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Gestión de salida escolar</p>
                  </div>
                </div>

                {/* Student Cards (CON ESTADO DE ACTIVIDAD ACTUALIZADO) */}
                <div className="space-y-4">
                  {students.map((student) => (
                    <div key={student.id} className={`p-5 rounded-2xl border shadow-sm transition-all ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-4 cursor-pointer" onClick={() => setSelectedStudent(student)}>
                          <img src={student.avatarUrl} alt={student.name} className="w-14 h-14 rounded-full object-cover ring-4 ring-gray-100" />
                          <div>
                            <h3 className={`text-base font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{student.name}</h3>
                            
                            {/* ESTADO DE ACTIVIDAD DEL ESTUDIANTE (VISUALIZACIÓN) */}
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                               <p className="text-xs text-gray-500">{student.grade} "{student.section}"</p>
                               {student.currentActivity && (
                                 <span className={`text-[9px] font-bold px-2 py-0.5 rounded flex items-center gap-1 uppercase tracking-wide border ${
                                   student.currentActivity === 'CLASSES' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                   student.currentActivity === 'FREE' ? 'bg-green-50 text-green-700 border-green-100' :
                                   'bg-orange-50 text-orange-700 border-orange-100'
                                 }`}>
                                   {student.currentActivity === 'CLASSES' && <Icons.Layers className="w-3 h-3"/>}
                                   {student.currentActivity === 'FREE' && <Icons.Sun className="w-3 h-3"/>}
                                   {student.currentActivity === 'EXIT' && <Icons.Bus className="w-3 h-3"/>}
                                   
                                   {student.currentActivity === 'CLASSES' ? 'EN CLASES' :
                                    student.currentActivity === 'FREE' ? 'TIEMPO LIBRE' : 'SALIDA'}
                                 </span>
                               )}
                            </div>

                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border flex items-center ${
                          student.status === StudentStatus.READY ? 'bg-green-100 text-green-700 border-green-200' :
                          student.status === StudentStatus.ON_WAY ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                          'bg-blue-50 text-blue-700 border-blue-100'
                        }`}>
                          {student.statusText}
                        </span>
                      </div>

                      <div className={`pt-4 border-t flex items-center justify-between ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                          <div className={`text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                             {student.pickupAuthorization === PickupAuthStatus.PENDING 
                               ? "Esperando confirmación..." 
                               : student.pickupAuthorization === PickupAuthStatus.APPROVED 
                                 ? "Salida confirmada." 
                                 : "Listo para solicitar."}
                          </div>
                          
                          {student.pickupAuthorization === PickupAuthStatus.NONE && (
                            <button 
                              onClick={() => handleRequestPickup(student.id)}
                              className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-all"
                            >
                              <Icons.Send className="w-3 h-3 mr-2" />
                              Solicitar Salida
                            </button>
                          )}
                          
                          {student.pickupAuthorization === PickupAuthStatus.APPROVED && (
                             <span className="text-green-500 font-bold text-xs flex items-center">
                               <Icons.Check className="w-4 h-4 mr-1" /> Autorizado
                             </span>
                          )}
                      </div>
                    </div>
                  ))}
                </div>

                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                   {SCHEDULE_ITEMS.map((item, idx) => (
                     <div key={idx} className={`p-4 rounded-2xl border shadow-sm flex items-center justify-between ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                        <div>
                          <h3 className={`text-base font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{item.time}</h3>
                          <p className="text-xs font-medium text-gray-500">{item.title}</p>
                        </div>
                     </div>
                   ))}
                </div>

                <div className={`rounded-2xl p-4 border flex items-center justify-between shadow-sm ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                   <div className="flex items-center gap-3">
                      <div className="bg-blue-50 p-2 rounded-lg text-blue-600">
                        <Icons.Settings className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Vincular nuevo celular</h4>
                        <p className="text-xs text-gray-500">Recibe alertas en tiempo real.</p>
                      </div>
                   </div>
                   <button 
                     onClick={() => setShowConnectModal(true)}
                     className="text-xs text-blue-600 font-bold px-4 py-2 hover:bg-blue-50 rounded-lg transition-all"
                   >
                     Conectar
                   </button>
                </div>
              </div>

              {/* Right Column: AI Panel */}
              <div className="lg:col-span-5 flex flex-col h-full">
                <div className="mb-4">
                  <h2 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Centro de Ayuda</h2>
                  <p className="text-xs text-gray-500">Asistente COAR IA</p>
                </div>
                <AIPanel />
              </div>

            </div>
          )}
        </div>
      </main>

      {/* Modals */}
      {selectedStudent && (
        <StudentDetailModal 
          student={selectedStudent} 
          onClose={() => setSelectedStudent(null)} 
        />
      )}

      {showConnectModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`rounded-3xl p-8 max-w-md w-full shadow-2xl border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
             <div className="flex justify-between items-start mb-6">
               <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Vincular Celular</h3>
               <button onClick={() => setShowConnectModal(false)} className="text-gray-400">
                 <Icons.Close size={20} />
               </button>
             </div>
             
             <form onSubmit={handleConnectPhone}>
               <div className="mb-6">
                 <input 
                   type="text" 
                   value={phoneCode}
                   onChange={(e) => setPhoneCode(e.target.value)}
                   className="w-full pl-4 pr-4 py-4 bg-gray-50 border-2 border-gray-200 rounded-xl text-center tracking-[0.5em] font-mono text-xl uppercase outline-none text-gray-900 focus:border-blue-500"
                   placeholder="COAR-XXX1234"
                   required
                 />
               </div>
               <button type="submit" className="w-full py-3.5 bg-blue-600 text-white rounded-xl font-bold">
                 Vincular Dispositivo
               </button>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;