
import React from 'react';
import CheckboxList from './CheckboxList.jsx';
import './Sidebar.css';
import {Link} from "react-router-dom";

const Sidebar = ({cars, selectedMakes, setSelectedMakes,selectedFuel,setSelectedFuel, minPrice,setMinPrice,maxPrice,setMaxPrice, searchBar, setSearchBar }) => {
    console.log("Selected Makes in Sidebar:", selectedMakes); // Debugging line

    return (
        <div className="sidebar">
            <Link to="/AddCar" >
            <button className="add-car">Add new car</button>
            </Link>
            {/* <input className="search" type="text" placeholder="Search" /> */}
            <input className="search" type="text" placeholder="Search" value={searchBar} onChange={(e) => setSearchBar(e.target.value)} />
            <CheckboxList
                title="Make"
                // items={["Mazda", "Volkswagen", "BMW", "Mercedes", "Audi"]}
                // items={cars.map(car => car.make)}  // Get the list of makes from the cars data
                // only unique makes
                items={Array.from(new Set(cars.map(car => car.make)))}  // Get the list of makes from the cars data
                selectedItems={selectedMakes}
                setSelectedItems={setSelectedMakes}
            />
            <CheckboxList
                title="Fuel Type"
                items={["Diesel", "Gasoline", "Hybrid", "Electric"]}
                selectedItems={selectedFuel}  // Empty array for selected items
                setSelectedItems={setSelectedFuel} // Empty function (you can update later if needed)
                />
            <h4>Price Interval</h4>
            <div className="MinMaxPrice">
                {/* <input className="priceInterval" type="text" placeholder="Min price" />
                <input className="priceInterval" type="text" placeholder="Max price" /> */}
                <input className="priceInterval" type="text" placeholder="Min price" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} />
                <input className="priceInterval" type="text" placeholder="Max price" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} />
            </div>
        </div>
    );
};

export default Sidebar;
