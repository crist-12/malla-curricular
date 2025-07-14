import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../config/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { PlusIcon, ArrowDownTrayIcon, ShareIcon, AcademicCapIcon, ChartBarIcon, SwatchIcon } from '@heroicons/react/24/outline';

const colorThemes = {
  default: {
    name: 'Azul Clásico',
    primary: 'bg-blue-500 hover:bg-blue-600',
    secondary: 'bg-gray-200 hover:bg-gray-300',
    header: 'bg-blue-600',
    headerText: 'text-white',
    footer: 'bg-blue-800',
    footerText: 'text-white',
    blocked: 'bg-gray-200 text-gray-600',
    available: 'bg-blue-100 text-blue-800 hover:bg-blue-200',
    inProgress: 'bg-orange-100 text-orange-800 hover:bg-orange-200',
    approved: 'bg-green-100 text-green-800',
    pdfHeader: { bg: [51, 122, 183], text: [255, 255, 255] }
  },
  ocean: {
    name: 'Océano Profundo',
    primary: 'bg-cyan-600 hover:bg-cyan-700',
    secondary: 'bg-slate-200 hover:bg-slate-300',
    header: 'bg-cyan-700',
    headerText: 'text-white',
    footer: 'bg-cyan-900',
    footerText: 'text-white',
    blocked: 'bg-slate-200 text-slate-600',
    available: 'bg-cyan-100 text-cyan-800 hover:bg-cyan-200',
    inProgress: 'bg-teal-100 text-teal-800 hover:bg-teal-200',
    approved: 'bg-emerald-100 text-emerald-800',
    pdfHeader: { bg: [14, 116, 144], text: [255, 255, 255] }
  },
  forest: {
    name: 'Bosque Verde',
    primary: 'bg-green-600 hover:bg-green-700',
    secondary: 'bg-gray-200 hover:bg-gray-300',
    header: 'bg-green-700',
    headerText: 'text-white',
    footer: 'bg-green-900',
    footerText: 'text-white',
    blocked: 'bg-gray-200 text-gray-600',
    available: 'bg-green-100 text-green-800 hover:bg-green-200',
    inProgress: 'bg-lime-100 text-lime-800 hover:bg-lime-200',
    approved: 'bg-emerald-100 text-emerald-800',
    pdfHeader: { bg: [22, 163, 74], text: [255, 255, 255] }
  },
  sunset: {
    name: 'Atardecer',
    primary: 'bg-orange-500 hover:bg-orange-600',
    secondary: 'bg-gray-200 hover:bg-gray-300',
    header: 'bg-orange-600',
    headerText: 'text-white',
    footer: 'bg-orange-800',
    footerText: 'text-white',
    blocked: 'bg-gray-200 text-gray-600',
    available: 'bg-orange-100 text-orange-800 hover:bg-orange-200',
    inProgress: 'bg-amber-100 text-amber-800 hover:bg-amber-200',
    approved: 'bg-yellow-100 text-yellow-800',
    pdfHeader: { bg: [249, 115, 22], text: [255, 255, 255] }
  },
  purple: {
    name: 'Púrpura Real',
    primary: 'bg-purple-600 hover:bg-purple-700',
    secondary: 'bg-gray-200 hover:bg-gray-300',
    header: 'bg-purple-700',
    headerText: 'text-white',
    footer: 'bg-purple-900',
    footerText: 'text-white',
    blocked: 'bg-gray-200 text-gray-600',
    available: 'bg-purple-100 text-purple-800 hover:bg-purple-200',
    inProgress: 'bg-fuchsia-100 text-fuchsia-800 hover:bg-fuchsia-200',
    approved: 'bg-violet-100 text-violet-800',
    pdfHeader: { bg: [147, 51, 234], text: [255, 255, 255] }
  }
};

export default function GuideView() {
  const { guideId } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [guide, setGuide] = useState(null);
  const [showNewSubjectForm, setShowNewSubjectForm] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [showThemeSelector, setShowThemeSelector] = useState(false);
  const [currentTheme, setCurrentTheme] = useState('default');
  const [newSubject, setNewSubject] = useState({
    name: '',
    credits: '',
    period: 1,
    prerequisites: [],
    status: 'blocked',
    score: ''
  });
  const [availablePrerequisites, setAvailablePrerequisites] = useState([]);
  const guideRef = useRef(null);

  useEffect(() => {
    loadGuide();
  }, [guideId]);

  useEffect(() => {
    if (guide?.theme) {
      setCurrentTheme(guide.theme);
    }
  }, [guide]);

  async function loadGuide() {
    try {
      const docRef = doc(db, 'guides', guideId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const guideData = { id: docSnap.id, ...docSnap.data() };
        setGuide(guideData);
        updateAvailablePrerequisites(guideData.subjects || []);
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Error al cargar la guía:', error);
    }
  }

  function updateAvailablePrerequisites(subjects) {
    const prerequisites = subjects.map(subject => ({
      id: subject.id,
      name: subject.name,
      period: subject.period
    }));
    setAvailablePrerequisites(prerequisites);
  }

  async function handleAddSubject(e) {
    e.preventDefault();

    try {
      const subjectId = Date.now().toString();
      const newSubjectData = {
        ...newSubject,
        id: subjectId,
        status: newSubject.prerequisites.length === 0 ? 'available' : 'blocked'
      };

      const updatedSubjects = [...(guide.subjects || []), newSubjectData];

      await updateDoc(doc(db, 'guides', guideId), {
        subjects: updatedSubjects
      });

      setShowNewSubjectForm(false);
      setNewSubject({
        name: '',
        credits: '',
        period: 1,
        prerequisites: [],
        status: 'blocked',
        score: ''
      });
      loadGuide();
    } catch (error) {
      console.error('Error al añadir materia:', error);
    }
  }

  async function handleSubjectStatusChange(subjectId, newStatus, score = '') {
    try {
      const updatedSubjects = guide.subjects.map(subject => {
        if (subject.id === subjectId) {
          return { ...subject, status: newStatus, score: score };
        }
        return subject;
      });

      const updatedSubjectsWithDependencies = updatedSubjects.map(subject => {
        if (subject.prerequisites.includes(subjectId)) {
          const allPrerequisitesApproved = subject.prerequisites.every(preReqId => {
            const prerequisite = updatedSubjects.find(s => s.id === preReqId);
            return prerequisite && prerequisite.status === 'approved';
          });

          return { ...subject, status: allPrerequisitesApproved ? 'available' : 'blocked' };
        }
        return subject;
      });

      await updateDoc(doc(db, 'guides', guideId), {
        subjects: updatedSubjectsWithDependencies
      });

      loadGuide();
      setShowStatusModal(false);
      setSelectedSubject(null);
    } catch (error) {
      console.error('Error al actualizar el estado de la materia:', error);
    }
  }

  async function handleThemeChange(theme) {
    try {
      await updateDoc(doc(db, 'guides', guideId), {
        theme: theme
      });
      setCurrentTheme(theme);
      setShowThemeSelector(false);
      loadGuide();
    } catch (error) {
      console.error('Error al cambiar el tema:', error);
    }
  }

  async function exportToPDF() {
    try {
      const theme = colorThemes[currentTheme];
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = pdf.internal.pageSize.width;
      const pageHeight = pdf.internal.pageSize.height;
      const margin = 15;
      const headerHeight = 40;
      const footerHeight = 20;

      // Header
      pdf.setFillColor(...theme.pdfHeader.bg);
      pdf.rect(0, 0, pageWidth, headerHeight, 'F');

      pdf.setTextColor(...theme.pdfHeader.text);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(16);
      pdf.text(guide.university, margin, 15);
      pdf.text(guide.name, margin, 25);
      pdf.text(`Estudiante: ${currentUser.displayName || currentUser.email}`, margin, 35);

      pdf.setFontSize(12);
      const promedioText = `Promedio Global: ${calculateGlobalIndex()}`;
      const progresoText = `Progreso: ${calculateProgress()}%`;
      pdf.text(promedioText, pageWidth - margin - pdf.getTextWidth(promedioText), 15);
      pdf.text(progresoText, pageWidth - margin - pdf.getTextWidth(progresoText), 25);

      // Content - Periodos en horizontal
      let yPos = headerHeight + margin;
      const periodHeight = 40;
      const subjectWidth = 45;
      const subjectHeight = 30;
      const subjectMargin = 5;

      periods.forEach(period => {
        // Título del periodo
        pdf.setFillColor(240, 240, 240);
        pdf.rect(margin, yPos, pageWidth - 2 * margin, 10, 'F');
        pdf.setTextColor(60, 60, 60);
        pdf.setFontSize(12);
        pdf.text(`${period}º ${guide.periodType === 'semester' ? 'Semestre' : 'Año'}`, margin + 2, yPos + 7);

        // Materias del periodo
        const periodSubjects = guide.subjects.filter(s => s.period === period);
        let xPos = margin;
        yPos += 15;

        periodSubjects.forEach(subject => {
          if (xPos + subjectWidth > pageWidth - margin) {
            xPos = margin;
            yPos += subjectHeight + subjectMargin;
          }

          pdf.setFillColor(...theme.pdfHeader.bg);
          pdf.roundedRect(xPos, yPos, subjectWidth, subjectHeight, 2, 2, 'F');
          pdf.setTextColor(255, 255, 255);
          pdf.setFontSize(8);
          
          // Nombre de la materia
          const lines = pdf.splitTextToSize(subject.name, subjectWidth - 4);
          pdf.text(lines, xPos + 2, yPos + 5);
          
          // Créditos y nota
          pdf.text(`${subject.credits} cr.`, xPos + 2, yPos + subjectHeight - 8);
          if (subject.score) {
            pdf.text(`Nota: ${subject.score}`, xPos + 2, yPos + subjectHeight - 3);
          }

          xPos += subjectWidth + subjectMargin;
        });

        yPos += subjectHeight + margin;
      });

      // Footer
      pdf.setFillColor(...theme.pdfHeader.bg);
      pdf.rect(0, pageHeight - footerHeight, pageWidth, footerHeight, 'F');
      pdf.setTextColor(...theme.pdfHeader.text);
      pdf.setFontSize(8);
      const today = new Date().toLocaleDateString();
      pdf.text(`Generado el ${today} por el Sistema de Malla Curricular`, margin, pageHeight - 8);

      pdf.save(`malla-curricular-${guide.name}.pdf`);
    } catch (error) {
      console.error('Error al exportar a PDF:', error);
    }
  }

  function calculateGlobalIndex() {
    if (!guide?.subjects) return 0;

    const approvedSubjects = guide.subjects.filter(s => s.status === 'approved');
    if (approvedSubjects.length === 0) return 0;

    const totalWeightedScore = approvedSubjects.reduce((sum, subject) => {
      return sum + (parseFloat(subject.score) * parseInt(subject.credits));
    }, 0);

    const totalCredits = approvedSubjects.reduce((sum, subject) => {
      return sum + parseInt(subject.credits);
    }, 0);

    return (totalWeightedScore / totalCredits).toFixed(2);
  }

  function calculateProgress() {
    if (!guide?.subjects) return 0;

    const totalCredits = guide.subjects.reduce((sum, subject) => {
      return sum + parseInt(subject.credits);
    }, 0);

    const approvedCredits = guide.subjects
      .filter(s => s.status === 'approved')
      .reduce((sum, subject) => {
        return sum + parseInt(subject.credits);
      }, 0);

    return ((approvedCredits / totalCredits) * 100).toFixed(1);
  }

  async function togglePublicStatus() {
    try {
      await updateDoc(doc(db, 'guides', guideId), {
        isPublic: !guide.isPublic
      });
      loadGuide();
    } catch (error) {
      console.error('Error al cambiar el estado público:', error);
    }
  }

  if (!guide) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const maxPeriod = Math.max(...guide.subjects.map(s => s.period), 0);
  const periods = Array.from({ length: maxPeriod + 1 }, (_, i) => i + 1);
  const currentThemeStyles = colorThemes[currentTheme];

  return (
    <div className="min-h-screen flex flex-col">
      <header className={`${currentThemeStyles.header} ${currentThemeStyles.headerText} py-4`}>
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-2xl font-bold">{guide.name}</h1>
              <p className="text-gray-200">{guide.university}</p>
            </div>
            <div className="flex items-center space-x-8">
              <div className="flex flex-col items-center">
                <div className="flex items-center text-gray-200 mb-2">
                  <AcademicCapIcon className="h-5 w-5 mr-2" />
                  <span className="font-semibold">Índice: {calculateGlobalIndex()}</span>
                </div>
                <div className="flex items-center text-gray-200">
                  <ChartBarIcon className="h-5 w-5 mr-2" />
                  <span className="font-semibold">Progreso: {calculateProgress()}%</span>
                </div>
              </div>
              <div className="flex space-x-4">
                <button
                  onClick={() => setShowThemeSelector(true)}
                  className={`btn-secondary flex items-center bg-gray-200 text-gray-800 hover:bg-gray-300`}
                >
                  <SwatchIcon className="h-5 w-5 mr-2" />
                  Tema
                </button>
                <button
                  onClick={togglePublicStatus}
                  className={`btn-secondary flex items-center ${guide.isPublic ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
                >
                  <ShareIcon className="h-5 w-5 mr-2" />
                  {guide.isPublic ? 'Pública' : 'Hacer pública'}
                </button>
                <button
                  onClick={exportToPDF}
                  className="btn-secondary flex items-center bg-gray-200 text-gray-800 hover:bg-gray-300"
                >
                  <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                  Exportar PDF
                </button>
                <button
                  onClick={() => setShowNewSubjectForm(true)}
                  className={`btn-primary ${currentThemeStyles.primary} text-white`}
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Añadir Materia
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main ref={guideRef} className="flex-grow bg-white p-6 rounded-lg shadow mb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {periods.map(period => (
            <div key={period} className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 text-center">
                {period}º {guide.periodType === 'semester' ? 'Semestre' : 'Año'}
              </h3>
              {guide.subjects
                .filter(subject => subject.period === period)
                .map(subject => (
                  <div
                    key={subject.id}
                    className={`p-4 rounded-lg cursor-pointer transition-all transform hover:scale-105 shadow-md hover:shadow-xl ${
                      subject.status === 'blocked'
                        ? currentThemeStyles.blocked
                        : subject.status === 'available'
                        ? currentThemeStyles.available
                        : subject.status === 'in_progress'
                        ? currentThemeStyles.inProgress
                        : currentThemeStyles.approved
                    }`}
                    onClick={() => {
                      setSelectedSubject(subject);
                      setShowStatusModal(true);
                    }}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-semibold text-lg flex-1">{subject.name}</h4>
                      <div className="ml-2">
                        {subject.status === 'blocked' && (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                          </svg>
                        )}
                        {subject.status === 'available' && (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                          </svg>
                        )}
                        {subject.status === 'in_progress' && (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                          </svg>
                        )}
                        {subject.status === 'approved' && (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {subject.credits} créditos
                      </span>
                      {subject.score && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Nota: {subject.score}
                        </span>
                      )}
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        subject.status === 'blocked' ? 'bg-gray-100 text-gray-800' :
                        subject.status === 'available' ? 'bg-yellow-100 text-yellow-800' :
                        subject.status === 'in_progress' ? 'bg-orange-100 text-orange-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {subject.status === 'blocked' ? 'Bloqueada' :
                         subject.status === 'available' ? 'Disponible' :
                         subject.status === 'in_progress' ? 'En curso' :
                         'Aprobada'}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          ))}
        </div>
      </main>

      <footer className={`${currentThemeStyles.footer} ${currentThemeStyles.footerText} py-4 fixed bottom-0 w-full`}>
        <div className="container mx-auto text-center">
          <p>Hecha por Christopher Enrique Ortiz Perdomo © {new Date().getFullYear()}</p>
        </div>
      </footer>

      {showNewSubjectForm && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Añadir Materia</h2>
            <form onSubmit={handleAddSubject} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Nombre de la materia
                </label>
                <input
                  type="text"
                  required
                  className="input-field mt-1 p-2 border border-gray-300 rounded-md w-full"
                  value={newSubject.name}
                  onChange={(e) =>
                    setNewSubject({ ...newSubject, name: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Créditos
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  className="input-field mt-1 p-2 border border-gray-300 rounded-md w-full"
                  value={newSubject.credits}
                  onChange={(e) =>
                    setNewSubject({ ...newSubject, credits: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Periodo
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  className="input-field mt-1 p-2 border border-gray-300 rounded-md w-full"
                  value={newSubject.period}
                  onChange={(e) =>
                    setNewSubject({ ...newSubject, period: parseInt(e.target.value) })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Prerrequisitos
                </label>
                <select
                  multiple
                  className="input-field mt-1 p-2 border border-gray-300 rounded-md w-full"
                  value={newSubject.prerequisites}
                  onChange={(e) =>
                    setNewSubject({
                      ...newSubject,
                      prerequisites: Array.from(
                        e.target.selectedOptions,
                        (option) => option.value
                      ),
                    })
                  }
                >
                  {availablePrerequisites
                    .filter((pre) => pre.period < newSubject.period)
                    .map((pre) => (
                      <option key={pre.id} value={pre.id}>
                        {pre.name} ({pre.period}º {guide.periodType})
                      </option>
                    ))}
                </select>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                  onClick={() => setShowNewSubjectForm(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className={`px-4 py-2 text-white rounded-lg ${currentThemeStyles.primary} transition-colors`}>
                  Añadir Materia
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showStatusModal && selectedSubject && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Cambiar Estado - {selectedSubject.name}</h2>
            <div className="space-y-4">
              {selectedSubject.status === 'blocked' && (
                <p className="text-gray-600 mb-4">Esta materia está bloqueada porque no cumple con los prerrequisitos.</p>
              )}

              {selectedSubject.status === 'available' && (
                <>
                  <button
                    className="w-full p-3 text-left rounded-lg bg-orange-100 text-orange-800 hover:bg-orange-200 transition-colors"
                    onClick={() => handleSubjectStatusChange(selectedSubject.id, 'in_progress')}
                  >
                    🔄 Marcar como "Cursando"
                  </button>
                  <button
                    className="w-full p-3 text-left rounded-lg bg-green-100 text-green-800 hover:bg-green-200 transition-colors"
                    onClick={() => {
                      const score = prompt('Ingrese la calificación obtenida (0-100):');
                      if (score !== null) {
                        const numScore = parseFloat(score);
                        if (!isNaN(numScore) && numScore >= 0 && numScore <= 100) {
                          handleSubjectStatusChange(selectedSubject.id, 'approved', numScore.toString());
                        } else {
                          alert('Por favor ingrese una calificación válida entre 0 y 100');
                        }
                      }
                    }}
                  >
                    ✅ Aprobar Materia
                  </button>
                </>
              )}

              {selectedSubject.status === 'in_progress' && (
                <>
                  <button
                    className="w-full p-3 text-left rounded-lg bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors"
                    onClick={() => handleSubjectStatusChange(selectedSubject.id, 'available')}
                  >
                    ⬅️ Volver a "Disponible"
                  </button>
                  <button
                    className="w-full p-3 text-left rounded-lg bg-green-100 text-green-800 hover:bg-green-200 transition-colors"
                    onClick={() => {
                      const score = prompt('Ingrese la calificación obtenida (0-100):');
                      if (score !== null) {
                        const numScore = parseFloat(score);
                        if (!isNaN(numScore) && numScore >= 0 && numScore <= 100) {
                          handleSubjectStatusChange(selectedSubject.id, 'approved', numScore.toString());
                        } else {
                          alert('Por favor ingrese una calificación válida entre 0 y 100');
                        }
                      }
                    }}
                  >
                    ✅ Aprobar Materia
                  </button>
                </>
              )}

              {selectedSubject.status === 'approved' && (
                <>
                  <p className="text-gray-600 mb-2">Calificación actual: {selectedSubject.score}</p>
                  <button
                    className="w-full p-3 text-left rounded-lg bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors"
                    onClick={() => handleSubjectStatusChange(selectedSubject.id, 'available', '')}
                  >
                    ↩️ Desaprobar y volver a "Disponible"
                  </button>
                </>
              )}

              <div className="flex justify-end mt-4">
                <button
                  onClick={() => {
                    setShowStatusModal(false);
                    setSelectedSubject(null);
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showThemeSelector && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Seleccionar Tema</h2>
            <div className="grid grid-cols-1 gap-4">
              {Object.entries(colorThemes).map(([key, theme]) => (
                <button
                  key={key}
                  onClick={() => handleThemeChange(key)}
                  className={`p-4 rounded-lg flex items-center justify-between ${theme.primary} text-white`}
                >
                  <span>{theme.name}</span>
                  {currentTheme === key && (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowThemeSelector(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}