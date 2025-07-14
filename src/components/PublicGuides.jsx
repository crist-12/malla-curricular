import { useState, useEffect } from 'react';
import { db } from '../config/firebase';
import { collection, query, where, getDocs, addDoc, getDoc, doc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

const countryNames = {
  AR: 'Argentina',
  BO: 'Bolivia',
  BR: 'Brasil',
  CL: 'Chile',
  CO: 'Colombia',
  CR: 'Costa Rica',
  CU: 'Cuba',
  DO: 'República Dominicana',
  EC: 'Ecuador',
  SV: 'El Salvador',
  GT: 'Guatemala',
  HN: 'Honduras',
  MX: 'México',
  NI: 'Nicaragua',
  PA: 'Panamá',
  PY: 'Paraguay',
  PE: 'Perú',
  PR: 'Puerto Rico',
  UY: 'Uruguay',
  VE: 'Venezuela'
};

export default function PublicGuides() {
  const { currentUser } = useAuth();
  const [guides, setGuides] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState('university');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPublicGuides();
  }, []);

  async function loadPublicGuides() {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'guides'),
        where('isPublic', '==', true)
      );
      const querySnapshot = await getDocs(q);
      const guidesPromises = querySnapshot.docs.map(async (docSnap) => {
        const guideData = { id: docSnap.id, ...docSnap.data() };
        // Obtener información del usuario que creó la guía
        const userDoc = await getDoc(doc(db, 'users', guideData.userId));
        const userData = userDoc.data();
        return {
          ...guideData,
          userCountry: userData?.country || 'Unknown'
        };
      });
      const guidesData = await Promise.all(guidesPromises);
      setGuides(guidesData);
    } catch (error) {
      console.error('Error al cargar guías públicas:', error);
    }
    setLoading(false);
  }

  async function handleCloneGuide(guide) {
    try {
      const clonedGuideData = {
        ...guide,
        userId: currentUser.uid,
        isPublic: false,
        name: `${guide.name} (Copia)`,
        createdAt: new Date()
      };

      delete clonedGuideData.id;
      delete clonedGuideData.userCountry;

      await addDoc(collection(db, 'guides'), clonedGuideData);
      alert('Guía clonada exitosamente');
    } catch (error) {
      console.error('Error al clonar la guía:', error);
      alert('Error al clonar la guía');
    }
  }

  const filteredGuides = guides.filter(guide => {
    const searchValue = searchTerm.toLowerCase();
    if (searchType === 'university') {
      return guide.university.toLowerCase().includes(searchValue);
    } else if (searchType === 'name') {
      return guide.name.toLowerCase().includes(searchValue);
    } else if (searchType === 'country') {
      const countryName = countryNames[guide.userCountry] || '';
      return countryName.toLowerCase().includes(searchValue);
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Guías Públicas</h1>

      <div className="mb-6">
        <div className="flex space-x-4 mb-4">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="input-field pl-10"
              placeholder={`Buscar por ${searchType === 'university' ? 'universidad' : searchType === 'name' ? 'nombre de la guía' : 'país'}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="input-field w-48"
            value={searchType}
            onChange={(e) => setSearchType(e.target.value)}
          >
            <option value="university">Universidad</option>
            <option value="name">Nombre de la guía</option>
            <option value="country">País</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : filteredGuides.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGuides.map((guide) => (
            <div key={guide.id} className="bg-white rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 overflow-hidden">
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2 hover:line-clamp-none transition-all duration-300">
                      {guide.name}
                    </h3>
                    <p className="text-indigo-600 font-semibold mb-3">{guide.university}</p>
                    <div className="flex items-center space-x-2 mb-4">
                      <img
                        src={`https://flagcdn.com/24x18/${guide.userCountry.toLowerCase()}.png`}
                        alt={countryNames[guide.userCountry]}
                        className="h-4 w-auto rounded shadow-sm"
                      />
                      <span className="text-sm text-gray-600">
                        {countryNames[guide.userCountry] || 'País desconocido'}
                      </span>
                    </div>
                  </div>
                  {currentUser && (
                    <button
                      onClick={() => handleCloneGuide(guide)}
                      className="ml-4 p-2 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-full transition-colors duration-200"
                      title="Clonar guía"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M7 9a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2H9a2 2 0 01-2-2V9z" />
                        <path d="M5 3a2 2 0 00-2 2v6a2 2 0 002 2V5h8a2 2 0 00-2-2H5z" />
                      </svg>
                    </button>
                  )}
                </div>
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center space-x-2">
                    <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-sm font-medium">
                      {guide.periodType.charAt(0).toUpperCase() + guide.periodType.slice(1)}
                    </span>
                    <span className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm font-medium">
                      {guide.subjects?.length || 0} materias
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500">
            {searchTerm
              ? 'No se encontraron guías que coincidan con tu búsqueda.'
              : 'No hay guías públicas disponibles.'}
          </p>
        </div>
      )}
    </div>
  );
}