import React, { useState, useEffect } from 'react';
import { Search, Plus, X, Clock, CheckCircle } from 'lucide-react';

const SurgeryRoomDisplay = () => {
  const roomColors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500'];
  
  const [rooms, setRooms] = useState([
    { id: 1, color: roomColors[0], surgeries: [] },
    { id: 2, color: roomColors[1], surgeries: [] },
    { id: 3, color: roomColors[2], surgeries: [] },
    { id: 4, color: roomColors[3], surgeries: [] },
    { id: 5, color: roomColors[4], surgeries: [] }
  ]);
  
  const [history, setHistory] = useState([]);
  const [savedPatients, setSavedPatients] = useState([]);
  const [savedDoctors, setSavedDoctors] = useState([]);
  const [savedSurgeryTypes, setSavedSurgeryTypes] = useState([]);
  const [hospitalName, setHospitalName] = useState('Mansoura University Eye Center');
  const [showSettings, setShowSettings] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  const [formData, setFormData] = useState({
    patientName: '',
    date: '',
    time: '',
    surgeryType: '',
    doctorName: ''
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      autoCompleteAndAdvance();
    }, 60000);
    return () => clearInterval(timer);
  }, [rooms]);

  const autoCompleteAndAdvance = () => {
    const now = new Date();
    
    setRooms(prevRooms => prevRooms.map(room => {
      const updatedSurgeries = [...room.surgeries];
      let hasChanges = false;
      
      for (let i = 0; i < updatedSurgeries.length; i++) {
        const surgery = updatedSurgeries[i];
        const nextSurgery = updatedSurgeries[i + 1];
        
        if (surgery.status === 'scheduled' && nextSurgery && nextSurgery.status === 'scheduled') {
          const nextSurgeryDate = new Date(nextSurgery.date);
          const [hours, minutes] = nextSurgery.time.split(':');
          nextSurgeryDate.setHours(parseInt(hours), parseInt(minutes), 0);
          
          if (now >= nextSurgeryDate) {
            updatedSurgeries[i] = { ...surgery, status: 'completed' };
            hasChanges = true;
          }
        }
      }
      
      return hasChanges ? { ...room, surgeries: updatedSurgeries } : room;
    }));

    setHistory(prevHistory => {
      const now = new Date();
      return prevHistory.map(record => {
        if (record.status === 'scheduled') {
          const room = rooms.find(r => r.id === record.roomId);
          if (room) {
            const surgeryIndex = room.surgeries.findIndex(s => s.id === record.id);
            const nextSurgery = room.surgeries[surgeryIndex + 1];
            
            if (nextSurgery && nextSurgery.status === 'scheduled') {
              const nextSurgeryDate = new Date(nextSurgery.date);
              const [hours, minutes] = nextSurgery.time.split(':');
              nextSurgeryDate.setHours(parseInt(hours), parseInt(minutes), 0);
              
              if (now >= nextSurgeryDate) {
                return { ...record, status: 'completed' };
              }
            }
          }
        }
        return record;
      });
    });
  };

  const isCurrentSurgery = (surgery) => {
    const now = new Date();
    const surgeryDate = new Date(surgery.date);
    const [hours, minutes] = surgery.time.split(':');
    surgeryDate.setHours(parseInt(hours), parseInt(minutes), 0);
    
    const isToday = surgeryDate.toDateString() === now.toDateString();
    const isTimeToStart = now >= surgeryDate;
    
    return surgery.status === 'scheduled' && isToday && isTimeToStart;
  };

  const getCurrentSurgery = (surgeries) => {
    const scheduled = surgeries.filter(s => s.status === 'scheduled');
    for (let surgery of scheduled) {
      if (isCurrentSurgery(surgery)) {
        return surgery;
      }
    }
    return null;
  };

  const getStatusColor = (surgery, currentSurgery) => {
    if (surgery.status === 'completed') return 'bg-green-100 text-green-800 border-green-300';
    if (currentSurgery && currentSurgery.id === surgery.id) return 'bg-red-100 text-red-800 border-red-300';
    return 'bg-gray-100 text-gray-700 border-gray-300';
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleAddSurgery = (roomId) => {
    if (!formData.patientName || !formData.date || !formData.time || !formData.surgeryType || !formData.doctorName) {
      alert('Please fill all fields');
      return;
    }

    if (!savedPatients.includes(formData.patientName)) {
      setSavedPatients([...savedPatients, formData.patientName]);
    }
    if (!savedDoctors.includes(formData.doctorName)) {
      setSavedDoctors([...savedDoctors, formData.doctorName]);
    }
    if (!savedSurgeryTypes.includes(formData.surgeryType)) {
      setSavedSurgeryTypes([...savedSurgeryTypes, formData.surgeryType]);
    }

    const newSurgery = {
      ...formData,
      id: Date.now(),
      roomId,
      status: 'scheduled',
      timestamp: new Date().toISOString()
    };

    setRooms(rooms.map(room => 
      room.id === roomId 
        ? { ...room, surgeries: [...room.surgeries, newSurgery].sort((a, b) => a.time.localeCompare(b.time)) }
        : room
    ));
    
    setHistory([newSurgery, ...history]);
    setFormData({ patientName: '', date: '', time: '', surgeryType: '', doctorName: '' });
    setShowAddForm(false);
    setEditingRoom(null);
  };

  const handleStatusChange = (roomId, surgeryId, newStatus) => {
    setRooms(rooms.map(room => 
      room.id === roomId 
        ? { 
            ...room, 
            surgeries: room.surgeries.map(s => 
              s.id === surgeryId ? { ...s, status: newStatus } : s
            )
          }
        : room
    ));
    
    setHistory(history.map(h => 
      h.id === surgeryId ? { ...h, status: newStatus } : h
    ));
  };

  const handleRemoveSurgery = (roomId, surgeryId) => {
    setRooms(rooms.map(room => 
      room.id === roomId 
        ? { ...room, surgeries: room.surgeries.filter(s => s.id !== surgeryId) }
        : room
    ));
  };

  const filteredHistory = history.filter(record =>
    record.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.doctorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.surgeryType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-900 p-4">
      <div className="max-w-full mx-auto">
        {/* Hospital Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-8 rounded-lg shadow-2xl mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-5xl font-bold mb-2">{hospitalName}</h1>
              <p className="text-2xl text-blue-100">Surgery Room Status Board</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold">{currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
              <p className="text-xl text-blue-100">{currentTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
          </div>
          <div className="flex gap-4 mt-4 text-lg">
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
          </div>
        </div>

        <div className="flex justify-end gap-3 mb-6">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 text-lg font-medium"
          >
            Settings
          </button>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 flex items-center gap-2 text-lg font-medium"
          >
            <Search size={22} />
            {showHistory ? 'View Rooms' : 'Search History'}
          </button>
        </div>

        {showSettings && (
          <div className="bg-gray-800 rounded-lg p-6 mb-6 text-white">
            <h3 className="text-2xl font-bold mb-4">Settings</h3>
            <div className="mb-4">
              <label className="block text-lg font-medium mb-2">Hospital Name</label>
              <input
                type="text"
                value={hospitalName}
                onChange={(e) => setHospitalName(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 text-white border border-gray-600 rounded-lg text-lg"
              />
            </div>
          </div>
        )}

        {!showHistory ? (
          <div className="grid grid-cols-5 gap-4">
            {rooms.map(room => {
              const currentSurgery = getCurrentSurgery(room.surgeries);
              return (
                <div key={room.id} className="bg-gray-800 rounded-lg shadow-2xl overflow-hidden">
                  <div className={`${room.color} text-white p-4 flex justify-between items-center`}>
                    <h2 className="text-2xl font-bold">Surgery {room.id}</h2>
                    <button
                      onClick={() => {
                        setEditingRoom(room.id);
                        setShowAddForm(true);
                      }}
                      className="bg-white bg-opacity-30 hover:bg-opacity-40 p-2 rounded-lg"
                    >
                      <Plus size={20} />
                    </button>
                  </div>
                  
                  <div className="p-4">
                    {room.surgeries.length > 0 ? (
                      <div className="space-y-3 max-h-[600px] overflow-y-auto">
                        {room.surgeries.map((surgery) => {
                          const isCurrent = currentSurgery && currentSurgery.id === surgery.id;
                          return (
                            <div key={surgery.id} className={`border-2 rounded-lg p-3 ${getStatusColor(surgery, currentSurgery)}`}>
                              <div className="flex justify-between items-start mb-2">
                                <div className="flex-1">
                                  <p className="font-bold text-lg">{surgery.patientName}</p>
                                  <p className="text-sm flex items-center gap-1 mt-1">
                                    <Clock size={14} />
                                    {surgery.time}
                                  </p>
                                </div>
                                <button
                                  onClick={() => handleRemoveSurgery(room.id, surgery.id)}
                                  className="text-gray-400 hover:text-red-500"
                                >
                                  <X size={16} />
                                </button>
                              </div>
                              
                              <div className="text-sm space-y-1 mb-2">
                                <p className="truncate"><span className="font-medium">Surgery:</span> {surgery.surgeryType}</p>
                                <p className="truncate"><span className="font-medium">Doctor:</span> {surgery.doctorName}</p>
                              </div>
                              
                              <div className="flex gap-2">
                                {surgery.status === 'scheduled' && isCurrent && (
                                  <button
                                    onClick={() => handleStatusChange(room.id, surgery.id, 'completed')}
                                    className="flex-1 px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600 flex items-center justify-center gap-1 font-medium"
                                  >
                                    <CheckCircle size={12} />
                                    Complete
                                  </button>
                                )}
                                {surgery.status === 'completed' && (
                                  <span className="flex-1 px-2 py-1 bg-green-600 text-white rounded text-xs text-center font-medium">
                                    ✓ Done
                                  </span>
                                )}
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
                placeholder="Search by patient name, doctor, or surgery type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-6 py-4 bg-gray-700 text-white border border-gray-600 rounded-lg text-lg"
              />
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-700 border-b border-gray-600">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-300 uppercase">Surgery</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-300 uppercase">Patient</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-300 uppercase">Date</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-300 uppercase">Time</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-300 uppercase">Surgery</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-300 uppercase">Doctor</th>
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
                      <td className="px-6 py-4 font-medium text-lg">{record.patientName}</td>
                      <td className="px-6 py-4 text-lg">{record.date}</td>
                      <td className="px-6 py-4 text-lg">{record.time}</td>
                      <td className="px-6 py-4 text-lg">{record.surgeryType}</td>
                      <td className="px-6 py-4 text-lg">{record.doctorName}</td>
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
                <h3 className="text-3xl font-bold">Add Surgery - Surgery {editingRoom}</h3>
                <button onClick={() => {
                  setShowAddForm(false);
                  setEditingRoom(null);
                  setFormData({ patientName: '', date: '', time: '', surgeryType: '', doctorName: '' });
                }} className="text-gray-400 hover:text-white">
                  <X size={32} />
                </button>
              </div>
              
              <div className="space-y-5">
                <div>
                  <label className="block text-lg font-medium mb-2">Patient Name</label>
                  <input
                    type="text"
                    name="patientName"
                    list="patients"
                    value={formData.patientName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-gray-700 text-white border border-gray-600 rounded-lg text-lg"
                  />
                  <datalist id="patients">
                    {savedPatients.map((patient, idx) => (
                      <option key={idx} value={patient} />
                    ))}
                  </datalist>
                </div>
                
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-lg font-medium mb-2">Date</label>
                    <input
                      type="date"
                      name="date"
                      value={formData.date}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-gray-700 text-white border border-gray-600 rounded-lg text-lg"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-lg font-medium mb-2">Time</label>
                    <input
                      type="time"
                      name="time"
                      value={formData.time}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-gray-700 text-white border border-gray-600 rounded-lg text-lg"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-lg font-medium mb-2">Surgery Type</label>
                  <input
                    type="text"
                    name="surgeryType"
                    list="surgeryTypes"
                    value={formData.surgeryType}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-gray-700 text-white border border-gray-600 rounded-lg text-lg"
                  />
                  <datalist id="surgeryTypes">
                    {savedSurgeryTypes.map((type, idx) => (
                      <option key={idx} value={type} />
                    ))}
                  </datalist>
                </div>
                
                <div>
                  <label className="block text-lg font-medium mb-2">Doctor Name</label>
                  <input
                    type="text"
                    name="doctorName"
                    list="doctors"
                    value={formData.doctorName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-gray-700 text-white border border-gray-600 rounded-lg text-lg"
                  />
                  <datalist id="doctors">
                    {savedDoctors.map((doctor, idx) => (
                      <option key={idx} value={doctor} />
                    ))}
                  </datalist>
                </div>
                
                <button
                  onClick={() => handleAddSurgery(editingRoom)}
                  className="w-full bg-blue-600 text-white py-4 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 text-xl font-medium"
                >
                  <Plus size={24} />
                  Add Surgery
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SurgeryRoomDisplay;