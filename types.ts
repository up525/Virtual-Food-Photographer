
export interface Edit {
  prompt: string;
  imageUrl: string;
}

export interface Dish {
  id: string;
  name: string;
  description: string;
  imageUrl: string | null;
  isGenerating: boolean;
  editHistory: Edit[];
  error?: string;
}

export type StyleId = 'rustic' | 'modern' | 'social';

export interface StyleOption {
  id: StyleId;
  name: string;
  prompt: string;
}
