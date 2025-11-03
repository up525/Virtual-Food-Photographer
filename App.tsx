
import React, { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { Dish, StyleId, StyleOption } from './types';
import { STYLE_OPTIONS } from './constants';
import * as geminiService from './services/geminiService';
import DishCard from './components/DishCard';
import EditModal from './components/EditModal';

const App: React.FC = () => {
  const [menuText, setMenuText] = useState('');
  const [selectedStyle, setSelectedStyle] = useState<StyleOption>(STYLE_OPTIONS[0]);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [editingDish, setEditingDish] = useState<Dish | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const handleGeneratePhotos = useCallback(async () => {
    if (!menuText.trim()) {
      setError("Please paste your menu first.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setDishes([]);

    try {
      const parsedDishes = await geminiService.parseMenu(menuText);
      if (parsedDishes.length === 0) {
        setError("Couldn't find any dishes in your menu. Please try a different format.");
        setIsLoading(false);
        return;
      }

      const initialDishes: Dish[] = parsedDishes.map(d => ({
        id: uuidv4(),
        name: d.name,
        description: d.description,
        imageUrl: null,
        isGenerating: true,
        editHistory: [],
      }));
      setDishes(initialDishes);
      setIsLoading(false);

      // Generate images one by one
      for (const dish of initialDishes) {
        try {
          const imageUrl = await geminiService.generateFoodImage(dish.name, dish.description, selectedStyle.prompt);
          setDishes(prevDishes =>
            prevDishes.map(d =>
              d.id === dish.id ? { ...d, imageUrl, isGenerating: false } : d
            )
          );
        } catch (genError) {
          console.error(`Failed to generate image for ${dish.name}:`, genError);
          setDishes(prevDishes =>
            prevDishes.map(d =>
              d.id === dish.id ? { ...d, isGenerating: false, error: 'Image generation failed.' } : d
            )
          );
        }
      }

    } catch (err) {
      setError((err as Error).message);
      setIsLoading(false);
    }
  }, [menuText, selectedStyle.prompt]);
  
  const handleEditImage = async (dishId: string, image: string, prompt: string) => {
      setIsEditing(true);
      try {
        const newImageUrl = await geminiService.editImage(image, prompt);
        setDishes(prevDishes => prevDishes.map(d => {
            if (d.id === dishId) {
                const updatedDish = {
                    ...d,
                    imageUrl: newImageUrl,
                    editHistory: [...d.editHistory, { prompt: "Original", imageUrl: d.imageUrl! }, { prompt, imageUrl: newImageUrl }]
                };
                setEditingDish(updatedDish);
                return updatedDish;
            }
            return d;
        }));
      } catch (err) {
        // You might want to show an error toast here in a real app
        console.error("Editing failed:", err);
      } finally {
        setIsEditing(false);
      }
  };


  return (
    <div className="min-h-screen bg-brand-50 font-sans">
      <header className="bg-white shadow-md p-4 sticky top-0 z-10">
        <div className="container mx-auto flex justify-between items-center">
            <h1 className="text-3xl font-bold text-brand-800">
                Virtual Food Photographer
            </h1>
        </div>
      </header>

      <main className="container mx-auto p-4 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Controls Column */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-lg">
                <h2 className="text-xl font-semibold text-brand-900 mb-1">1. Paste Your Menu</h2>
                <p className="text-sm text-brand-700 mb-4">Provide your menu text. Our AI will automatically identify the dishes.</p>
                <textarea
                className="w-full h-48 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition"
                placeholder="e.g.,&#10;Margherita Pizza - Fresh mozzarella, San Marzano tomatoes, basil.&#10;Spaghetti Carbonara - Pancetta, egg yolk, pecorino cheese."
                value={menuText}
                onChange={e => setMenuText(e.target.value)}
                />
            </div>

            <div className="bg-white p-6 rounded-lg shadow-lg">
              <h2 className="text-xl font-semibold text-brand-900 mb-1">2. Choose a Style</h2>
              <p className="text-sm text-brand-700 mb-4">Select the aesthetic for your food photos.</p>
              <div className="space-y-2">
                {STYLE_OPTIONS.map(style => (
                  <button
                    key={style.id}
                    onClick={() => setSelectedStyle(style)}
                    className={`w-full text-left p-3 rounded-md border-2 transition-all ${
                      selectedStyle.id === style.id
                        ? 'bg-brand-100 border-brand-500 font-bold'
                        : 'bg-gray-50 border-transparent hover:border-brand-300'
                    }`}
                  >
                    {style.name}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="sticky top-24">
              <button
                onClick={handleGeneratePhotos}
                disabled={isLoading}
                className="w-full bg-brand-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-brand-700 disabled:bg-gray-400 transition-transform transform hover:scale-105 shadow-lg"
              >
                {isLoading ? 'Generating...' : '3. Generate Photos'}
              </button>
              {error && <p className="text-red-600 mt-2 text-sm">{error}</p>}
            </div>
          </div>

          {/* Results Column */}
          <div className="lg:col-span-2">
            {dishes.length === 0 && !isLoading ? (
                <div className="flex flex-col items-center justify-center h-full bg-white/50 rounded-lg border-2 border-dashed border-brand-200 p-8 text-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-brand-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <h3 className="text-xl font-semibold text-brand-800">Your gallery awaits</h3>
                    <p className="text-brand-700 mt-1">Generated food photos will appear here.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {dishes.map(dish => (
                    <DishCard key={dish.id} dish={dish} onEdit={setEditingDish} />
                    ))}
                </div>
            )}
            
          </div>
        </div>
        
        {editingDish && (
            <EditModal 
                dish={editingDish}
                onClose={() => setEditingDish(null)}
                onEdit={handleEditImage}
                isEditing={isEditing}
            />
        )}
      </main>
    </div>
  );
};

export default App;
