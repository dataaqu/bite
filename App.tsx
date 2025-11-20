
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { analyzeImage } from './services/geminiService';
import { FoodLogEntry, ViewState } from './types';
import { DailySummary } from './components/DailySummary';
import { NutritionCard } from './components/NutritionCard';
import { WeightInputPopup } from './components/WeightInputPopup';
import { DeleteConfirmPopup } from './components/DeleteConfirmPopup';
import { ImageDetailPopup } from './components/ImageDetailPopup';
import { PWAInstallPrompt } from './components/PWAInstallPrompt';
import { AuthPrompt } from './components/AuthPrompt';
import { AuthService } from './lib/auth';
import { APIService } from './lib/api';
import { CameraIcon, PlusIcon, AppleIcon, CarrotIcon, BreadIcon, MeatIcon, CheeseIcon, MilkIcon, SaladIcon, GrapeIcon } from './components/Icons';

// Helper to compress images before storage to avoid hitting LocalStorage 5MB limit
const compressImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const MAX_DIM = 800; // Resize to max 800px

        if (width > height) {
          if (width > MAX_DIM) {
            height *= MAX_DIM / width;
            width = MAX_DIM;
          }
        } else {
          if (height > MAX_DIM) {
            width *= MAX_DIM / height;
            height = MAX_DIM;
          }
        }

        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            resolve(event.target?.result as string);
            return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        // Compress to JPEG at 70% quality
        resolve(canvas.toDataURL('image/jpeg', 0.7)); 
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

export default function App() {
  // Database state
  const [entries, setEntries] = useState<FoodLogEntry[]>([]);
  const [calorieGoal, setCalorieGoal] = useState<number>(2200);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Auth state  
  const [currentUser, setCurrentUser] = useState(AuthService.getCurrentUser());
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);

  const [viewState, setViewState] = useState<ViewState>(ViewState.DASHBOARD);
  const [currentDate, setCurrentDate] = useState(new Date());
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Weight input popup state
  const [showWeightPopup, setShowWeightPopup] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  // Delete confirmation popup state
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  // Edit State
  const [editingEntry, setEditingEntry] = useState<FoodLogEntry | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0
  });

  // Image popup state
  const [showImagePopup, setShowImagePopup] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<FoodLogEntry | null>(null);

  // Load data on mount and when date changes
  useEffect(() => {
    loadData();
  }, [currentDate, currentUser]);

  // Load user settings on mount
  useEffect(() => {
    loadUserSettings();
  }, [currentUser]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const userId = AuthService.getCurrentUserId();
      const response = await APIService.getFoodEntries(userId, currentDate);
      
      if (response.success && response.data) {
        const foodLogEntries = APIService.convertDBEntriesToFoodLogEntries(response.data);
        setEntries(foodLogEntries);
      } else {
        setError(response.error || 'Failed to load entries');
      }
    } catch (error) {
      setError('Network error occurred');
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserSettings = async () => {
    if (!currentUser) return;
    
    try {
      const response = await APIService.getUserSettings(currentUser.id);
      
      if (response.success && response.data) {
        setCalorieGoal(response.data.calorie_goal);
      }
    } catch (error) {
      console.error('Error loading user settings:', error);
    }
  };

  // Filter entries for the currently selected date
  const filteredEntries = useMemo(() => {
    return entries.filter(entry => {
      const entryDate = new Date(entry.timestamp);
      return (
        entryDate.getDate() === currentDate.getDate() &&
        entryDate.getMonth() === currentDate.getMonth() &&
        entryDate.getFullYear() === currentDate.getFullYear()
      );
    }).sort((a, b) => b.timestamp - a.timestamp); // Newest first
  }, [entries, currentDate]);

  // Handler for image upload (File Input)
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Store the file and show weight popup
    setPendingFile(file);
    setShowWeightPopup(true);

    // Reset input so same file can be selected again if needed
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Handler for weight popup confirmation
  const handleWeightConfirm = async (weight: number | null) => {
    setShowWeightPopup(false);
    
    if (!pendingFile) {
      setPendingFile(null);
      return;
    }

    const file = pendingFile;
    setPendingFile(null);

    // Always switch to "Today" when adding a new meal
    setCurrentDate(new Date());

    try {
      // Compress image first
      const compressedBase64 = await compressImage(file);
      
      const userId = AuthService.getCurrentUserId();
      const timestamp = Date.now();
      
      // Create entry in database
      const response = await APIService.createFoodEntry(
        userId,
        timestamp,
        compressedBase64,
        undefined, // analysis_data will be added after processing
        weight
      );

      if (!response.success) {
        throw new Error(response.error || 'Failed to create entry');
      }

      const dbEntry = response.data!;
      
      // Create temporary UI entry with loading state
      const tempEntry: FoodLogEntry = {
        id: dbEntry.id,
        timestamp: dbEntry.timestamp,
        imageUrl: dbEntry.image_url,
        analysis: null,
        loading: true,
        userProvidedWeight: dbEntry.user_provided_weight,
      };

      setEntries(prev => [tempEntry, ...prev]);
      setViewState(ViewState.DASHBOARD);

      try {
        const result = await analyzeImage(compressedBase64, weight);
        
        // Update entry in database with analysis results
        const updateResponse = await APIService.updateFoodEntry(
          dbEntry.id,
          userId,
          result
        );

        if (updateResponse.success) {
          setEntries(prev => prev.map(entry => 
              entry.id === dbEntry.id 
              ? { ...entry, loading: false, analysis: result } 
              : entry
          ));
        } else {
          throw new Error('Failed to update analysis');
        }
      } catch (error) {
        console.error(error);
        setEntries(prev => prev.map(entry => 
            entry.id === dbEntry.id 
            ? { ...entry, loading: false, error: 'სურათის დამუშავება ვერ მოხერხდა.' } 
            : entry
        ));
      }
    } catch (e) {
      console.error("Error processing image", e);
      alert("სურათის დამუშავება ვერ მოხერხდა. გთხოვთ სცადოთ სხვა ფოტო.");
    }
  };

  // Handler for weight popup cancellation
  const handleWeightCancel = () => {
    setShowWeightPopup(false);
    setPendingFile(null);
  };

  const handleDelete = (id: string) => {
    setPendingDeleteId(id);
    setShowDeletePopup(true);
  };

  const handleDeleteConfirm = async () => {
    if (pendingDeleteId) {
      try {
        const userId = AuthService.getCurrentUserId();
        const response = await APIService.deleteFoodEntry(pendingDeleteId, userId);
        
        if (response.success) {
          setEntries(prev => prev.filter(e => e.id !== pendingDeleteId));
        } else {
          alert('წაშლა ვერ მოხერხდა: ' + (response.error || 'უცნობი შეცდომა'));
        }
      } catch (error) {
        console.error('Delete error:', error);
        alert('წაშლა ვერ მოხერხდა');
      }
    }
    setShowDeletePopup(false);
    setPendingDeleteId(null);
  };

  const handleDeleteCancel = () => {
    setShowDeletePopup(false);
    setPendingDeleteId(null);
  };

  const handleEditClick = (entry: FoodLogEntry) => {
    if (!entry.analysis) return;
    setEditingEntry(entry);
    setEditForm({
      name: entry.analysis.summary,
      calories: Math.round(entry.analysis.totalMacros.calories),
      protein: Math.round(entry.analysis.totalMacros.protein),
      carbs: Math.round(entry.analysis.totalMacros.carbs),
      fat: Math.round(entry.analysis.totalMacros.fat),
    });
  };

  const handleSaveEdit = async () => {
    if (!editingEntry || !editingEntry.analysis) return;

    try {
      const userId = AuthService.getCurrentUserId();
      const updatedAnalysis = {
        ...editingEntry.analysis,
        summary: editForm.name,
        totalMacros: {
          calories: Number(editForm.calories),
          protein: Number(editForm.protein),
          carbs: Number(editForm.carbs),
          fat: Number(editForm.fat)
        }
      };

      const response = await APIService.updateFoodEntry(
        editingEntry.id,
        userId,
        updatedAnalysis
      );

      if (response.success) {
        setEntries(prev => prev.map(e => {
          if (e.id === editingEntry.id) {
            return {
              ...e,
              analysis: updatedAnalysis
            };
          }
          return e;
        }));
      } else {
        alert('შეცვლა ვერ მოხერხდა: ' + (response.error || 'უცნობი შეცდომა'));
      }
    } catch (error) {
      console.error('Edit error:', error);
      alert('შეცვლა ვერ მოხერხდა');
    }

    setEditingEntry(null);
  };

  const handleAddClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleImageClick = (entry: FoodLogEntry) => {
    setSelectedEntry(entry);
    setShowImagePopup(true);
  };

  const handleCloseImagePopup = () => {
    setShowImagePopup(false);
    setSelectedEntry(null);
  };

  const handleUpdateCalorieGoal = async (goal: number) => {
    try {
      const userId = AuthService.getCurrentUserId();
      
      if (currentUser) {
        // Authenticated user - save to database
        const response = await APIService.updateUserSettings(userId, goal);
        
        if (response.success) {
          setCalorieGoal(goal);
        } else {
          alert('მიზნის შენახვა ვერ მოხერხდა: ' + (response.error || 'უცნობი შეცდომა'));
        }
      } else {
        // Anonymous user - just update local state
        setCalorieGoal(goal);
      }
    } catch (error) {
      console.error('Update calorie goal error:', error);
      alert('მიზნის შენახვა ვერ მოხერხდა');
    }
  };

  const handleLogin = (user: any) => {
    setCurrentUser(user);
    // Reload data for the authenticated user
    loadData();
    loadUserSettings();
  };

  const handleLogout = () => {
    AuthService.logout();
    setCurrentUser(null);
    setEntries([]);
    setCalorieGoal(2200);
    loadData(); // Load data for new anonymous user
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Sticky Header with Summary */}
      <DailySummary 
        entries={filteredEntries} 
        date={currentDate}
        onDateChange={setCurrentDate}
        calorieGoal={calorieGoal}
        onUpdateGoal={handleUpdateCalorieGoal}
      />

      {/* Main Content Area */}
      <main className="max-w-md lg:max-w-4xl xl:max-w-6xl mx-auto px-4 lg:px-8 pt-6 relative">
        
        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{borderColor: '#f27141'}}></div>
            <p className="text-gray-500 mt-4">მონაცემების ჩატვირთვა...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="p-6 rounded-full mb-4 bg-red-100">
                <span className="text-red-500 text-2xl">⚠️</span>
            </div>
            <h2 className="text-xl font-semibold text-gray-800">შეცდომა</h2>
            <p className="text-gray-500 mt-2">{error}</p>
            <button 
              onClick={loadData}
              className="mt-4 px-4 py-2 rounded-lg text-white font-medium"
              style={{backgroundColor: '#f27141'}}
            >
              თავიდან ცდა
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredEntries.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center opacity-60">
            <div className="p-6 rounded-full mb-4" style={{backgroundColor: 'rgba(242, 113, 65, 0.1)'}}>
                <CameraIcon className="w-12 h-12" style={{color: '#f27141'}} />
            </div>
            <h2 className="text-xl font-semibold text-gray-800">ჩანაწერები არ მოიძებნა</h2>
            <p className="text-gray-500 mt-2">
              {currentDate.toDateString() === new Date().toDateString() 
                ? "დააჭირე + ღილაკს ფოტოს გადასაღებად!" 
                : "ამ დღეს მონაცემები არ არის."}
            </p>
            {!currentUser && (
              <button 
                onClick={() => setShowAuthPrompt(true)}
                className="mt-4 px-4 py-2 text-sm rounded-lg border border-orange-200 text-orange-600 hover:bg-orange-50 transition-colors"
              >
                შესვლა მონაცემების შესანახად
              </button>
            )}
          </div>
        )}

        <div className="space-y-4 lg:grid lg:grid-cols-2 xl:grid-cols-3 lg:gap-6 lg:space-y-0 relative z-10">
          {filteredEntries.map(entry => (
            <NutritionCard 
                key={entry.id} 
                entry={entry} 
                onDelete={handleDelete}
                onEdit={handleEditClick}
                onImageClick={handleImageClick}
            />
          ))}
        </div>
      </main>

      {/* Hidden File Input for "Camera" */}
      <input 
        type="file" 
        accept="image/*" 
        capture="environment" // Hints to open camera on mobile
        ref={fileInputRef}
        onChange={handleImageUpload}
        className="hidden"
      />

      {/* Sticky Floating Action Button - Only show if viewing Today */}
      {currentDate.toDateString() === new Date().toDateString() && (
        <div className="fixed bottom-6 left-0 right-0 flex justify-center z-30 pointer-events-none">
          <button 
            onClick={handleAddClick}
            className="pointer-events-auto shadow-xl text-white rounded-full p-4 transition-transform transform hover:scale-105 active:scale-95 flex items-center gap-2 pr-6"
            style={{backgroundColor: '#f27141'}}
          >
            <div className="bg-white/20 p-1 rounded-full">
              <PlusIcon className="w-6 h-6" />
            </div>
            <span className="font-semibold text-lg">კვების დამატება</span>
          </button>
        </div>
      )}
      
      {/* Gradient fade at bottom for aesthetics */}
      <div className="fixed bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-gray-50 to-transparent pointer-events-none z-10"></div>

      {/* Edit Modal */}
      {editingEntry && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-gray-900 mb-4">კერძის რედაქტირება</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">სახელი</label>
                <input 
                  type="text" 
                  value={editForm.name}
                  onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">კალორია (კკალ)</label>
                  <input 
                    type="number" 
                    value={editForm.calories}
                    onChange={(e) => setEditForm({...editForm, calories: Number(e.target.value)})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                   <label className="block text-xs font-medium text-gray-500 mb-1">ცილა (გ)</label>
                   <input 
                    type="number" 
                    value={editForm.protein}
                    onChange={(e) => setEditForm({...editForm, protein: Number(e.target.value)})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                   <label className="block text-xs font-medium text-gray-500 mb-1">ნახშირწ. (გ)</label>
                   <input 
                    type="number" 
                    value={editForm.carbs}
                    onChange={(e) => setEditForm({...editForm, carbs: Number(e.target.value)})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                   <label className="block text-xs font-medium text-gray-500 mb-1">ცხიმი (გ)</label>
                   <input 
                    type="number" 
                    value={editForm.fat}
                    onChange={(e) => setEditForm({...editForm, fat: Number(e.target.value)})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button 
                onClick={() => setEditingEntry(null)}
                className="flex-1 py-2.5 text-gray-700 font-semibold hover:bg-gray-50 rounded-xl transition-colors"
              >
                გაუქმება
              </button>
              <button 
                onClick={handleSaveEdit}
                className="flex-1 py-2.5 text-white font-semibold rounded-xl transition-colors shadow-lg"
                style={{backgroundColor: '#f27141', boxShadow: '0 10px 15px -3px rgba(242, 113, 65, 0.3)'}}
              >
                შენახვა
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Weight Input Popup */}
      <WeightInputPopup
        isOpen={showWeightPopup}
        onConfirm={handleWeightConfirm}
        onCancel={handleWeightCancel}
      />

      {/* Delete Confirmation Popup */}
      <DeleteConfirmPopup
        isOpen={showDeletePopup}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />

      {/* Image Detail Popup */}
      {selectedEntry && (
        <ImageDetailPopup
          entry={selectedEntry}
          isOpen={showImagePopup}
          onClose={handleCloseImagePopup}
        />
      )}

      {/* PWA Install Prompt */}
      <PWAInstallPrompt />

      {/* Auth Prompt */}
      <AuthPrompt
        isOpen={showAuthPrompt}
        onClose={() => setShowAuthPrompt(false)}
        onLogin={handleLogin}
      />
    </div>
  );
}
