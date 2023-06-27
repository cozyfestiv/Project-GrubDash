const path = require('path');

// Use the existing dishes data
const dishes = require(path.resolve('src/data/dishes-data'));

// Use this function to assign ID's when necessary
const nextId = require('../utils/nextId');

// TODO: Implement the /dishes handlers needed to make the tests pass
function list (req, res) {
  res.json({ data: dishes });
}

function bodyDataHas (propertyName) {
  return function (req, res, next) {
    const { data = {} } = req.body;
    if (data[propertyName] !== undefined && data[propertyName] !== '') {
      return next();
    }
    next({ status: 400, message: `Must include a ${propertyName}` });
  };
}

function create (req, res) {
  const { data: { id, name, description, price, image_url } = {} } = req.body;
  const newDish = {
    id: dishes.length + 1,
    name,
    description,
    price,
    image_url
  };
  dishes.push(newDish);
  res.status(201).json({ data: newDish });
}

function pricePropertyIsValid (req, res, next) {
  const { data: { price } = {} } = req.body;
  if (!Number.isInteger(price) || price <= 0) {
    next({
      status: 400,
      message: 'Dish must have a price that is an integer greater than 0.'
    });
  }
  return next();
}

function dishExists (req, res, next) {
  const { dishId } = req.params;
  const foundDish = dishes.find(dish => dish.id === dishId);
  if (foundDish) {
    res.locals.dish = foundDish;
    return next();
  }
  next({
    status: 404,
    message: `Dish does not exist: ${dishId}`
  });
}

function read (req, res, next) {
  res.json({ data: res.locals.dish });
}

function update (req, res) {
  const dish = res.locals.dish;
  const { data: { id, name, description, price, image_url } = {} } = req.body;

  dish.name = name;
  dish.description = description;
  dish.price = price;
  dish.image_url = image_url;

  res.json({ data: dish });
}

function dishIdCheck (req, res, next) {
  const { data: { id } = {} } = req.body;
  const { dishId } = req.params;
  if (!dishId) {
    return next({
      status: 400,
      message: `Dish does not exist: ${dishId}.`
    });
  } else if (id && id !== dishId) {
    return next({
      status: 400,
      message: `Dish id does not match route id. Dish: ${id}, Route: ${dishId}`
    });
  }
  return next();
}

module.exports = {
  create: [
    bodyDataHas('name'),
    bodyDataHas('description'),
    bodyDataHas('price'),
    bodyDataHas('image_url'),
    pricePropertyIsValid,
    create
  ],
  list,
  read: [dishExists, read],
  update: [
    dishExists,
    bodyDataHas('name'),
    bodyDataHas('description'),
    bodyDataHas('price'),
    bodyDataHas('image_url'),
    pricePropertyIsValid,
    dishIdCheck,
    update
  ]
};

//   module.exports = {
//     create: [hasText, create],
//     list,
//     read: [noteExists, read],
//     update: [noteExists, hasText, update],
//     delete: [destroy, noteExists],
//     noteExists
//   };
