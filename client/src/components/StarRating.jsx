import React, { useState } from 'react';

export default function StarRating({ value, onChange, readOnly = false }) {
  const [hovered, setHovered] = useState(0);
  const display = hovered || value || 0;

  return (
    <div className="star-rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={`star ${display >= star ? 'filled' : ''} ${readOnly ? 'readonly' : ''}`}
          onClick={() => !readOnly && onChange && onChange(star)}
          onMouseEnter={() => !readOnly && setHovered(star)}
          onMouseLeave={() => !readOnly && setHovered(0)}
        >
          ★
        </span>
      ))}
    </div>
  );
}
