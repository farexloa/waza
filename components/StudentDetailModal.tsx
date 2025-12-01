
import React from 'react';
import { Icons } from './Icons';
import { Student } from '../types';

interface StudentDetailModalProps {
  student: Student;
  onClose: () => void;
}

export const StudentDetailModal: React.FC<StudentDetailModalProps> = ({ student, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100">
        
        {/* Header with Cover */}
        <div className="relative h-32 bg-gradient-to-r from-blue-600 to-blue-800">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 p-2 rounded-full text-white transition-colors backdrop-blur-md"
          >
            <Icons.Close size={20} />
          </button>
          <div className="absolute -bottom-10 left-8">
            <img 
              src={student.avatarUrl} 
              alt={student.name} 
              className="w-24 h-24 rounded-2xl border-4 border-white shadow-lg object-cover"
            />
          </div>
        </div>

        {/* Content */}
        <div className="pt-12 px-8 pb-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">{student.name}</h2>
            <div className="flex items-center gap-2 text-gray-500 mt-1">
              <span className="px-2 py-0.5 bg-gray-100 rounded-md text-xs font-bold border border-gray-200">
                {student.grade} "{student.section}"
              </span>
              <span className="text-sm">• COAR Puno</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Personal Info */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Información Personal</h3>
              
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                   <Icons.Shield className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">DNI</p>
                  <p className="text-sm font-semibold text-gray-900">{student.dni}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                   <Icons.MapPin className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Lugar de Origen</p>
                  <p className="text-sm font-semibold text-gray-900">{student.originCity}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                   <Icons.Settings className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Fecha Nacimiento</p>
                  <p className="text-sm font-semibold text-gray-900">{student.birthDate}</p>
                </div>
              </div>
            </div>

            {/* Contact/Medical */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Datos Adicionales</h3>
              
              <div className="flex items-start gap-3">
                <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
                   <Icons.Map className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Dirección Actual</p>
                  <p className="text-sm font-semibold text-gray-900">{student.address}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-red-50 rounded-lg text-red-600">
                   <Icons.Refresh className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Grupo Sanguíneo</p>
                  <p className="text-sm font-semibold text-gray-900">{student.bloodType}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-100">
            <p className="text-xs text-center text-gray-400">
              Esta información es privada y confidencial del estudiante.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};
