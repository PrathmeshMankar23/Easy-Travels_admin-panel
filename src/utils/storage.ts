// Shared storage utilities for admin panel

interface Category {
  id: string;
  name: string;
  isActive: boolean;
  _count?: {
    itineraries: number;
  };
}

interface Itinerary {
  id: string;
  title: string;
  description: string;
  duration: number;
  nights?: number;
  price: number;
  image?: string;
  isActive: boolean;
  categoryId: string;
  rating?: number;
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

// Category storage
export const categoryStorage = {
  getCategories: (): Category[] => {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem('adminCategories');
    return stored ? JSON.parse(stored) : getDefaultCategories();
  },

  setCategories: (categories: Category[]): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('adminCategories', JSON.stringify(categories));
    // Dispatch custom event for real-time updates
    window.dispatchEvent(new CustomEvent('storage-updated', { detail: { type: 'categories', data: categories } }));
  },

  addCategory: (category: Omit<Category, 'id'>): Category => {
    const categories = categoryStorage.getCategories();
    const newCategory: Category = {
      ...category,
      id: Date.now().toString()
    };
    categories.push(newCategory);
    categoryStorage.setCategories(categories);
    return newCategory;
  },

  updateCategory: (id: string, updates: Partial<Category>): Category | null => {
    const categories = categoryStorage.getCategories();
    const index = categories.findIndex(cat => cat.id === id);
    if (index === -1) return null;
    
    categories[index] = { ...categories[index], ...updates };
    categoryStorage.setCategories(categories);
    return categories[index];
  },

  deleteCategory: (id: string): boolean => {
    const categories = categoryStorage.getCategories();
    const filteredCategories = categories.filter(cat => cat.id !== id);
    if (filteredCategories.length === categories.length) return false;
    
    categoryStorage.setCategories(filteredCategories);
    
    // Update itineraries that had this category to "Unknown Category"
    const itineraries = itineraryStorage.getItineraries();
    const updatedItineraries = itineraries.map(itinerary => 
      itinerary.categoryId === id 
        ? { ...itinerary, categoryId: 'unknown' }
        : itinerary
    );
    itineraryStorage.setItineraries(updatedItineraries);
    
    return true;
  }
};

// Itinerary storage
export const itineraryStorage = {
  getItineraries: (): Itinerary[] => {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem('adminItineraries');
    return stored ? JSON.parse(stored) : getDefaultItineraries();
  },

  setItineraries: (itineraries: Itinerary[]): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('adminItineraries', JSON.stringify(itineraries));
    // Dispatch custom event for real-time updates
    window.dispatchEvent(new CustomEvent('storage-updated', { detail: { type: 'itineraries', data: itineraries } }));
  },

  addItinerary: (itinerary: Omit<Itinerary, 'id'>): Itinerary => {
    const itineraries = itineraryStorage.getItineraries();
    const newItinerary: Itinerary = {
      ...itinerary,
      id: Date.now().toString()
    };
    itineraries.push(newItinerary);
    itineraryStorage.setItineraries(itineraries);
    return newItinerary;
  },

  updateItinerary: (id: string, updates: Partial<Itinerary>): Itinerary | null => {
    const itineraries = itineraryStorage.getItineraries();
    const index = itineraries.findIndex(item => item.id === id);
    if (index === -1) return null;
    
    itineraries[index] = { ...itineraries[index], ...updates };
    itineraryStorage.setItineraries(itineraries);
    return itineraries[index];
  },

  deleteItinerary: (id: string): boolean => {
    const itineraries = itineraryStorage.getItineraries();
    const filteredItineraries = itineraries.filter(item => item.id !== id);
    if (filteredItineraries.length === itineraries.length) return false;
    
    itineraryStorage.setItineraries(filteredItineraries);
    return true;
  }
};

// Get category name for itinerary
export const getCategoryName = (categoryId: string): string => {
  const categories = categoryStorage.getCategories();
  const category = categories.find(cat => cat.id === categoryId);
  return category?.name || 'Unknown';
};

// Get itineraries with category information
export const getItinerariesWithCategories = () => {
  const itineraries = itineraryStorage.getItineraries();
  const categories = categoryStorage.getCategories();
  
  return itineraries.map(itinerary => {
    const category = categories.find(cat => cat.id === itinerary.categoryId);
    return {
      ...itinerary,
      category: {
        id: itinerary.categoryId,
        name: category?.name || 'Unknown Category'
      }
    };
  });
};

// Default data
function getDefaultCategories(): Category[] {
  return [
    { id: '1', name: 'Adventure', isActive: true, _count: { itineraries: 2 } },
    { id: '2', name: 'Beach Holidays', isActive: true, _count: { itineraries: 1 } },
    { id: '3', name: 'Cultural Tours', isActive: true, _count: { itineraries: 0 } },
    { id: '4', name: 'Wildlife', isActive: true, _count: { itineraries: 0 } },
    { id: '5', name: 'Pilgrimage', isActive: true, _count: { itineraries: 0 } },
    { id: 'unknown', name: 'Unknown Category', isActive: false, _count: { itineraries: 0 } }
  ];
}

function getDefaultItineraries(): Itinerary[] {
  return [
    {
      id: '2',
      title: 'Manali',
      description: 'Experience the beauty of Himachal Pradesh with this scenic Manali getaway. From snow-clad mountains and serene temples to riverside camps in Kasol, this trip promises unforgettable memories.',
      duration: 5,
      nights: 4,
      price: 67000,
      image: '/assets/images/shimla&Manali.jpeg',
      isActive: true,
      categoryId: '1',
      rating: 4.7,
      highlights: [
        'Drive through scenic Himalayan roads',
        'Visit Solang Valley & Atal Tunnel',
        'Explore Sissu Lake & waterfalls',
        'Local Manali sightseeing',
        'Kasol & Manikaran excursion'
      ],
      included: [
        'Accommodation (Breakfast & Dinner)',
        'Private transportation (Innova Crysta)',
        'Toll taxes & parking'
      ],
      notIncluded: [
        'Flights / Train tickets',
        'Lunch',
        'Adventure activities',
        'Personal expenses'
      ],
      days: [
        {
          title: 'Chandigarh to Manali – Arrival & Mall Road',
          image: '/assets/images/shimla&Manali_1.jpeg',
          description: 'Begin your journey from Chandigarh to Manali with a scenic mountain drive.',
          activities: [
            'Pickup from Chandigarh',
            'Scenic drive to Manali (6–7 hours)',
            'Hotel check-in',
            'Evening visit to Mall Road',
            'Dinner and overnight stay'
          ]
        },
        {
          title: 'Solang Valley & Atal Tunnel Excursion',
          image: '/assets/images/manali-day2.jpg',
          description: 'Explore high-altitude attractions and breathtaking landscapes.',
          activities: [
            'Breakfast at hotel',
            'Visit Solang Valley',
            'Drive through Atal Tunnel',
            'Visit Sissu Lake',
            'Return to hotel for dinner'
          ]
        },
        {
          title: 'Manali Local Sightseeing',
          image: '/assets/images/manali-day3.jpg',
          description: 'Discover the cultural and spiritual charm of Manali.',
          activities: [
            'Hidimba Devi Temple',
            'Buddhist Monastery',
            'Old Manali walk',
            'Vashisht Kund',
            'Mall Road visit'
          ]
        },
        {
          title: 'Manali to Kasol & Manikaran',
          image: '/assets/images/manali-day4.jpg',
          description: 'Visit Parvati Valley and enjoy riverside camping.',
          activities: [
            'Drive to Kasol',
            'Visit Manikaran Gurudwara',
            'Explore Kasol market',
            'Riverside camp stay',
            'Dinner at camps'
          ]
        },
        {
          title: 'Return Journey',
          image: '/assets/images/manali-day5.jpg',
          description: 'Conclude your journey with beautiful memories.',
          activities: [
            'Breakfast',
            'Checkout',
            'Return to Ambala',
            'Trip ends'
          ]
        }
      ]
    },
    {
      id: '3',
      title: 'Delhi – Churdhar – Shimla',
      description: 'Experience the untouched beauty of Himachal Pradesh with this adventurous Churdhar trek combined with leisure time in Shimla. From remote mountain villages and forest trails to breathtaking sunrise views from Churdhar Peak (3650 m) and the colonial charm of Shimla, this tour offers the perfect blend of trekking, culture, and relaxation.',
      duration: 6,
      nights: 5,
      price: 18999,
      image: 'https://images.unsplash.com/photo-1609232529165-da44951373fa?q=80&w=735&auto=format&fit=crop',
      isActive: true,
      categoryId: '1',
      rating: 4.8,
      highlights: [
        'Trek to Churdhar Peak (3650 m)',
        'Stay in scenic mountain camps',
        'Bonfire & candlelight dinner under the stars',
        'Village walk and interaction with locals',
        'Sunrise from Churdhar top',
        'Explore colonial Shimla'
      ],
      included: [
        'Accommodation in homestays, camps & hotel',
        'Breakfast and dinner',
        'All transfers as per itinerary',
        'Camping equipment',
        'Bonfire during campsite stays',
        'Experienced trek guide',
        'Forest entry permits'
      ],
      notIncluded: [
        'Lunch on all days',
        'Personal expenses',
        'Adventure activities not mentioned',
        'Travel insurance',
        'Monument entry tickets',
        'Tips & gratuities'
      ],
      days: [
        {
          title: 'Delhi to Solan – Overnight Journey',
          image: 'https://images.unsplash.com/photo-1612380635197-a025736ddba1?q=80&w=1170&auto=format&fit=crop',
          description: 'Start your adventure with an overnight Volvo bus journey from Delhi to Solan.',
          activities: [
            'Evening departure from Delhi',
            'Overnight Volvo bus journey',
            'Scenic mountain road travel'
          ]
        },
        {
          title: 'Solan to Gyankot Village',
          image: 'https://images.unsplash.com/photo-1605689380471-e395f069d0b5?q=80&w=1332&auto=format&fit=crop',
          description: 'Arrive in Solan and drive to the peaceful mountain village of Gyankot.',
          activities: [
            'Arrival at Solan bus station',
            'Meet local driver',
            'Drive to Gyankot village',
            'Homestay check-in',
            'Breakfast & dinner',
            'Rest and acclimatization'
          ]
        },
        {
          title: 'Gyankot – Pab – Jiunthi Trek',
          image: 'https://images.unsplash.com/photo-1584075612901-259c1bcbd9b2?q=80&w=1074&auto=format&fit=crop',
          description: 'Drive to Pab and trek through forest trails to Jiunthi village.',
          activities: [
            'Breakfast at homestay',
            'Drive to Pab',
            '2–3 hour trek to Jiunthi',
            'Campsite check-in',
            'Bonfire & candlelight dinner',
            'Optional sunset walk'
          ]
        },
        {
          title: 'Jiunthi to Bherog / Tisri Trek',
          image: 'https://plus.unsplash.com/premium_photo-1754590179764-0f36db5fcbb0?q=80&w=1170&auto=format&fit=crop',
          description: 'A long yet rewarding trek through alpine landscapes toward Churdhar.',
          activities: [
            'Morning tea with locals',
            'Village walk',
            'Breakfast',
            '14 km trek to Bherog/Tisri',
            'Packed lunch',
            'Bonfire & dinner at campsite'
          ]
        },
        {
          title: 'Churdhar Peak Sunrise & Shimla Transfer',
          image: 'https://images.unsplash.com/photo-1740383234486-4137f1dee821?q=80&w=1170&auto=format&fit=crop',
          description: 'Early morning trek to Churdhar Peak for sunrise, then descend and drive to Shimla.',
          activities: [
            'Early morning wake-up',
            'Trek to Churdhar summit',
            'Sunrise view',
            'Descend to Churdhar temple',
            'Breakfast',
            'Trek down to Madhalani',
            'Drive to Shimla',
            'Hotel check-in & dinner'
          ]
        },
        {
          title: 'Shimla Sightseeing & Return to Delhi',
          image: 'https://images.unsplash.com/photo-1609232529165-da44951373fa?q=80&w=735&auto=format&fit=crop',
          description: 'Explore Shimla\'s iconic attractions before returning to Delhi.',
          activities: [
            'Breakfast & checkout',
            'Jakhoo Temple visit',
            'Viceregal Lodge',
            'Christ Church & The Ridge',
            'Shopping at Mall Road',
            'Evening dinner',
            'Overnight Volvo bus to Delhi'
          ]
        }
      ]
    }
  ];
}

// Initialize storage if empty
export const initializeStorage = () => {
  if (typeof window === 'undefined') return;
  
  // Force refresh of default data for testing
  categoryStorage.setCategories(getDefaultCategories());
  itineraryStorage.setItineraries(getDefaultItineraries());
};
