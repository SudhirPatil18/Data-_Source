document.addEventListener('DOMContentLoaded', () => {
    const monthSelector = document.getElementById('monthSelector');
    const searchBox = document.getElementById('searchBox');
    const transactionsTable = document.getElementById('transactionsTable').getElementsByTagName('tbody')[0];
    const prevPage = document.getElementById('prevPage');
    const nextPage = document.getElementById('nextPage');
    const totalSaleAmount = document.getElementById('totalSaleAmount');
    const soldItems = document.getElementById('soldItems');
    const notSoldItems = document.getElementById('notSoldItems');
    const barChartCanvas = document.getElementById('barChart');
    const pieChartCanvas = document.getElementById('pieChart');
  
    let currentPage = 1;
    let searchText = '';
  
    const fetchTransactions = async (month, search, page) => {
      const response = await fetch(`/api/transactions?month=${month}&search=${search}&page=${page}`);
      const transactions = await response.json();
      return transactions;
    };
  
    const fetchStatistics = async (month) => {
      const response = await fetch(`/api/statistics?month=${month}`);
      const statistics = await response.json();
      return statistics;
    };
  
    const fetchBarChart = async (month) => {
      const response = await fetch(`/api/barchart?month=${month}`);
      const barChart = await response.json();
      return barChart;
    };
  
    const fetchPieChart = async (month) => {
      const response = await fetch(`/api/piechart?month=${month}`);
      const pieChart = await response.json();
      return pieChart;
    };
  
    const updateTransactionsTable = (transactions) => {
      transactionsTable.innerHTML = '';
      transactions.forEach(transaction => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${transaction.title}</td>
          <td>${transaction.description}</td>
          <td>${transaction.price}</td>
          <td>${new Date(transaction.dateOfSale).toLocaleDateString()}</td>
          <td>${transaction.category}</td>
          <td>${transaction.sold ? 'Yes' : 'No'}</td>
        `;
        transactionsTable.appendChild(row);
      });
    };
  
    const updateStatistics = (statistics) => {
      totalSaleAmount.textContent = statistics.totalSaleAmount;
      soldItems.textContent = statistics.soldItems;
      notSoldItems.textContent = statistics.notSoldItems;
    };
  
    const updateBarChart = (barChart) => {
      const ctx = barChartCanvas.getContext('2d');
      new Chart(ctx, {
        type: 'bar',
        data: {
          labels: barChart.map(item => item.range),
          datasets: [{
            label: '# of Items',
            data: barChart.map(item => item.count),
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1
          }]
        },
        options: {
          scales: {
            y: {
              beginAtZero: true
            }
          }
        }
      });
    };
  
    const updatePieChart = (pieChart) => {
      const ctx = pieChartCanvas.getContext('2d');
      new Chart(ctx, {
        type: 'pie',
        data: {
          labels: pieChart.map(item => item._id),
          datasets: [{
            label: '# of Items',
            data: pieChart.map(item => item.count),
            backgroundColor: pieChart.map((_, index) => `hsl(${index * 360 / pieChart.length}, 75%, 50%)`)
          }]
        }
      });
    };
  
    const updateData = async () => {
      const month = monthSelector.value;
      const transactions = await fetchTransactions(month, searchText, currentPage);
      const statistics = await fetchStatistics(month);
      const barChart = await fetchBarChart(month);
      const pieChart = await fetchPieChart(month);
  
      updateTransactionsTable(transactions);
      updateStatistics(statistics);
      updateBarChart(barChart);
      updatePieChart(pieChart);
    };
  
    monthSelector.addEventListener('change', updateData);
    searchBox.addEventListener('input', (e) => {
      searchText = e.target.value;
      updateData();
    });
    prevPage.addEventListener('click', () => {
      if (currentPage > 1) {
        currentPage--;
        updateData();
      }
    });
    nextPage.addEventListener('click', () => {
      currentPage++;
      updateData();
    });
  
    updateData();
  });
  