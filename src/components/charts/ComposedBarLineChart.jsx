'use client'
import React from 'react'
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts'
import moment from 'moment'

// Function to prepare data for the Composed Chart
const getMonthlyCategoryData = (transactions) => {
  const monthlyData = {}

  transactions.forEach((tx) => {
    const month = moment(tx.date_time, 'DD/MM/YYYY').format('MMM YYYY')
    const category = tx.transaction_category
    const amount = tx.amount

    if (!monthlyData[month]) {
      monthlyData[month] = { month, total: 0 }
    }

    monthlyData[month][category] = (monthlyData[month][category] || 0) + amount
    monthlyData[month].total += amount
  })

  return Object.values(monthlyData)
}

// Define colors for categories
const CATEGORY_COLORS = {
  Food: '#0088FE', // Blue
  Entertainment: '#00C49F', // Green
  Bills: '#FFBB28', // Yellow
  Misc: '#FF8042', // Orange
  Shopping: '#8884d8', // Purple
  Events: '#FF6699', // Pink
  Transportation: '#A569BD', // Violet
}

const ComposedBarLineChart = ({ transactions }) => {
  const data = getMonthlyCategoryData(transactions)
  const categories = [
    ...new Set(transactions.map((tx) => tx.transaction_category)),
  ]

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload

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

          {/* Total Cost */}
          <p style={{ marginBottom: '8px' }}>
            <strong>Total Cost:</strong> ₹{data.total.toFixed(2)}
          </p>

          {/* Category Breakdown */}
          {categories.map((category) => {
            const value = data[category]
            if (value > 0) {
              return (
                <div
                  key={category}
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
                      backgroundColor: CATEGORY_COLORS[category],
                      marginRight: '6px',
                      borderRadius: '2px',
                    }}
                  />
                  <span>
                    {category}: ₹{value.toFixed(2)}
                  </span>
                </div>
              )
            }
            return null
          })}
        </div>
      )
    }

    return null
  }

  return (
    <div style={{ textAlign: 'center' }}>
      <ResponsiveContainer width="100%" height={500}>
        <ComposedChart
          data={data}
          margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
        >
          <CartesianGrid stroke="#f5f5f5" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip content={<CustomTooltip />} />
          <Legend />

          {/* Bar for each category */}
          {categories.map((category, index) => (
            <Bar
              key={category}
              dataKey={category}
              fill={CATEGORY_COLORS[category] || CATEGORY_COLORS['Misc']}
              stackId="a"
              label={({ name, value }) => {
                return `${name}: ₹${value.toLocaleString('en-IN')}`
              }}
            />
          ))}

          {/* Line for Total Monthly Cost */}
          <Line
            type="monotone"
            dataKey="total"
            stroke="#000000"
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}

export default ComposedBarLineChart
