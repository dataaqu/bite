import React, { useState } from 'react';
import { FoodLogEntry, MacroNutrients } from '../types';
import { ChevronLeftIcon, ChevronRightIcon, PencilIcon, CalendarIcon } from './Icons';
import biteLogo from '../assets/bite.png';
import pigImage from '../assets/pig.png';


interface Props {
  entries: FoodLogEntry[];
  date: Date;
  onDateChange: (date: Date) => void;
  calorieGoal: number;
  onUpdateGoal: (goal: number) => void;
}

// Georgian Date Helpers
const MONTHS_KA = [
  'იანვარი', 'თებერვალი', 'მარტი', 'აპრილი', 'მაისი', 'ივნისი',
  'ივლისი', 'აგვისტო', 'სექტემბერი', 'ოქტომბერი', 'ნოემბერი', 'დეკემბერი'
];

const WEEKDAYS_KA = ['ორშ', 'სამ', 'ოთხ', 'ხუთ', 'პარ', 'შაბ', 'კვი'];

export const DailySummary: React.FC<Props> = ({ 
  entries, 
  date, 
  onDateChange, 
  calorieGoal,
  onUpdateGoal
}) => {
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [tempGoal, setTempGoal] = useState(calorieGoal.toString());
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [calendarViewDate, setCalendarViewDate] = useState(new Date(date));

  const totals = entries.reduce((acc, entry) => {
    if (entry.analysis && entry.analysis.isFood) {
      acc.calories += entry.analysis.totalMacros.calories;
      acc.protein += entry.analysis.totalMacros.protein;
      acc.carbs += entry.analysis.totalMacros.carbs;
      acc.fat += entry.analysis.totalMacros.fat;
    }
    return acc;
  }, { calories: 0, protein: 0, carbs: 0, fat: 0 } as MacroNutrients);

  // Calculate targets based on calorie goal
  const GOALS = {
    calories: calorieGoal,
    protein: Math.round((calorieGoal * 0.25) / 4),
    carbs: Math.round((calorieGoal * 0.45) / 4),
    fat: Math.round((calorieGoal * 0.30) / 9)
  };

  const getPercentage = (current: number, target: number) => Math.min(100, (current / target) * 100);

  const isToday = (d: Date) => {
    const today = new Date();
    return d.getDate() === today.getDate() &&
           d.getMonth() === today.getMonth() &&
           d.getFullYear() === today.getFullYear();
  };

  const formatDate = (d: Date) => {
    if (isToday(d)) return "დღეს";
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.getDate() === yesterday.getDate() && 
        d.getMonth() === yesterday.getMonth() && 
        d.getFullYear() === yesterday.getFullYear()) {
      return "გუშინ";
    }

    return d.toLocaleDateString('ka-GE', { month: 'short', day: 'numeric' });
  };

  const changeDate = (days: number) => {
    const newDate = new Date(date);
    newDate.setDate(date.getDate() + days);
    onDateChange(newDate);
  };

  const handleSaveGoal = () => {
    const val = parseInt(tempGoal);
    if (!isNaN(val) && val > 0) {
      onUpdateGoal(val);
      setIsEditingGoal(false);
    }
  };

  // Calendar Logic
  const toggleCalendar = () => {
    setCalendarViewDate(new Date(date)); // Reset view to current selected date
    setIsCalendarOpen(!isCalendarOpen);
  };

  const handleMonthChange = (offset: number) => {
    const newDate = new Date(calendarViewDate);
    newDate.setMonth(newDate.getMonth() + offset);
    setCalendarViewDate(newDate);
  };

  const handleDateSelect = (day: number) => {
    const newDate = new Date(calendarViewDate.getFullYear(), calendarViewDate.getMonth(), day);
    onDateChange(newDate);
    setIsCalendarOpen(false);
  };

  const renderCalendarGrid = () => {
    const year = calendarViewDate.getFullYear();
    const month = calendarViewDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    // Adjust so Monday is index 0, Sunday is index 6
    let firstDayIndex = new Date(year, month, 1).getDay() - 1;
    if (firstDayIndex === -1) firstDayIndex = 6;

    const days = [];
    // Empty slots
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(<div key={`empty-${i}`} className="h-10" />);
    }

    // Days
    const today = new Date();
    const selected = new Date(date);

    for (let d = 1; d <= daysInMonth; d++) {
      const isSelected = selected.getDate() === d && selected.getMonth() === month && selected.getFullYear() === year;
      const isCurrentDay = today.getDate() === d && today.getMonth() === month && today.getFullYear() === year;

      days.push(
        <button
          key={d}
          onClick={() => handleDateSelect(d)}
          className={`
            h-10 w-10 rounded-full flex items-center justify-center text-sm font-medium transition-all
            ${isSelected ? 'text-white shadow-md' : 'hover:bg-gray-100 text-gray-700'}
            ${isCurrentDay && !isSelected ? 'border text-gray-700' : ''}
          `}
          style={{
            backgroundColor: isSelected ? '#f27141' : 'transparent',
            borderColor: isCurrentDay && !isSelected ? '#f27141' : 'transparent'
          }}
        >
          {d}
        </button>
      );
    }
    return days;
  };

  return (
    <div className="bg-white shadow-sm border-b border-gray-200 lg:sticky lg:top-0 lg:z-20 pb-2 pt-safe">
      <div className="max-w-md lg:max-w-4xl xl:max-w-6xl mx-auto px-4 lg:px-8 py-3">
        {/* Header Row */}
        <div className="flex flex-col lg:flex-row justify-between lg:items-center mb-4 gap-4 lg:gap-0">
          <div className="flex justify-center lg:justify-start items-center">
            <img 
              src={biteLogo}
              alt="Bite Logo" 
              className="w-[280px] h-[280px] lg:w-[200px] lg:h-[200px]"
            />
          </div>
          
          {/* Date Navigator */}
          <div className="flex justify-center lg:justify-end items-center bg-gray-100 rounded-full px-1 py-1">
            <button 
              onClick={() => changeDate(-1)}
              className="p-1 hover:bg-white rounded-full transition-colors text-gray-600"
            >
              <ChevronLeftIcon className="w-4 h-4" />
            </button>
            
            <button 
              onClick={toggleCalendar}
              className="flex items-center gap-2 mx-2 px-2 py-1 rounded-md hover:bg-white transition-colors"
            >
              <CalendarIcon className="w-3.5 h-3.5 text-gray-500" />
              <span className="text-sm font-medium min-w-[60px] text-center text-gray-800">
                {formatDate(date)}
              </span>
            </button>

            <button 
              onClick={() => changeDate(1)}
              className={`p-1 rounded-full transition-colors text-gray-600 ${isToday(date) ? 'opacity-30 cursor-not-allowed' : 'hover:bg-white'}`}
              disabled={isToday(date)}
            >
              <ChevronRightIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Calories Main Display */}
        <div className="flex flex-col lg:flex-row justify-between lg:items-end mb-3 gap-4 lg:gap-8">
            <div>
                <p className="text-lg font-bold" style={{color: '#f27141'}}>სულ მიღებული</p>
                <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-extrabold" style={{color: '#f27141'}}>{Math.round(totals.calories)}</span>
                    <button 
                      onClick={() => setIsEditingGoal(true)}
                      className="flex items-center gap-1 transition-colors text-sm font-medium"
                      style={{color: '#f27141'}}
                    >
                       / {GOALS.calories} კკალ
                       <PencilIcon className="w-3 h-3" style={{color: '#f27141'}} />
                    </button>
                </div>
            </div>
            
            {/* Pig image when calories exceeded */}
            {totals.calories > GOALS.calories && (
              <div className="flex justify-center lg:justify-end">
                <img 
                  src={pigImage}
                  alt="კალორიები გადაცილებულია!" 
                  className="w-24 h-24 lg:w-32 lg:h-32 animate-bounce"
                />
              </div>
            )}
        </div>

        {/* Progress Bar for Calories */}
        <div className="w-full bg-gray-100 rounded-full h-3 mb-4 overflow-hidden">
            <div 
                className="h-3 rounded-full transition-all duration-500 ease-out"
                style={{
                  backgroundColor: totals.calories > GOALS.calories ? '#ef4444' : '#f27141',
                  width: `${getPercentage(totals.calories, GOALS.calories)}%`
                }}
            ></div>
        </div>

        {/* Macros Mini Bars */}
        <div className="grid grid-cols-3 lg:grid-cols-6 xl:grid-cols-3 gap-3 lg:gap-6">
            <div className="space-y-1">
                <div className="flex justify-between text-xs">
                    <span className="text-gray-500">ნახშირწ.</span>
                    <span className="font-semibold">{Math.round(totals.carbs)}გ</span>
                </div>
                <div className="w-full bg-orange-100 rounded-full h-1.5">
                    <div className="h-1.5 rounded-full transition-all" style={{ width: `${getPercentage(totals.carbs, GOALS.carbs)}%`, backgroundColor: '#f27141' }}></div>
                </div>
            </div>
            <div className="space-y-1">
                <div className="flex justify-between text-xs">
                    <span className="text-gray-500">ცილა</span>
                    <span className="font-semibold">{Math.round(totals.protein)}გ</span>
                </div>
                <div className="w-full bg-orange-100 rounded-full h-1.5">
                    <div className="h-1.5 rounded-full transition-all" style={{ width: `${getPercentage(totals.protein, GOALS.protein)}%`, backgroundColor: '#f27141' }}></div>
                </div>
            </div>
             <div className="space-y-1">
                <div className="flex justify-between text-xs">
                    <span className="text-gray-500">ცხიმი</span>
                    <span className="font-semibold">{Math.round(totals.fat)}გ</span>
                </div>
                <div className="w-full bg-orange-100 rounded-full h-1.5">
                    <div className="h-1.5 rounded-full transition-all" style={{ width: `${getPercentage(totals.fat, GOALS.fat)}%`, backgroundColor: '#f27141' }}></div>
                </div>
            </div>
        </div>
      </div>

      {/* Goal Setting Modal */}
      {isEditingGoal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-6 w-full max-w-xs shadow-2xl transform scale-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4">დღიური მიზნის შეცვლა</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">კალორიები (კკალ)</label>
              <input 
                type="number" 
                value={tempGoal}
                onChange={(e) => setTempGoal(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                autoFocus
              />
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => setIsEditingGoal(false)}
                className="flex-1 py-2.5 text-gray-700 font-semibold hover:bg-gray-50 rounded-xl transition-colors"
              >
                გაუქმება
              </button>
              <button 
                onClick={handleSaveGoal}
                className="flex-1 py-2.5 text-white font-semibold rounded-xl transition-colors shadow-lg"
                style={{backgroundColor: '#f27141', boxShadow: '0 10px 15px -3px rgba(242, 113, 65, 0.3)'}}
              >
                შენახვა
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Calendar Modal */}
      {isCalendarOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-5 w-full max-w-sm shadow-2xl transform scale-100">
             {/* Calendar Header */}
             <div className="flex items-center justify-between mb-4">
                <button onClick={() => handleMonthChange(-1)} className="p-2 hover:bg-gray-100 rounded-full text-gray-600">
                  <ChevronLeftIcon className="w-5 h-5" />
                </button>
                <h3 className="text-lg font-bold text-gray-800">
                  {MONTHS_KA[calendarViewDate.getMonth()]} {calendarViewDate.getFullYear()}
                </h3>
                <button onClick={() => handleMonthChange(1)} className="p-2 hover:bg-gray-100 rounded-full text-gray-600">
                  <ChevronRightIcon className="w-5 h-5" />
                </button>
             </div>

             {/* Weekdays */}
             <div className="grid grid-cols-7 mb-2 text-center">
                {WEEKDAYS_KA.map(day => (
                  <span key={day} className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{day}</span>
                ))}
             </div>

             {/* Days Grid */}
             <div className="grid grid-cols-7 gap-1 place-items-center">
                {renderCalendarGrid()}
             </div>

             <button 
               onClick={() => setIsCalendarOpen(false)}
               className="w-full mt-6 py-2 text-gray-500 hover:text-gray-800 text-sm font-medium transition-colors"
             >
               დახურვა
             </button>
          </div>
        </div>
      )}
    </div>
  );
};