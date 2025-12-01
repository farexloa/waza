import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { AIPanel } from './components/AIPanel';
import { Icons } from './components/Icons';
import { StudentPortal } from './components/StudentPortal';
import { StudentDetailModal } from './components/StudentDetailModal';
import { AdminMenuEditor } from './components/AdminMenuEditor'; // Importamos el editor
import { INITIAL_STUDENTS, SCHEDULE_ITEMS, INITIAL_PARENTS } from './constants';
import { Student, StudentStatus, PickupAuthStatus, UserRole, SurveyData, Parent, StudentActivity } from './types';
import { db } from './firebaseConfig';
import { collection, addDoc, query, where, getDocs, updateDoc, doc, onSnapshot } from 'firebase/firestore';

const App: React.FC = () => {
  // --- DATABASE STATE ---
  const [parents, setParents] = useState<Parent[]>(INITIAL_PARENTS);
  const [students, setStudents] = useState<Student[]>([]); 
  const [isLoading, setIsLoading] = useState(true);

  // --- AUTH & USER STATE ---
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [currentUserParent, setCurrentUserParent] = useState<Parent | null>(null);
  const [currentStudentId, setCurrentStudentId] = useState<string>('');
  
  // --- ADMIN STATE (NUEVO) ---
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminUser, setAdminUser] = useState('');
  const [adminPass, setAdminPass] = useState('');
  
  // --- PAGINATION STATE ---
  const [visibleCount, setVisibleCount] = useState(8);

  // --- UI STATE ---
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

  // --- EFECTOS ---
  useEffect(() => {
    const initializeApp = async () => {
      setIsLoading(true);
      try {
        const qStudents = query(collection(db, "students")); 
        const studentsSnap = await getDocs(qStudents);
        const fetchedStudents: Student[] = [];
        studentsSnap.forEach((doc) => {
          fetchedStudents.push({ ...doc.data(), id: doc.id } as Student);
        });
        setStudents(fetchedStudents);

        const qParents = query(collection(db, "parents"));
        const parentsSnap = await getDocs(qParents);
        const fetchedParents: Parent[] = [];
        parentsSnap.forEach((doc) => {
          fetchedParents.push({ ...doc.data(), id: doc.id } as Parent);
        });
        if (fetchedParents.length > 0) setParents(fetchedParents);

      } catch (error) {
        console.error("Error cargando datos:", error);
      }

      const savedSession = localStorage.getItem('coar_session');
      if (savedSession) {
        try {
          const session = JSON.parse(savedSession);
          if (session.role === 'PARENT') {
             setCurrentUserParent(session.userData);
             setUserRole('PARENT');
          } else if (session.role === 'STUDENT') {
             setCurrentStudentId(session.userData.id);
             setUserRole('STUDENT');
          } else if (session.role === 'ADMIN') { // Recuperar sesión admin
             setUserRole('ADMIN');
          }
        } catch (e) {
          console.error("Sesión inválida", e);
          localStorage.removeItem('coar_session');
        }
      }
      setIsLoading(false);
    };
    initializeApp();
  }, []);

  useEffect(() => {
    if (isLoading) return;
    let unsubscribe: () => void;

    if (userRole === 'PARENT' && currentUserParent && (currentUserParent as any).linkedStudentId) {
      const studentId = (currentUserParent as any).linkedStudentId;
      const studentRef = doc(db, "students", studentId);
      unsubscribe = onSnapshot(studentRef, (docSnapshot) => {
        if (docSnapshot.exists()) {
          const updatedStudent = { ...docSnapshot.data(), id: docSnapshot.id } as Student;
          setStudents(prev => prev.map(s => s.id === updatedStudent.id ? updatedStudent : s));
        }
      });
    }

    if (userRole === 'STUDENT' && currentStudentId) {
      const myStudentRef = doc(db, "students", currentStudentId);
      unsubscribe = onSnapshot(myStudentRef, (docSnapshot) => {
        if (docSnapshot.exists()) {
          const updatedMyData = { ...docSnapshot.data(), id: docSnapshot.id } as Student;
          setStudents(prev => {
             const exists = prev.find(s => s.id === updatedMyData.id);
             if (exists) {
               return prev.map(s => s.id === updatedMyData.id ? updatedMyData : s);
             } else {
               return [...prev, updatedMyData];
             }
          });
        }
      });
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [userRole, currentUserParent, currentStudentId, isLoading]);

  useEffect(() => {
    localStorage.setItem('coar_theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const saveSession = (role: UserRole, userData: any) => {
    localStorage.setItem('coar_session', JSON.stringify({
      role,
      userData
    }));
  };

  const handleLogout = () => {
    localStorage.removeItem('coar_session');
    setUserRole(null);
    setCurrentUserParent(null);
    setCurrentStudentId('');
    setLoginTab('PARENT');
  };

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  // --- HANDLE ADMIN LOGIN ---
  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Validar usuario y clave 'admin'
    if (adminUser === 'admin' && adminPass === 'admin') {
      setUserRole('ADMIN');
      setShowAdminLogin(false);
      setAdminUser('');
      setAdminPass('');
      saveSession('ADMIN', { name: 'Administrador' }); // Guardar sesión simple
    } else {
      alert("Credenciales incorrectas.");
    }
  };

  const getSortedStudents = () => {
    if (!currentUserParent || !(currentUserParent as any).linkedStudentId) return students; 
    const linkedId = (currentUserParent as any).linkedStudentId;
    const linkedStudent = students.find(s => s.id === linkedId);
    const otherStudents = students.filter(s => s.id !== linkedId);
    return linkedStudent ? [linkedStudent, ...otherStudents] : students;
  };

  const sortedStudents = getSortedStudents();
  const visibleStudents = sortedStudents.slice(0, visibleCount);
  const hasMore = visibleCount < sortedStudents.length;

  const handleShowMore = () => setVisibleCount(prev => prev + 10);
  const handleShowLess = () => setVisibleCount(8);

  const handleUpdateActivity = async (activity: StudentActivity) => {
    const updatedStudents = students.map(s => s.id === currentStudentId ? { ...s, currentActivity: activity } : s);
    setStudents(updatedStudents);
    if (currentStudentId) {
      try {
        const studentRef = doc(db, "students", currentStudentId);
        const statusText = activity === 'CLASSES' ? 'EN CLASES' : activity === 'FREE' ? 'TIEMPO LIBRE' : activity === 'EXIT' ? 'SALIDA' : 'EN LÍNEA';
        await updateDoc(studentRef, { currentActivity: activity, statusText: statusText });
      } catch (error) { console.error("Error al guardar actividad en BD:", error); }
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setIsLoggingIn(true);
    try {
      if (loginTab === 'PARENT') {
        const q = query(collection(db, "parents"), where("dni", "==", authInput));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const docSnap = querySnapshot.docs[0];
          const parentData = { ...docSnap.data(), id: docSnap.id } as Parent; 
          setCurrentUserParent(parentData);
          setUserRole('PARENT');
          if (keepSession) saveSession('PARENT', parentData);
        } else {
          const qCode = query(collection(db, "parents"), where("familyCode", "==", authInput));
          const codeSnapshot = await getDocs(qCode);
          if (!codeSnapshot.empty) {
             const docSnap = codeSnapshot.docs[0];
             const parentData = { ...docSnap.data(), id: docSnap.id } as Parent;
             setCurrentUserParent(parentData);
             setUserRole('PARENT');
             if (keepSession) saveSession('PARENT', parentData);
          } else { setAuthError('Usuario no encontrado. Verifique su DNI.'); }
        }
      } else {
        const q = query(collection(db, "students"), where("dni", "==", authInput));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const docSnap = querySnapshot.docs[0];
          const studentData = { ...docSnap.data(), id: docSnap.id } as Student;
          setCurrentStudentId(docSnap.id);
          setUserRole('STUDENT');
          if (keepSession) saveSession('STUDENT', studentData);
        } else { setAuthError('Estudiante no encontrado. Regístrate primero.'); }
      }
    } catch (error) { console.error("Error Login:", error); setAuthError('Error de conexión.'); } finally { setIsLoggingIn(false); }
  };

 const handleRegisterParent = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setIsLoggingIn(true);
    if (parentRegData.dni.length !== 8) { setAuthError('El DNI debe tener 8 dígitos.'); setIsLoggingIn(false); return; }
    try {
      const q = query(collection(db, "parents"), where("dni", "==", parentRegData.dni));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) { setAuthError('Este DNI ya está registrado.'); setIsLoggingIn(false); return; }
      let linkedStudentData: Student | null = null;
      if (parentRegData.familyCode) {
         const cleanCode = parentRegData.familyCode.trim().toUpperCase();
         const qStudent = query(collection(db, "students"), where("linkCode", "==", cleanCode));
         const studentSnapshot = await getDocs(qStudent);
         if (!studentSnapshot.empty) {
            const sDoc = studentSnapshot.docs[0];
            linkedStudentData = { ...sDoc.data(), id: sDoc.id } as Student;
         } else { setAuthError('El código familiar no existe.'); setIsLoggingIn(false); return; }
      }
      const newCode = `FAM-${Math.floor(1000 + Math.random() * 9000)}`;
      const newParent = {
        name: parentRegData.name, dni: parentRegData.dni, phone: parentRegData.phone, address: parentRegData.address, familyCode: newCode,
        avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(parentRegData.name)}&background=random`, role: 'Apoderado',
        linkedStudentId: linkedStudentData ? linkedStudentData.id : null, createdAt: new Date().toISOString()
      };
      await addDoc(collection(db, "parents"), newParent);
      setCurrentUserParent(newParent as any);
      setUserRole('PARENT');
      saveSession('PARENT', newParent);
      setRegisterSuccess(true);
      setTimeout(() => { setIsLoggingIn(false); setRegisterSuccess(false); setIsRegistering(false); if (linkedStudentData) alert(`¡Vinculado con ${linkedStudentData.name}!`); }, 1500);
    } catch (error) { console.error("Error Registro:", error); setAuthError("Error BD."); setIsLoggingIn(false); }
  };
  
const handleRegisterStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setIsLoggingIn(true);
    if (studentRegData.dni.length !== 8) { setAuthError('El DNI debe tener 8 dígitos.'); setIsLoggingIn(false); return; }
    try {
      const q = query(collection(db, "students"), where("dni", "==", studentRegData.dni));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) { setAuthError('Este estudiante ya existe.'); setIsLoggingIn(false); return; }
      const linkCodeSuffix = Math.floor(1000 + Math.random() * 9000);
      const namePrefix = studentRegData.name.substring(0, 3).toUpperCase().replace(/\s/g, 'X');
      const generatedLinkCode = `COAR-${namePrefix}${linkCodeSuffix}`;
      const newStudent = {
        name: studentRegData.name, dni: studentRegData.dni, grade: studentRegData.grade, section: studentRegData.section, originCity: studentRegData.originCity,
        address: studentRegData.address || '', birthDate: studentRegData.birthDate || '', bloodType: studentRegData.bloodType || 'O+',
        avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(studentRegData.name)}&background=random&size=128`,
        status: 'NORMAL', statusText: 'En línea', deviceId: 'Web-App', batteryLevel: 100, pickupAuthorization: 'NONE', linkCode: generatedLinkCode,
        weeklySurvey: { completed: false, destination: '', transportMethod: 'OTHER', healthStatus: 'GOOD', comments: '' }, currentActivity: null, createdAt: new Date().toISOString()
      };
      const docRef = await addDoc(collection(db, "students"), newStudent);
      const studentWithId = { ...newStudent, id: docRef.id };
      setStudents(prev => [...prev, studentWithId as any]);
      setCurrentStudentId(docRef.id);
      setUserRole('STUDENT');
      saveSession('STUDENT', studentWithId);
      setRegisterSuccess(true);
      setTimeout(() => { setIsLoggingIn(false); setIsRegistering(false); setRegisterSuccess(false); }, 1000);
    } catch (error) { console.error("Error Registro Estudiante:", error); setAuthError("Error al guardar."); setIsLoggingIn(false); }
  };

  if (isLoading) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
         <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
         <p className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Cargando sistema...</p>
      </div>
    );
  }

  // --- VISTA ADMIN (NUEVO) ---
  if (userRole === 'ADMIN') {
    return <AdminMenuEditor onLogout={handleLogout} />;
  }

  // --- LOGIN VIEW ---
  if (!userRole) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center p-4 transition-colors duration-300 ${isDarkMode ? 'bg-gray-900' : 'bg-[#F0F4F8]'}`}>
        
        {/* BOTÓN SECRETO EDITOR */}
        <button 
          onClick={() => setShowAdminLogin(true)}
          className="fixed top-4 left-4 text-[10px] font-bold uppercase tracking-widest text-gray-300 hover:text-gray-500 transition-colors z-50"
        >
          Editor
        </button>

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
                <button onClick={() => { setLoginTab('PARENT'); setAuthError(''); setAuthInput(''); }} className={`flex-1 py-4 text-sm font-bold transition-colors ${loginTab === 'PARENT' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-400'}`}>Familiares</button>
                <button onClick={() => { setLoginTab('STUDENT'); setAuthError(''); setAuthInput(''); }} className={`flex-1 py-4 text-sm font-bold transition-colors ${loginTab === 'STUDENT' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-400'}`}>Estudiantes</button>
              </div>

              <div className="p-8">
                 <form onSubmit={handleLogin}>
                   <div className="space-y-2">
                     <label className={`text-xs font-bold ml-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-700'}`}>
                       {loginTab === 'PARENT' ? 'CÓDIGO DE FAMILIA O DNI' : 'DNI ESTUDIANTE'}
                     </label>
                     <input type="text" value={authInput} onChange={(e) => setAuthInput(e.target.value)} placeholder={loginTab === 'PARENT' ? 'Ej: DNI o FAM-1234' : 'Ej: 70012345'} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 font-bold text-center text-lg" />
                   </div>
                   <div className="mt-4 flex items-center justify-center">
                      <label className="flex items-center cursor-pointer select-none">
                        <input type="checkbox" checked={keepSession} onChange={(e) => setKeepSession(e.target.checked)} className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500" />
                        <span className={`ml-2 text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>Mantener sesión iniciada</span>
                      </label>
                   </div>
                   {authError && <p className="text-xs text-red-500 font-medium mt-2 text-center">{authError}</p>}
                   <button type="submit" disabled={isLoggingIn || !authInput} className="w-full mt-4 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-900/20 transition-all disabled:opacity-50">
                     {isLoggingIn ? <Icons.Refresh className="w-5 h-5 animate-spin mx-auto" /> : 'Ingresar'}
                   </button>
                 </form>
                 <div className={`mt-6 pt-4 border-t text-center ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                    <p className="text-xs text-gray-500 mb-2">¿Primera vez aquí?</p>
                    <button onClick={() => setIsRegistering(true)} className={`w-full py-2 rounded-lg text-sm font-bold transition-colors ${isDarkMode ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}>Crear Cuenta {loginTab === 'PARENT' ? 'de Familia' : 'de Estudiante'}</button>
                 </div>
              </div>
            </>
          ) : (
            <div className="p-6 h-[500px] overflow-y-auto custom-scrollbar">
               <div className={`flex items-center gap-2 mb-4 sticky top-0 z-10 py-2 border-b ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                 <button onClick={() => setIsRegistering(false)} className={`p-2 rounded-full ${isDarkMode ? 'hover:bg-gray-700 text-white' : 'hover:bg-gray-100 text-gray-500'}`}><Icons.Close className="w-4 h-4" /></button>
                 <h2 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Registro {loginTab === 'PARENT' ? 'Familiar' : 'Estudiante'}</h2>
               </div>
               {loginTab === 'PARENT' ? (
                 <form onSubmit={handleRegisterParent} className="space-y-4">
                   <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
                      <label className="text-[10px] font-bold text-blue-800 ml-1 flex items-center gap-1"><Icons.Shield className="w-3 h-3"/> CÓDIGO FAMILIAR (DEL ESTUDIANTE)</label>
                      <input type="text" value={parentRegData.familyCode} onChange={(e) => setParentRegData({...parentRegData, familyCode: e.target.value})} className="w-full p-2 mt-2 bg-white border border-blue-200 rounded-lg text-sm text-gray-900 font-bold outline-none focus:border-blue-500 uppercase tracking-wider text-center" placeholder="EJ: COAR-JUAN1234" />
                      <p className="text-[10px] text-blue-600 mt-2 ml-1 leading-tight">* Pide este código a tu hijo (está en su credencial digital) para vincularlo automáticamente.</p>
                   </div>
                   <div><label className="text-[10px] font-bold text-gray-500 ml-1">NOMBRE</label><input type="text" value={parentRegData.name} onChange={(e) => setParentRegData({...parentRegData, name: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 font-medium outline-none" required /></div>
                   <div><label className="text-[10px] font-bold text-gray-500 ml-1">DNI</label><input type="text" value={parentRegData.dni} onChange={(e) => setParentRegData({...parentRegData, dni: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 font-medium outline-none" maxLength={8} required /></div>
                   <div><label className="text-[10px] font-bold text-gray-500 ml-1">CELULAR</label><input type="text" value={parentRegData.phone} onChange={(e) => setParentRegData({...parentRegData, phone: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 font-medium outline-none" required /></div>
                   <div><label className="text-[10px] font-bold text-gray-500 ml-1">DIRECCIÓN</label><input type="text" value={parentRegData.address} onChange={(e) => setParentRegData({...parentRegData, address: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 font-medium outline-none" required /></div>
                   {authError && <p className="text-xs text-red-500 font-medium text-center">{authError}</p>}
                   <button type="submit" className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold mt-4">Crear Cuenta Familiar</button>
                 </form>
               ) : (
                 <form onSubmit={handleRegisterStudent} className="space-y-4">
                   <div className="grid grid-cols-2 gap-3">
                     <div><label className="text-[10px] font-bold text-gray-500 ml-1">DNI</label><input type="text" value={studentRegData.dni} onChange={(e) => setStudentRegData({...studentRegData, dni: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 font-medium outline-none" maxLength={8} required /></div>
                     <div><label className="text-[10px] font-bold text-gray-500 ml-1">NOMBRE</label><input type="text" value={studentRegData.name} onChange={(e) => setStudentRegData({...studentRegData, name: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 font-medium outline-none" required /></div>
                   </div>
                   <div className="grid grid-cols-2 gap-3">
                     <div>
                       <label className="text-[10px] font-bold text-gray-500 ml-1">GRADO</label>
                       <select value={studentRegData.grade} onChange={(e) => setStudentRegData({...studentRegData, grade: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 outline-none">
                         <option value="3ro">3ro</option><option value="4to">4to</option><option value="5to">5to</option>
                       </select>
                     </div>
                     <div>
                       <label className="text-[10px] font-bold text-gray-500 ml-1">SECCIÓN</label>
                       <select value={studentRegData.section} onChange={(e) => setStudentRegData({...studentRegData, section: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 outline-none">
                         <option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="D">D</option>
                       </select>
                     </div>
                   </div>
                   <div><label className="text-[10px] font-bold text-gray-500 ml-1">CIUDAD</label><input type="text" value={studentRegData.originCity} onChange={(e) => setStudentRegData({...studentRegData, originCity: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 font-medium outline-none" required /></div>
                   {authError && <p className="text-xs text-red-500 font-medium text-center">{authError}</p>}
                   <button type="submit" className="w-full py-3 bg-gray-900 hover:bg-black text-white rounded-xl font-bold mt-4">Registrar Estudiante</button>
                 </form>
               )}
            </div>
          )}
        </div>

        {/* ADMIN LOGIN MODAL */}
        {showAdminLogin && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in">
             <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
                <div className="flex justify-between items-center mb-4">
                   <h3 className="font-bold text-gray-900 flex items-center gap-2">
                     <Icons.Settings className="w-5 h-5 text-blue-600" />
                     Acceso Editor
                   </h3>
                   <button onClick={() => setShowAdminLogin(false)} className="bg-gray-100 p-1 rounded-full text-gray-500 hover:text-red-500">
                     <Icons.Close size={18} />
                   </button>
                </div>
                <form onSubmit={handleAdminLogin} className="space-y-4">
                   <div>
                     <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Usuario</label>
                     <input 
                       type="text" 
                       value={adminUser} 
                       onChange={e => setAdminUser(e.target.value)} 
                       className="w-full p-3 bg-gray-50 rounded-lg border border-gray-200 outline-none focus:border-blue-500 font-bold" 
                       autoFocus 
                     />
                   </div>
                   <div>
                     <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Clave</label>
                     <input 
                       type="password" 
                       value={adminPass} 
                       onChange={e => setAdminPass(e.target.value)} 
                       className="w-full p-3 bg-gray-50 rounded-lg border border-gray-200 outline-none focus:border-blue-500" 
                     />
                   </div>
                   <button type="submit" className="w-full py-3 bg-black text-white rounded-xl font-bold shadow-lg hover:opacity-90 transition-opacity">
                     Ingresar
                   </button>
                </form>
             </div>
          </div>
        )}

      </div>
    );
  }

  // --- STUDENT PORTAL ---
  if (userRole === 'STUDENT') {
    const myData = students.find(s => s.id === currentStudentId);
    if (!myData) { setUserRole(null); return null; }
    const linkedParent = parents.find(p => (p as any).linkedStudentId === myData.id);
    const parentName = linkedParent ? linkedParent.name : "Tu Apoderado";

    const handleStudentResponse = async (approved: boolean) => {
       const newStatus = approved ? PickupAuthStatus.APPROVED : PickupAuthStatus.REJECTED;
       try {
         const studentRef = doc(db, "students", currentStudentId);
         await updateDoc(studentRef, { pickupAuthorization: newStatus });
       } catch (error) { console.error("Error updating pickup status:", error); alert("Error de conexión al responder."); }
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
        requestingParentName={parentName} 
      />
    );
  }

  // --- PARENT DASHBOARD ---
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

  const handleRequestPickup = async (studentId: string) => {
    setStudents(prev => prev.map(s => s.id === studentId ? { ...s, pickupAuthorization: PickupAuthStatus.PENDING } : s));
    try {
      const studentRef = doc(db, "students", studentId);
      await updateDoc(studentRef, { pickupAuthorization: 'PENDING' });
      alert("Solicitud enviada al dispositivo del estudiante.");
    } catch (error) { console.error("Error al solicitar salida:", error); alert("Hubo un error al enviar la solicitud."); }
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
        <header className={`border-b px-6 py-3 flex items-center justify-between shadow-sm z-20 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
          <div className="flex items-center flex-1">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className={`mr-4 lg:hidden ${isDarkMode ? 'text-white' : 'text-gray-500'}`}><Icons.Menu size={24} /></button>
            <h2 className={`font-bold text-lg hidden md:block ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{activeTab === 'dashboard' ? 'Panel Principal' : 'Ajustes de Cuenta'}</h2>
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

        <div className="flex-1 overflow-auto p-4 lg:p-6">
          {activeTab === 'settings' ? (
             <div className="max-w-2xl mx-auto space-y-6">
                <div className={`p-6 rounded-2xl border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                   <h3 className={`font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Apariencia</h3>
                   <div className="flex items-center justify-between">
                      <span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Modo Oscuro</span>
                      <button onClick={toggleTheme} className={`w-14 h-8 rounded-full p-1 transition-colors flex items-center ${isDarkMode ? 'bg-blue-600 justify-end' : 'bg-gray-200 justify-start'}`}><div className="w-6 h-6 bg-white rounded-full shadow-sm"></div></button>
                   </div>
                </div>
                <button onClick={handleLogout} className="w-full py-3 text-red-500 bg-red-50 hover:bg-red-100 rounded-xl font-bold transition-colors">Cerrar Sesión</button>
             </div>
          ) : (
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className={`text-2xl font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Estudiantes ({students.length})</h2>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Gestión de salida escolar</p>
                  </div>
                </div>
                <div className="space-y-4">
                  {visibleStudents.map((student) => {
                    const isLinked = (currentUserParent as any)?.linkedStudentId === student.id;
                    return (
                      <div key={student.id} className={`p-5 rounded-2xl border shadow-sm transition-all relative ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} ${isLinked ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-gray-100' : ''}`}>
                        {isLinked && <div className="absolute top-0 right-0 bg-blue-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl rounded-tr-xl">TU HIJO</div>}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-4 cursor-pointer" onClick={() => setSelectedStudent(student)}>
                            <img src={student.avatarUrl} alt={student.name} className="w-14 h-14 rounded-full object-cover ring-4 ring-gray-100" />
                            <div>
                              <h3 className={`text-base font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{student.name}</h3>
                              <div className="flex flex-wrap items-center gap-2 mt-1">
                                 <p className="text-xs text-gray-500">{student.grade} "{student.section}"</p>
                                 {student.currentActivity && (
                                   <span className={`text-[9px] font-bold px-2 py-0.5 rounded flex items-center gap-1 uppercase tracking-wide border ${student.currentActivity === 'CLASSES' ? 'bg-blue-50 text-blue-700 border-blue-100' : student.currentActivity === 'FREE' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-orange-50 text-orange-700 border-orange-100'}`}>
                                     {student.currentActivity === 'CLASSES' && <Icons.Layers className="w-3 h-3"/>}
                                     {student.currentActivity === 'FREE' && <Icons.Sun className="w-3 h-3"/>}
                                     {student.currentActivity === 'EXIT' && <Icons.Bus className="w-3 h-3"/>}
                                     {student.currentActivity === 'CLASSES' ? 'EN CLASES' : student.currentActivity === 'FREE' ? 'TIEMPO LIBRE' : 'SALIDA'}
                                   </span>
                                 )}
                              </div>
                            </div>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold border flex items-center ${student.currentActivity === 'CLASSES' ? 'bg-blue-100 text-blue-700 border-blue-200' : student.currentActivity === 'FREE' ? 'bg-green-100 text-green-700 border-green-200' : student.currentActivity === 'EXIT' ? 'bg-orange-100 text-orange-700 border-orange-200' : student.status === StudentStatus.READY ? 'bg-green-100 text-green-700 border-green-200' : student.status === StudentStatus.ON_WAY ? 'bg-yellow-100 text-yellow-700 border-yellow-200' : 'bg-blue-50 text-blue-700 border-blue-100'}`}>
                            {student.currentActivity === 'CLASSES' ? 'EN CLASES' : student.currentActivity === 'FREE' ? 'TIEMPO LIBRE' : student.currentActivity === 'EXIT' ? 'SALIDA' : student.statusText || 'En línea'}
                          </span>
                        </div>
                        <div className={`pt-4 border-t flex items-center justify-between ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                            <div className={`text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                               {student.pickupAuthorization === PickupAuthStatus.PENDING ? "Esperando confirmación..." : student.pickupAuthorization === PickupAuthStatus.APPROVED ? "✅ Salida confirmada." : student.pickupAuthorization === PickupAuthStatus.REJECTED ? "❌ Solicitud rechazada (En clases)." : "Estado regular."}
                            </div>
                            {isLinked && (student.pickupAuthorization === PickupAuthStatus.NONE || student.pickupAuthorization === PickupAuthStatus.REJECTED) && (
                              <button onClick={() => handleRequestPickup(student.id)} className={`flex items-center px-4 py-2 text-white text-xs font-bold rounded-lg transition-all ${student.pickupAuthorization === PickupAuthStatus.REJECTED ? 'bg-orange-500 hover:bg-orange-600' : 'bg-blue-600 hover:bg-blue-700'}`}>
                                <Icons.Send className="w-3 h-3 mr-2" />{student.pickupAuthorization === PickupAuthStatus.REJECTED ? "Reenviar Solicitud" : "Solicitar Salida"}
                              </button>
                            )}
                            {!isLinked && <span className="text-gray-400 text-xs italic">Solo lectura</span>}
                            {student.pickupAuthorization === PickupAuthStatus.APPROVED && <span className="text-green-500 font-bold text-xs flex items-center"><Icons.Check className="w-4 h-4 mr-1" /> Autorizado</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-center gap-4 py-4">
                   {hasMore && <button onClick={handleShowMore} className={`px-6 py-2 rounded-xl text-sm font-bold shadow-sm transition-colors ${isDarkMode ? 'bg-gray-800 text-white hover:bg-gray-700' : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'}`}>Mostrar más ({sortedStudents.length - visibleCount} restantes)</button>}
                   {visibleCount > 8 && <button onClick={handleShowLess} className={`px-6 py-2 rounded-xl text-sm font-bold shadow-sm transition-colors ${isDarkMode ? 'bg-gray-800 text-red-400 hover:bg-gray-700' : 'bg-white text-red-500 hover:bg-red-50 border border-red-100'}`}>Mostrar menos</button>}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                   {SCHEDULE_ITEMS.map((item, idx) => (
                     <div key={idx} className={`p-4 rounded-2xl border shadow-sm flex items-center justify-between ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                        <div><h3 className={`text-base font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{item.time}</h3><p className="text-xs font-medium text-gray-500">{item.title}</p></div>
                     </div>
                   ))}
                </div>
                <div className={`rounded-2xl p-4 border flex items-center justify-between shadow-sm ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                   <div className="flex items-center gap-3"><div className="bg-blue-50 p-2 rounded-lg text-blue-600"><Icons.Settings className="w-5 h-5" /></div><div><h4 className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Vincular nuevo celular</h4><p className="text-xs text-gray-500">Recibe alertas en tiempo real.</p></div></div>
                   <button onClick={() => setShowConnectModal(true)} className="text-xs text-blue-600 font-bold px-4 py-2 hover:bg-blue-50 rounded-lg transition-all">Conectar</button>
                </div>
              </div>
              <div className="lg:col-span-5 flex flex-col h-full">
                <div className="mb-4"><h2 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Centro de Ayuda</h2><p className="text-xs text-gray-500">Asistente COAR IA</p></div>
                <AIPanel />
              </div>
            </div>
          )}
        </div>
      </main>

      {selectedStudent && <StudentDetailModal student={selectedStudent} onClose={() => setSelectedStudent(null)} />}
      {showConnectModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`rounded-3xl p-8 max-w-md w-full shadow-2xl border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
             <div className="flex justify-between items-start mb-6"><h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Vincular Celular</h3><button onClick={() => setShowConnectModal(false)} className="text-gray-400"><Icons.Close size={20} /></button></div>
             <form onSubmit={handleConnectPhone}>
               <div className="mb-6"><input type="text" value={phoneCode} onChange={(e) => setPhoneCode(e.target.value)} className="w-full pl-4 pr-4 py-4 bg-gray-50 border-2 border-gray-200 rounded-xl text-center tracking-[0.5em] font-mono text-xl uppercase outline-none text-gray-900 focus:border-blue-500" placeholder="COAR-XXX1234" required /></div>
               <button type="submit" className="w-full py-3.5 bg-blue-600 text-white rounded-xl font-bold">Vincular Dispositivo</button>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;