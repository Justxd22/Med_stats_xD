
"use client";
import React, { useState, useEffect } from 'react';
import { Search, Plus, X, Clock, CheckCircle, Pencil } from 'lucide-react';
import Image from 'next/image';

const SurgeryRoomDisplay = ({ rooms, history, handleAddSurgery, handleStatusChange, handleRemoveSurgery, isAdmin }) => {
  const roomColors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500', 'bg-teal-500', 'bg-indigo-500'];
  
  const [hospitalName, setHospitalName] = useState('Mansoura University');
  const [showSettings, setShowSettings] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportDate, setExportDate] = useState('');
  const [exportEndDate, setExportEndDate] = useState('');
  const [editingRoom, setEditingRoom] = useState(null);
  const [editingSurgery, setEditingSurgery] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  const [formData, setFormData] = useState({
    patientName: '',
    age: '',
    dateTime: '',
    diagnosis: '',
    anesthesiaType: '',
    surgeonName: ''
  });

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
        return 'bg-orange-800 text-white-900 border-orange-300';
      default:
        return 'bg-gray-900 text-white-900 border-gray-300';
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const onAddSurgery = () => {
    if (!formData.patientName || !formData.age || !formData.dateTime || !formData.diagnosis || !formData.anesthesiaType || !formData.surgeonName) {
      alert('Please fill all fields');
      return;
    }
    handleAddSurgery(editingRoom, formData);
    setFormData({ patientName: '', age: '', dateTime: '', diagnosis: '', anesthesiaType: '', surgeonName: '' });
    setShowAddForm(false);
    setEditingRoom(null);
  }

  const handleExport = () => {
    if (!exportDate || !exportEndDate) {
      alert('Please select a start and end date to export.');
      return;
    }

    const startDate = new Date(exportDate);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(exportEndDate);
    endDate.setHours(23, 59, 59, 999);

    const surgeriesToExport = rooms
      .filter(room => room)
      .flatMap(room => room.surgeries || [])
      .filter(surgery => {
        const surgeryDate = new Date(surgery.dateTime);
        return surgeryDate >= startDate && surgeryDate <= endDate;
      });

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
  };

  const filteredHistory = history.filter(record =>
    record.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.surgeonName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.diagnosis.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const todayString = new Date().toDateString();
  const todaysSurgeries = rooms.filter(room => room).flatMap(room => room.surgeries || []).filter(surgery => new Date(surgery.dateTime).toDateString() === todayString);
  const totalToday = todaysSurgeries.length;
  const totalCompletedToday = todaysSurgeries.filter(s => s.status === 'completed').length;

  return (
    <div className="min-h-screen bg-gray-900 p-4">
      <div className="max-w-full mx-auto pb-32">
        {/* Hospital Header */} 
        <div className="bg-white  text-white p-4 rounded-lg shadow-2xl mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold mb-2 text-blue-900 pl-6">Mansoura University</h1>
              <p className="text-3xl text-gray-600 pl-6">Ophthalmology Center</p>
            </div>
            <div className="flex justify-center">
                <Image src="/logo.png" alt="Logo" width={130} height={130} />
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-blue-900 pr-6">{currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
              <p className="text-xl text-gray-600 pr-6">{currentTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
              {/* <div className="mt-2">
                <p className="text-lg text-blue-900">Total Operations Today: {totalToday}</p>
                <p className="text-lg text-blue-900">Completed Today: {totalCompletedToday}</p>
              </div> */}
            </div>
          </div>
          {/* <div className="flex gap-4 mt-4 text-lg text-blue-900">
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 bg-red-500 rounded"></span>
              <span>In Progress</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 bg-green-500 rounded"></span>
              <span>Completed</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 bg-gray-300 rounded"></span>
              <span>Scheduled</span>
            </div>
          </div> */}
        </div>

        <div className="flex justify-end gap-3 mb-6">
          {isAdmin && (<>
            <button
              onClick={() => setShowExportModal(!showExportModal)}
              className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 text-lg font-medium"
            >
              Export to Excel
            </button>
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 flex items-center gap-2 text-lg font-medium"
            >
              <Search size={22} />
              {showHistory ? 'View Rooms' : 'Search History'}
            </button>
          </>)}
        </div>

        {showExportModal && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg p-8 w-full max-w-md text-white">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-3xl font-bold">Export to Excel</h3>
                <button onClick={() => setShowExportModal(false)} className="text-gray-400 hover:text-white">
                  <X size={32} />
                </button>
              </div>
              <div className="space-y-5">
                <div>
                  <label className="block text-lg font-medium mb-2">From</label>
                  <input
                    type="date"
                    value={exportDate}
                    onChange={(e) => setExportDate(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-700 text-white border border-gray-600 rounded-lg text-lg"
                  />
                </div>
                <div>
                  <label className="block text-lg font-medium mb-2">To</label>
                  <input
                    type="date"
                    value={exportEndDate}
                    onChange={(e) => setExportEndDate(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-700 text-white border border-gray-600 rounded-lg text-lg"
                  />
                </div>
                <button
                  onClick={handleExport}
                  className="w-full bg-blue-600 text-white py-4 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 text-xl font-medium"
                >
                  Export
                </button>
              </div>
            </div>
          </div>
        )}

        {!showHistory ? (
          <div className="grid grid-cols-7 gap-4">
            {rooms.filter(room => room).map(room => {
              const currentSurgery = getCurrentSurgery(room.surgeries);
              return (
                <div key={room.id} className="bg-gray-800 rounded-lg shadow-2xl overflow-hidden">
                  <div className={`${room.color} text-white p-4 flex justify-between items-center`}>
                    <h2 className="text-2xl font-bold">OR{room.id}</h2>
                    {isAdmin && <button
                      onClick={() => {
                        setEditingRoom(room.id);
                        setShowAddForm(true);
                      }}
                      className="bg-opacity-30 hover:bg-opacity-40 p-2 rounded-lg"
                    >
                      <Pencil size={20} />
                    </button>}
                  </div>
                  
                  <div className="p-4">
                    {room.surgeries && room.surgeries.length > 0 ? (
                      <div className="space-y-3 max-h-[600px] overflow-y-auto">
                        {room.surgeries.map((surgery) => {
                          const isCurrent = currentSurgery && currentSurgery.id === surgery.id;
                          return (
                            <div key={surgery.id} className={`border-2 rounded-lg p-3 ${getStatusColor(surgery, currentSurgery)}`}>
                              <div className="flex justify-between items-start mb-2">
                                <div className="flex-1">
                                  <p className="font-bold text-lg">{surgery.patientName} ({surgery.age})</p>
                                  <p className="text-sm flex items-center gap-1 mt-1">
                                    <Clock size={14} />
                                    {new Date(surgery.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </p>
                                </div>
                                {isAdmin && <div className="flex flex-col gap-2">
                                  <button
                                    onClick={() => handleRemoveSurgery(room.id, surgery.id)}
                                    className="text-gray-400 hover:text-red-500"
                                  >
                                    <X size={16} />
                                  </button>
                                  <button
                                    onClick={() => setEditingSurgery(surgery)}
                                    className="text-gray-400 hover:text-blue-500"
                                  >
                                    <Pencil size={16} />
                                  </button>
                                </div>}
                              </div>
                              
                              <div className="text-sm space-y-1 mb-2">
                                <p><span className="font-medium">Diagnosis:</span> {surgery.diagnosis}</p>
                                <p><span className="font-medium">Anesthesia:</span> {surgery.anesthesiaType}</p>
                                <p><span className="font-medium">Surgeon:</span> {surgery.surgeonName}</p>
                              </div>
                              
                              <div className="flex gap-2">
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-400">
                        <p className="text-base">No surgeries scheduled</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-gray-800 rounded-lg shadow-2xl p-6 text-white">
            <div className="mb-6">
              <input
                type="text"
                placeholder="Search by patient name, surgeon, or diagnosis..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-6 py-4 bg-gray-700 text-white border border-gray-600 rounded-lg text-lg"
              />
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-700 border-b border-gray-600">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-300 uppercase">Room</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-300 uppercase">Patient</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-300 uppercase">Date/Time</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-300 uppercase">Diagnosis</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-300 uppercase">Surgeon</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-300 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {filteredHistory.map(record => (
                    <tr key={record.id} className="hover:bg-gray-700">
                      <td className="px-6 py-4">
                        <span className={`inline-block w-4 h-4 rounded-full ${roomColors[record.roomId - 1]}`}></span>
                        <span className="ml-2 text-lg">{record.roomId}</span>
                      </td>
                      <td className="px-6 py-4 font-medium text-lg">{record.patientName} ({record.age})</td>
                      <td className="px-6 py-4 text-lg">{new Date(record.dateTime).toLocaleString()}</td>
                      <td className="px-6 py-4 text-lg">{record.diagnosis}</td>
                      <td className="px-6 py-4 text-lg">{record.surgeonName}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded text-sm ${record.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                          {record.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredHistory.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  <p className="text-xl">No records found</p>
                </div>
              )}
            </div>
          </div>
        )}

        {showAddForm && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg p-8 w-full max-w-2xl text-white">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-3xl font-bold">Add Surgery - Room {editingRoom}</h3>
                <button onClick={() => {
                  setShowAddForm(false);
                  setEditingRoom(null);
                  setFormData({ patientName: '', age: '', dateTime: '', diagnosis: '', anesthesiaType: '', surgeonName: '' });
                }} className="text-gray-400 hover:text-white">
                  <X size={32} />
                </button>
              </div>
              
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-lg font-medium mb-2">Patient Name</label>
                    <input type="text" name="patientName" value={formData.patientName} onChange={handleInputChange} className="w-full px-4 py-3 bg-gray-700 text-white border border-gray-600 rounded-lg text-lg" />
                  </div>
                  <div>
                    <label className="block text-lg font-medium mb-2">Age</label>
                    <input type="number" name="age" value={formData.age} onChange={handleInputChange} className="w-full px-4 py-3 bg-gray-700 text-white border border-gray-600 rounded-lg text-lg" />
                  </div>
                </div>
                <div>
                  <label className="block text-lg font-medium mb-2">Date/Time</label>
                  <input type="datetime-local" name="dateTime" value={formData.dateTime} onChange={handleInputChange} className="w-full px-4 py-3 bg-gray-700 text-white border border-gray-600 rounded-lg text-lg" />
                </div>
                <div>
                  <label className="block text-lg font-medium mb-2">Diagnosis</label>
                  <input type="text" name="diagnosis" value={formData.diagnosis} onChange={handleInputChange} className="w-full px-4 py-3 bg-gray-700 text-white border border-gray-600 rounded-lg text-lg" />
                </div>
                <div>
                  <label className="block text-lg font-medium mb-2">Anesthesia Type</label>
                  <input type="text" name="anesthesiaType" value={formData.anesthesiaType} onChange={handleInputChange} className="w-full px-4 py-3 bg-gray-700 text-white border border-gray-600 rounded-lg text-lg" />
                </div>
                <div>
                  <label className="block text-lg font-medium mb-2">Surgeon Name</label>
                  <input type="text" name="surgeonName" value={formData.surgeonName} onChange={handleInputChange} className="w-full px-4 py-3 bg-gray-700 text-white border border-gray-600 rounded-lg text-lg" />
                </div>
                
                <button
                  onClick={onAddSurgery}
                  className="w-full bg-blue-600 text-white py-4 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 text-xl font-medium"
                >
                  <Plus size={24} />
                  Add Surgery
                </button>
              </div>
            </div>
          </div>
        )}

        {editingSurgery && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg p-8 w-full max-w-md text-white">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-3xl font-bold">Update Status</h3>
                <button onClick={() => setEditingSurgery(null)} className="text-gray-400 hover:text-white">
                  <X size={32} />
                </button>
              </div>
              <div className="space-y-5">
                <p>Patient: {editingSurgery.patientName}</p>
                <select 
                  onChange={(e) => handleStatusChange(editingSurgery.roomId, editingSurgery.id, e.target.value)}
                  defaultValue={editingSurgery.status}
                  className="w-full px-4 py-3 bg-gray-700 text-white border border-gray-600 rounded-lg text-lg"
                >
                  <option value="scheduled">Waiting</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="delayed">Delayed</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Info Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white text-gray-900 p-4 shadow-lg border-t-2 border-gray-200">
        <div className="max-w-full mx-auto flex justify-between items-center">
          <div className="flex gap-8 text-xm pl-15">
            <div className="flex flex-col items-center text-gray-500">
              <p>Total Operations Today</p>
              <span className="text-3xl text-gray-600 font-bold">{totalToday}</span>
            </div>
            <div className="flex flex-col items-center text-gray-500">
              <p>Completed Today</p>
              <span className="text-3xl text-green-500  font-bold">{totalCompletedToday}</span>
            </div>
          </div>
          <div className="flex gap-6 text-lg pr-15">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 bg-orange-700 border-2 border-orange-700 rounded"></span>
              <span>Waiting</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 bg-red-700 border-2 border-red-700 rounded"></span>
              <span>Delayed</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 bg-green-700 border-2 border-green-700 rounded"></span>
              <span>Completed</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 bg-blue-700 border-2 border-blue-700 rounded"></span>
              <span>In Progress</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SurgeryRoomDisplay;
