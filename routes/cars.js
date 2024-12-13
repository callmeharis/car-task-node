const express = require("express");

const router = express.Router();
const {
  createCar,
  deleteCar,
  getAllCars,
  updateCar,
  getCar,
  uploadProductImage,
} = require("../controllers/cars");

router.route("/").post(createCar).get(getAllCars);

router.route("/:id").get(getCar).delete(deleteCar).patch(updateCar);
router.route("/uploads").post(uploadProductImage);

module.exports = router;
