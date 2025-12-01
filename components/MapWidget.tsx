
import React, { useMemo } from 'react';
import { Icons } from './Icons';
import { Student, StudentStatus, PickupAuthStatus, Coordinates } from '../types';
import { MAP_BOUNDS, SCHOOL_ZONES } from '../constants';

interface MapWidgetProps {
  students: Student[];
}

export const MapWidget: React.FC<MapWidgetProps> = ({ students }) => {
  
  const getStatusColor = (status: StudentStatus) => {
    switch (status) {
      case StudentStatus.READY: return 'bg-green-500 ring-green-200';
      case StudentStatus.ON_WAY: return 'bg-yellow-500 ring-yellow-200';
      case StudentStatus.DELAYED: return 'bg-red-500 ring-red-200';
      default: return 'bg-blue-500 ring-blue-200';
    }
  };

  // --- PROJECTION ENGINE ---
  // Converts real GPS (lat, lng) to CSS percentages (top%, left%)
  // Formula: (Current - Min) / (Max - Min) * 100
  const project = (coords: Coordinates) => {
    const latPercent = (coords.lat - MAP_BOUNDS.maxLat) / (MAP_BOUNDS.minLat - MAP_BOUNDS.maxLat) * 100;
    const lngPercent = (coords.lng - MAP_BOUNDS.minLng) / (MAP_BOUNDS.maxLng - MAP_BOUNDS.minLng) * 100;
    return { x: lngPercent, y: latPercent };
  };

  // Generate SVG Polygon points from Lat/Lng arrays
  const getPolygonPoints = (polygonCoords: Coordinates[]) => {
    return polygonCoords.map(coord => {
      const p = project(coord);
      return `${p.x},${p.y}`;
    }).join(' ');
  };

  return (
    <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Mapa Satelital COAR</h2>
          <p className="text-xs text-gray-500">Vista en tiempo real (-15.885906, -69.892060)</p>
        </div>
        <div className="flex space-x-2">
          <div className="flex items-center px-2 py-1 bg-gray-900 rounded-md border border-gray-800 shadow-sm">
             <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
             <span className="text-[10px] font-semibold text-white tracking-wide">LIVE GPS</span>
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div className="relative flex-1 w-full bg-[#e0e5ec] rounded-2xl overflow-hidden border-2 border-gray-200 min-h-[400px] lg:min-h-[500px] group">
        
        {/* 1. SATELLITE BASE LAYER */}
        {/* Using a solid textured background to simulate satellite if image fails, 
            but intended to be a satellite map tile. */}
        <div className="absolute inset-0 bg-[#bfae92] opacity-100">
           {/* Texture overlay to look like ground */}
           <div className="absolute inset-0 opacity-20" style={{ 
             backgroundImage: 'url("https://www.transparenttextures.com/patterns/cubes.png")',
             backgroundSize: '50px' 
           }}></div>
           
           {/* ROAD Visual (Right Side) */}
           <div className="absolute top-0 bottom-0 right-0 w-[12%] bg-[#4a4a4a] border-l-4 border-[#d4d4d4]">
              <div className="h-full w-full flex flex-col justify-between py-4 items-center opacity-50">
                 {[...Array(10)].map((_, i) => <div key={i} className="w-1 h-8 bg-yellow-400 rounded-full"></div>)}
              </div>
           </div>
        </div>

        {/* 2. ZONES LAYER (SVG OVERLAY) */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
          {SCHOOL_ZONES.map((zone) => (
            <g key={zone.id}>
              <polygon 
                points={getPolygonPoints(zone.polygon)} 
                fill={zone.color}
                stroke="rgba(255,255,255,0.4)"
                strokeWidth="1"
                strokeDasharray="4 2"
              />
              {/* Zone Labels - rough center estimation */}
              <text 
                x={`${project(zone.polygon[0]).x + 2}%`} 
                y={`${project(zone.polygon[0]).y + 10}%`} 
                fill="white" 
                fontSize="10" 
                fontWeight="bold"
                className="opacity-70 drop-shadow-md"
              >
                {zone.name}
              </text>
            </g>
          ))}
        </svg>

        {/* 3. STUDENTS LAYER */}
        {students.map((student) => {
          // SECURITY CHECK: ONLY SHOW IF AUTHORIZED
          if (student.pickupAuthorization === PickupAuthStatus.NONE) return null;

          const pos = project(student.location);
          
          return (
            <div
              key={student.id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-[3000ms] ease-linear cursor-pointer group z-30"
              style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
            >
              <div className="relative">
                {/* Movement Ping */}
                <div className={`absolute inset-0 rounded-full ${getStatusColor(student.status)} opacity-30 animate-ping`}></div>
                
                {/* The Marker Dot */}
                <div className={`w-6 h-6 rounded-full border-[3px] border-white shadow-xl ring-2 ${getStatusColor(student.status)} flex items-center justify-center bg-white overflow-hidden transform transition-transform group-hover:scale-110`}>
                   {student.avatarUrl ? (
                     <img src={student.avatarUrl} alt="" className="w-full h-full object-cover" />
                   ) : (
                     <span className="text-[8px] font-bold text-gray-600">{student.name.charAt(0)}</span>
                   )}
                </div>

                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 hidden group-hover:block min-w-[150px] z-50">
                  <div className="bg-gray-900/95 backdrop-blur-md text-white p-3 rounded-xl shadow-2xl border border-gray-700/50 flex flex-col text-center animate-in fade-in slide-in-from-bottom-2 duration-200">
                    <span className="text-xs font-bold text-white whitespace-nowrap">{student.name}</span>
                    <span className="text-[10px] text-gray-400 mb-2 font-medium tracking-wide uppercase">{student.statusText}</span>
                    <div className="w-full h-px bg-gradient-to-r from-transparent via-gray-600 to-transparent my-1"></div>
                    <div className="flex justify-between items-center text-[10px]">
                       <span className="text-gray-400 font-mono tracking-tight">GPS: {student.location.lat.toFixed(5)}</span>
                    </div>
                  </div>
                  <div className="w-2 h-2 bg-gray-900 border-r border-b border-gray-700 transform rotate-45 absolute left-1/2 -translate-x-1/2 -bottom-1"></div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Map Controls Overlay */}
        <div className="absolute bottom-4 right-4 flex flex-col space-y-2 z-20">
           <button className="bg-white p-2 rounded-lg shadow-md text-gray-600 hover:text-blue-600 border border-gray-200 transition-colors">
             <Icons.Refresh className="w-4 h-4" />
           </button>
           <button className="bg-white p-2 rounded-lg shadow-md text-gray-600 hover:text-blue-600 border border-gray-200 transition-colors">
             <Icons.Layers className="w-4 h-4" />
           </button>
        </div>

        {/* Privacy Warning Overlay (If any student is hidden) */}
        {students.some(s => s.pickupAuthorization === PickupAuthStatus.NONE) && (
           <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-sm px-3 py-2 rounded-lg border border-white/10 z-20 max-w-[200px]">
              <div className="flex items-start gap-2">
                 <Icons.Shield className="w-4 h-4 text-gray-300 mt-0.5" />
                 <p className="text-[10px] text-gray-200 leading-tight">
                    Ubicaciones ocultas por privacidad. Solicita recogida para visualizar.
                 </p>
              </div>
           </div>
        )}
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-3 text-[10px] text-gray-500 font-medium px-1">
         <div className="flex items-center bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
            <div className="w-2 h-2 bg-orange-300 rounded-full mr-1.5"></div>Aulas
         </div>
         <div className="flex items-center bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
            <div className="w-2 h-2 bg-green-400 rounded-full mr-1.5"></div>Canchas
         </div>
         <div className="flex items-center bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
            <div className="w-2 h-2 bg-gray-700 rounded-full mr-1.5"></div>Carretera
         </div>
      </div>
    </div>
  );
};
