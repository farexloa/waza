import React from 'react';
import { Icons } from './Icons';
import { SurveyData } from '../types';

interface SurveyFormProps {
  onSubmit?: (data: SurveyData) => void; // Mantenemos las props para no romper el StudentPortal
  onCancel: () => void;
  studentCode?: string;
}

export const SurveyForm: React.FC<SurveyFormProps> = ({ onCancel, studentCode }) => {
  const GOOGLE_FORM_URL = "https://docs.google.com/forms/d/e/1FAIpQLSd7lSCDadwV1VA9CfxajmxeqWCZXznghmyvIYJts7IxeeGHmw/viewform";

  return (
    <div className="flex-1 flex flex-col bg-gray-50 h-full p-6">
      
      {/* Cabecera con botón de cerrar */}
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-xl font-bold text-gray-900">Encuesta de Salida</h2>
        <button 
          onClick={onCancel} 
          className="p-2 bg-white rounded-full text-gray-500 hover:text-gray-900 shadow-sm border border-gray-100 transition-transform active:scale-95"
        >
          <Icons.Close size={20} />
        </button>
      </div>

      {/* Cuadro Único con el Link */}
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-200 flex flex-col items-center text-center space-y-6 max-w-md mx-auto w-full">
         
         <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 mb-2 ring-4 ring-blue-50/50">
            <Icons.Survey className="w-8 h-8" />
         </div>
         
         <div>
           <h3 className="text-xl font-bold text-gray-900">Registro Obligatorio</h3>
           <p className="text-gray-500 text-sm mt-2">
             Para autorizar tu salida, debes completar el formulario oficial externo.
           </p>
         </div>

         <div className="w-full bg-gray-50 p-6 rounded-2xl border border-gray-200">
            <p className="text-xs text-gray-400 font-bold uppercase mb-3 tracking-wider">Este es el link de salida:</p>
            <a 
              href={GOOGLE_FORM_URL} 
              target="_blank" 
              rel="noopener noreferrer"
              className="block w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-200 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <Icons.Send className="w-4 h-4" />
              Abrir Google Form
            </a>
         </div>

         {studentCode && (
           <div className="text-xs text-gray-400 bg-white px-3 py-1 rounded-full border border-gray-100">
             Tu código de estudiante: <span className="font-mono font-bold text-gray-600 ml-1">{studentCode}</span>
           </div>
         )}
      </div>
    </div>
  );
};