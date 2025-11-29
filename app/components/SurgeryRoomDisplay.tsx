
"use client";
import React, { useState, useEffect } from 'react';
import { Search, X, Clock, Pencil, Link, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { roomColors } from '../constants';
import AddSurgeryForm from './AddSurgeryForm';

// --- Helper to clean DB dates ---
const formatDisplayDob = (dob) => {
  if (!dob) return '';
  // Attempt to find day, month, year digits amidst potentially messy characters (like RTL marks)
  const match = dob.match(/(\d{1,2})\D+(\d{1,2})\D+(\d{4})/);
  if (match) {
    return `${match[1].padStart(2, '0')}/${match[2].padStart(2, '0')}/${match[3]}`;
  }
  // Fallback: simply strip common invisible control characters
  return dob.replace(/[\u200E\u200F\u202A-\u202E]/g, '');
};

const SurgeryRoomDisplay = ({ rooms = [], history = [], handleAddSurgery = () => {}, handleStatusChange = (roomId: any, id: any, value: string) => {}, handleRemoveSurgery = () => {}, handleMoveSurgery = () => {}, isAdmin = true, isEditable = true, displayDate = new Date(), handlePrevDay = () => {}, handleNextDay = () => {}, isToday = true, isLoading = false }) => {
  
    // --- Definitive Operation Data ---
  
  const canEdit = isEditable;
  const [showAddForm, setShowAddForm] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportDate, setExportDate] = useState('');
  const [exportEndDate, setExportEndDate] = useState('');
  const [editingRoom, setEditingRoom] = useState(null);
  const [editingSurgery, setEditingSurgery] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [initialFormDate, setInitialFormDate] = useState('');

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

  const getStatusColor = (surgery, currentSurgery: any) => {
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
                  <p className="text-sm text-center text-gray-600">{displayDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</p>
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
                <p className="text-lg text-center text-gray-600">{displayDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric' })}</p>
                <p className="text-xl font-bold text-blue-900 text-center">{currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
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
            <div className="relative min-h-[50vh]">
              {isLoading && (
                <div className="absolute inset-0 bg-gray-900/50 z-50 flex items-center justify-center backdrop-blur-sm rounded-xl transition-all duration-300">
                  <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              )}
              <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-3 sm:gap-4 transition-opacity duration-300 ${isLoading ? 'opacity-50' : 'opacity-100'}`}>
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
                      {canEdit && isAdmin && <button
                          onClick={() => {
                            setEditingRoom(room.id);
                            
                            // Calculate default date time
                            const year = displayDate.getFullYear();
                            const month = String(displayDate.getMonth() + 1).padStart(2, '0');
                            const day = String(displayDate.getDate()).padStart(2, '0');
                            const formattedDisplayDate = `${year}-${month}-${day}`;
                            
                            const today = new Date();
                            const todayYear = today.getFullYear();
                            const todayMonth = String(today.getMonth() + 1).padStart(2, '0');
                            const todayDay = String(today.getDate()).padStart(2, '0');
                            const formattedToday = `${todayYear}-${todayMonth}-${todayDay}`;
                            
                            let defaultDateTime = '';
                            if (formattedDisplayDate !== formattedToday) {
                                defaultDateTime = `${formattedDisplayDate}T09:00`;
                            }

                            setInitialFormDate(defaultDateTime);
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
                                                  <div className="space-y-2 sm:space-y-3">
                                                    {room.surgeries.sort((a, b) => {
                                                      if (a.status === 'completed' && b.status !== 'completed') return 1;
                                                      if (b.status === 'completed' && a.status !== 'completed') return -1;
                                                      return new Date(a.dateTime) - new Date(b.dateTime);
                                                    }).map((surgery, index) => {                            const isCurrent = currentSurgery && currentSurgery.id === surgery.id;
                                return (
                                  <Draggable key={surgery.id} draggableId={surgery.id.toString()} index={index} isDragDisabled={!canEdit}>
                                    {(provided) => (
                                      <div
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        {...provided.dragHandleProps}
                                      >
                                        <div className={`rounded-xl shadow-md hover:shadow-lg transition-shadow ${getStatusColor(surgery, currentSurgery)} overflow-hidden`}>

                                          {/* Patient Details Section */}
                                          <div className="px-2 sm:px-2 pb-3 border-b border-gray-200">
                                            <h3 className="font-bold text-base sm:text-lg lg:text-xl mb-1 mt-1" dir="auto">
                                              {surgery.patientName}
                                            </h3>
                                            <div className="flex items-center gap-2 text-xs sm:text-sm ">
                                              <span className="font-medium">{surgery.age}yr</span>
                                              <span>/</span>
                                              <span className="font-medium">{surgery.gender === 'Male' ? 'M' : 'F'}</span>
                                              <span>/</span>
                                              <span className="font-medium">{formatDisplayDob(surgery.dob)}</span>
                                            </div>
                                          </div>

                                          {/* Surgery Details Section */}
                                          <div className="px-2 sm:px-2 py-3 bg-gray-50 space-y-2">
                                            <div className="flex items-start gap-2">

                                              <div className="flex-1">
                                                <p className="text-xs text-gray-500 font-medium">Operation</p>
                                                <p className="text-sm sm:text-base font-semibold text-gray-800" dir="auto">{surgery.operationName}</p>
                                              </div>
                                            </div>

                                            <div className="flex items-start gap-2">
                                              <div className="flex-1">
                                                <p className="text-xs text-gray-500 font-medium">Eye</p>
                                                <p className="text-sm sm:text-base font-semibold text-gray-800">{surgery.eye}</p>
                                              </div>
                                            </div>

                                            <div className="flex items-start gap-2">
                                              <div className="flex-1">
                                                <p className="text-xs text-gray-500 font-medium">Surgeon</p>
                                                <p className="text-sm sm:text-base font-semibold text-gray-800" dir="auto">{surgery.surgeonName}</p>
                                              </div>
                                            </div>

                                            <div className="flex items-start gap-2">
                                              <div className="flex-1">
                                                <p className="text-xs text-gray-500 font-medium">Surgeon Assistant</p>
                                                <p className="text-sm sm:text-base font-semibold text-gray-800" dir="auto">{surgery.surgeonAssistant}</p>
                                              </div>
                                            </div>

                                            {/* New Data Display */}
                                            {(surgery.visualAcuityRight || surgery.visualAcuityLeft) && (
                                              <div className="flex items-start gap-2 border-t border-gray-100 pt-2">
                                                <div className="flex-1">
                                                  <p className="text-xs text-gray-500 font-medium">Visual Acuity</p>
                                                  <div className="flex gap-4 text-xs sm:text-sm font-semibold text-gray-800">
                                                    {surgery.visualAcuityRight && <span>OD: {surgery.visualAcuityRight}</span>}
                                                    {surgery.visualAcuityLeft && <span>OS: {surgery.visualAcuityLeft}</span>}
                                                  </div>
                                                </div>
                                              </div>
                                            )}
                                            {(surgery.refractionRight || surgery.refractionLeft) && (
                                              <div className="flex items-start gap-2">
                                                <div className="flex-1">
                                                  <p className="text-xs text-gray-500 font-medium">Refraction</p>
                                                  <div className="flex gap-4 text-xs sm:text-sm font-semibold text-gray-800">
                                                    {surgery.refractionRight && <span>OD: {surgery.refractionRight}</span>}
                                                    {surgery.refractionLeft && <span>OS: {surgery.refractionLeft}</span>}
                                                  </div>
                                                </div>
                                              </div>
                                            )}
                                            {(surgery.iolPowerRight || surgery.iolPowerLeft) && (
                                              <div className="flex items-start gap-2">
                                                <div className="flex-1">
                                                  <p className="text-xs text-gray-500 font-medium">IOL Power</p>
                                                  <div className="flex gap-4 text-xs sm:text-sm font-semibold text-gray-800">
                                                    {surgery.iolPowerRight && <span>OD: {surgery.iolPowerRight}</span>}
                                                    {surgery.iolPowerLeft && <span>OS: {surgery.iolPowerLeft}</span>}
                                                  </div>
                                                </div>
                                              </div>
                                            )}
                                          </div>

                                          {/* Time Footer */}
                                          <div className="px-3 sm:px-4 py-2.5 bg-gradient-to-r border-t border-blue-100">
                                            <div className="flex items-center justify-center gap-2 ">
                                              <Clock size={14} className="sm:w-4 sm:h-4" />
                                              <span className="text-xs sm:text-sm font-semibold">
                                                {new Date(surgery.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                              </span>
                                              <div className="flex justify-end gap-2">
                                            {canEdit && <button
                                              onClick={() => setEditingSurgery(surgery)}
                                              className="hover:text-blue-500"
                                            >
                                              <Pencil size={14} className="sm:w-4 sm:h-4" />
                                            </button>}

                                            {canEdit && isAdmin && <button
                                                onClick={() => handleRemoveSurgery(room.id, surgery.id)}
                                                className="hover:text-red-500"
                                              >
                                                <Trash2 size={14} className="sm:w-4 sm:h-4" />
                                              </button>
                                            }
                                            </div>
                                            </div>
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
  <AddSurgeryForm
    editingRoom={editingRoom}
    setShowAddForm={setShowAddForm}
    initialDateTime={initialFormDate}
    onAddSurgery={handleAddSurgery}
  />
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
