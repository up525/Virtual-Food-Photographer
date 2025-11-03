
import React, { useState } from 'react';
import type { Dish } from '../types';
import Spinner from './Spinner';

interface EditModalProps {
  dish: Dish | null;
  onClose: () => void;
  onEdit: (dishId: string, image: string, prompt: string) => Promise<void>;
  isEditing: boolean;
}

const EditModal: React.FC<EditModalProps> = ({ dish, onClose, onEdit, isEditing }) => {
  const [prompt, setPrompt] = useState('');
  const [currentImage, setCurrentImage] = useState<string | null>(dish?.imageUrl || null);

  if (!dish) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt || isEditing || !currentImage) return;
    await onEdit(dish.id, currentImage, prompt);
    setPrompt('');
    // The parent component will update the dish prop, which will update the image
  };

  React.useEffect(() => {
    setCurrentImage(dish.imageUrl);
  }, [dish.imageUrl]);

  const allImages = dish.editHistory.length > 0 ? [...dish.editHistory.map(e => e.imageUrl).reverse(), dish.editHistory[0].imageUrl] : [dish.imageUrl];
  const uniqueHistory = [
    ...dish.editHistory.map(e => ({...e, imageUrl: e.imageUrl})).reverse()
  ];
  
  if (dish.imageUrl && uniqueHistory.every(e => e.imageUrl !== dish.imageUrl)) {
      uniqueHistory.unshift({ prompt: "Original", imageUrl: dish.imageUrl });
  } else if (uniqueHistory.length === 0 && dish.imageUrl) {
       uniqueHistory.push({ prompt: "Original", imageUrl: dish.imageUrl });
  }


  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col md:flex-row overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="w-full md:w-2/3 p-4 flex flex-col items-center justify-center bg-gray-100 relative">
          {isEditing && (
            <div className="absolute inset-0 bg-white bg-opacity-80 flex flex-col justify-center items-center z-10">
              <Spinner size="lg" />
              <p className="mt-4 text-brand-800 font-semibold">Applying your magic touch...</p>
            </div>
          )}
          {currentImage ? (
             <img src={`data:image/png;base64,${currentImage}`} alt={dish.name} className="max-h-[75vh] object-contain rounded-md" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-500">No image available</div>
          )}
        </div>
        <div className="w-full md:w-1/3 p-6 flex flex-col bg-white">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-2xl font-bold text-brand-900">{dish.name}</h2>
              <p className="text-sm text-brand-700">Image Editor</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">&times;</button>
          </div>
          
          <form onSubmit={handleSubmit} className="mb-4">
            <label htmlFor="edit-prompt" className="block text-sm font-medium text-brand-800 mb-2">Edit Prompt:</label>
            <textarea
              id="edit-prompt"
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder="e.g., 'Add a sprinkle of parsley' or 'Make it look more glossy'"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition"
              rows={3}
              disabled={isEditing}
            />
            <button type="submit" disabled={!prompt || isEditing} className="mt-2 w-full bg-brand-600 text-white font-bold py-2 px-4 rounded-md hover:bg-brand-700 disabled:bg-gray-400 transition-colors">
              {isEditing ? 'Applying...' : 'Apply Edit'}
            </button>
          </form>

          <div className="flex-grow overflow-y-auto">
            <h3 className="text-lg font-semibold text-brand-800 mb-2">Version History</h3>
            <div className="space-y-2">
              {uniqueHistory.map((edit, index) => (
                <div key={index} 
                     className={`flex items-center p-2 rounded-md cursor-pointer transition-colors ${currentImage === edit.imageUrl ? 'bg-brand-100' : 'hover:bg-gray-50'}`}
                     onClick={() => setCurrentImage(edit.imageUrl)}>
                  <img src={`data:image/png;base64,${edit.imageUrl}`} alt={edit.prompt} className="w-12 h-12 object-cover rounded-md mr-3" />
                  <span className="text-sm text-brand-900 flex-1 truncate">{edit.prompt}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditModal;
