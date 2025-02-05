import React, { useState } from "react";

const Carousel = ({ categories, itemsPerPage = 5,activeCategory,setActiveCategory }) => {
  const [currentPage, setCurrentPage] = useState(0);

  // Split categories into chunks (pages)
  const chunkedCategories = [];
  for (let i = 0; i < categories.length; i += itemsPerPage) {
    chunkedCategories.push(categories.slice(i, i + itemsPerPage));
  }

  // Handle dot click to navigate to a specific page
  const handleDotClick = (index) => {
    setCurrentPage(index);
  };

  return (
    <div className="backdrop-blur-sm rounded-xl shadow-md z-10 my-2 max-w-full">
      <div className="flex gap-2 overflow-x-hidden w-full rounded-xl px-4 items-center">
        {chunkedCategories[currentPage]?.map((category) => (
          <button
            key={category}
            onClick={() => setActiveCategory(category)}
            className={`min-w-20 p-2 rounded-xl whitespace-nowrap ${
              activeCategory === category
                ? "bg-white/50 text-white"
                : "bg-white/20 text-white"
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Dots for navigation */}
      <div className="flex justify-center gap-2 mt-2">
        {chunkedCategories.map((_, index) => (
          <button
            key={index}
            onClick={() => handleDotClick(index)}
            className={`w-2 h-2 rounded-full ${
              currentPage === index ? "bg-white" : "bg-white/50"
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default Carousel;