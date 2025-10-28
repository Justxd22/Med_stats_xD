
"use client";
import React, { useState, useEffect } from 'react';
import { Search, Plus, X, Clock, CheckCircle, Pencil, Link, ChevronLeft, ChevronRight, User, Cake } from 'lucide-react';
import Image from 'next/image';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

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

    return { dob: dob.toLocaleDateString(), age, gender };
  } catch (e) {
    return null;
  }
};

const SurgeryRoomDisplay = ({ rooms = [], history = [], handleAddSurgery = () => {}, handleStatusChange = (roomId: any, id: any, value: string) => {}, handleRemoveSurgery = () => {}, handleMoveSurgery = () => {}, isAdmin = true, displayDate = new Date(), handlePrevDay = () => {}, handleNextDay = () => {}, isToday = true }) => {
  const roomColors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-yellow-500', 'bg-pink-500', 'bg-teal-500', 'bg-indigo-500'];
  
  // --- Definitive Operation Data ---
  const operationData = {
    "Cataract Surgeries": [
      "cataract extraction",
      "cataract extraction and sclera fixation IOL",
      "Phacoemulsification & Foldable IOL implantation",
      "Secondary IOL implantatation",
      "cataract extraction and IOL implantation+Subscleral trabeculectomy",
      "cataract extraction and IOL implantation",
      "after cataract aspiration",
      "Lensectomy for subluxated lens",
      "phaco trabeculectomy +pciol implantation",
      "Phacoemulsification"
    ],
    "Retina and Vitreous Surgeries": [
      "removal of infected buckle",
      "Vitrectomy",
      "cataract extraction and IOL implantation,and Vitrectomy+ silicone oil injection",
      "Silicone oil removal and scleral fixation of IOL",
      "Vitrectomy and FB extraction",
      "Silicone bubble in anterior chamber",
      "Phacoemulsification +PCIOL+ Silicone oil removal",
      "Phacoemulsification + Silicone oil removal",
      "cataract extraction + Vitrectomy",
      "IOL explantation + Vitrectomy +IOL implantation",
      "Silicon oil removal+retinopexy+silicon oil injection",
      "Pars plana vitrectomy + iol implantation",
      "cataract extraction and IOL implantation,and +silicone oil removal+retinopexy+ silicone oil injection",
      "retinopexy+ silicon oil injection",
      "Retinopexy +removal of retinal traction+silicon oil injection",
      "Retinopexy",
      "Cataract extraction and IOL implantation and silicon oil removal and silicon oil injectione",
      "Phacoemulsification + silicone oil removal + retinopexy+ silicone oil injection",
      "cataract extraction+vitrectomy+silicon oil injection",
      "Vitrectomy +retinopexy +gas injection",
      "Vitrectomy +endo laser+ silicone oil injection",
      "laser coagulation of avascular retina by laser indirect ophthalmoscopy",
      "Retinopexy + Vitrectomy + silicone oil injection",
      "cataract extraction and IOL implantation,and Vitrectomy",
      "Silicone oil removal"
    ],
    "Orbital Surgeries": [
      "Dacryocystectomy",
      "enuclation and mid pore implantation",
      "contracted socket repair with midpore implant",
      "silicone intubation",
      "repair of arbital floor fracture +tytanium mesh",
      "blepharoplasty",
      "corneal and conjunctival amniotic membrane graft",
      "evisceration",
      "Conjunctival graft",
      "Orbital volume augmentation",
      "Recurrent pterygium",
      "Endoscopic DCR",
      "orbital biopsy",
      "DCR",
      "Reconstruction of lid after removal of tumor",
      "Enucleation",
      "midpore implant",
      "Repair of orbital floor fracture",
      "Ptosis repair (blepharoplasty",
      "Lid lesion excision and blepharoplasty",
      "Contracted Socket repair",
      "Blepharoplasty with Metero tube",
      "Upper lid blepharoplasty with silicone stent",
      "Orbitotomy & tumer excision"
    ],
    "Strabismus Surgeries": [
      "Strabismus Surgery"
    ],
    "Corneal Surgeries": [
      "keratoplasty",
      "keratoplasty + cataract extraction and IOL implantation",
      "corneal cross linking",
      "Keratoplasty+ cataract extraction",
      "chelation of band shaped keratopathy",
      "Corneal tumor excision"
    ],
    "Glaucoma Surgeries": [
      "Subscleral trabeculectomy + Mitomycin c",
      "Subscleral trabeculectomy + ologen implant",
      "Subscleral trabeculectomy",
      "Ahmed valve implant",
      "Subscleral trabeculectomy + Mitomycin c & ologen implant",
      "Combined subscleral trabeculectomy & trabeculotomy",
      "Diode laser cyclophotocoagulation",
      "Ahmed Valve repositioning"
    ],
    "Injection Procedures": [
      "intra- vitreal injection of stercid (Triamcinolone Acetate)",
      "intra- vitreal injection of anti-vegf (Lucentis)",
      "Phacoemulsification + PCIOL + intra- vitreal injection of anti-vegf (Lucentis)",
      "Ozordix",
      "Eylea",
      "gas injection",
      "Subconjunctival injection of corticosteroid",
      "intra- vitreal injection of anti-vegf"
    ],
    "Other Surgeries": [
      "Anterior vitrectomy",
      "ACIOL implantation",
      "Iris claw iol implantation",
      "Repositioning of iol",
      "iol explantation",
      "Lens matter aspiration",
      "Wash of anterior chamber",
      "keratectomy",
      "Anterior vitrectomy +IOL repositioning",
      "Secondary IOL implantation ( scleral fixation)",
      "Lensectomy ,anterior vitrectomy and scleral fixation of IOL",
      "Peripheral iridectomy",
      "IOL extraction",
      "Recurrent pterygium",
      "Excision of recurrent ptrygium with conjunctival autograft",
      "secondary IOL implantation through Iris fixation",
      "surgical posterior capsulotomy",
      "iol exchange",
      "Iris repair",
      "pupilloplasty"
    ],
    "Trauma Surgeries": [
      "Corneal and sclera wound repair",
      "Upper lid wound repair",
      "Lower lid wound repair",
      "Upper lid wound repair including margin",
      "Lower lid wound repair including margin",
      "Upper lid wound repair including margin and canaliculus",
      "Lower lid wound repair including margin and canaliculus",
      "Corneal and sclera wound repair with cataract extraction",
      "Hyphema aspiration",
      "Repair of gapped corneal section",
      "Repair of gapped corneal section and reposition of iris",
      "Repair of gapped corneal section , reposition of iris and anterior vitrectomy",
      "Repair of gapped corneal section and anterior vitrectomy",
      "IOFB magnet extraction",
      "intra- vitreal injection of antibiotic"
    ],
    "Minor Surgeries": [
      "cryoabblation",
      "Silicone tube removal",
      "dermato chalasis",
      "Intra lesional injection of kenacort",
      "Subconjunctival injection",
      "Conjunctival suture removal",
      "PTS removal",
      "abscess evacuation",
      "Stye excision",
      "chalazion excision",
      "Examined under a general anesthetic",
      "Electrolysis of rubbing lashes",
      "Pterygium excision",
      "Lacrimal passage probing",
      "entropion",
      "ectropion",
      "Theraputic contact lens",
      "Cyclocryotherapy",
      "Cautery of Corneal ulcer",
      "Repair of Cojunctival wound",
      "Evisceration or Enucleation",
      "corneal suture removal",
      "Cojunctival nevus excision",
      "Cojunctival tumor excision",
      "Symblepharon excision",
      "Corneal tumor excision",
      "Repair of eye lid wound",
      "Orbital hemorrhage evacuation",
      "Trichiasis repair",
      "conjunctival cyst excision",
      "Skin papilloma excision",
      "Xanthelasma excisin",
      "skin sutures removal",
      "for artifial eye",
      "corneal F B removal"
    ],
    "Pediatric Surgeries": [
      "IOL explantation + surgical capsulotomy",
      "Foldable iol implantation",
      "Endo LASER surgery for neonate",
      "surgical posterior capsulorhexis, anterior vitrectomy and foldable IOL implantation",
      "phacoaspiration + anterior vitrectomy",
      "phacoaspiration + iol implantation + anterior vitrectomy",
      "Phacoasipration+PCIOL",
      "Phacoaspiration, posterior capsulorhexis, anterior vitrectomy and foldable IOL implantation",
      "Phacoaspiration and posterior capsulorhexis and anterior vitrectomy",
      "Surgical capsulotomy + iol exchange",
      "Secondary iol implantation,anterior vitrectomy and pupiloplasty"
    ]
  };
  const operationCollections = Object.keys(operationData);
  const surgeons = ['Dr. Smith', 'Dr. Elara', 'Dr. Jones', 'Dr. Williams']; // Placeholder
  const assistants = ['Assistant A', 'Assistant B', 'Assistant C']; // Placeholder
  // ---

  const [hospitalName, setHospitalName] = useState('Mansoura University');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportDate, setExportDate] = useState('');
  const [exportEndDate, setExportEndDate] = useState('');
  const [editingRoom, setEditingRoom] = useState(null);
  const [editingSurgery, setEditingSurgery] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [nationalIdError, setNationalIdError] = useState('');
  
  const [formData, setFormData] = useState({
    patientName: '',
    nationalId: '',
    dateTime: '',
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

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const isCurrentSurgery = (surgery) => {
    const now = new Date();
    const surgeryDate = new Date(surgery.dateTime);
    
    const isToday = surgeryDate.toDateString() === now.toDateString();
    const isTimeToStart = now >= surgeryDate;
    
    return surgery.status === 'scheduled' && isToday && isTimeToStart;
  };

  const getCurrentSurgery = (surgeries) => {
    if (!surgeries) {
      return null;
    }
    const scheduled = surgeries.filter(s => s.status === 'scheduled');
    for (let surgery of scheduled) {
      if (isCurrentSurgery(surgery)) {
        return surgery;
      }
    }
    return null;
  };

  const getStatusColor = (surgery) => {
    switch (surgery.status) {
      case 'completed':
        return 'bg-green-900 text-white-900 border-green-300';
      case 'in-progress':
        return 'bg-blue-900 text-white-900 border-blue-300';
      case 'delayed':
        return 'bg-red-900 text-white-800 border-red-300';
      case 'scheduled':
        return 'bg-[#E0C255] text-black border-yellow-300';
      default:
        return 'bg-gray-900 text-white-900 border-gray-300';
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const onAddSurgery = () => {
    if (!formData.patientName || !formData.nationalId || !formData.dateTime || !formData.anesthesiaType || !formData.surgeonName || !formData.surgeonAssistant || !formData.operationCollection || !formData.operationName || !formData.eye) {
      alert('Please fill all fields');
      return;
    }
    handleAddSurgery(editingRoom, formData);
    setFormData({
      patientName: '',
      nationalId: '',
      dateTime: '',
      anesthesiaType: 'Local',
      surgeonName: '',
      surgeonAssistant: '',
      operationCollection: '',
      operationName: '',
      eye: 'Left Eye',
    });
    setShowAddForm(false);
    setEditingRoom(null);
  }

  const handleExport = async () => {
    if (!exportDate || !exportEndDate) {
      alert('Please select a start and end date to export.');
      return;
    }

    try {
      const res = await fetch(`/api/archive?startDate=${exportDate}&endDate=${exportEndDate}`);
      if (!res.ok) {
        throw new Error('Failed to fetch archived data');
      }
      const surgeriesToExport = await res.json();

      if (surgeriesToExport.length === 0) {
        alert('No surgeries found for the selected date range.');
        return;
      }

      const headers = ['Patient Name', 'Age', 'Date/Time', 'Diagnosis', 'Anesthesia Type', 'Surgeon Name', 'Status', 'Room ID'];
      const csvRows = [headers.join(',')];

      surgeriesToExport.forEach(surgery => {
        const row = [
          `"${surgery.patientName}"`,
          surgery.age,
          `"${new Date(surgery.dateTime).toLocaleString()}"`,
          `"${surgery.diagnosis}"`,
          `"${surgery.anesthesiaType}"`,
          `"${surgery.surgeonName}"`,
          surgery.status,
          surgery.roomId
        ];
        csvRows.push(row.join(','));
      });

      const csvString = csvRows.join('\n');
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `surgeries_${exportDate}_to_${exportEndDate}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setShowExportModal(false);
    } catch (error) {
      console.error("Export failed:", error);
      alert("Failed to export data. Please try again.");
    }
  };

  const filteredHistory = history.filter(record =>
    record.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.surgeonName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.diagnosis.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const allSurgeries = rooms.filter(room => room).flatMap(room => room.surgeries || []);
  const totalOperations = allSurgeries.length;
  const totalCompleted = allSurgeries.filter(s => s.status === 'completed').length;
  const totalPostponed = allSurgeries.filter(s => s.status === 'delayed').length;
  const totalIncomplete = totalOperations - totalCompleted;
  const onDragEnd = (result) => {
    const { source, destination, draggableId } = result;

    if (!destination) {
      return;
    }

    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    const sourceRoomId = source.droppableId;
    const destRoomId = destination.droppableId;

    handleMoveSurgery(draggableId, sourceRoomId, destRoomId);
  };

  return (
    <div className="min-h-screen bg-gray-900 p-2 sm:p-4">
      <div className="max-w-full mx-auto pb-24 sm:pb-32">
        {/* Hospital Header */} 
        <div className="bg-white text-white p-2 rounded-lg shadow-2xl mb-4">
          {/* Mobile Header */}
          <div className="sm:hidden flex justify-between items-center">
            <div className="text-left flex-1">
              <h1 className="text-2xl font-bold text-blue-900">Mansoura University</h1>
              <p className="text-xl text-gray-600">Ophthalmology Center</p>
              <div className="mt-2 flex items-center gap-2">
                <button onClick={handlePrevDay} className="p-1 rounded-full hover:bg-gray-200 transition">
                  <ChevronLeft size={24} className="text-gray-700" />
                </button>
                <div>
                  <p className="text-lg font-bold text-blue-900 text-center">{currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
                  <p className="text-sm text-gray-600">{displayDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</p>
                </div>
                <button onClick={handleNextDay} className="p-1 rounded-full hover:bg-gray-200 transition disabled:opacity-50">
                  <ChevronRight size={24} className="text-gray-700" />
                </button>
              </div>
            </div>
            <div className="flex-shrink-0">
              <Image src="/logo.png" alt="Logo" width={100} height={100} className="object-contain" priority />
            </div>
          </div>

          {/* Desktop Header */}
          <div className="hidden sm:flex justify-between items-center p-2">
            <div className="text-left">
              <h1 className="text-2xl font-bold text-4xl text-blue-900 pl-4">Mansoura University</h1>
              <p className="text-2xl text-gray-600 pl-4">Ophthalmology Center</p>
            </div>
            <div className="flex justify-center relative left-[-40px]">
              <div className="w-20 h-20 rounded-full flex items-center justify-center overflow-hidden">
                <Image src="/logo.png" alt="Logo" width={100} height={100} className="object-contain w-full h-full" priority />
              </div>
            </div>
            <div className="text-right flex items-center gap-4">
              <button onClick={handlePrevDay} className="p-2 rounded-full hover:bg-gray-200 transition"><ChevronLeft size={32} className="text-gray-700" /></button>
              <div>
                <p className="text-2xl font-bold text-blue-900">{displayDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</p>
                <p className="text-lg text-gray-600">{displayDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric' })}</p>
                <p className="text-xl font-bold text-blue-900 pr-4">{currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
              </div>
              <button onClick={handleNextDay} className="p-2 rounded-full hover:bg-gray-200 transition disabled:opacity-50"><ChevronRight size={32} className="text-gray-700" /></button>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 mb-4 sm:mb-6">
          {isAdmin && (<>
            <button
              onClick={() => setShowExportModal(!showExportModal)}
              className="px-4 sm:px-6 py-2 sm:py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 text-sm sm:text-base lg:text-lg font-medium"
            >
              Export to Excel
            </button>
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="px-4 sm:px-6 py-2 sm:py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 flex items-center justify-center gap-2 text-sm sm:text-base lg:text-lg font-medium"
            >
              <Search size={18} className="sm:w-5 sm:h-5" />
              {showHistory ? 'View Rooms' : 'Search History'}
            </button>
          </>)}
        </div>

        {showExportModal && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg p-6 sm:p-8 w-full max-w-md text-white">
              <div className="flex justify-between items-center mb-4 sm:mb-6">
                <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold">Export to Excel</h3>
                <button onClick={() => setShowExportModal(false)} className="text-gray-400 hover:text-white">
                  <X size={24} className="sm:w-8 sm:h-8" />
                </button>
              </div>
              <div className="space-y-4 sm:space-y-5">
                <div>
                  <label className="block text-sm sm:text-base lg:text-lg font-medium mb-2">From</label>
                  <input
                    type="date"
                    value={exportDate}
                    onChange={(e) => setExportDate(e.target.value)}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-gray-700 text-white border border-gray-600 rounded-lg text-sm sm:text-base lg:text-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm sm:text-base lg:text-lg font-medium mb-2">To</label>
                  <input
                    type="date"
                    value={exportEndDate}
                    onChange={(e) => setExportEndDate(e.target.value)}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-gray-700 text-white border border-gray-600 rounded-lg text-sm sm:text-base lg:text-lg"
                  />
                </div>
                <button
                  onClick={handleExport}
                  className="w-full bg-blue-600 text-white py-3 sm:py-4 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 text-base sm:text-lg lg:text-xl font-medium"
                >
                  Export
                </button>
              </div>
            </div>
          </div>
        )}

        {!showHistory ? (
          <>
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-3 sm:gap-4">
              {rooms.filter(room => room).map(room => {
                const currentSurgery = getCurrentSurgery(room.surgeries);
                              const totalSurgeriesInRoom = room.surgeries ? room.surgeries.length : 0;
                              const completedSurgeriesInRoom = room.surgeries ? room.surgeries.filter(s => s.status === 'completed').length : 0;
                              const incompleteSurgeriesInRoom = totalSurgeriesInRoom - completedSurgeriesInRoom;
                return (
                  <div key={room.id} className="bg-gray-800 rounded-lg shadow-2xl overflow-hidden">
                    <div className={`bg-white text-white p-2 sm:p-2 flex justify-between items-center`}>
                    <div>
                      <h2
                        className={`font-bold text-gray-800 ${room.id === 6
                            ? "text-lg sm:text-xl"
                            : "text-xl sm:text-2xl"
                          }`}
                      >
                        {room.id === 6
                          ? "Injection"
                          : room.id === 7
                            ? "ICU"
                            : `ROOM${room.id}`}
                      </h2>
                      {isAdmin && <button
                          onClick={() => {
                            setEditingRoom(room.id);
                            setShowAddForm(true);
                          }}
                          className="bg-opacity-30 hover:bg-opacity-40 p-2 rounded-lg bg-black"
                        >
                          <Pencil size={18} className="sm:w-5 sm:h-5" />
                        </button>}
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-xs text-right text-gray-700">
                                                  <p className='font-bold'>Total: {totalSurgeriesInRoom}</p>
                                                  <p className='text-orange-500 font-bold'>Incomplete: {incompleteSurgeriesInRoom}</p>
                                                  <p className='text-green-700 font-bold'>Completed: {completedSurgeriesInRoom}</p>                        </div>

                      </div>
                    </div>
                    
                    <Droppable droppableId={room.id.toString()} isDropDisabled={false} isCombineEnabled={false} ignoreContainerClipping={false}>
                      {(provided) => (
                        <div 
                          ref={provided.innerRef} 
                          {...provided.droppableProps}
                          className="p-3 sm:p-4 h-full"
                        >
                          {room.surgeries && room.surgeries.length > 0 ? (
                                                  <div className="space-y-2 sm:space-y-3 max-h-[400px] sm:max-h-[600px] overflow-y-auto">
                                                    {room.surgeries.sort((a, b) => {
                                                      if (a.status === 'completed' && b.status !== 'completed') return 1;
                                                      if (b.status === 'completed' && a.status !== 'completed') return -1;
                                                      return new Date(a.dateTime) - new Date(b.dateTime);
                                                    }).map((surgery, index) => {                            const isCurrent = currentSurgery && currentSurgery.id === surgery.id;
                                return (
                                  <Draggable key={surgery.id} draggableId={surgery.id.toString()} index={index}>
                                    {(provided) => (
                                      <div
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        {...provided.dragHandleProps}
                                      >
                                        <div className={`border-2 rounded-lg p-2 sm:p-3 ${getStatusColor(surgery, currentSurgery)}`}>
                                                                                                          <div className="flex justify-between items-start mb-2">
                                                                                                            <div className="flex-1">
                                                                                                                                                  <p className="font-bold text-sm sm:text-base lg:text-lg">{surgery.patientName} ({surgery.age}) {surgery.gender === 'Male' ? 'M' : 'F'}</p>
                                                                                                                                                  <div className="flex items-center gap-1 text-xs sm:text-sm mt-1">
                                                                                                                                                    <Clock size={12} className="sm:w-3.5 sm:h-3.5" />
                                                                                                                                                    <span>{new Date(surgery.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} &middot; {surgery.dob}</span>
                                                                                                                                                  </div>                                                                                                            </div>
                                                                          
                                                                                                            {isAdmin && <div className="flex flex-col gap-2">
                                                                                                              <button
                                                                                                                onClick={() => handleRemoveSurgery(room.id, surgery.id)}
                                                                                                                className="text-gray-400 hover:text-red-500"
                                                                                                              >
                                                                                                                <X size={14} className="sm:w-4 sm:h-4" />
                                                                                                              </button>
                                                                                                            </div>}
                                                                          
                                                                                                          </div>
                                                                                                          
                                                                                                          <div className="text-xs sm:text-sm space-y-1 mb-2">
                                                                                                            <p><span className="font-bold">Operation:</span> {surgery.operationName}</p>
                                                                                                            <p><span className="font-bold">Surgeon:</span> {surgery.surgeonName}</p>
                                                                                                            <p><span className="font-bold">Eye:</span> {surgery.eye}</p>
                                                                                                          </div>
                                          <div className="flex justify-end">
                                            <button
                                              onClick={() => setEditingSurgery(surgery)}
                                              className="text-gray-400 hover:text-blue-500"
                                            >
                                              <Pencil size={14} className="sm:w-4 sm:h-4" />
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </Draggable>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="text-center py-6 sm:py-8 text-gray-400">
                              <p className="text-sm sm:text-base">No surgeries scheduled</p>
                            </div>
                          )}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </div>
                );
              })}
            </div>
            </DragDropContext>
            <div className="text-center pt-5 text-gray-500 text-xm pb-5">
              Powered by <a href="https://pom-agency.online" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-400">pom-agency.online <Link size={12} className="inline-block" /></a>
            </div>
          </>
        ) : (
          <div className="bg-gray-800 rounded-lg shadow-2xl p-4 sm:p-6 text-white">
            <div className="mb-4 sm:mb-6">
              <input
                type="text"
                placeholder="Search by patient name, surgeon, or diagnosis..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 sm:px-6 py-3 sm:py-4 bg-gray-700 text-white border border-gray-600 rounded-lg text-sm sm:text-base lg:text-lg"
              />
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-700 border-b border-gray-600">
                  <tr>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-medium text-gray-300 uppercase">Room</th>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-medium text-gray-300 uppercase">Patient</th>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-medium text-gray-300 uppercase hidden md:table-cell">Date/Time</th>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-medium text-gray-300 uppercase hidden lg:table-cell">Diagnosis</th>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-medium text-gray-300 uppercase hidden xl:table-cell">Surgeon</th>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-medium text-gray-300 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {filteredHistory.map(record => (
                    <tr key={record.id} className="hover:bg-gray-700">
                      <td className="px-3 sm:px-6 py-3 sm:py-4">
                        <span className={`inline-block w-3 h-3 sm:w-4 sm:h-4 rounded-full ${roomColors[record.roomId - 1]}`}></span>
                        <span className="ml-2 text-sm sm:text-base lg:text-lg">{record.roomId}</span>
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 font-medium text-sm sm:text-base lg:text-lg">{record.patientName} ({record.age})</td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 text-sm sm:text-base lg:text-lg hidden md:table-cell">{new Date(record.dateTime).toLocaleString()}</td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 text-sm sm:text-base lg:text-lg hidden lg:table-cell">{record.diagnosis}</td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 text-sm sm:text-base lg:text-lg hidden xl:table-cell">{record.surgeonName}</td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4">
                        <span className={`px-2 sm:px-3 py-1 rounded text-xs sm:text-sm ${record.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                          {record.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredHistory.length === 0 && (
                <div className="text-center py-8 sm:py-12 text-gray-400">
                  <p className="text-base sm:text-xl">No records found</p>
                </div>
              )}
            </div>
          </div>
        )}

        {showAddForm && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg p-6 sm:p-8 w-full max-w-3xl text-white max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold">Add Surgery - Room {editingRoom}</h3>
                <button onClick={() => setShowAddForm(false)} className="text-gray-400 hover:text-white">
                  <X size={28} />
                </button>
              </div>
              
              <div className="space-y-5">
                {/* Patient Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block font-medium mb-2">Patient Name</label>
                    <input type="text" name="patientName" value={formData.patientName} onChange={handleInputChange} className="w-full px-4 py-3 bg-gray-700 rounded-lg" />
                  </div>
                  <div>
                    <label className="block font-medium mb-2">National ID</label>
                    <input type="text" name="nationalId" value={formData.nationalId} onChange={handleInputChange} className="w-full px-4 py-3 bg-gray-700 rounded-lg" />
                    {nationalIdError && <p className="text-red-500 text-sm mt-1">{nationalIdError}</p>}
                  </div>
                </div>

                {/* Anesthesia Type & Parsed ID Info */}
                <div className="flex items-start gap-5">
                  <div className="pr-32">
                    <label className="block font-medium mb-2">Anesthesia Type</label>
                    <div className="flex gap-3">
                      {['Local', 'General'].map(type => (
                        <button key={type} onClick={() => setFormData({...formData, anesthesiaType: type})} className={`px-6 py-3 rounded-lg text-lg transition ${formData.anesthesiaType === type ? 'bg-blue-600 text-white' : 'bg-gray-700'}`}>
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>
                  {formData.age !== null && (
                    <div className="bg-gray-700 p-4 rounded-lg flex items-center gap-6">
                      <div className="text-center">
                        <User size={28} className={formData.gender === 'Male' ? 'text-blue-400' : 'text-pink-400'} />
                        <p className="text-sm font-bold">{formData.gender}</p>
                      </div>
                      <div className="text-center">
                        <Cake size={28} className="text-gray-400" />
                        <p className="text-sm">{formData.dob}</p>
                      </div>
                       <div className="text-center">
                        <p className="text-3xl font-bold">{formData.age}</p>
                        <p className="text-sm">Years</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Operation Type - Stage 1 & 2 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block font-medium mb-2">Operation Collection</label>
                    <select name="operationCollection" value={formData.operationCollection} onChange={handleInputChange} className="w-full px-4 py-3 bg-gray-700 rounded-lg">
                      <option value="" disabled>Select Collection</option>
                      {operationCollections.map(collection => (
                        <option key={collection} value={collection}>{collection}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-medium mb-2">Operation Name</label>
                    <select name="operationName" value={formData.operationName} onChange={handleInputChange} className="w-full px-4 py-3 bg-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed" disabled={!formData.operationCollection}>
                      <option value="" disabled>Select Name</option>
                      {formData.operationCollection && operationData[formData.operationCollection].map(name => (
                        <option key={name} value={name}>{name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Operation Type - Stage 3 */}
                <div>
                  <label className="block font-medium mb-2">Eye</label>
                  <div className="flex gap-3">
                    {['Left Eye', 'Right Eye', 'Bilateral Eye'].map(eye => (
                      <button key={eye} onClick={() => setFormData({...formData, eye: eye})} className={`px-6 py-3 rounded-lg text-lg transition ${formData.eye === eye ? 'bg-blue-600 text-white' : 'bg-gray-700'} disabled:opacity-50 disabled:cursor-not-allowed`} disabled={!formData.operationCollection}>
                        {eye}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Surgeon and Assistant */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block font-medium mb-2">Surgeon Name</label>
                    <select name="surgeonName" value={formData.surgeonName} onChange={handleInputChange} className="w-full px-4 py-3 bg-gray-700 rounded-lg">
                      <option value="" disabled>Select Surgeon</option>
                      {surgeons.map(name => (
                        <option key={name} value={name}>{name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-medium mb-2">Surgeon Assistant</label>
                    <select name="surgeonAssistant" value={formData.surgeonAssistant} onChange={handleInputChange} className="w-full px-4 py-3 bg-gray-700 rounded-lg">
                      <option value="" disabled>Select Assistant</option>
                      {assistants.map(name => (
                        <option key={name} value={name}>{name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* DateTime */}
                <div>
                  <label className="block font-medium mb-2">Date/Time</label>
                  <input type="datetime-local" name="dateTime" value={formData.dateTime} onChange={handleInputChange} className="w-full px-4 py-3 bg-gray-700 rounded-lg" />
                </div>
                
                <button onClick={onAddSurgery} className="w-full bg-blue-600 text-white py-4 rounded-lg hover:bg-blue-700 text-xl font-medium">
                  Add Surgery
                </button>
              </div>
            </div>
          </div>
        )}

{editingSurgery && (
  <div className="fixed inset-0 bg-black/20 bg-opacity-70 backdrop-blur flex items-center justify-center z-50 p-4">
    <div className="bg-gray-800 rounded-lg p-6 sm:p-8 w-full max-w-md text-white">
      <div className="flex justify-between items-center mb-4 sm:mb-6">
        <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold">Update Status</h3>
        <button
          onClick={() => setEditingSurgery(null)}
          className="text-gray-400 hover:text-white"
        >
          <X size={24} className="sm:w-8 sm:h-8" />
        </button>
      </div>

      <div className="space-y-4 sm:space-y-5">
        <p className="text-sm sm:text-base">
          Patient: {editingSurgery.patientName}
        </p>
        <select
          onChange={(e) => {
            handleStatusChange(
              editingSurgery.roomId,
              editingSurgery.id,
              e.target.value
            );
            setEditingSurgery(null); // 👈 Close modal automatically
          }}
          defaultValue={editingSurgery.status}
          className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-gray-700 text-white border border-gray-600 rounded-lg text-sm sm:text-base lg:text-lg"
        >
          <option value="scheduled">Waiting</option>
          <option value="in-progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="delayed">Postponed</option>
        </select>
      </div>
    </div>
  </div>
)}

      </div>

      {/* Bottom Info Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white text-gray-900 p-3 sm:p-4 shadow-lg border-t-2 border-gray-200">
        <div className="max-w-full mx-auto flex flex-col sm:flex-row justify-center sm:justify-between items-center gap-4">
          <div className="flex gap-4 sm:gap-8 text-xs sm:text-sm sm:pl-15">
            <div className="flex flex-col items-center text-gray-900 font-bold">
              <p>Total Operations</p>
              <span className="text-xl sm:text-2xl lg:text-3xl text-gray-600 font-bold">{totalOperations}</span>
            </div>
            <div className="flex flex-col items-center text-gray-900 font-bold">
              <p>Completed</p>
              <span className="text-xl sm:text-2xl lg:text-3xl text-green-500 font-bold">{totalCompleted}</span>
            </div>
            <div className="flex flex-col items-center text-gray-900 font-bold">
              <p>Incomplete</p>
              <span className="text-xl sm:text-2xl lg:text-3xl text-orange-500 font-bold">{totalIncomplete}</span>
            </div>
            <div className="flex flex-col items-center text-gray-900 font-bold">
              <p>Postponed</p>
              <span className="text-xl sm:text-2xl lg:text-3xl text-red-500 font-bold">{totalPostponed}</span>
            </div>
          </div>
          <div className="flex flex-wrap justify-center gap-3 sm:gap-6 text-xs sm:text-sm lg:text-base sm:pr-15">
            <div className="flex items-center gap-1 sm:gap-2">
              <span className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 bg-[#E0C255] border-2 border-[#E0C255] rounded"></span>
              <span>Waiting</span>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              <span className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 bg-red-700 border-2 border-red-700 rounded"></span>
              <span>Postponed</span>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              <span className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 bg-green-700 border-2 border-green-700 rounded"></span>
              <span>Completed</span>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              <span className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 bg-blue-700 border-2 border-blue-700 rounded"></span>
              <span>In Progress</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SurgeryRoomDisplay;
