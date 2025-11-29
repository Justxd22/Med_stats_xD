
"use client";
import React, { useState, useEffect } from 'react';
import { Search, Plus, X, Clock, CheckCircle, Pencil, Link, ChevronLeft, ChevronRight, User, Cake, Trash2, Calendar, Activity, Eye, Stethoscope, UserPlus } from 'lucide-react';
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

    // Manual formatting to ensure clean LTR string (DD/MM/YYYY)
    const formattedDob = `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${birthYear}`;

    return { dob: formattedDob, age, gender };
  } catch (e) {
    return null;
  }
};

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
  const surgeons = [
    "أ.د/ آمال أحمد عبد الوهاب",
    "أ.د/ أحمد رشيد سامح محمود اللقاني",
    "أ.د/ أحمد سامي الوهيدى الحسيني",
    "أ.د/ أحمد مصطفى إسماعيل",
    "أ.د/ أسعد أحمد ابراهيم غانم",
    "أ.د/ أشرف إبراهيم معوض محمد",
    "أ.د/ أشرف محمد سويلم محمد",
    "أ.د/ أمل مصطفى البندارى زغبي",
    "أ.د/ أيهاب حسن احمد نعمة الله",
    "أ.د/ إجلال محمد السعيد مصطفى",
    "أ.د/ ابراهيم طه العدوى عفصه",
    "أ.د/ اماني السيد بدوي محمد",
    "أ.د/ ايمان عزمي عبد الحميد عوض",
    "أ.د/ ايمان محمد الحفنى عطا",
    "أ.د/ ايمن السيد عبد الغفار محمد",
    "أ.د/ ايهاب محمد عبد الحميد نافع",
    "أ.د/ حاتم السعيد العوضي",
    "أ.د/ حسام الدين طه زينهم",
    "أ.د/ حسام الدين يوسف عمر ابو الخير",
    "أ.د/ حسام محمد على السيد الفلال",
    "أ.د/ حمزة عبد الحميد أحمد عبد الله",
    "أ.د/ داليا صبرى الإمام",
    "أ.د/ رءوف أمين أحمد النفيس",
    "أ.د/ رانيا كامل عبد الحميد فرج",
    "أ.د/ سامح محمود حسن صالح",
    "أ.د/ سامي على محمد أبو الخير",
    "أ.د/ سحر مصطفي الطرشوبي",
    "أ.د/ شريف السعيد الخولى",
    "أ.د/ شــرين محمود عبدالسلام هجرس",
    "أ.د/ طارق احمد عبد الوهاب محسن",
    "أ.د/ طاهر محمد جمال الدين الدسوقي",
    "أ.د/ عادل السيد عبد العال اللايح",
    "أ.د/ عبير محمد صادق خطاب",
    "أ.د/ عصام عبد الحميد السعيد بدور",
    "أ.د/ عمرو محمد حسن القنيشي",
    "أ.د/ ماجدة عبد الواحد التركي",
    "أ.د/ محمد أحمد محمد خلف",
    "أ.د/ محمد عبد الله جاد",
    "أ.د/ محمد ممدوح صابر علوان",
    "أ.د/ محمد نادر رشدي المتولي",
    "أ.د/ محمد هاني عبد الرحمن سالم",
    "أ.د/ منال على حسين إبراهيم",
    "أ.د/ منى عبد القادر رمضان",
    "أ.د/ مها محمد عثمان شاهين",
    "أ.د/ نشأت شوقي زكى",
    "أ.د/ هانم محمد عبد الفتاح كشك",
    "أ.د/ هشام إبراهيم علي السروجي",
    "أ.د/ وليد علي مصطفي أبو سمره",
    "أ.د/ وليد محمد عبد العزيز جعفر"
  ];
  const assistants = [
    "ط/ آلاء أحمد عبد الهادى أبو النجا",
    "ط/ آيه اسماعيل عبد العال سلطان",
    "ط/ آيه عماد الدين مصطفى مصطفى",
    "ط/ أيه صبرى محمد جمعه",
    "ط/ أحمد سمير محمد محمد عسيلى",
    "ط/ أحمد صالح أحمد محمد",
    "ط/ أحمد عامر عبد الله",
    "ط/ أحمد عبد المجيد حسين نصر",
    "ط/ أحمد محمد محمد الشيمى",
    "ط/ أحمـــد محمـــود هـــلال فرج",
    "ط/ احمد سامي علي ابو الخير",
    "ط/ احمد محمد علي الجبوري",
    "ط/ احمد نشات فضل شرف الدين",
    "ط/ أسامة ابراهيم العدوى",
    "ط/ أمانى السيد أحمد محمد",
    "ط/ أميرة أحمد السيد مؤنس",
    "ط/ أميرة أسامة عبد المقصود أحمد",
    "ط/ أميرة محمود بدر الدياسطى",
    "ط/ إسراء عبد السلام محمد جاد",
    "ط/ اريج تيسير نظيف عبدو",
    "ط/ اسلام مدحت رزق",
    "ط/ امل نبيل محمود المهدي",
    "ط/ امنية أحمد الجزار",
    "ط/ امنية سالم",
    "ط/ انجي عمرو حسين الغول",
    "ط/ اهداء محمد فتحي",
    "ط/ ايمان السيد محمود طافور",
    "ط/ ايمان جمال مجاهد",
    "ط/ ايمان سامي",
    "ط/ ايمان سمير احمد عبد الحليم",
    "ط/ ايمان صلاح أحمد البرعى",
    "ط/ ايمن محمد مجلى على",
    "ط/ بنان الصاوي",
    "ط/ تامر محمد بدير",
    "ط/ حسن عثمان",
    "ط/ حنان أحمد السيد ماضي",
    "ط/ خالد مصطفى السعيد",
    "ط/ داليا سمير حامد زقزوق",
    "ط/ دعاء عزت عبد الله محمود",
    "ط/ رؤي فيصل بحبوح",
    "ط/ رحمه أيمن أحمد عبد العزيز",
    "ط/ رغد يوسف حبال",
    "ط/ زيدون احمد جوهر امين",
    "ط/ سارة كامل",
    "ط/ ساره شفيق",
    "ط/ ساره عبد الناصر فتوح ابراهيم",
    "ط/ سالى جمال محمد عماره",
    "ط/ سامي رضوان",
    "ط/ سلمى عادل ابراهيم عبده",
    "ط/ سلمى عثمان السيد سليمان",
    "ط/ سلمي محمود منصور احمد",
    "ط/ سمر عبد الشافى محمد بدر",
    "ط/ شمس عصام ذكى ابراهيم",
    "ط/ شيرين خالد على المتولى",
    "ط/ ضياء نصر منصور نصر",
    "ط/ طاهر علي طاهر",
    "ط/ عبد الرحمن السيد أحمد أبو فوده",
    "ط/ عبد الرحمن حسن قطب قطب",
    "ط/ عبد العزيز على عبد العزيز شقير",
    "ط/ عبد الله السيد عبد الله",
    "ط/ عبد الله سامي عبد الله العجه",
    "ط/ عزة احمد جمال الدين الشاذلي",
    "ط/ علا الملاح",
    "ط/ علا شها",
    "ط/ علياء ايمن ابراهيم الدسوقى",
    "ط/ عمر هشام ابراهيم السروجي",
    "ط/ عمرو محمد محمود طايل",
    "ط/ غاده طه حسن العلاوى",
    "ط/ فاطمة عبد العزيز سعدشتا",
    "ط/ فاطمة مختار الطاهر",
    "ط/ فيرنا عادل ونيس المنياوى",
    "ط/ كمال عيسى علي",
    "ط/ مايكل مدحت ميخائيل مسيحه",
    "ط/ محمد احمد حبيب حسن",
    "ط/ محمد ايهاب محمد نافع",
    "ط/ محمد رضا ابو النجا احمد",
    "ط/ محمد علي عبد الله عبد الله",
    "ط/ مريم طاهر عقل",
    "ط/ مصطفي احمد سامي الوهيدي",
    "ط/ نجوى حسين عبد المجيد",
    "ط/ ندى جمال محمود محمد",
    "ط/ ندى عبد الرحمن على صادق",
    "ط/ ندى مصطفى بدير الخولى",
    "ط/ نديم حسام قاسم العبادله",
    "ط/ نوار اسعد حاطوم",
    "ط/ هاجر خيري",
    "ط/ هدير السيد",
    "ط/ ولاء وائل",
    "ط/ يارا نبيل مصطفى ابراهيم"
  ];

  const visualAcuityOptions = [
    "6/6", "6/9", "6/12", "6/18", "6/24", "6/36", "6/60",
    "5/60", "4/60", "3/60", "2/60", "1/60",
    "CF 75 cm", "CF 50 cm", "CF 25 cm",
    "HM", "PL", "No PL", "can't be assessed"
  ];
  // ---
  const canEdit = isEditable;

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
  const [currentStep, setCurrentStep] = useState(1);
  
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
    setCurrentStep(1);
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

                            setFormData(prev => ({ ...prev, dateTime: defaultDateTime }));
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
            <button onClick={() => { setShowAddForm(false); setCurrentStep(1); }} className="text-white hover:bg-white/20 p-2 rounded-lg transition flex-shrink-0">
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
              onClick={onAddSurgery}
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
