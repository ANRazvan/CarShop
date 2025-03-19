// import React, { useState } from "react";
// import "./CarShop.css";
//
// // Mocked car data
// const cars = [
//     { id: 1, make: "Mazda", model: "6", description: "1.5 Diesel", price: 18209, img: "mazda.jpg" },
//     { id: 2, make: "Volkswagen", model: "6", description: "1.5 Diesel", price: 18209.38, img: "mazda.jpg" },
//     { id: 3, make: "Mazda", model: "6", description: "1.5 Diesel", price: 18209.38, img: "mazda.jpg" },
//     { id: 4, make: "Mazda", model: "6", description: "1.5 Diesel", price: 18209.38, img: "mazda.jpg" },
//     { id: 5, make: "Mazda", model: "6", description: "1.5 Diesel", price: 18209.38, img: "mazda.jpg" },
//     { id: 6, make: "Mazda", model: "6", description: "1.5 Diesel", price: 18209, img: "mazda.jpg" },
//     { id: 7, make: "Mazda", model: "6", description: "1.5 Diesel", price: 18209.38, img: "mazda.jpg" },
//     { id: 8, make: "Mazda", model: "6", description: "1.5 Diesel", price: 18209.38, img: "mazda.jpg" },
//     { id: 9, make: "Mazda", model: "6", description: "1.5 Diesel", price: 18209.38, img: "mazda.jpg" },
//     { id: 10, make: "Mazda", model: "6", description: "1.5 Diesel", price: 18209.38, img: "mazda.jpg" },
//     { id: 11, make: "Mazda", model: "6", description: "1.5 Diesel", price: 18209, img: "mazda.jpg" },
// ];
//
// const itemsPerPage = 8; // Number of cars per page
//
// // CarList Component
// const CarList = ({ cars, selectedMakes }) => {
//     // Filter cars by selected makes
//     const filteredCars = selectedMakes.length
//         ? cars.filter((car) => selectedMakes.includes(car.make))
//         : cars;
//
//     const [currentPage, setCurrentPage] = useState(1);
//
//     const totalPages = Math.ceil(filteredCars.length / itemsPerPage);
//     const startIndex = (currentPage - 1) * itemsPerPage;
//     const selectedCars = filteredCars.slice(startIndex, startIndex + itemsPerPage);
//
//     const goToPage = (page) => {
//         if (page >= 1 && page <= totalPages) {
//             setCurrentPage(page);
//         }
//     };
//
//     return (
//         <div>
//             <div className="car-list">
//                 {selectedCars.map((car) => (
//                     <div key={car.id} className="car-card">
//                         <img className="car-img" src={car.img} alt={car.model} />
//                         <h3>{car.make}</h3>
//                         <h4>{car.model}</h4>
//                         <p>{car.description}</p>
//                         <p className="price">${car.price.toFixed(2)}</p>
//                     </div>
//                 ))}
//             </div>
//
//             <div className="pagination">
//                 <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}>
//                     Previous
//                 </button>
//                 {Array.from({ length: totalPages }, (_, index) => (
//                     <button
//                         key={index + 1}
//                         className={currentPage === index + 1 ? "active" : ""}
//                         onClick={() => goToPage(index + 1)}
//                     >
//                         {index + 1}
//                     </button>
//                 ))}
//                 <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages}>
//                     Next
//                 </button>
//             </div>
//         </div>
//     );
// };
//
// // CheckboxList Component
// const CheckboxList = ({ title, items, selectedItems, setSelectedItems }) => {
//     const handleCheckboxChange = (item) => {
//         setSelectedItems((prevSelected) =>
//             prevSelected.includes(item)
//                 ? prevSelected.filter((selected) => selected !== item) // Remove if already selected
//                 : [...prevSelected, item] // Add if not selected
//         );
//     };
//
//     return (
//         <div className="checkbox-list">
//             <h3>{title}</h3>
//             {items.map((item) => (
//                 <label key={item} className="checkbox-label">
//                     <input
//                         type="checkbox"
//                         className="checkbox-input"
//                         checked={selectedItems.includes(item)}
//                         onChange={() => handleCheckboxChange(item)}
//                     />
//                     {item}
//                 </label>
//             ))}
//         </div>
//     );
// };
//
// // Sidebar Component
// const Sidebar = ({ selectedMakes, setSelectedMakes }) => (
//     <div className="sidebar">
//         <button className="add-car">Add new car</button>
//         <input className="search" type="text" placeholder="Search" />
//         <CheckboxList
//             title="Make"
//             items={["Mazda", "Volkswagen", "BMW", "Mercedes", "Audi"]}
//             selectedItems={selectedMakes}
//             setSelectedItems={setSelectedMakes}
//         />
//         <CheckboxList title="Fuel Type" items={["Diesel", "Gas", "Hybrid", "Electric"]} />
//         <h4>Price Interval</h4>
//         <div className="MinMaxPrice">
//             <input className="priceInterval" type="text" placeholder="Min price" />
//             <input className="priceInterval" type="text" placeholder="Max price" />
//         </div>
//     </div>
// );
//
// // Cover Component
// const Cover = () => (
//     <div className="cover">
//         <h1>Welcome to the Car Shop</h1>
//     </div>
// );
//
// // Main CarShop Component
// const CarShop = () => {
//     const [selectedMakes, setSelectedMakes] = useState([]);
//
//     return (
//         <div>
//             <div className="main-content">
//                 <Cover />
//                 <div className="content">
//                     <Sidebar selectedMakes={selectedMakes} setSelectedMakes={setSelectedMakes} />
//                     <CarList cars={cars} selectedMakes={selectedMakes} />
//                 </div>
//             </div>
//         </div>
//     );
// };
//
// export default CarShop;
