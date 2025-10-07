import React from 'react';

const styles = [
  { name: 'Photorealistic', keyword: 'photorealistic, 8k, detailed', gradient: 'from-blue-400 to-sky-500' },
  { name: 'Anime', keyword: 'anime style, vibrant, detailed illustration', gradient: 'from-pink-500 to-purple-500' },
  { name: 'Fantasy Art', keyword: 'fantasy art, epic, cinematic, matte painting', gradient: 'from-purple-600 to-indigo-700' },
  { name: 'Cyberpunk', keyword: 'cyberpunk style, neon lighting, futuristic city', gradient: 'from-cyan-400 to-pink-600' },
  { name: 'Oil Painting', keyword: 'oil painting style, textured, classical', gradient: 'from-amber-500 to-orange-600' },
  { name: 'Low Poly', keyword: 'low poly, isometric, simple colors', gradient: 'from-green-400 to-teal-500' },
];

interface StylePickerProps {
  onStyleSelect: (keyword: string) => void;
  disabled: boolean;
}

const StylePicker: React.FC<StylePickerProps> = ({ onStyleSelect, disabled }) => {
  return (
    <div>
      <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-2">
        Inspiration Styles
      </h4>
      <div className="flex gap-3 overflow-x-auto pb-3 -mx-1 px-1">
        {styles.map(style => (
          <button
            key={style.name}
            onClick={() => onStyleSelect(style.keyword)}
            disabled={disabled}
            className="group flex-shrink-0 w-32 h-20 bg-gray-700 rounded-lg overflow-hidden relative text-white font-bold text-sm shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div 
                className={`absolute inset-0 bg-gradient-to-br ${style.gradient} transition-transform duration-300 group-hover:scale-110 opacity-80 group-hover:opacity-100`}
            ></div>
            <span className="relative z-10 p-2 text-center flex items-center justify-center w-full h-full bg-black/20">
              {style.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default StylePicker;
