'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import { categoryStorage, itineraryStorage, initializeStorage } from '@/utils/storage';

interface Category {
  id: string;
  name: string;
  isActive: boolean;
  _count: {
    itineraries: number;
  };
}

interface Itinerary {
  id: string;
  title: string;
  categoryId: string;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [itineraries, setItineraries] = useState<Itinerary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showItineraryModal, setShowItineraryModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    isActive: true
  });
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.push('/login');
      return;
    }

    // Initialize storage and load data
    initializeStorage();
    loadCategories();

    // Listen for storage updates from other components
    const handleStorageUpdate = () => {
      loadCategories();
    };

    window.addEventListener('storage-updated', handleStorageUpdate);
    
    return () => {
      window.removeEventListener('storage-updated', handleStorageUpdate);
    };
  }, [router]);

  const loadCategories = () => {
    const categories = categoryStorage.getCategories();
    const itineraries = itineraryStorage.getItineraries();
    
    // Update category counts
    const categoriesWithCounts = categories.map(category => ({
      ...category,
      _count: {
        itineraries: itineraries.filter(i => i.categoryId === category.id).length
      }
    }));
    
    setCategories(categoriesWithCounts);
    setItineraries(itineraries);
    setIsLoading(false);
  };

  const handleAddCategory = () => {
    if (!formData.name.trim()) return;

    const newCategory = categoryStorage.addCategory({
      name: formData.name,
      isActive: formData.isActive
    });

    setCategories([...categories, { ...newCategory, _count: { itineraries: 0 } }]);
    setFormData({ name: '', isActive: true });
    setShowAddModal(false);
    
    // Trigger storage update event to notify other pages
    window.dispatchEvent(new CustomEvent('storage-updated', { 
      detail: { 
        type: 'categories', 
        data: categoryStorage.getCategories() 
      } 
    }));
  };

  const handleEditCategory = () => {
    if (!selectedCategory || !formData.name.trim()) return;

    const updatedCategory = categoryStorage.updateCategory(selectedCategory.id, {
      name: formData.name,
      isActive: formData.isActive
    });

    if (updatedCategory) {
      setCategories(categories.map(cat => 
        cat.id === selectedCategory.id 
          ? { ...cat, name: formData.name, isActive: formData.isActive }
          : cat
      ));
    }
    
    setFormData({ name: '', isActive: true });
    setShowEditModal(false);
    setSelectedCategory(null);
    
    // Trigger storage update event to notify other pages
    window.dispatchEvent(new CustomEvent('storage-updated', { 
      detail: { 
        type: 'categories', 
        data: categoryStorage.getCategories() 
      } 
    }));
  };

  const handleDeleteCategory = (id: string) => {
    const categoryItineraries = itineraries.filter(i => i.categoryId === id);
    
    if (categoryItineraries.length > 0) {
      if (!confirm(`This category has ${categoryItineraries.length} itineraries. Deleting it will move these itineraries to "Unknown Category". Continue?`)) {
        return;
      }
    } else {
      if (!confirm('Are you sure you want to delete this category?')) return;
    }

    categoryStorage.deleteCategory(id);
    setCategories(categories.filter(cat => cat.id !== id));
    
    // Trigger storage update event to notify other pages
    window.dispatchEvent(new CustomEvent('storage-updated', { 
      detail: { 
        type: 'categories', 
        data: categoryStorage.getCategories() 
      } 
    }));
  };

  const openEditModal = (category: Category) => {
    setSelectedCategory(category);
    setFormData({
      name: category.name,
      isActive: category.isActive
    });
    setShowEditModal(true);
  };

  const openItineraryModal = (category: Category) => {
    setSelectedCategory(category);
    setShowItineraryModal(true);
    // Refresh itineraries to get latest data
    const latestItineraries = itineraryStorage.getItineraries();
    setItineraries(latestItineraries);
  };

  const changeItineraryCategory = (itineraryId: string, newCategoryId: string) => {
    itineraryStorage.updateItinerary(itineraryId, { categoryId: newCategoryId });
    
    setItineraries(itineraries.map(i => 
      i.id === itineraryId ? { ...i, categoryId: newCategoryId } : i
    ));
    
    // Update category counts and trigger refresh
    const updatedCategories = categories.map(cat => ({
      ...cat,
      _count: {
        itineraries: itineraries.filter(i => i.categoryId === cat.id).length
      }
    }));
    setCategories(updatedCategories);
    
    // Trigger storage update event
    window.dispatchEvent(new CustomEvent('storage-updated', { 
      detail: { 
        type: 'itineraries', 
        data: itineraryStorage.getItineraries() 
      } 
    }));
  };

  // Listen for storage changes to update counts in real-time
  useEffect(() => {
    const handleStorageChange = () => {
      loadCategories();
    };

    // Custom event listener for storage updates
    window.addEventListener('storage-updated', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage-updated', handleStorageChange);
    };
  }, []);

  const getCategoryItineraries = (categoryId: string) => {
    return itineraries.filter(i => i.categoryId === categoryId);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-primary">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-600"></div>
          <p className="text-secondary animate-pulse">Loading Categories...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-primary min-h-screen">
      <Navigation />
      
      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-primary">Manage Categories</h1>
            <p className="mt-2 text-secondary">Organize your travel packages by categories</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn btn-primary btn-lg"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            Add New Category
          </button>
        </div>

        <div className="card">
          <div className="px-4 py-5 sm:p-6">
            {categories.length === 0 ? (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-primary">No categories</h3>
                <p className="mt-1 text-sm text-secondary">Get started by creating a new category.</p>
                <div className="mt-6">
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="btn btn-primary"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                    </svg>
                    New Category
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categories.map((category) => (
                  <div key={category.id} className="card hover:shadow-lg transition-shadow">
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-medium text-primary">{category.name}</h3>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => openEditModal(category)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Edit category"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(category.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete category"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <span className={`status-${category.isActive ? 'active' : 'inactive'}`}>
                            {category.isActive ? 'Active' : 'Inactive'}
                          </span>
                          <span className="text-sm text-secondary">
                            {category._count.itineraries} itineraries
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => openItineraryModal(category)}
                        className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                        disabled={category._count.itineraries === 0}
                      >
                        View Itineraries
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Add Category Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Add New Category</h3>
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Adventure Tours"
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                    Active
                  </label>
                </div>
              </form>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setFormData({ name: '', isActive: true });
                  }}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-md font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddCategory}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium"
                >
                  Add Category
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Category Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Edit Category</h3>
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="editIsActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="editIsActive" className="ml-2 block text-sm text-gray-900">
                    Active
                  </label>
                </div>
              </form>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setFormData({ name: '', isActive: true });
                    setSelectedCategory(null);
                  }}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-md font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditCategory}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium"
                >
                  Update Category
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Itinerary Management Modal */}
      {showItineraryModal && selectedCategory && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-5 mx-auto p-5 border max-w-4xl shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl leading-6 font-bold text-gray-900">
                  Itineraries in "{selectedCategory.name}"
                </h3>
                <button
                  onClick={() => setShowItineraryModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                {getCategoryItineraries(selectedCategory.id).length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No itineraries in this category</p>
                  </div>
                ) : (
                  getCategoryItineraries(selectedCategory.id).map((itinerary) => (
                    <div key={itinerary.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900">{itinerary.title}</h4>
                          <p className="text-sm text-gray-500">Current category: {selectedCategory.name}</p>
                        </div>
                        <div className="flex items-center space-x-3">
                          <select
                            value={itinerary.categoryId}
                            onChange={(e) => changeItineraryCategory(itinerary.id, e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            {categories.map((cat) => (
                              <option key={cat.id} value={cat.id}>
                                {cat.name}
                              </option>
                            ))}
                          </select>
                          <span className="text-sm text-green-600 font-medium">
                            ✓ Updated
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowItineraryModal(false)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
