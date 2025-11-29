
import React, { useState, useEffect } from 'react';
import { Search, X, User, Cake, Calendar, Activity, Eye, Stethoscope, UserPlus } from 'lucide-react';
import { operationData, operationCollections, surgeons, assistants, visualAcuityOptions } from '../constants';

// --- National ID Parser Utility ---
const parseNationalId = (id) => {
  if (!id || id.length !== 14) {
    return null;
  }
  try {
    const century = parseInt(id.substring(0, 1), 10);
    const year = parseInt(id.substring(1, 3), 10);
    const month = parseInt(id.substring(3, 5), 10);
    const day = parseInt(id.substring(5, 7), 10);
    const genderDigit = parseInt(id.substring(12, 13), 10);

    const birthYear = (century === 2 ? 1900 : 2000) + year;

    const dob = new Date(birthYear, month - 1, day);
    if (isNaN(dob.getTime())) return null; // Invalid date

    const age = new Date().getFullYear() - dob.getFullYear();
    const gender = genderDigit % 2 !== 0 ? 'Male' : 'Female';

    // Manual formatting to ensure clean LTR string (DD/MM/YYYY)
    const formattedDob = `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${birthYear}`;

    return { dob: formattedDob, age, gender };
  } catch (e) {
    return null;
  }
};

interface AddSurgeryFormProps {
  editingRoom: string | number;
  setShowAddForm: (show: boolean) => void;
  initialDateTime: string;
  onAddSurgery: (roomId: string | number, surgeryData: any) => void;
}

const AddSurgeryForm: React.FC<AddSurgeryFormProps> = ({ editingRoom, setShowAddForm, initialDateTime, onAddSurgery }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [nationalIdError, setNationalIdError] = useState('');
  
  const [formData, setFormData] = useState({
    patientName: '',
    nationalId: '',
    dateTime: initialDateTime || '',
    anesthesiaType: 'Local', // Default value
    surgeonName: '',
    surgeonAssistant: '',
    operationCollection: '',
    operationName: '',
    eye: 'Left Eye', // Default value
    // Derived from nationalId
    dob: null,
    age: null,
    gender: null,
    // New Fields
    visualAcuityRight: '',
    visualAcuityLeft: '',
    refractionRight: '',
    refractionLeft: '',
    iolPowerRight: '',
    iolPowerLeft: '',
  });

  // Effect to parse National ID
  useEffect(() => {
    const id = formData.nationalId;
    if (!id) {
      setNationalIdError('');
      return;
    }

    if (!/^[0-9]+$/.test(id)) {
      setNationalIdError('National ID must contain only numbers.');
      return;
    }

    if (id.length !== 14) {
      setNationalIdError('National ID must be 14 digits long.');
      return;
    }

    const idInfo = parseNationalId(id);
    if (idInfo) {
      setFormData(prev => ({ ...prev, ...idInfo }));
      setNationalIdError('');
    } else {
      setNationalIdError('Invalid National ID format.');
    }
  }, [formData.nationalId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = () => {
    if (!formData.patientName || !formData.nationalId || !formData.dateTime || !formData.anesthesiaType || !formData.surgeonName || !formData.operationCollection || !formData.operationName || !formData.eye) {
      alert('Please fill all fields');
      return;
    }
    onAddSurgery(editingRoom, formData);
    setShowAddForm(false);
  };

  return (
    <>
    <style>{`
      .slider::-webkit-slider-thumb {
        appearance: none;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background: linear-gradient(135deg, #3b82f6, #2563eb);
        cursor: pointer;
        box-shadow: 0 2px 8px rgba(59, 130, 246, 0.5);
        transition: all 0.2s;
      }
      .slider::-webkit-slider-thumb:hover {
        transform: scale(1.2);
        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.7);
      }
      .slider::-moz-range-thumb {
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background: linear-gradient(135deg, #3b82f6, #2563eb);
        cursor: pointer;
        border: none;
        box-shadow: 0 2px 8px rgba(59, 130, 246, 0.5);
        transition: all 0.2s;
      }
      .slider::-moz-range-thumb:hover {
        transform: scale(1.2);
        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.7);
      }
      .slider::-webkit-slider-runnable-track {
        background: linear-gradient(to right, 
          #ef4444 0%, 
          #f59e0b 25%, 
          #10b981 50%, 
          #f59e0b 75%, 
          #ef4444 100%);
        border-radius: 10px;
        height: 12px;
      }
      .slider::-moz-range-track {
        background: linear-gradient(to right, 
          #ef4444 0%, 
          #f59e0b 25%, 
          #10b981 50%, 
          #f59e0b 75%, 
          #ef4444 100%);
        border-radius: 10px;
        height: 12px;
      }
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes slideIn {
        from { opacity: 0; transform: translateX(-20px); }
        to { opacity: 1; transform: translateX(0); }
      }
      .animate-fadeIn {
        animation: fadeIn 0.3s ease-out;
      }
      .animate-slideIn {
        animation: slideIn 0.4s ease-out;
      }
    `}</style>
    
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-gray-800 rounded-xl sm:rounded-2xl shadow-2xl overflow-hidden w-full max-w-5xl max-h-[98vh] sm:max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-blue-900 p-4 sm:p-6 sticky top-0 z-10">
          <div className="flex justify-between items-start sm:items-center gap-2">
            <div className="flex-1">
              <h2 className="text-xl sm:text-3xl font-bold text-white flex items-center gap-2 sm:gap-3">
                <Stethoscope size={24} className="sm:hidden" />
                <Stethoscope size={32} className="hidden sm:block" />
                <span className="leading-tight">Add Surgery - Room {editingRoom}</span>
              </h2>
              <p className="text-blue-100 mt-1 text-xs sm:text-base">Complete all sections to schedule the surgery</p>
            </div>
            <button onClick={() => setShowAddForm(false)} className="text-white hover:bg-white/20 p-2 rounded-lg transition flex-shrink-0">
              <X size={24} className="sm:hidden" />
              <X size={28} className="hidden sm:block" />
            </button>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="bg-gray-750 px-3 sm:px-6 py-4 sm:py-5 sticky top-[88px] sm:top-[120px] z-10">
          <div className="flex items-center justify-between">
            {[
              { num: 1, title: 'Patient', fullTitle: 'Patient Info', icon: User },
              { num: 2, title: 'Operation', fullTitle: 'Operation Details', icon: Activity },
              { num: 3, title: 'Clinical', fullTitle: 'Clinical Data', icon: Eye },
              { num: 4, title: 'Team', fullTitle: 'Team & Schedule', icon: Calendar }
            ].map((step, idx) => {
              const isStepComplete = (stepNum) => {
                switch(stepNum) {
                  case 1:
                    return formData.patientName && formData.nationalId.length === 14 && formData.anesthesiaType;
                  case 2:
                    return formData.operationCollection && formData.operationName && formData.eye;
                  case 3:
                    return formData.visualAcuityRight && formData.visualAcuityLeft;
                  case 4:
                    return formData.surgeonName && formData.dateTime;
                  default:
                    return false;
                }
              };
              
              return (
                <React.Fragment key={step.num}>
                  <div className="flex flex-col items-center flex-1">
                    <div className={`w-8 h-8 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                      currentStep === step.num 
                        ? 'bg-blue-500 text-white scale-110 shadow-lg shadow-blue-500/50' 
                        : isStepComplete(step.num)
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-700 text-gray-400'
                    }`}>
                      {isStepComplete(step.num) ? (
                        <svg className="w-4 h-4 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <step.icon size={16} className="sm:hidden" />
                      )}
                      {!isStepComplete(step.num) && <step.icon size={20} className="hidden sm:block" />}
                    </div>
                    <span className={`text-[10px] sm:text-xs mt-1 sm:mt-2 font-medium text-center ${
                      currentStep === step.num ? 'text-blue-400' : 'text-gray-400'
                    }`}>
                      <span className="sm:hidden">{step.title}</span>
                      <span className="hidden sm:inline">{step.fullTitle}</span>
                    </span>
                  </div>
                  {idx < 3 && (
                    <div className={`h-0.5 sm:h-1 flex-1 mx-1 sm:mx-2 rounded transition-all duration-300 ${
                      isStepComplete(step.num) ? 'bg-green-600' : 'bg-gray-700'
                    }`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Form Content */}
        <div className="p-4 sm:p-8">
          {/* Step 1: Patient Info */}
          {currentStep === 1 && (
            <div className="space-y-4 sm:space-y-6 animate-fadeIn">
              <div className="grid grid-cols-1 gap-4 sm:gap-6">
                <div className="group">
                  <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                    <User size={16} className="text-blue-400" />
                    Patient Name *
                  </label>
                  <input
                    type="text"
                    name="patientName"
                    value={formData.patientName}
                    onChange={handleInputChange}
                    placeholder="Enter full name"
                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                </div>
                
                <div className="group">
                  <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                    <Search size={16} className="text-blue-400" />
                    National ID *
                  </label>
                  <input
                    type="text"
                    name="nationalId"
                    value={formData.nationalId}
                    onChange={handleInputChange}
                    placeholder="14-digit National ID"
                    maxLength={14}
                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                  {nationalIdError && (
                    <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                      <span>⚠</span> {nationalIdError}
                    </p>
                  )}
                  {formData.nationalId.length > 0 && formData.nationalId.length < 14 && (
                    <p className="text-yellow-400 text-sm mt-1">
                      {14 - formData.nationalId.length} digits remaining
                    </p>
                  )}
                </div>
              </div>

              {/* Parsed ID Info Card */}
              {formData.age !== null && (
                <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-700/50 rounded-xl p-4 sm:p-6 animate-slideIn">
                  <p className="text-xs sm:text-sm text-gray-400 mb-3 sm:mb-4 flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Patient information extracted from National ID
                  </p>
                  <div className="grid grid-cols-3 gap-2 sm:gap-6">
                    <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 bg-gray-800/50 rounded-lg p-2 sm:p-4">
                      <div className={`p-2 sm:p-3 rounded-lg ${formData.gender === 'Male' ? 'bg-blue-500/20' : 'bg-pink-600/20'}`}>
                        <User size={20} className={`sm:hidden ${formData.gender === 'Male' ? 'text-blue-400' : 'text-pink-400'}`} />
                        <User size={24} className={`hidden sm:block ${formData.gender === 'Male' ? 'text-blue-400' : 'text-pink-400'}`} />
                      </div>
                      <div className="text-center sm:text-left">
                        <p className="text-[10px] sm:text-xs text-gray-400">Gender</p>
                        <p className="text-sm sm:text-lg font-bold text-white">{formData.gender}</p>
                      </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 bg-gray-800/50 rounded-lg p-2 sm:p-4">
                      <div className="p-2 sm:p-3 rounded-lg bg-purple-600/20">
                        <Cake size={20} className="text-purple-400 sm:hidden" />
                        <Cake size={24} className="text-purple-400 hidden sm:block" />
                      </div>
                      <div className="text-center sm:text-left">
                        <p className="text-[10px] sm:text-xs text-gray-400">DOB</p>
                        <p className="text-xs sm:text-lg font-bold text-white">{formData.dob}</p>
                      </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 bg-gray-800/50 rounded-lg p-2 sm:p-4">
                      <div className="p-2 sm:p-3 rounded-lg bg-green-600/20">
                        <Calendar size={20} className="text-green-400 sm:hidden" />
                        <Calendar size={24} className="text-green-400 hidden sm:block" />
                      </div>
                      <div className="text-center sm:text-left">
                        <p className="text-[10px] sm:text-xs text-gray-400">Age</p>
                        <p className="text-sm sm:text-lg font-bold text-white">{formData.age} <span className="text-xs sm:text-base">yrs</span></p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Anesthesia Type */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
                  <Activity size={16} className="text-blue-400" />
                  Anesthesia Type *
                </label>
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  {['Local', 'General'].map(type => (
                    <button
                      key={type}
                      onClick={() => setFormData({...formData, anesthesiaType: type})}
                      className={`px-4 sm:px-6 py-3 sm:py-4 rounded-xl text-base sm:text-lg font-medium transition-all duration-200 ${
                        formData.anesthesiaType === type
                          ? 'bg-gradient-to-r from-blue-500 to-blue-500 text-white shadow-lg shadow-blue-500/50 scale-105'
                          : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700 border border-gray-600'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Operation Details */}
          {currentStep === 2 && (
            <div className="space-y-4 sm:space-y-6 animate-fadeIn">
              <div className="grid grid-cols-1 gap-4 sm:gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Operation Collection *</label>
                  <select
                    name="operationCollection"
                    value={formData.operationCollection}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  >
                    <option value="" disabled>Select Collection</option>
                    {operationCollections.map(collection => (
                      <option key={collection} value={collection}>{collection}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Operation Name *</label>
                  <select
                    name="operationName"
                    value={formData.operationName}
                    onChange={handleInputChange}
                    disabled={!formData.operationCollection}
                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="" disabled>Select Name</option>
                    {formData.operationCollection && operationData[formData.operationCollection].map(name => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
                  <Eye size={16} className="text-blue-400" />
                  Eye Selection *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                  {['Left Eye', 'Right Eye', 'Bilateral Eye'].map(eye => (
                    <button
                      key={eye}
                      onClick={() => setFormData({...formData, eye: eye})}
                      disabled={!formData.operationCollection}
                      className={`px-4 sm:px-6 py-3 sm:py-4 rounded-xl text-sm sm:text-base font-medium transition-all duration-200 ${
                        formData.eye === eye
                          ? 'bg-gradient-to-r from-blue-500 to-blue-500 text-white shadow-lg shadow-blue-500/50 scale-105'
                          : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700 border border-gray-600'
                      } disabled:opacity-30 disabled:cursor-not-allowed`}
                    >
                      {eye}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Clinical Data */}
          {currentStep === 3 && (
            <div className="space-y-6 sm:space-y-8 animate-fadeIn">
              {/* Visual Acuity */}
              <div className="bg-gray-700/30 rounded-xl p-4 sm:p-6 border border-gray-600">
                <h4 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4 flex items-center gap-2">
                  <Eye size={18} className="text-blue-400 sm:hidden" />
                  <Eye size={20} className="text-blue-400 hidden sm:block" />
                  Visual Acuity *
                </h4>
                <div className="grid grid-cols-1 gap-4 sm:gap-6">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Right Eye (OD)</label>
                    <select
                      name="visualAcuityRight"
                      value={formData.visualAcuityRight}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="" disabled>Select VA</option>
                      {visualAcuityOptions.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Left Eye (OS)</label>
                    <select
                      name="visualAcuityLeft"
                      value={formData.visualAcuityLeft}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="" disabled>Select VA</option>
                      {visualAcuityOptions.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Refraction */}
              <div className="bg-gray-700/30 rounded-xl p-4 sm:p-6 border border-gray-600">
                <h4 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">Refraction</h4>
                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <label className="text-sm text-gray-400">Right Eye (OD)</label>
                      <span className="text-lg sm:text-xl font-bold text-white bg-gray-800 px-3 sm:px-4 py-1 rounded-lg min-w-[70px] sm:min-w-[80px] text-center">
                        {formData.refractionRight || '0.00'}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="-15"
                      max="15"
                      step="0.25"
                      name="refractionRight"
                      value={formData.refractionRight || 0}
                      onChange={handleInputChange}
                      className="w-full h-3 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>-15.00</span>
                      <span>0</span>
                      <span>+15.00</span>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <label className="text-sm text-gray-400">Left Eye (OS)</label>
                      <span className="text-lg sm:text-xl font-bold text-white bg-gray-800 px-3 sm:px-4 py-1 rounded-lg min-w-[70px] sm:min-w-[80px] text-center">
                        {formData.refractionLeft || '0.00'}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="-15"
                      max="15"
                      step="0.25"
                      name="refractionLeft"
                      value={formData.refractionLeft || 0}
                      onChange={handleInputChange}
                      className="w-full h-3 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>-15.00</span>
                      <span>0</span>
                      <span>+15.00</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* IOL Power */}
              <div className="bg-gray-700/30 rounded-xl p-4 sm:p-6 border border-gray-600">
                <h4 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">IOL Power</h4>
                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <label className="text-sm text-gray-400">Right Eye (OD)</label>
                      <span className="text-lg sm:text-xl font-bold text-white bg-gray-800 px-3 sm:px-4 py-1 rounded-lg min-w-[70px] sm:min-w-[80px] text-center">
                        {formData.iolPowerRight || '0.0'}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="35"
                      step="0.5"
                      name="iolPowerRight"
                      value={formData.iolPowerRight || 0}
                      onChange={handleInputChange}
                      className="w-full h-3 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>0.0</span>
                      <span>17.5</span>
                      <span>35.0</span>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <label className="text-sm text-gray-400">Left Eye (OS)</label>
                      <span className="text-lg sm:text-xl font-bold text-white bg-gray-800 px-3 sm:px-4 py-1 rounded-lg min-w-[70px] sm:min-w-[80px] text-center">
                        {formData.iolPowerLeft || '0.0'}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="35"
                      step="0.5"
                      name="iolPowerLeft"
                      value={formData.iolPowerLeft || 0}
                      onChange={handleInputChange}
                      className="w-full h-3 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>0.0</span>
                      <span>17.5</span>
                      <span>35.0</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Team & Schedule */}
          {currentStep === 4 && (
            <div className="space-y-4 sm:space-y-6 animate-fadeIn">
              <div className="grid grid-cols-1 gap-4 sm:gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                    <Stethoscope size={16} className="text-blue-400" />
                    Surgeon Name *
                  </label>
                  <select
                    name="surgeonName"
                    value={formData.surgeonName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="" disabled>Select Surgeon</option>
                    {surgeons.map(name => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                    <UserPlus size={16} className="text-blue-400" />
                    Surgeon Assistant
                  </label>
                  <select
                    name="surgeonAssistant"
                    value={formData.surgeonAssistant}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="" disabled>Select Assistant</option>
                    {assistants.map(name => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                  <Calendar size={16} className="text-blue-400" />
                  Surgery Date & Time *
                </label>
                <input
                  type="datetime-local"
                  name="dateTime"
                  value={formData.dateTime}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Summary Card */}
              <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-700/50 rounded-xl p-4 sm:p-6 mt-6 sm:mt-8">
                <h4 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">Surgery Summary</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Patient:</span>
                    <span className="text-white font-medium text-right">{formData.patientName || 'Not set'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Operation:</span>
                    <span className="text-white font-medium text-right">{formData.operationName || 'Not set'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Eye:</span>
                    <span className="text-white font-medium text-right">{formData.eye || 'Not set'}</span></div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Surgeon:</span>
                    <span className="text-white font-medium text-right">{formData.surgeonName || 'Not set'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Footer */}
        <div className="bg-gray-750 px-4 sm:px-8 py-4 sm:py-6 flex justify-between items-center border-t border-gray-700 sticky bottom-0">
          <button
            onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
            disabled={currentStep === 1}
            className="px-4 sm:px-6 py-2 sm:py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm sm:text-base"
          >
            Previous
          </button>
          
          <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-400">
            Step {currentStep} of 4
          </div>

          {currentStep < 4 ? (
            <button
              onClick={() => setCurrentStep(Math.min(4, currentStep + 1))}
              disabled={!(() => {
                switch(currentStep) {
                  case 1:
                    return formData.patientName && formData.nationalId.length === 14 && formData.anesthesiaType;
                  case 2:
                    return formData.operationCollection && formData.operationName && formData.eye;
                  case 3:
                    return formData.visualAcuityRight && formData.visualAcuityLeft;
                  default:
                    return false;
                }
              })()}
              className="px-4 sm:px-6 py-2 sm:py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-400 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm sm:text-base"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!(formData.surgeonName && formData.dateTime)}
              className="px-4 sm:px-8 py-2 sm:py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg text-sm sm:text-base"
            >
              Add Surgery
            </button>
          )}
        </div>
      </div>
    </div>
    </>
  );
};

export default AddSurgeryForm;
