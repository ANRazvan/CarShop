// import React from 'react';
// import './CheckboxList.css';
//
// const CheckboxList = ({ title, items }) =>{
// const [selectedItems, setSelectedItems] = React.useState([]);
//     const handleCheckboxChange = (item) => {
//         setSelectedItems((prevSelected) =>
//             prevSelected.includes(item)
//                 ? prevSelected.filter((selected) => selected !== item) // Remove if already selected
//                 : [...prevSelected, item] // Add if not selected
//         );
//     };
//     return  (
//         <div className="checkbox-list">
//             <h3>{title}</h3>
//             {items.map((item) => (
//                 <label key={item} className="checkbox-label">
//                     <input type="checkbox" className="checkbox-input"
//                            checked ={selectedItems.includes(item)}
//                     onChange={()=> handleCheckboxChange(item)}/> {item}
//                 </label>
//             ))}
//         </div>
//     );
// }
//
// export default CheckboxList;

import React from 'react';
import './CheckboxList.css';

const CheckboxList = ({ title, items, selectedItems, setSelectedItems }) => {
    const handleCheckboxChange = (item) => {
        console.log("Item selected:", item); // Debugging line
        if (selectedItems.includes(item)) {
            setSelectedItems(selectedItems.filter((selected) => selected !== item));
        } else {
            setSelectedItems([...selectedItems, item]);
        }
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

