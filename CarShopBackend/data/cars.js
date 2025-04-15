const carsData = {
    cars: [
        {
            "id": 1,
            "make": "Mazda",
            "model": "6",
            "year": "2019",
            "keywords": "1.5 Diesel 130Cp 2019",
            "description": "A stylish and sporty sedan with a 1.5L diesel engine, offering exceptional fuel efficiency and smooth handling. The Mazda 6 provides a luxurious interior with premium materials, a user-friendly infotainment system, and advanced safety features like lane departure warning and adaptive cruise control.",
            "fuelType": "Diesel",
            "price": 18209,
            "img": "mazda1.jpeg"
        },
        {
            "id": 2,
            "make": "Volkswagen",
            "model": "Passat",
            "year": "2020",
            "keywords": "2.0 TDI Diesel 2020",
            "description": "The Volkswagen Passat is a comfortable and spacious midsize sedan featuring a 2.0L TDI diesel engine. With an elegant design, high-tech interior, and features like Apple CarPlay, heated seats, and a digital cockpit, it's perfect for long drives and everyday commuting.",
            "fuelType": "Diesel",
            "price": 22000,
            "img": "passat.jpeg"
        },
        {
            "id": 3,
            "make": "Honda",
            "model": "Civic",
            "year": "2021",
            "keywords": "1.8 VTEC Turbo 2021",
            "description": "A modern compact car with a 1.8L VTEC turbocharged engine, providing an ideal balance of performance and efficiency. The Honda Civic boasts a sporty design, premium cabin, and advanced driver assistance features, making it a top choice for urban driving.",
            "fuelType": "Gasoline",
            "price": 21000,
            "img": "mazda1.jpeg"
        },
        {
            "id": 4,
            "make": "Toyota",
            "model": "Camry",
            "year": "2022",
            "keywords": "Hybrid 2.5L 2022",
            "description": "The Toyota Camry is a reliable midsize sedan with a hybrid 2.5L engine, offering excellent fuel economy and a comfortable ride. With a spacious interior, intuitive technology, and safety systems like blind-spot monitoring, it ensures a premium driving experience.",
            "fuelType": "Hybrid",
            "price": 26000,
            "img": "camry.jpg"
        },
        {
            "id": 5,
            "make": "BMW",
            "model": "3 Series",
            "year": "2021",
            "keywords": "2.0 Motor 2021",
            "description": "A high-performance luxury sedan with a 2.0 motor, a refined interior, cutting-edge technology, and intelligent safety features such as parking assistance and collision prevention.",
            "fuelType": "Gasoline",
            "price": 35000,
            "img": "bmw3series.jpeg"
        },
        {
            "id": 6,
            "make": "Mercedes-Benz",
            "model": "C-Class",
            "year": "2020",
            "keywords": "2.0 Turbocharged 2020",
            "description": "The Mercedes-Benz C-Class is a premium sedan known for its sophisticated design, a 2.0L turbocharged engine, and a smooth 9-speed automatic transmission. It offers an upscale cabin, advanced infotainment, and driver assistance systems for maximum comfort and safety.",
            "fuelType": "Gasoline",
            "price": 40000,
            "img": "cclass.jpeg"
        },
        {
            "id": 7,
            "make": "Audi",
            "model": "A4",
            "year": "2019",
            "keywords": "2.0 TFSI Quattro 2019",
            "description": "The Audi A4 is a compact luxury sedan featuring a 2.0L TFSI engine, quattro all-wheel drive, and a high-quality interior with leather seats and ambient lighting. Its digital cockpit and intuitive MMI infotainment system make for a refined driving experience.",
            "fuelType": "Gasoline",
            "price": 37000,
            "img": "audia4.jpeg"
        },
        {
            "id": 8,
            "make": "Ford",
            "model": "Mondeo",
            "year": "2018",
            "keywords": "2.0 EcoBlue Diesel 2018",
            "description": "A practical and efficient midsize car equipped with a 2.0L EcoBlue diesel engine. The Ford Mondeo combines modern styling with a spacious interior, a SYNC 3 infotainment system, and multiple safety features, making it a great choice for families and professionals.",
            "fuelType": "Gasoline",
            "price": 20000,
            "img": "mondeo.jpeg"
        },
        {
            "id": 9,
            "make": "Hyundai",
            "model": "Sonata",
            "year": "2021",
            "keywords": "1.6 Turbocharged 2021",
            "description": "The Hyundai Sonata is a sleek and fuel-efficient sedan powered by a 1.6L turbocharged engine. It features a futuristic design, a digital instrument cluster, wireless charging, and SmartSense safety technologies for a high-tech driving experience.",
            "fuelType": "Gasoline",
            "price": 28000,
            "img": "sonata.jpeg"
        },
        {
            "id": 10,
            "make": "Nissan",
            "model": "Altima",
            "year": "2022",
            "keywords": "2.5L VC-Turbo 2022",
            "description": "The Nissan Altima is a dynamic midsize sedan offering a 2.5L VC-Turbo engine and all-wheel drive capability. Its ProPILOT Assist, premium Bose sound system, and spacious cabin make it an excellent choice for comfort and innovation.",
            "fuelType": "Gasoline",
            "price": 29000,
            "img": "altima.jpeg"
        },
        {
            "id": 11,
            "make": "Kia",
            "model": "Optima",
            "year": "2019",
            "keywords": "2.4 GDI 2019",
            "description": "The Kia Optima is a stylish and practical sedan with a 2.4L GDI engine. It offers advanced driver assistance features, an 8-inch touchscreen infotainment system, and a comfortable ride, making it an ideal car for daily commutes and long journeys.",
            "fuelType": "Gasoline",
            "price": 23000,
            "img": "optima.jpeg"
        },
        {
            "id": 12,
            "make": "Mazda",
            "model": "6",
            "year": "2020",
            "keywords": "1.5 Diesel 140Cp 2020",
            "description": "A stylish and sporty sedan with a 1.5L diesel engine, offering exceptional fuel efficiency and smooth handling. The Mazda 6 provides a luxurious interior with premium materials, a user-friendly infotainment system, and advanced safety features like lane departure warning and adaptive cruise control.",
            "fuelType":"Diesel",
            "price": 18999,
            "img": "mazda1.jpeg"
        },
        {
            "id": 13,
            "make": "Mazda",
            "model": "6",
            "year": "2021",
            "keywords": "1.5 Diesel 180Cp 2021",
            "description": "A stylish and sporty sedan with a 1.5L diesel engine, offering exceptional fuel efficiency and smooth handling. The Mazda 6 provides a luxurious interior with premium materials, a user-friendly infotainment system, and advanced safety features like lane departure warning and adaptive cruise control.",
            "fuelType": "Diesel",
            "price": 19500,
            "img": "mazda2.jpeg"
        },
    ],
    nextId: 14  // Set this to one higher than the highest ID in the cars array
};
  
module.exports = carsData;