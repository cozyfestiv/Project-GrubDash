const path = require('path');

// Use the existing order data
const orders = require(path.resolve('src/data/orders-data'));

// Use this function to assigh ID's when necessary
const nextId = require('../utils/nextId');

// TODO: Implement the /orders handlers needed to make the tests pass

function list (req, res) {
  res.json({ data: orders });
}

function bodyDataHas (propertyName) {
  return function (req, res, next) {
    const { data = {} } = req.body;
    if (data[propertyName] !== undefined && data[propertyName] !== '') {
      return next();
    }
    next({ status: 400, message: `Order must include a ${propertyName}` });
  };
}

function dishCheck (req, res, next) {
  const { data: { dishes } = {} } = req.body;

  if (!Array.isArray(dishes) || dishes.length === 0) {
    return next({
      status: 400,
      message: 'Order must include at least one dish.'
    });
  }

  dishes.forEach((dish, index) => {
    if (
      !dish.hasOwnProperty('quantity') ||
      typeof dish.quantity !== 'number' ||
      !Number.isInteger(dish.quantity) ||
      dish.quantity <= 0
    ) {
      return next({
        status: 400,
        message: `Dish ${index} must have a quantity that is an integer greater than 0.`
      });
    }
  });

  return next();
}

function create (req, res) {
  const { data: { id, deliverTo, mobileNumber, status } = {} } = req.body;
  const newOrder = {
    id: nextId(),
    deliverTo,
    mobileNumber,
    status
  };
  orders.push(newOrder);
  res.status(201).json({ data: newOrder });
}

function orderExists (req, res, next) {
  const { orderId } = req.params;
  const foundOrder = orders.find(order => order.id === orderId);
  if (foundOrder) {
    res.locals.order = foundOrder;
    return next();
  }
  next({
    status: 404,
    message: `Order does not exist: ${orderId}`
  });
}

function read (req, res, next) {
  res.json({ data: res.locals.order });
}

function update (req, res) {
  const order = res.locals.order;
  const { data: { id, deliverTo, mobileNumber, status } = {} } = req.body;

  order.deliverTo = deliverTo;
  order.mobileNumber = mobileNumber;
  order.status = status;

  res.json({ data: order });
}

function orderIdCheck (req, res, next) {
  const { data: { id } = {} } = req.body;
  const { orderId } = req.params;
  if (!orderId) {
    return next({
      status: 400,
      message: `Order does not exist: ${orderId}.`
    });
  } else if (id && id !== orderId) {
    return next({
      status: 400,
      message: `Order id does not match route id. Order: ${id}, Route: ${orderId}`
    });
  }
  return next();
}

function statusCheck (req, res, next) {
  const { data: { status } = {} } = req.body;
  const validStatus = ['pending', 'preparing', 'out-for-delivery', 'delivered'];

  if (!validStatus.includes(status)) {
    return next({
      status: 400,
      message:
        'Order must have a status of pending, preparing, out-for-delivery, delivered'
    });
  }
  if (status === 'delivered')
    return next({
      status: 400,
      message: 'A delivered order cannot be changed'
    });
  return next();
}

function destroy (req, res) {
  // `splice()` returns an array of the deleted elements, even if it is one element
  const { orderId } = req.params;
  const index = orders.findIndex(order => order.id === orderId);
  orders.splice(index, 1);
  res.sendStatus(204);
}

function pendingCheck (req, res, next) {
  const { orderId } = req.params;
  const order = orders.find(order => order.id === orderId);
  if (order.status !== 'pending') {
    return next({
      status: 400,
      message: 'An order cannot be deleted unless it is pending'
    });
  }
  return next();
}

module.exports = {
  list,
  create: [
    bodyDataHas('deliverTo'),
    bodyDataHas('mobileNumber'),
    dishCheck,
    create
  ],
  read: [orderExists, read],
  update: [
    orderExists,
    bodyDataHas('deliverTo'),
    bodyDataHas('mobileNumber'),
    orderIdCheck,
    statusCheck,
    dishCheck,
    update
  ],
  delete: [orderExists, pendingCheck, destroy]
};
