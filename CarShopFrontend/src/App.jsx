import Footer from './Footer.jsx'
import CarShop from './CarShop.jsx'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import React, {useState} from "react";
import Navbar from './Navbar.jsx'
import CarDetail from './CarDetail.jsx'
import AddCar from "./AddCar.jsx";
import UpdateCar from './UpdateCar.jsx';
import Charts from './Charts.jsx'; // Import the Charts component
import './Charts.css'; // Import the Charts CSS
import NetworkStatusBar from "./components/NetworkStatusBar.jsx";

function App() {

  return(
    <Router>
      <div className="App">
        <Navbar />
        <Routes>
            <Route path ="/" element={<CarShop />} /> {/* Pass cars and setCars to CarShop */}
            <Route path ="/CarDetail/:id" element={<CarDetail />} />
            <Route path="/AddCar" element={<AddCar />} />
            <Route path="/UpdateCar/:id" element={<UpdateCar />} />
            <Route path="/charts" element={<Charts />} />
        </Routes>   
        <NetworkStatusBar />
        <Footer />
      </div>
    </Router>
  );
}

export default App
