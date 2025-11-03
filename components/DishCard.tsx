
import React from 'react';
import type { Dish } from '../types';
import Spinner from './Spinner';

interface DishCardProps {
  dish: Dish;
  onEdit: (dish: Dish) => void;
}

const DishCard: React.FC<DishCardProps> = ({ dish, onEdit }) => {
  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden transition-transform transform hover:-translate-y-1 group">
      <div className="relative aspect-w-4 aspect-h-3 bg-brand-100">
        {dish.isGenerating && (
          <div className="absolute inset-0 flex flex-col justify-center items-center">
            <Spinner />
            <p className="text-sm text-brand-700 mt-2">Photographing...</p>
          </div>
        )}
        {dish.error && (
            <div className="absolute inset-0 flex flex-col justify-center items-center p-4">
                <p className="text-sm text-red-600 text-center">{dish.error}</p>
            </div>
        )}
        {dish.imageUrl && !dish.isGenerating && (
          <>
            <img src={`data:image/png;base64,${dish.imageUrl}`} alt={dish.name} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-300 flex justify-center items-center">
                <button
                    onClick={() => onEdit(dish)}
                    className="bg-white text-brand-800 font-semibold py-2 px-4 rounded-full opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300"
                >
                    Edit Image
                </button>
            </div>
          </>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-bold text-lg text-brand-900 truncate">{dish.name}</h3>
        <p className="text-sm text-brand-700 h-10 overflow-hidden">{dish.description}</p>
      </div>
    </div>
  );
};

export default DishCard;
