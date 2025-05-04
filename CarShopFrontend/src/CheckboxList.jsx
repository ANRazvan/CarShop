import React, { useEffect } from 'react';
import './CheckboxList.css';

const CheckboxList = ({ title, items, selectedItems = [], onChange, disabled = false, itemIds = null }) => {
    // If itemIds is provided, we'll use those values instead of the item names
    // This allows us to display brand names but filter by brand IDs
    
    const handleCheckboxChange = (item, index) => {
        const itemValue = itemIds ? itemIds[index] : item;
        
        const updatedItems = selectedItems.includes(itemValue)
            ? selectedItems.filter((selected) => selected !== itemValue)
            : [...selectedItems, itemValue];
            
        console.log(`${title} selected values:`, updatedItems); // Debugging line
        onChange(updatedItems);
    };

    // Reset selected items when the parent component changes
    useEffect(() => {
        // This will handle external changes to selectedItems
    }, [selectedItems]);

    return (
        <div className="checkbox-list">
            <h3>{title}</h3>
            {items.map((item, index) => {
                const itemValue = itemIds ? itemIds[index] : item;
                return (
                    <label key={itemValue} className="checkbox-label">
                        <input
                            type="checkbox"
                            className="checkbox-input"
                            checked={selectedItems.includes(itemValue)}
                            onChange={() => handleCheckboxChange(item, index)}
                            disabled={disabled}
                        />
                        {item}
                    </label>
                );
            })}
        </div>
    );
};

export default CheckboxList;

