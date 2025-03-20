// CarShop.jsx
import React, {useState} from "react";
import Sidebar from "./Sidebar.jsx";
import "./CarShop.css";
import Cover from "./Cover.jsx";
import CarList from "./CarList.jsx";

const CarShop = ({cars}) => {


    const [selectedMakes, setSelectedMakes] = useState([]);
    const [selectedFuel, setSelectedFuel] = useState([]);
    const [minPrice, setMinPrice] = useState(0);
    const [maxPrice, setMaxPrice] = useState(0);
    const [searchBar, setSearchBar] = useState("");

    console.log("Selected Makes in CarShop:", selectedMakes); // Debugging line

    return (
        <div>
            <div className="main-content">
                <Cover />
                <div className="content">
                    <Sidebar cars = {cars} selectedMakes={selectedMakes} setSelectedMakes={setSelectedMakes} selectedFuel={selectedFuel} setSelectedFuel={setSelectedFuel}
                                    minPrice={minPrice} setMinPrice={setMinPrice} maxPrice={maxPrice} setMaxPrice={setMaxPrice} searchBar={searchBar} setSearchBar={setSearchBar}/>
                    <CarList cars = {cars} selectedMakes={selectedMakes} selectedFuel={selectedFuel} minPrice={minPrice} maxPrice={maxPrice} searchBar={searchBar}  />
                </div>
            </div>
        </div>
    );
};

export default CarShop;
