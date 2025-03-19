// CarShop.jsx
import React, {useState} from "react";
import Sidebar from "./Sidebar.jsx";
import "./CarShop.css";
import Cover from "./Cover.jsx";
import CarList from "./CarList.jsx";

const CarShop = ({cars}) => {


    const [selectedMakes, setSelectedMakes] = useState([]);

    console.log("Selected Makes in CarShop:", selectedMakes); // Debugging line

    return (
        <div>
            <div className="main-content">
                <Cover />
                <div className="content">
                    <Sidebar selectedMakes={selectedMakes} setSelectedMakes={setSelectedMakes} />
                    <CarList cars = {cars} selectedMakes={selectedMakes} />
                </div>
            </div>
        </div>
    );
};

export default CarShop;
