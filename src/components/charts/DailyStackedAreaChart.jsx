'use client'
import React from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import moment from 'moment'

const CATEGORY_COLORS = {
  Food: '#0088FE', // Blue
  Entertainment: '#00C49F', // Green
  Bills: '#FFBB28', // Yellow
  Misc: '#FF8042', // Orange
  Shopping: '#8884d8', // Purple
  Events: '#FF6699', // Pink
  Transportation: '#A569BD', // Violet
}

const categories = [
  'Food',
  'Entertainment',
  'Bills',
  'Misc',
  'Shopping',
  'Events',
  'Transportation',
]

// Transform transactions into daily grouped data
const getDailyCategoryData = (transactions) => {
  const dailyData = {}

  transactions.forEach((tx) => {
    const date = moment(tx.date_time, 'DD/MM/YYYY').format('DD MMM YYYY')
    const category = tx.transaction_category
    const amount = tx.amount

    if (!dailyData[date]) {
      dailyData[date] = {
        date,
        Food: 0,
        Entertainment: 0,
        Bills: 0,
        Misc: 0,
        Shopping: 0,
        Events: 0,
        Travel: 0,
      }
    }
    dailyData[date][category] += amount
  })

  // Sort dates chronologically
  return Object.values(dailyData).sort(
    (a, b) => moment(a.date, 'DD MMM YYYY') - moment(b.date, 'DD MMM YYYY')
  )
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const total = payload.reduce((sum, item) => sum + item.value, 0)

    return (
      <div
        style={{
          backgroundColor: '#fff',
          padding: '10px',
          border: '1px solid #ccc',
          borderRadius: '5px',
        }}
      >
        <p style={{ fontWeight: 'bold', marginBottom: '5px' }}>{label}</p>
        <p>
          <strong>Total Expense:</strong> ₹{total.toFixed(2)}
        </p>

        {payload.map((item) => (
          <div
            key={item.dataKey}
            style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '4px',
            }}
          >
            <div
              style={{
                width: '10px',
                height: '10px',
                backgroundColor: item.color,
                marginRight: '6px',
                borderRadius: '2px',
              }}
            />
            <span>
              {item.dataKey}: ₹{item.value.toFixed(2)}
            </span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

const DailyStackedAreaChart = ({ transactions }) => {
  const data = getDailyCategoryData(transactions)
  return (
    <div style={{ padding: '20px' }}>
      <h2 style={{ textAlign: 'center' }}>
        Daily Expense Breakdown by Category
      </h2>
      <ResponsiveContainer width="100%" height={500}>
        <AreaChart
          data={data}
          margin={{ top: 20, right: 20, left: 20, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip content={<CustomTooltip />} />
          <Legend />

          {categories.map((category) => (
            <Area
              key={category}
              type="monotone"
              dataKey={category}
              stackId="1"
              stroke={CATEGORY_COLORS[category]}
              fill={CATEGORY_COLORS[category]}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

export default DailyStackedAreaChart
