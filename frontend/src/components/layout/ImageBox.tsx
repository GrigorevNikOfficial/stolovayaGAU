import React from 'react';

interface ImageBoxProps {
  src?: string | null;
  alt?: string;
  aspect?: number; // width / height
  className?: string; // applied to wrapper (usually width control)
  imgClassName?: string;
  placeholder?: React.ReactNode;
  rounded?: boolean;
}

const ImageBox: React.FC<ImageBoxProps> = ({
  src,
  alt,
  aspect = 3 / 2,
  className = 'w-full',
  imgClassName = '',
  placeholder,
  rounded = true,
}) => {
  // padding-top as percentage = (height/width)*100 = (1/aspect)*100
  const paddingTop = `${(1 / aspect) * 100}%`;

  return (
    <div className={`${className} relative overflow-hidden`}>
      <div
        className={`w-full ${rounded ? 'rounded-xl' : ''} bg-gradient-to-br from-gray-50 to-gray-100 relative`}
        style={{ paddingTop }}
      >
        {src ? (
          <img
            src={src}
            alt={alt}
            className={`absolute inset-0 w-full h-full object-cover ${imgClassName}`}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            {placeholder ?? <span className="text-3xl text-gray-300">🍽️</span>}
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageBox;
