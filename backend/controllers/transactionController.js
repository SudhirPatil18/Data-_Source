const Transaction = require('../models/transactionModel');
const axios = require('axios');

const initializeDatabase = async (req, res) => {
  try {
    const response = await axios.get('https://s3.amazonaws.com/roxiler.com/product_transaction.json');
    const data = response.data;

    await Transaction.deleteMany({});
    await Transaction.insertMany(data);

    res.send('Database initialized with seed data');
  } catch (error) {
    res.status(500).send('Error initializing database');
  }
};

const listTransactions = async (req, res) => {
  const { month, search, page = 1, perPage = 10 } = req.query;
  const monthNumber = new Date(`${month} 1, 2000`).getMonth() + 1;

  const query = {
    $expr: {
      $eq: [{ $month: '$dateOfSale' }, monthNumber]
    }
  };

  if (search) {
    query.$or = [
      { title: new RegExp(search, 'i') },
      { description: new RegExp(search, 'i') },
      { price: new RegExp(search, 'i') }
    ];
  }

  const transactions = await Transaction.find(query)
    .skip((page - 1) * perPage)
    .limit(parseInt(perPage));

  res.json(transactions);
};

const getStatistics = async (req, res) => {
  const { month } = req.query;
  const monthNumber = new Date(`${month} 1, 2000`).getMonth() + 1;

  const soldItems = await Transaction.countDocuments({
    $expr: {
      $eq: [{ $month: '$dateOfSale' }, monthNumber]
    },
    sold: true
  });

  const notSoldItems = await Transaction.countDocuments({
    $expr: {
      $eq: [{ $month: '$dateOfSale' }, monthNumber]
    },
    sold: false
  });

  const totalSaleAmount = await Transaction.aggregate([
    { $match: { $expr: { $eq: [{ $month: '$dateOfSale' }, monthNumber] } } },
    { $group: { _id: null, total: { $sum: '$price' } } }
  ]);

  res.json({
    totalSaleAmount: totalSaleAmount[0]?.total || 0,
    soldItems,
    notSoldItems
  });
};

const getBarChart = async (req, res) => {
  const { month } = req.query;
  const monthNumber = new Date(`${month} 1, 2000`).getMonth() + 1;

  const ranges = [
    { min: 0, max: 100 },
    { min: 101, max: 200 },
    { min: 201, max: 300 },
    { min: 301, max: 400 },
    { min: 401, max: 500 },
    { min: 501, max: 600 },
    { min: 601, max: 700 },
    { min: 701, max: 800 },
    { min: 801, max: 900 },
    { min: 901, max: Infinity }
  ];

  const results = await Promise.all(
    ranges.map(async (range) => {
      const count = await Transaction.countDocuments({
        $expr: { $eq: [{ $month: '$dateOfSale' }, monthNumber] },
        price: { $gte: range.min, $lte: range.max }
      });

      return { range: `${range.min}-${range.max}`, count };
    })
  );

  res.json(results);
};

const getPieChart = async (req, res) => {
  const { month } = req.query;
  const monthNumber = new Date(`${month} 1, 2000`).getMonth() + 1;

  const categories = await Transaction.aggregate([
    { $match: { $expr: { $eq: [{ $month: '$dateOfSale' }, monthNumber] } } },
    { $group: { _id: '$category', count: { $sum: 1 } } }
  ]);

  res.json(categories);
};

const getCombinedData = async (req, res) => {
  const { month } = req.query;

  const [transactions, statistics, barChart, pieChart] = await Promise.all([
    axios.get('http://localhost:3000/transactions', { params: { month } }),
    axios.get('http://localhost:3000/statistics', { params: { month } }),
    axios.get('http://localhost:3000/barchart', { params: { month } }),
    axios.get('http://localhost:3000/piechart', { params: { month } })
  ]);

  res.json({
    transactions: transactions.data,
    statistics: statistics.data,
    barChart: barChart.data,
    pieChart: pieChart.data
  });
};

module.exports = {
  initializeDatabase,
  listTransactions,
  getStatistics,
  getBarChart,
  getPieChart,
  getCombinedData
};
