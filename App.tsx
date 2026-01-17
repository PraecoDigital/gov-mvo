
import React, { useState, useMemo, useRef, useCallback } from 'react';
import { 
  InspectionFormData, 
  VehicleClass, 
  InspectionStatus, 
  InspectionChecklistItem,
  AISafetyResponse
} from './types';
import { INITIAL_CHECKLIST } from './constants';
import { analyzeSafetyStatus } from './geminiService';

// --- Sub-components ---

const CameraModal: React.FC<{
  onCapture: (base64: string) => void;
  onClose: () => void;
}> = ({ onCapture, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isReady, setIsReady] = useState(false);

  React.useEffect(() => {
    let stream: MediaStream | null = null;
    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' }, 
          audio: false 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setIsReady(true);
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
        alert("Could not access camera. Please check permissions.");
        onClose();
      }
    };
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        onCapture(dataUrl);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center p-4">
      <div className="relative w-full max-w-md aspect-[3/4] bg-slate-900 rounded-3xl overflow-hidden shadow-2xl">
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          className="w-full h-full object-cover"
        />
        <canvas ref={canvasRef} className="hidden" />
        
        <div className="absolute inset-x-0 bottom-8 flex justify-center items-center gap-8">
          <button 
            onClick={onClose}
            className="p-4 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/30 transition-all"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          <button 
            onClick={takePhoto}
            className="w-20 h-20 bg-white rounded-full border-8 border-white/30 shadow-xl flex items-center justify-center active:scale-90 transition-all"
          >
            <div className="w-14 h-14 bg-white rounded-full border-2 border-slate-300" />
          </button>

          <div className="w-14" /> {/* Spacer */}
        </div>

        {!isReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900 text-white font-bold">
            INITIALIZING CAMERA...
          </div>
        )}
      </div>
    </div>
  );
};

const SectionHeader: React.FC<{ 
  title: string; 
  icon?: React.ReactNode; 
  isOpen?: boolean; 
  onToggle?: () => void;
  isCollapsible?: boolean;
  count?: string;
}> = ({ title, icon, isOpen, onToggle, isCollapsible, count }) => (
  <div 
    className={`flex items-center justify-between py-3 px-1 border-b border-slate-200 ${isCollapsible ? 'cursor-pointer select-none' : ''}`}
    onClick={isCollapsible ? onToggle : undefined}
  >
    <div className="flex items-center gap-2">
      {icon}
      <h3 className="text-sm md:text-lg font-bold text-slate-700 uppercase tracking-wide">{title}</h3>
      {count && <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-bold">{count}</span>}
    </div>
    {isCollapsible && (
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        className={`h-5 w-5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
        fill="none" viewBox="0 0 24 24" stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    )}
  </div>
);

const CheckboxItem: React.FC<{ 
  item: InspectionChecklistItem; 
  onToggle: (id: string) => void;
  onNoteChange: (id: string, note: string) => void;
  onOpenCamera: (id: string) => void;
}> = ({ item, onToggle, onNoteChange, onOpenCamera }) => (
  <div className={`flex flex-col p-4 mb-3 rounded-xl border transition-all shadow-sm ${item.value ? 'bg-white border-slate-200' : 'bg-orange-50 border-orange-200'}`}>
    <div className="flex items-start gap-4">
      <div className="relative flex items-center h-6 mt-0.5">
        <input 
          type="checkbox" 
          checked={item.value} 
          onChange={() => onToggle(item.id)}
          className="w-6 h-6 rounded-md text-indigo-600 focus:ring-indigo-500 cursor-pointer border-slate-300"
        />
      </div>
      <div className="flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`text-base font-semibold ${item.value ? 'text-slate-800' : 'text-orange-900'}`}>
            {item.label}
          </span>
          {item.isCritical && (
            <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-black uppercase ring-1 ring-red-200">
              Critical Safety
            </span>
          )}
        </div>
        {!item.value && (
          <div className="mt-3 space-y-3">
            <input 
              type="text"
              placeholder="Provide defect details..."
              className="w-full text-base p-3 rounded-lg bg-white border border-orange-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
              value={item.notes || ''}
              onChange={(e) => onNoteChange(item.id, e.target.value)}
            />
            <div className="flex items-center gap-3">
              <button 
                type="button"
                onClick={() => onOpenCamera(item.id)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-md active:scale-95"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {item.image ? 'Update Evidence' : 'Capture Evidence'}
              </button>
              {item.image && (
                <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-slate-300">
                  <img src={item.image} className="w-full h-full object-cover" alt="evidence" />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  </div>
);

export default function App() {
  const [formData, setFormData] = useState<InspectionFormData>({
    inspectorName: '',
    inspectionDate: new Date().toISOString().split('T')[0],
    vehiclePlate: '',
    vehicleMake: '',
    vehicleModel: '',
    vehicleYear: '',
    vehicleClass: VehicleClass.PRIVATE,
    vinNumber: '',
    engineNumber: '',
    odometer: '',
    checklist: INITIAL_CHECKLIST,
    overallStatus: InspectionStatus.PENDING,
  });

  const [aiAnalysis, setAiAnalysis] = useState<AISafetyResponse | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [activeCameraItemId, setActiveCameraItemId] = useState<string | null>(null);
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({
    'Identification': true,
    'Lighting': true
  });

  const categories = useMemo(() => Array.from(new Set(INITIAL_CHECKLIST.map(i => i.category))), []);

  const progress = useMemo(() => {
    const passed = formData.checklist.filter(i => i.value).length;
    return Math.round((passed / formData.checklist.length) * 100);
  }, [formData.checklist]);

  const toggleCategory = (cat: string) => {
    setOpenCategories(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

  const toggleCheck = (id: string) => {
    setFormData(prev => ({
      ...prev,
      checklist: prev.checklist.map(item => 
        item.id === id ? { ...item, value: !item.value } : item
      )
    }));
  };

  const updateNote = (id: string, note: string) => {
    setFormData(prev => ({
      ...prev,
      checklist: prev.checklist.map(item => 
        item.id === id ? { ...item, notes: note } : item
      )
    }));
  };

  const handleCaptureImage = (base64: string) => {
    if (activeCameraItemId) {
      setFormData(prev => ({
        ...prev,
        checklist: prev.checklist.map(item => 
          item.id === activeCameraItemId ? { ...item, image: base64 } : item
        )
      }));
      setActiveCameraItemId(null);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const calculateVerdict = () => {
    const criticalFails = formData.checklist.filter(item => item.isCritical && !item.value);
    const nonCriticalFails = formData.checklist.filter(item => !item.isCritical && !item.value);
    if (criticalFails.length > 0) return InspectionStatus.FAIL;
    if (nonCriticalFails.length > 3) return InspectionStatus.FAIL;
    return InspectionStatus.PASS;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAnalyzing(true);
    const verdict = calculateVerdict();
    const updatedData = { ...formData, overallStatus: verdict };
    const analysis = await analyzeSafetyStatus(updatedData);
    setAiAnalysis(analysis);
    setFormData(updatedData);
    setIsAnalyzing(false);
    setIsSubmitted(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      {/* Camera Modal Overlay */}
      {activeCameraItemId && (
        <CameraModal 
          onCapture={handleCaptureImage} 
          onClose={() => setActiveCameraItemId(null)} 
        />
      )}

      {/* Sticky Mobile Header */}
      <header className="bg-indigo-700 text-white shadow-lg sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 py-4 md:py-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-black leading-tight tracking-tight uppercase">T&T Inspection</h1>
              <p className="text-[10px] text-indigo-200 font-bold uppercase opacity-80">Cap. 48:50 Standard</p>
            </div>
          </div>
          {isSubmitted && (
            <div className={`px-4 py-1.5 rounded-full font-black text-xs md:text-sm border-2 ${
              formData.overallStatus === InspectionStatus.PASS 
                ? 'bg-green-500 border-green-400' 
                : 'bg-red-500 border-red-400'
            }`}>
              {formData.overallStatus}
            </div>
          )}
        </div>
        {/* Progress bar */}
        {!isSubmitted && (
          <div className="w-full h-1 bg-indigo-800">
            <div 
              className="h-full bg-green-400 transition-all duration-500" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        )}
      </header>

      <main className="max-w-4xl mx-auto px-4 md:px-6 mt-6">
        {isSubmitted && aiAnalysis && (
          <div className={`mb-6 p-5 md:p-8 rounded-2xl border-2 shadow-lg transition-all ${
            aiAnalysis.riskLevel === 'HIGH' ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'
          }`}>
            <div className="flex items-center gap-4 mb-4">
              <div className={`p-3 rounded-xl ${aiAnalysis.riskLevel === 'HIGH' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">AI Safety Audit</h2>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-black px-2 py-0.5 rounded-full ${
                    aiAnalysis.riskLevel === 'HIGH' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'
                  }`}>
                    {aiAnalysis.riskLevel} RISK
                  </span>
                </div>
              </div>
            </div>
            <p className="text-slate-700 leading-relaxed text-sm md:text-base mb-6 font-medium">{aiAnalysis.summary}</p>
            <div className="bg-white/50 p-4 rounded-xl border border-slate-200/50">
              <h4 className="font-black text-xs text-slate-500 uppercase tracking-widest mb-3">Road Safety Directives:</h4>
              <ul className="space-y-2">
                {aiAnalysis.recommendations.map((rec, i) => (
                  <li key={i} className="flex gap-3 text-sm text-slate-700 font-medium">
                    <span className="text-indigo-500 font-bold">•</span>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
            <button 
              onClick={() => setIsSubmitted(false)}
              className="mt-6 w-full md:w-auto text-indigo-600 text-sm font-black uppercase tracking-tighter hover:underline px-4 py-2"
            >
              ← Edit Inspection
            </button>
          </div>
        )}

        {!isSubmitted ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Inspector Details */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
              <SectionHeader title="Inspector Information" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 mb-1.5 uppercase tracking-widest">Full Name</label>
                  <input 
                    required name="inspectorName" value={formData.inspectorName} onChange={handleInputChange} type="text" 
                    className="w-full p-4 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-base font-semibold" 
                    placeholder="Inspector Name"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 mb-1.5 uppercase tracking-widest">Date of Inspection</label>
                  <input 
                    required name="inspectionDate" value={formData.inspectionDate} onChange={handleInputChange} type="date" 
                    className="w-full p-4 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-base font-semibold" 
                  />
                </div>
              </div>
            </div>

            {/* Vehicle Details */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
              <SectionHeader title="Vehicle Info" />
              <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mt-4">
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black text-slate-400 mb-1.5 uppercase tracking-widest">Registration Plate</label>
                  <input 
                    required name="vehiclePlate" value={formData.vehiclePlate} onChange={handleInputChange} placeholder="e.g. PCG 4567" type="text" 
                    className="w-full p-4 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none uppercase font-black text-lg text-indigo-700" 
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black text-slate-400 mb-1.5 uppercase tracking-widest">Vehicle Class</label>
                  <select 
                    name="vehicleClass" value={formData.vehicleClass} onChange={handleInputChange}
                    className="w-full p-4 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-base font-semibold h-[58px]"
                  >
                    {Object.values(VehicleClass).map(vc => <option key={vc} value={vc}>{vc}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 mb-1.5 uppercase tracking-widest">Make</label>
                  <input required name="vehicleMake" value={formData.vehicleMake} onChange={handleInputChange} placeholder="Toyota" type="text" className="w-full p-4 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-base font-semibold" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 mb-1.5 uppercase tracking-widest">Model</label>
                  <input required name="vehicleModel" value={formData.vehicleModel} onChange={handleInputChange} placeholder="Hilux" type="text" className="w-full p-4 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-base font-semibold" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black text-slate-400 mb-1.5 uppercase tracking-widest">Chassis / VIN</label>
                  <input required name="vinNumber" value={formData.vinNumber} onChange={handleInputChange} type="text" className="w-full p-4 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none uppercase font-mono text-base tracking-wider" />
                </div>
              </div>
            </div>

            {/* Checklist with Accordions */}
            <div className="space-y-4">
              {categories.map(cat => {
                const isOpen = openCategories[cat] || false;
                const items = formData.checklist.filter(item => item.category === cat);
                const passedCount = items.filter(i => i.value).length;
                
                return (
                  <div key={cat} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <SectionHeader 
                      title={cat} 
                      isCollapsible 
                      isOpen={isOpen} 
                      onToggle={() => toggleCategory(cat)}
                      count={`${passedCount}/${items.length}`}
                    />
                    {isOpen && (
                      <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-x-6 animate-in slide-in-from-top-2 duration-200">
                        {items.map(item => (
                          <CheckboxItem 
                            key={item.id} 
                            item={item} 
                            onToggle={toggleCheck} 
                            onNoteChange={updateNote} 
                            onOpenCamera={setActiveCameraItemId}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Sticky Submission Button for Mobile */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-slate-50/80 backdrop-blur-lg border-t border-slate-200 z-40 md:static md:p-0 md:bg-transparent md:border-none">
              <button 
                type="submit" 
                disabled={isAnalyzing}
                className={`w-full max-w-4xl mx-auto py-5 rounded-2xl font-black text-lg shadow-2xl transition-all flex items-center justify-center gap-3 active:scale-[0.98] ${
                  isAnalyzing ? 'bg-slate-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                }`}
              >
                {isAnalyzing ? (
                  <>
                    <div className="animate-spin h-6 w-6 border-4 border-white border-t-transparent rounded-full"></div>
                    RUNNING AI AUDIT...
                  </>
                ) : (
                  'FINALIZE INSPECTION'
                )}
              </button>
            </div>
          </form>
        ) : (
          <div className="animate-in fade-in zoom-in duration-300">
             <div className="bg-white p-8 md:p-16 rounded-3xl shadow-2xl border border-slate-200 text-center relative overflow-hidden">
               <div className={`absolute top-0 left-0 w-full h-2 ${formData.overallStatus === InspectionStatus.PASS ? 'bg-green-500' : 'bg-red-500'}`} />
               
               <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-6 ${formData.overallStatus === InspectionStatus.PASS ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   {formData.overallStatus === InspectionStatus.PASS 
                    ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
                    : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M6 18L18 6M6 6l12 12" />
                   }
                 </svg>
               </div>
               
               <h2 className="text-4xl font-black text-slate-900 mb-4 uppercase tracking-tighter">Result: {formData.overallStatus}</h2>
               <p className="text-slate-500 text-sm md:text-base font-medium mb-10 leading-relaxed max-w-md mx-auto">
                 Official vehicle roadworthiness assessment concluded for registration 
                 <span className="text-indigo-600 font-black px-1 uppercase">{formData.vehiclePlate}</span>.
               </p>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left max-w-lg mx-auto mb-12 border-y border-slate-100 py-8">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Vehicle Platform</span>
                    <span className="font-bold text-slate-800 text-lg uppercase">{formData.vehicleMake} {formData.vehicleModel}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Certification Date</span>
                    <span className="font-bold text-slate-800 text-lg">{new Date(formData.inspectionDate).toLocaleDateString('en-TT', { dateStyle: 'long' })}</span>
                  </div>
               </div>

               <div className="flex flex-col md:flex-row gap-4 justify-center">
                 <button 
                    onClick={() => window.print()}
                    className="w-full md:w-auto bg-slate-900 text-white px-10 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl active:scale-95"
                 >
                   Print Certificate
                 </button>
                 <button 
                    onClick={() => { setIsSubmitted(false); setFormData(prev => ({ ...prev, checklist: INITIAL_CHECKLIST })); }}
                    className="w-full md:w-auto bg-white text-slate-900 border-2 border-slate-200 px-10 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-50 transition-all active:scale-95"
                 >
                   New Inspection
                 </button>
               </div>
             </div>
          </div>
        )}
      </main>

      <footer className="mt-12 text-center text-slate-400 p-8 border-t border-slate-100">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">
            Transport Division Standards &bull; Cap. 48:50 &bull; Trinidad and Tobago
          </p>
          <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            Cloud Verified Audit
          </p>
        </div>
      </footer>
    </div>
  );
}
