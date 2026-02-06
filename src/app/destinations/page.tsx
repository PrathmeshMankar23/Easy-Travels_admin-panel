'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import { categoryStorage, itineraryStorage, getItinerariesWithCategories, initializeStorage } from '@/utils/storage';

interface Destination {
  id: string;
  title: string;
  description: string;
  duration: number;
  nights?: number;
  price: number;
  image?: string;
  isActive: boolean;
  rating?: number;
  categoryId?: string;
  category: {
    id: string;
    name: string;
  };
  highlights?: string[];
  included?: string[];
  notIncluded?: string[];
  days?: {
    title: string;
    image: string;
    description: string;
    activities: string[];
  }[];
}

export default function DestinationsPage() {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [editingDestination, setEditingDestination] = useState<Destination | null>(null);
  const [selectedDestination, setSelectedDestination] = useState<Destination | null>(null);
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');

  const initialFormState = {
    id: '',
    title: '',
    description: '',
    categoryId: '',
    duration: 0,
    nights: 0,
    price: '',
    image: '',
    rating: 0,
    highlights: [''],
    included: [''],
    notIncluded: [''],
    days: [{
      title: '',
      image: '',
      description: '',
      activities: ['']
    }]
  };

  const [formData, setFormData] = useState(initialFormState);
  const router = useRouter();

  // --- Dynamic Field Helpers ---
  const addArrayItem = (field: 'highlights' | 'included' | 'notIncluded') => {
    setFormData({ ...formData, [field]: [...formData[field], ''] });
  };

  const removeArrayItem = (field: 'highlights' | 'included' | 'notIncluded', index: number) => {
    const newArr = formData[field].filter((_, i) => i !== index);
    setFormData({ ...formData, [field]: newArr.length ? newArr : [''] });
  };

  const updateArrayItem = (field: 'highlights' | 'included' | 'notIncluded', index: number, value: string) => {
    const newArr = [...formData[field]];
    newArr[index] = value;
    setFormData({ ...formData, [field]: newArr });
  };

  // Day Handlers
  const addDay = () => {
    setFormData({
      ...formData,
      days: [...formData.days, { title: '', image: '', description: '', activities: [''] }]
    });
  };

  const updateDay = (index: number, field: string, value: string) => {
    const newDays = [...formData.days];
    newDays[index] = { ...newDays[index], [field]: value };
    setFormData({ ...formData, days: newDays });
  };

  // Activity Handlers (Fixed)
  const addActivity = (dayIndex: number) => {
    const newDays = [...formData.days];
    newDays[dayIndex].activities = [...newDays[dayIndex].activities, ''];
    setFormData({ ...formData, days: newDays });
  };

  const removeActivity = (dayIndex: number, activityIndex: number) => {
    const newDays = [...formData.days];
    newDays[dayIndex].activities = newDays[dayIndex].activities.filter((_, i) => i !== activityIndex);
    if (newDays[dayIndex].activities.length === 0) newDays[dayIndex].activities = [''];
    setFormData({ ...formData, days: newDays });
  };

  const updateActivity = (dayIndex: number, activityIndex: number, value: string) => {
    const newDays = [...formData.days];
    newDays[dayIndex].activities[activityIndex] = value;
    setFormData({ ...formData, days: newDays });
  };

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.push('/login');
      return;
    }
    initializeStorage();
    loadData();

    // Listen for storage updates from other components
    const handleStorageUpdate = () => {
      loadData();
    };

    window.addEventListener('storage-updated', handleStorageUpdate);
    
    return () => {
      window.removeEventListener('storage-updated', handleStorageUpdate);
    };
  }, [router]);

  const loadData = () => {
    const categoriesData = categoryStorage.getCategories();
    const destinationsData = getItinerariesWithCategories();
    setCategories(categoriesData);
    setDestinations(destinationsData);
    setIsLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this destination?')) return;
    itineraryStorage.deleteItinerary(id);
    
    // Trigger storage update event to notify other pages
    window.dispatchEvent(new CustomEvent('storage-updated', { 
      detail: { 
        type: 'itineraries', 
        data: itineraryStorage.getItineraries() 
      } 
    }));
    
    setDestinations(destinations.filter(item => item.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.categoryId || !formData.duration || !formData.price) {
      alert('Please fill in all required fields');
      return;
    }

    const destinationData = {
      ...formData,
      duration: parseInt(formData.duration.toString()),
      nights: parseInt(formData.nights.toString()) || 0,
      price: parseInt(formData.price.toString().replace(/[^0-9]/g, '')),
      isActive: true,
      highlights: formData.highlights.filter(h => h.trim() !== ''),
      included: formData.included.filter(i => i.trim() !== ''),
      notIncluded: formData.notIncluded.filter(n => n.trim() !== ''),
    };

    if (editingDestination) {
      itineraryStorage.updateItinerary(editingDestination.id, destinationData);
    } else {
      itineraryStorage.addItinerary(destinationData);
    }
    
    // Trigger storage update event to notify other pages
    window.dispatchEvent(new CustomEvent('storage-updated', { 
      detail: { 
        type: 'itineraries', 
        data: itineraryStorage.getItineraries() 
      } 
    }));
    
    loadData();
    setFormData(initialFormState);
    setShowAddModal(false);
    setEditingDestination(null);
  };

  const openEditModal = (destination: Destination) => {
    setEditingDestination(destination);
    setFormData({
      id: destination.id,
      title: destination.title,
      description: destination.description,
      categoryId: destination.category?.id || '',
      duration: destination.duration || 0,
      nights: destination.nights || 0,
      price: destination.price.toString(),
      image: destination.image || '',
      rating: destination.rating || 0,
      highlights: destination.highlights?.length ? destination.highlights : [''],
      included: destination.included?.length ? destination.included : [''],
      notIncluded: destination.notIncluded?.length ? destination.notIncluded : [''],
      days: destination.days?.length ? destination.days : [{ title: '', image: '', description: '', activities: [''] }]
    });
    setShowAddModal(true);
  };

  const openViewModal = (destination: Destination) => {
    setSelectedDestination(destination);
    setShowViewModal(true);
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;

  return (
    <div className="page-container">
      <Navigation />
      
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="page-header flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="page-title">Manage Destinations</h1>
            <p className="page-subtitle">Create and manage your travel destinations</p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="view-toggle">
              <button onClick={() => setViewMode('card')} className={`view-toggle button ${viewMode === 'card' ? 'active' : ''}`}>Card</button>
              <button onClick={() => setViewMode('table')} className={`view-toggle button ${viewMode === 'table' ? 'active' : ''}`}>Table</button>
            </div>
            <button onClick={() => { setFormData(initialFormState); setEditingDestination(null); setShowAddModal(true); }} className="add-new-btn">
              Add New
            </button>
          </div>
        </div>

        <div className="content-area">
          {destinations.length === 0 ? (
            <div className="no-itineraries">No destinations found.</div>
          ) : (
            viewMode === 'card' ? (
              <div className="card-grid">
                {destinations.map(destination => (
                  <div key={destination.id} className="itinerary-card">
                    <div className="card-image-container">
                      <img src={destination.image || 'https://images.unsplash.com/photo-1469474968028-5669f8e4b82?w=500&h=300&fit=crop'} alt={destination.title} className="card-image" />
                      <div className="category-badge">{destination.category?.name}</div>
                      <div className="duration-badge"><span>{destination.duration}D / {destination.nights || (destination.duration - 1)}N</span></div>
                    </div>
                    <div className="card-content">
                      <div className="card-header">
                        <div className="card-title-section">
                          <h3 className="card-title">{destination.title}</h3>
                          <div className="card-meta">
                            <span className="flex items-center">Active</span>
                          </div>
                        </div>
                        <div className="card-price-section">
                          <div className="card-price">₹{destination.price.toLocaleString('en-IN')}</div>
                        </div>
                      </div>
                      
                      <div className="card-actions">
                        <button onClick={() => openEditModal(destination)} className="card-btn card-btn-edit">Edit</button>
                        <button onClick={() => openViewModal(destination)} className="card-btn card-btn-view">View</button>
                        <button onClick={() => handleDelete(destination.id)} className="card-btn card-btn-delete">Del</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="table-container">
                <table className="itinerary-table">
                  <thead className="table-header">
                    <tr>
                      <th className="table-header text-left">Title</th>
                      <th className="table-header text-left">Category</th>
                      <th className="table-header text-left">Duration</th>
                      <th className="table-header text-left">Price</th>
                      <th className="table-header text-left">Rating</th>
                      <th className="table-header text-center">Status</th>
                      <th className="table-header text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="table-body">
                    {destinations.map(destination => (
                      <tr key={destination.id} className="border-b">
                        <td className="table-body">
                          <div className="title-content">
                            <div className="title-name">{destination.title}</div>
                            <div className="title-id">ID: {destination.id}</div>
                          </div>
                        </td>
                        <td className="table-body">
                          <span className="category-badge">
                            {destination.category?.name}
                          </span>
                        </td>
                        <td className="table-body">
                          <div className="duration-display">
                            {destination.duration}D / {destination.nights || (destination.duration - 1)}N
                          </div>
                        </td>
                        <td className="table-body">
                          <div className="price-display">₹{destination.price.toLocaleString('en-IN')}</div>
                        </td>
                        <td className="table-body">
                          <div className="rating-display">
                            <span className="rating-star">⭐</span>
                            <span>{destination.rating || 'N/A'}</span>
                          </div>
                        </td>
                        <td className="table-body text-center">
                          <span className={`status-badge ${
                            destination.isActive ? 'status-active' : 'status-inactive'
                          }`}>
                            {destination.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="table-actions text-right">
                          <button 
                            onClick={() => openEditModal(destination)} 
                            className="table-btn table-btn-edit"
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => openViewModal(destination)} 
                            className="table-btn table-btn-view"
                          >
                            View
                          </button>
                          <button 
                            onClick={() => handleDelete(destination.id)} 
                            className="table-btn table-btn-delete"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
        </div>
      </main>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">{editingDestination ? 'Edit Destination' : 'Create Destination'}</h2>
              <button onClick={() => setShowAddModal(false)} className="modal-close">×</button>
            </div>

            <form onSubmit={handleSubmit} className="form-container">
              <div className="form-section">
                <h3 className="form-title">Basic Information</h3>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Title *</label>
                    <input type="text" className="form-input" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Category *</label>
                    <select className="form-select" value={formData.categoryId} onChange={e => setFormData({...formData, categoryId: e.target.value})} required>
                      <option value="">Select</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Price (₹) *</label>
                    <input type="text" className="form-input" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Duration (Days/Nights)</label>
                    <div className="flex gap-2">
                      <input type="number" className="form-input" value={formData.duration} onChange={e => setFormData({...formData, duration: parseInt(e.target.value) || 0})} placeholder="Days" />
                      <input type="number" className="form-input" value={formData.nights} onChange={e => setFormData({...formData, nights: parseInt(e.target.value) || 0})} placeholder="Nights" />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Image URL</label>
                    <input type="text" className="form-input" value={formData.image} onChange={e => setFormData({...formData, image: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Rating</label>
                    <input type="number" className="form-input" value={formData.rating} onChange={e => setFormData({...formData, rating: parseFloat(e.target.value)})} step="0.1" max="5" />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <label className="form-label">Destination Description</label>
                <textarea className="form-textarea" rows={3} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              </div>

              {/* Highlights */}
              <div className="form-section">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="form-title">Highlights</h3>
                  <button type="button" onClick={() => addArrayItem('highlights')} className="btn btn-primary">+ Add</button>
                </div>
                {formData.highlights.map((h, i) => (
                  <div key={i} className="array-item-container flex gap-2 mb-2">
                    <input type="text" className="form-input" value={h} onChange={e => updateArrayItem('highlights', i, e.target.value)} />
                    <button type="button" onClick={() => removeArrayItem('highlights', i)} className="btn btn-danger">×</button>
                  </div>
                ))}
              </div>

              {/* Day-by-Day */}
              <div className="form-section">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="form-title">Day-by-Day Plan</h3>
                  <button type="button" onClick={addDay} className="btn btn-primary">+ Add Day</button>
                </div>
                {formData.days.map((day, i) => (
                  <div key={i} className="border p-4 rounded-lg mb-4 bg-gray-50">
                    <div className="flex justify-between mb-2">
                      <h4 className="font-bold">Day {i + 1}</h4>
                      <button type="button" onClick={() => {
                        const newDays = formData.days.filter((_, idx) => idx !== i);
                        setFormData({...formData, days: newDays.length ? newDays : initialFormState.days});
                      }} className="text-red-500 text-sm">Remove Day</button>
                    </div>
                    <input type="text" placeholder="Day Title" className="form-input mb-2" value={day.title} onChange={e => updateDay(i, 'title', e.target.value)} />
                    <input type="text" placeholder="Day Image URL" className="form-input mb-2" value={day.image} onChange={e => updateDay(i, 'image', e.target.value)} />
                    <textarea placeholder="Description" className="form-textarea mb-2" rows={2} value={day.description} onChange={e => updateDay(i, 'description', e.target.value)} />
                    
                    <div className="mt-2">
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-xs font-bold uppercase text-gray-500">Activities</label>
                        <button type="button" onClick={() => addActivity(i)} className="text-blue-600 text-xs">+ Add Activity</button>
                      </div>
                      {day.activities.map((act, actIdx) => (
                        <div key={actIdx} className="flex gap-2 mb-1">
                          <input type="text" className="form-input text-sm" value={act} onChange={e => updateActivity(i, actIdx, e.target.value)} />
                          <button type="button" onClick={() => removeActivity(i, actIdx)} className="text-red-500">×</button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Included Section */}
              <div className="form-section">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="form-title">Included</h3>
                  <button type="button" onClick={() => addArrayItem('included')} className="btn btn-primary">+ Add Item</button>
                </div>
                {formData.included.map((item, i) => (
                  <div key={i} className="array-item-container flex gap-2 mb-2">
                    <input type="text" className="form-input" value={item} onChange={e => updateArrayItem('included', i, e.target.value)} placeholder="Enter included item..." />
                    <button type="button" onClick={() => removeArrayItem('included', i)} className="btn btn-danger">×</button>
                  </div>
                ))}
              </div>

              {/* Not Included Section */}
              <div className="form-section">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="form-title">Not Included</h3>
                  <button type="button" onClick={() => addArrayItem('notIncluded')} className="btn btn-primary">+ Add Item</button>
                </div>
                {formData.notIncluded.map((item, i) => (
                  <div key={i} className="array-item-container flex gap-2 mb-2">
                    <input type="text" className="form-input" value={item} onChange={e => updateArrayItem('notIncluded', i, e.target.value)} placeholder="Enter not included item..." />
                    <button type="button" onClick={() => removeArrayItem('notIncluded', i)} className="btn btn-danger">×</button>
                  </div>
                ))}
              </div>

              <div className="form-actions flex justify-end gap-3">
                <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Save Destination</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && selectedDestination && (
        <div className="modal-overlay">
          <div className="modal-content max-w-6xl max-h-[90vh] overflow-y-auto">
            {/* Header with Image */}
            <div className="relative h-80">
              <img src={selectedDestination.image || 'https://images.unsplash.com/photo-1469474968028-5669f8e4b82?w=800&h=400&fit=crop'} className="w-full h-full object-cover" alt={selectedDestination.title} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              <button onClick={() => setShowViewModal(false)} className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full w-10 h-10 flex items-center justify-center shadow-lg hover:bg-white transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <div className="absolute bottom-6 left-6 text-white">
                <h1 className="text-4xl font-bold mb-2">{selectedDestination.title}</h1>
                <div className="flex items-center gap-4 text-lg">
                  <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                    🕒 {selectedDestination.duration}D / {selectedDestination.nights || (selectedDestination.duration - 1)}N
                  </span>
                  <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                    📂 {selectedDestination.category?.name}
                  </span>
                  <span className="bg-green-500/80 backdrop-blur-sm px-3 py-1 rounded-full font-bold">
                    ₹{selectedDestination.price.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-8">
              {/* Description */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold mb-4 text-gray-800">About This Destination</h2>
                <p className="text-gray-600 leading-relaxed text-lg">{selectedDestination.description}</p>
              </div>

              {/* Highlights */}
              {selectedDestination.highlights && selectedDestination.highlights.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-2xl font-bold mb-4 text-gray-800">Destination Highlights</h2>
                  <div className="grid md:grid-cols-2 gap-3">
                    {selectedDestination.highlights.map((highlight, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                        <span className="text-blue-500 text-xl">✨</span>
                        <span className="text-gray-700">{highlight}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Day by Day Itinerary */}
              {selectedDestination.days && selectedDestination.days.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-2xl font-bold mb-6 text-gray-800">Day-by-Day Itinerary</h2>
                  <div className="space-y-6">
                    {selectedDestination.days.map((day, idx) => (
                      <div key={idx} className="border-l-4 border-blue-500 pl-6 relative">
                        <div className="absolute -left-2 top-2 w-4 h-4 bg-blue-500 rounded-full"></div>
                        <div className="bg-gray-50 rounded-lg p-6">
                          <h3 className="text-xl font-bold mb-3 text-gray-800">Day {idx + 1}: {day.title}</h3>
                          {day.image && (
                            <img src={day.image} className="w-full h-48 object-cover rounded-lg mb-4" alt={day.title} />
                          )}
                          <p className="text-gray-600 mb-4">{day.description}</p>
                          {day.activities && day.activities.length > 0 && (
                            <div>
                              <h4 className="font-semibold mb-2 text-gray-700">Activities:</h4>
                              <ul className="space-y-2">
                                {day.activities.map((activity, actIndex) => (
                                  <li key={actIndex} className="flex items-center gap-2 text-gray-600">
                                    <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                                    {activity}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Included & Not Included */}
              <div className="grid md:grid-cols-2 gap-8">
                {/* Included */}
                {selectedDestination.included && selectedDestination.included.length > 0 && (
                  <div>
                    <h2 className="text-2xl font-bold mb-4 text-green-600">What's Included</h2>
                    <div className="bg-green-50 rounded-lg p-6">
                      <ul className="space-y-3">
                        {selectedDestination.included.map((item, i) => (
                          <li key={i} className="flex items-center gap-3 text-gray-700">
                            <span className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-sm">✓</span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* Not Included */}
                {selectedDestination.notIncluded && selectedDestination.notIncluded.length > 0 && (
                  <div>
                    <h2 className="text-2xl font-bold mb-4 text-red-600">What's Not Included</h2>
                    <div className="bg-red-50 rounded-lg p-6">
                      <ul className="space-y-3">
                        {selectedDestination.notIncluded.map((item, i) => (
                          <li key={i} className="flex items-center gap-3 text-gray-700">
                            <span className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-sm">✗</span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
