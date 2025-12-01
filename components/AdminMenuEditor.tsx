import React, { useState, useEffect } from 'react';
import { Icons } from './Icons';
import { db } from '../firebaseConfig';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { DailyMenu } from '../types';

interface AdminMenuEditorProps {
  onLogout: () => void;
}

export const AdminMenuEditor: React.FC<AdminMenuEditorProps> = ({ onLogout }) => {
  const [selectedMeal, setSelectedMeal] = useState<keyof DailyMenu>('lunch');
  const [dishName, setDishName] = useState('');
  const [menuData, setMenuData] = useState<DailyMenu>({
    breakfast: '',
    recess: '',
    lunch: '',
    dinner: ''
  });
  const [isSaving, setIsSaving] = useState(false);

  // Cargar menú en tiempo real
  useEffect(() => {
    const menuRef = doc(db, "settings", "dailyMenu");
    const unsubscribe = onSnapshot(menuRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as DailyMenu;
        setMenuData(data);
        // Solo actualizamos el input si no estamos escribiendo activamente para evitar conflictos,
        // o simplificamos actualizando cuando cambia la selección de comida.
      }
    });
    return () => unsubscribe();
  }, []);

  // Actualizar el input cuando cambiamos de opción (Desayuno -> Almuerzo)
  useEffect(() => {
    setDishName(menuData[selectedMeal] || '');
  }, [selectedMeal, menuData]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const menuRef = doc(db, "settings", "dailyMenu");
      const newMenuData = {
        ...menuData,
        [selectedMeal]: dishName
      };
      await setDoc(menuRef, newMenuData);
      alert("¡Menú actualizado correctamente!");
    } catch (error) {
      console.error("Error:", error);
      alert("Error al guardar.");
    } finally {
      setIsSaving(false);
    }
  };

  const mealOptions: {key: keyof DailyMenu, label: string, icon: any}[] = [
    { key: 'breakfast', label: 'Desayuno', icon: Icons.Sun },
    { key: 'recess', label: 'Receso', icon: Icons.Check },
    { key: 'lunch', label: 'Almuerzo', icon: Icons.Layers },
    { key: 'dinner', label: 'Cena', icon: Icons.Moon },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
        
        {/* Header */}
        <div className="bg-gray-900 p-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
             <div className="bg-blue-600 p-2 rounded-lg text-white">
               <Icons.Settings className="w-5 h-5" />
             </div>
             <div>
               <h1 className="text-white font-bold text-lg">Editor de Menú</h1>
               <p className="text-gray-400 text-xs">Modo Administrador</p>
             </div>
          </div>
          <button onClick={onLogout} className="text-gray-400 hover:text-white transition-colors">
            <Icons.Close size={20} />
          </button>
        </div>

        <div className="p-8">
          <form onSubmit={handleSave} className="space-y-6">
            
            {/* 1. Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase">Selecciona turno</label>
              <div className="grid grid-cols-2 gap-3">
                {mealOptions.map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => setSelectedMeal(option.key)}
                    className={`p-3 rounded-xl border flex items-center gap-2 transition-all ${
                      selectedMeal === option.key 
                        ? 'bg-blue-50 border-blue-500 text-blue-700 ring-1 ring-blue-500' 
                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <option.icon className={`w-4 h-4 ${selectedMeal === option.key ? 'text-blue-500' : 'text-gray-400'}`} />
                    <span className="text-sm font-bold">{option.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Input */}
            <div className="space-y-2">
               <label className="text-xs font-bold text-gray-500 uppercase">Nombre del Plato</label>
               <textarea
                 value={dishName}
                 onChange={(e) => setDishName(e.target.value)}
                 className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-medium text-gray-900 resize-none h-32"
                 placeholder="Escribe el menú aquí..."
               />
            </div>

            {/* Botón */}
            <button
              type="submit"
              disabled={isSaving}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-200 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              {isSaving ? <Icons.Refresh className="w-5 h-5 animate-spin" /> : <Icons.Check className="w-5 h-5" />}
              Publicar Cambios
            </button>

          </form>

          {/* Preview */}
          <div className="mt-8 pt-6 border-t border-gray-100">
             <p className="text-xs font-bold text-gray-400 uppercase mb-3">Menú Actual:</p>
             <div className="bg-orange-50 rounded-xl p-4 border border-orange-100 text-xs space-y-1">
                <p><span className="font-bold text-orange-800">Desayuno:</span> {menuData.breakfast || '---'}</p>
                <p><span className="font-bold text-orange-800">Almuerzo:</span> {menuData.lunch || '---'}</p>
                <p><span className="font-bold text-orange-800">Cena:</span> {menuData.dinner || '---'}</p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};