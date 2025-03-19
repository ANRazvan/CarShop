
import React from 'react';
import CheckboxList from './CheckboxList.jsx';
import './Sidebar.css';
import {Link} from "react-router-dom";

const Sidebar = ({ selectedMakes, setSelectedMakes }) => {
    console.log("Selected Makes in Sidebar:", selectedMakes); // Debugging line

    return (
        <div className="sidebar">
            <Link to="/AddCar" >
            <button className="add-car">Add new car</button>
            </Link>
            <input className="search" type="text" placeholder="Search" />
            <CheckboxList
                title="Make"
                items={["Mazda", "Volkswagen", "BMW", "Mercedes", "Audi"]}
                selectedItems={selectedMakes}
                setSelectedItems={setSelectedMakes}
            />
            <CheckboxList
                title="Fuel Type"
                items={["Diesel", "Gas", "Hybrid", "Electric"]}
                selectedItems={[]}  // Empty array for selected items
                setSelectedItems={() => {}}  // Empty function (you can update later if needed)
                />
            <h4>Price Interval</h4>
            <div className="MinMaxPrice">
                <input className="priceInterval" type="text" placeholder="Min price" />
                <input className="priceInterval" type="text" placeholder="Max price" />
            </div>
        </div>
    );
};

export default Sidebar;
