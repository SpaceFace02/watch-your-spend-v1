'use client'
import React from 'react'
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

const getCategoryData = (transactions) => {
  const categoryTotals = transactions.reduce((acc, curr) => {
    const category = curr.transaction_category
    acc[category] = (acc[category] || 0) + curr.amount
    return acc
  }, {})

  return Object.keys(categoryTotals).map((category) => ({
    name: category,
    value: categoryTotals[category],
  }))
}

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          backgroundColor: '#fff',
          padding: '10px',
          border: '1px solid #ccc',
        }}
      >
        <p>{`${payload[0].name}`}</p>
        <p>{`₹ ${payload[0].value.toLocaleString('en-IN')}`}</p>
      </div>
    )
  }
  return <></>
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042']

const TransactionPieChart = ({ transactions }) => {
  const data = getCategoryData(transactions)
  return (
    <div style={{ width: '100%', height: 400 }}>
      <ResponsiveContainer width="100%" height={400}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={120}
            label={({ name, value }) => {
              return `${name}: ₹${value.toLocaleString('en-IN')}`
            }}
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

export default TransactionPieChart
