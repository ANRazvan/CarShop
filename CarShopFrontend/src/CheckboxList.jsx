import React from 'react';
import './CheckboxList.css';

const CheckboxList = ({ title, items, onChange }) => {
    const [selectedItems, setSelectedItems] = React.useState([]);

    const handleCheckboxChange = (item) => {
        const updatedItems = selectedItems.includes(item)
            ? selectedItems.filter((selected) => selected !== item)
            : [...selectedItems, item];
        setSelectedItems(updatedItems);
        console.log(`${title} selected items:`, updatedItems); // Debugging line
        onChange(updatedItems);
    };

    return (
        <div className="checkbox-list">
            <h3>{title}</h3>
            {items.map((item) => (
                <label key={item} className="checkbox-label">
                    <input
                        type="checkbox"
                        className="checkbox-input"
                        checked={selectedItems.includes(item)}
                        onChange={() => handleCheckboxChange(item)}
                    />
                    {item}
                </label>
            ))}
        </div>
    );
};

export default CheckboxList;

