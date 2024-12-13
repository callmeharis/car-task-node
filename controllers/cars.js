const Car = require("../models/Car");
const { StatusCodes } = require("http-status-codes");
const { BadRequestError, NotFoundError } = require("../errors");
const cloudinary = require("cloudinary").v2;
const fs = require("fs");

const getAllCars = async (req, res) => {
  const { search, status, sort } = req.query;

  const queryObject = {
    createdBy: req.user.userId,
  };

  if (search) {
    queryObject.carModel = { $regex: search, $options: "i" };
  }
  if (status && status !== "all") {
    queryObject.status = status;
  }
  let result = Car.find(queryObject);

  if (sort === "latest") {
    result = result.sort("-createdAt");
  }
  if (sort === "oldest") {
    result = result.sort("createdAt");
  }
  if (sort === "a-z") {
    result = result.sort("carModel");
  }
  if (sort === "z-a") {
    result = result.sort("-carModel");
  }

  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 5;
  const skip = (page - 1) * limit;

  result = result.skip(skip).limit(limit);

  const cars = await result;

  const totalCars = await Car.countDocuments(queryObject);
  const numOfPages = Math.ceil(totalCars / limit);

  res.status(StatusCodes.OK).json({ cars, totalCars, numOfPages });
};
const getCar = async (req, res) => {
  const {
    user: { userId },
    params: { id: carId },
  } = req;

  const car = await Car.findOne({
    _id: carId,
    createdBy: userId,
  });
  if (!car) {
    throw new NotFoundError(`No car with id ${carId}`);
  }
  res.status(StatusCodes.OK).json({ car });
};

// const createCar = async (req, res) => {
//   try {
//     const { carModel, price, phone } = req.body;
//     if (!req.files || !req.files.carImage) {
//       return res.status(400).json({ msg: "Please upload an image" });
//     }

//     const result = await cloudinary.uploader.upload(
//       req.files.carImage.tempFilePath,
//       {
//         use_filename: true,
//         folder: "cars",
//       }
//     );

//     fs.unlinkSync(req.files.carImage.tempFilePath);

//     const carData = {
//       carModel,
//       price,
//       phone,
//       carImage: result.secure_url,
//       createdBy: req.user.userId,
//     };

//     const car = await Car.create(carData);

//     res.status(StatusCodes.CREATED).json({ car });
//   } catch (error) {
//     res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ msg: error.message });
//   }
// };

const createCar = async (req, res) => {
  try {
    const { carModel, price, phone } = req.body;

    if (!req.files || !req.files.carImage) {
      return res.status(400).json({ msg: "Please upload at least one image" });
    }
    const files = Array.isArray(req.files.carImage)
      ? req.files.carImage
      : [req.files.carImage];
    // Process each image
    const uploadPromises = files.map((file) =>
      cloudinary.uploader.upload(file.tempFilePath, {
        use_filename: true,
        folder: "cars",
      })
    );

    // Wait for all uploads to complete
    const uploadResults = await Promise.all(uploadPromises);

    // Remove temporary files
    files.forEach((file) => {
      fs.unlinkSync(file.tempFilePath);
    });

    // Extract secure URLs from upload results
    const carImages = uploadResults.map((result) => result.secure_url);

    // Prepare car data
    const carData = {
      carModel,
      price,
      phone,
      carImage: carImages, // Array of image URLs
      createdBy: req.user.userId,
    };

    // Save to database
    const car = await Car.create(carData);

    res.status(StatusCodes.CREATED).json({ car });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ msg: error.message });
  }
};

const updateCar = async (req, res) => {
  const {
    body: { carModel, phone },
    user: { userId },
    params: { id: carId },
  } = req;

  if (carModel === "" || phone === "") {
    throw new BadRequestError("carModel & phone fields cannot be empty");
  }
  const car = await Car.findByIdAndUpdate(
    { _id: carId, createdBy: userId },
    req.body,
    { new: true, runValidators: true }
  );
  if (!car) {
    throw new NotFoundError(`No car with id ${carId}`);
  }
  res.status(StatusCodes.OK).json({ car });
};

const deleteCar = async (req, res) => {
  const {
    user: { userId },
    params: { id: carId },
  } = req;

  const car = await Car.findByIdAndRemove({
    _id: carId,
    createdBy: userId,
  });
  if (!car) {
    throw new NotFoundError(`No car with id ${carId}`);
  }
  res.status(StatusCodes.OK).send();
};

const uploadProductImage = async (req, res) => {
  const result = await cloudinary.uploader.upload(
    req.files.carImage.tempFilePath,
    {
      use_filename: true,
      folder: "file-upload",
    }
  );

  fs.unlinkSync(req.files.carImage.tempFilePath);
  return res.status(StatusCodes.OK).json({
    carImage: {
      src: result.secure_url,
    },
  });
};

module.exports = {
  createCar,
  deleteCar,
  getAllCars,
  updateCar,
  getCar,
  uploadProductImage,
};
