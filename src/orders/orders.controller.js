const { type } = require("express/lib/response");
const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass

function list(req, res, next) {
  res.json({ data: orders });
}

function create(req, res, next) {
  const {
    data: { deliverTo, mobileNumber, status, dishes },
  } = req.body;
  const newOrder = {
    id: nextId(),
    deliverTo,
    mobileNumber,
    status,
    dishes,
  };
  orders.push(newOrder);
  res.status(201).json({ data: newOrder });
}

function read(req, res, next) {
  const foundIdx = res.locals.foundIdx;
  res.json({ data: orders[foundIdx] });
}

function update(req, res, next) {
  const foundIdx = res.locals.foundIdx;
  const { data } = req.body;
  const id = orders[foundIdx].id;
  orders[foundIdx] = { ...data, id };
  res.json({ data: { ...data, id } });
}

function destory(req, res, next) {
  const foundIdx = res.locals.foundIdx;
  orders.splice(foundIdx, 1);
  res.sendStatus(204);
}

//validate middleware

function isStatusPending(req, res, next) {
  const foundIdx = res.locals.foundIdx;
  const currentorder = orders[foundIdx];
  if (currentorder.status !== "pending") {
    return next({
      status: 400,
      message: "An order cannot be deleted unless it is pending",
    });
  }
  next();
}

function isStatusDelivered(req, res, next) {
  const foundIdx = res.locals.foundIdx;
  const currentorder = orders[foundIdx];
  if (currentorder.status === "delivered") {
    return next({
      status: 400,
      message: "A delivered order cannot be changed",
    });
  }
  next();
}

function validateStatus(req, res, next) {
  const {
    data: { status },
  } = req.body;
  const statusTypes = ["pending", "preparing", "out-for-delivery", "delivered"];
  if (!status || !statusTypes.includes(status)) {
    return next({
      status: 400,
      message: `Order must have a status of pending, preparing, out-for-delivery, delivered`,
    });
  }
  next();
}

function validateBodyIdToParams(req, res, next) {
  const { orderId } = req.params;
  const {
    data: { id },
  } = req.body;
  if (!id || orderId === id) {
    return next();
  }
  next({
    status: 400,
    message: `Order id does not match route id. Order: ${id}, Route: ${orderId}.`,
  });
}

function validateId(req, res, next) {
  const { orderId } = req.params;
  const foundIdx = orders.findIndex((order) => order.id === orderId);
  if (foundIdx === -1) {
    next({ status: 404, message: `not found ${orderId}` });
  }
  res.locals.foundIdx = foundIdx;
  next();
}

function validateOrderField(field) {
  return (req, res, next) => {
    const { data = {} } = req.body;
    if (!data[field]) {
      return next({ status: 400, message: `Order must include a ${field}` });
    }
    next();
  };
}

function validateDishes(req, res, next) {
  const {
    data: { dishes },
  } = req.body;
  if (!dishes || !Array.isArray(dishes) || dishes.length === 0) {
    return next({
      status: 400,
      message: "Order must include at least one dish",
    });
  }
  next();
}

function validateQuantity(req, res, next) {
  const {
    data: { dishes },
  } = req.body;
  dishes.forEach((item, idx) => {
    if (
      !item.quantity ||
      !Number.isInteger(item.quantity) ||
      item.quantity <= 0
    ) {
      return next({
        status: 400,
        message: `Dish ${idx} must have a quantity that is an integer greater than 0`,
      });
    }
  });
  next();
}

module.exports = {
  list,
  create: [
    validateOrderField("deliverTo"),
    validateOrderField("mobileNumber"),
    validateDishes,
    validateQuantity,
    create,
  ],
  read: [validateId, read],
  update: [
    validateId,
    validateOrderField("deliverTo"),
    validateOrderField("mobileNumber"),
    validateDishes,
    validateQuantity,
    validateBodyIdToParams,
    validateStatus,
    isStatusDelivered,
    update,
  ],
  delete: [validateId, isStatusPending, destory],
};
