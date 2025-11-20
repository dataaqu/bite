
import React from 'react';
import { FoodLogEntry } from '../types';
import { FlameIcon, TrashIcon, PencilIcon, ClockIcon } from './Icons';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface Props {
  entry: FoodLogEntry;
  onDelete: (id: string) => void;
  onEdit: (entry: FoodLogEntry) => void;
  onImageClick?: (entry: FoodLogEntry) => void;
}

const COLORS = ['#3b82f6', '#22c55e', '#ef4444']; // Blue (ნახშირწყლები), Green (ცილა), Red (ცხიმი)

export const NutritionCard: React.FC<Props> = ({ entry, onDelete, onEdit, onImageClick }) => {
  const timestampStr = new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (entry.loading) {
    return (
      <div className="bg-white rounded-2xl shadow-md p-4 mb-4 animate-pulse flex flex-col gap-4">
        <div className="h-48 bg-gray-200 rounded-xl w-full"></div>
        <div className="h-6 bg-gray-200 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        <div className="flex gap-2 mt-2">
           <div className="h-16 w-16 bg-gray-200 rounded-full"></div>
           <div className="flex-1 space-y-2">
             <div className="h-4 bg-gray-200 rounded"></div>
             <div className="h-4 bg-gray-200 rounded"></div>
           </div>
        </div>
      </div>
    );
  }

  if (entry.error || (entry.analysis && !entry.analysis.isFood)) {
    return (
      <div className="bg-white rounded-2xl shadow-md p-4 mb-4 border-l-4 relative overflow-hidden" style={{borderLeftColor: '#f27141'}}>
        <div className="absolute top-2 right-2">
            <button onClick={() => onDelete(entry.id)} className="p-2 text-gray-400 transition-colors" style={{'--hover-color': '#f27141'}}>
                <TrashIcon className="w-5 h-5" />
            </button>
        </div>
        <div className="flex gap-4 items-start">
            {entry.imageUrl ? (
                <img src={entry.imageUrl} alt="Failed analysis" className="w-20 h-20 object-cover rounded-lg bg-gray-100" />
            ) : (
                <div className="w-20 h-20 rounded-lg bg-gray-100 flex items-center justify-center text-gray-300">
                   <span className="text-2xl">?</span>
                </div>
            )}
            <div>
                <h3 className="text-red-600 font-semibold">ანალიზი ვერ მოხერხდა</h3>
                <p className="text-gray-500 text-sm mt-1">
                    {entry.error || "ფოტოზე საჭმელი ვერ დაფიქსირდა. გთხოვთ სცადოთ თავიდან."}
                </p>
            </div>
        </div>
      </div>
    );
  }

  if (!entry.analysis) return null;

  const { totalMacros, summary, foodItems } = entry.analysis;
  const hasImage = !!entry.imageUrl;
  
  const data = [
    { name: 'ნახშირწყლები', value: totalMacros.carbs },
    { name: 'ცილა', value: totalMacros.protein },
    { name: 'ცხიმი', value: totalMacros.fat },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-md overflow-hidden mb-4 lg:mb-0 border cursor-pointer hover:shadow-lg transition-shadow duration-200" style={{borderColor: '#f27141'}} onClick={() => onImageClick?.(entry)}>
      <div className={`relative ${hasImage ? 'h-48' : 'h-32'}`}>
        {hasImage ? (
            <>
                <img 
                  src={entry.imageUrl} 
                  alt="Meal" 
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-200" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />
            </>
        ) : (
            <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600" />
        )}

        {/* Header Content Overlay */}
        <div className="absolute inset-0 flex items-end p-4">
           <div className="text-white w-full">
             <div className="flex justify-between items-end">
                <div className="flex-1 mr-2">
                    <h3 className="font-bold text-lg leading-tight line-clamp-1 drop-shadow-md">{summary.split('.')[0]}</h3>
                </div>
                <div className="flex items-center bg-orange-500/90 px-2.5 py-1 rounded-full backdrop-blur-sm shadow-sm">
                   <FlameIcon className="w-4 h-4 text-white mr-1" />
                   <span className="font-bold text-sm">{Math.round(totalMacros.calories)}</span>
                </div>
             </div>
           </div>
        </div>
        
        {/* Time Badge */}
        <div className="absolute top-3 left-3 bg-black/30 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-medium border border-white/10 flex items-center gap-1">
          <ClockIcon className="w-3 h-3" />
          {timestampStr}
        </div>

        {/* Actions */}
        <div className="absolute top-3 right-3 flex gap-2">
          <button 
              onClick={(e) => {
                e.stopPropagation();
                onEdit(entry);
              }}
              className="bg-black/30 text-white p-2 rounded-full backdrop-blur-md transition-colors"
              style={{'--hover-bg': '#f27141'}}
          >
              <PencilIcon className="w-4 h-4" />
          </button>
          <button 
              onClick={(e) => {
                e.stopPropagation();
                onDelete(entry.id);
              }}
              className="bg-black/30 hover:bg-red-500 text-white p-2 rounded-full backdrop-blur-md transition-colors"
          >
              <TrashIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="p-4">
        {/* Macros Summary */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-4 gap-4 lg:gap-0">
             <div className="flex-1 pr-4">
                 <ul className="space-y-2">
                    {foodItems.map((item, idx) => (
                        <li key={idx} className="flex justify-between text-sm items-center border-b border-gray-50 last:border-0 pb-1 last:pb-0">
                            <span className="text-gray-700 font-medium line-clamp-1">{item.name}</span>
                            <span className="text-gray-400 text-xs whitespace-nowrap ml-2">{item.portion}</span>
                        </li>
                    ))}
                 </ul>
             </div>
             <div className="w-24 h-24 lg:w-32 lg:h-32 relative shrink-0 mx-auto lg:mx-0" style={{minWidth: '96px', minHeight: '96px'}}>
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                    <PieChart>
                        <Pie
                            data={data}
                            innerRadius={25}
                            outerRadius={40}
                            paddingAngle={5}
                            dataKey="value"
                            stroke="none"
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip 
                             contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                             itemStyle={{ fontSize: '12px', fontWeight: 600 }}
                        />
                    </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                   <span className="text-[10px] text-gray-400 font-medium">მაკროები</span>
                </div>
             </div>
        </div>

        {/* Macro Pills */}
        <div className="grid grid-cols-3 gap-2 mt-2">
            <div className="flex flex-col items-center p-2 rounded-lg flex-1 border" style={{backgroundColor: 'rgba(59, 130, 246, 0.1)', borderColor: 'rgba(59, 130, 246, 0.3)'}}>
                <span className="text-[10px] uppercase tracking-wider text-blue-500 font-bold">ნახშირწყლები</span>
                <span className="text-blue-800 font-bold text-lg leading-none mt-0.5">{Math.round(totalMacros.carbs)}გ</span>
            </div>
            <div className="flex flex-col items-center p-2 rounded-lg flex-1 border" style={{backgroundColor: 'rgba(34, 197, 94, 0.1)', borderColor: 'rgba(34, 197, 94, 0.3)'}}>
                <span className="text-[10px] uppercase tracking-wider text-green-500 font-bold">ცილა</span>
                <span className="text-green-800 font-bold text-lg leading-none mt-0.5">{Math.round(totalMacros.protein)}გ</span>
            </div>
            <div className="flex flex-col items-center p-2 rounded-lg flex-1 border" style={{backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.3)'}}>
                <span className="text-[10px] uppercase tracking-wider text-red-500 font-bold">ცხიმი</span>
                <span className="text-red-800 font-bold text-lg leading-none mt-0.5">{Math.round(totalMacros.fat)}გ</span>
            </div>
        </div>
      </div>
    </div>
  );
};
