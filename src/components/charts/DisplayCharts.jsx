import React from 'react'
import TransactionPieChart from './TransactionPieChart'
import ComposedBarLineChart from './ComposedBarLineChart'
import InOutFlows from './InOutFlows'
import DailyStackedAreaChart from './DailyStackedAreaChart'
import MonthlyCashflow from './MonthlyCashflow'

const DisplayCharts = ({ statement }) => {
  if (!statement) {
    return <div>Loading...</div>
  }
  statement.transactions.sort((a, b) => {
    const dateA = new Date(a.date_time.split('/').reverse().join('-'))
    const dateB = new Date(b.date_time.split('/').reverse().join('-'))
    return dateA - dateB
  })
  return (
    <div style={styles.container}>
      {/* Header */}
      <h1 style={styles.title}>{statement.name}</h1>
      <h2 style={styles.subtitle}>{statement.duration}</h2>

      {/* INR Note */}
      <p style={styles.note}>* Amounts are in INR (₹)</p>

      {/* Transactions Table */}
      <h2 style={styles.sectionTitle}>Detailed Transactions</h2>
      <div style={styles.chartWrapper}>
        <div style={styles.chartCard}>
          <InOutFlows transactions={statement.transactions} />
        </div>
      </div>

      {/* Charts Grid */}
      <div style={styles.grid}>
        {/* Pie Chart */}
        <div style={styles.chartCard}>
          <TransactionPieChart
            transactions={statement.transactions.filter(
              (tx) => tx['deposit-withdrawal'].toLowerCase() === 'withdrawal'
            )}
          />
        </div>

        {/* Bar Line Chart */}
        <div style={styles.chartCard}>
          <ComposedBarLineChart
            transactions={statement.transactions.filter(
              (tx) => tx['deposit-withdrawal'].toLowerCase() === 'withdrawal'
            )}
          />
        </div>

        {/* Stacked Area Chart */}
        <div style={styles.chartCard}>
          <DailyStackedAreaChart
            transactions={statement.transactions.filter(
              (tx) => tx['deposit-withdrawal'].toLowerCase() === 'withdrawal'
            )}
          />
        </div>

        {/* Monthly Cashflow */}
        <div style={styles.chartCard}>
          <MonthlyCashflow transactions={statement.transactions} />
        </div>
      </div>
    </div>
  )
}

// Styles
const styles = {
  container: {
    maxWidth: '1500px',
    margin: '0 auto',
    padding: '20px',
    fontFamily: 'Arial, sans-serif',
  },
  title: {
    textAlign: 'center',
    fontSize: '2.5rem',
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    textAlign: 'center',
    fontSize: '1.5rem',
    color: '#555',
  },
  note: {
    textAlign: 'center',
    fontStyle: 'italic',
    color: '#777',
    marginTop: '10px',
  },
  sectionTitle: {
    textAlign: 'center',
    marginTop: '40px',
    marginBottom: '20px',
    fontSize: '1.8rem',
    color: '#444',
    borderBottom: '2px solid #ddd',
    paddingBottom: '10px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(600px, 1fr))',
    gap: '20px',
    marginTop: '20px',
  },
  chartWrapper: {
    marginTop: '20px',
  },
  chartCard: {
    backgroundColor: '#fff',
    padding: '20px',
    borderRadius: '10px',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
    border: '1px solid #e0e0e0',
    transition: 'transform 0.2s',
  },
}

export default DisplayCharts
