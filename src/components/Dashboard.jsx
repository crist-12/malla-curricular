import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../config/firebase';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { PlusIcon } from '@heroicons/react/24/outline';

export default function Dashboard() {
  const { currentUser } = useAuth();
  const [guides, setGuides] = useState([]);
  const [showNewGuideForm, setShowNewGuideForm] = useState(false);
  const [newGuide, setNewGuide] = useState({
    name: '',
    university: '',
    periodType: 'semester'
  });

  useEffect(() => {
    loadGuides();
  }, [currentUser]);

  async function loadGuides() {
    if (!currentUser) return;

    try {
      const q = query(
        collection(db, 'guides'),
        where('userId', '==', currentUser.uid)
      );
      const querySnapshot = await getDocs(q);
      const guidesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setGuides(guidesData);
    } catch (error) {
      console.error('Error al cargar las guías:', error);
    }
  }

  async function handleCreateGuide(e) {
    e.preventDefault();
    
    try {
      const guideData = {
        ...newGuide,
        userId: currentUser.uid,
        createdAt: new Date(),
        subjects: [],
        isPublic: false
      };

      await addDoc(collection(db, 'guides'), guideData);
      setShowNewGuideForm(false);
      setNewGuide({ name: '', university: '', periodType: 'semester' });
      loadGuides();
    } catch (error) {
      console.error('Error al crear la guía:', error);
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Mis Guías Curriculares</h1>
        <button
          onClick={() => setShowNewGuideForm(true)}
          className="btn-primary flex items-center"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Nueva Guía
        </button>
      </div>

      {showNewGuideForm && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Crear Nueva Guía</h2>
            <form onSubmit={handleCreateGuide} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Nombre de la guía
                </label>
                <input
                  type="text"
                  required
                  className="input-field mt-1"
                  value={newGuide.name}
                  onChange={(e) => setNewGuide({ ...newGuide, name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Universidad
                </label>
                <input
                  type="text"
                  required
                  className="input-field mt-1"
                  value={newGuide.university}
                  onChange={(e) => setNewGuide({ ...newGuide, university: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Tipo de periodo
                </label>
                <select
                  className="input-field mt-1"
                  value={newGuide.periodType}
                  onChange={(e) => setNewGuide({ ...newGuide, periodType: e.target.value })}
                >
                  <option value="semester">Semestre</option>
                  <option value="quarter">Cuatrimestre</option>
                  <option value="trimester">Trimestre</option>
                  <option value="bimester">Bimestre</option>
                </select>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowNewGuideForm(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  Crear Guía
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {guides.map((guide) => (
          <Link
            key={guide.id}
            to={`/guide/${guide.id}`}
            className="block bg-white rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 overflow-hidden"
          >
            <div className="p-6">
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2 hover:line-clamp-none transition-all duration-300">
                  {guide.name}
                </h3>
                <p className="text-indigo-600 font-semibold mb-4">{guide.university}</p>
              </div>
              
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center space-x-2">
                  <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-sm font-medium">
                    {guide.periodType.charAt(0).toUpperCase() + guide.periodType.slice(1)}
                  </span>
                  <span className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm font-medium">
                    {guide.subjects?.length || 0} materias
                  </span>
                  {guide.isPublic && (
                    <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                      </svg>
                      Pública
                    </span>
                  )}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {guides.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No tienes guías curriculares creadas.</p>
          <p className="text-gray-500 mt-2">
            Haz clic en "Nueva Guía" para comenzar.
          </p>
        </div>
      )}
    </div>
  );
}