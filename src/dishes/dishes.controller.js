const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /dishes handlers needed to make the tests pass

function list(req, res, next) {
  res.json({ data: dishes });
}

function create(req, res, next) {
  const {
    data: { name, description, price, image_url },
  } = req.body;
  const newDish = {
    id: nextId(),
    name,
    description,
    price,
    image_url,
  };
  dishes.push(newDish);
  res.status(201).json({ data: newDish });
}

function read(req, res, next) {
  const foundIdx = res.locals.foundIdx;
  res.json({ data: dishes[foundIdx] });
}

function update(req, res, next) {
  const foundIdx = res.locals.foundIdx;
  const { data } = req.body;
  const id = dishes[foundIdx].id;
  dishes[foundIdx] = { ...data, id };
  res.json({ data: { ...data, id } });
}

//middlerware validation functions

function validateId(req, res, next) {
  const { dishId } = req.params;
  if (!dishId) {
    return next({ status: 404, message: `Dish does not exist: ${dishId}.` });
  }
  const foundIdx = dishes.findIndex((dish) => dish.id === dishId);
  if (foundIdx === -1) {
    return next({ status: 404, message: `Dish does not exist: ${dishId}.` });
  }
  res.locals.foundIdx = foundIdx;
  next();
}

function compareBodyIdToParams(req, res, next) {
  const { dishId } = req.params;
  const {
    data: { id },
  } = req.body;
  if (!id) return next();
  if (dishId !== id)
    return next({
      status: 400,
      message: `Dish id does not match route id. Dish: ${id}, Route: ${dishId}`,
    });
  next();
}

function validateInputFields(field) {
  return (req, res, next) => {
    const { data } = req.body;
    if (!data[field])
      return next({ status: 400, message: `Dish must include a ${field}` });
    next();
  };
}

function validatePrice(req, res, next) {
  const {
    data: { price },
  } = req.body;

  if (price <= 0) {
    return next({
      status: 400,
      message: "Dish must have a price that is an integer greater than 0",
    });
  } else if (!price) {
    return next({
      status: 400,
      message: "Dish must include a price",
    });
  } else if (!Number.isInteger(price)) {
    return next({
      status: 400,
      message: "Dish must have a price that is an integer greater than 0",
    });
  }
  next();
}

module.exports = {
  list,
  create: [
    validateInputFields("name"),
    validateInputFields("description"),
    validateInputFields("image_url"),
    validatePrice,
    create,
  ],
  read: [validateId, read],
  update: [
    validateId,
    validateInputFields("name"),
    validateInputFields("description"),
    validateInputFields("image_url"),
    validatePrice,
    compareBodyIdToParams,
    update,
  ],
};
