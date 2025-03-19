'use client'
import React from 'react'
import moment from 'moment'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

const getData = (transactions) => {
  const monthlyData = {}
  transactions.map((tx) => {
    const month = moment(tx.date_time, 'DD/MM/YYYY').format('MMM YYYY')
    if (!monthlyData[month]) {
      monthlyData[month] = { month, inflow: 0, outflow: 0 }
    }
    if (tx['deposit-withdrawal'].toLowerCase() === 'withdrawal') {
      monthlyData[month].outflow += tx.amount
    } else {
      monthlyData[month].inflow += tx.amount
    }
  })
  return Object.values(monthlyData).sort(
    (a, b) => moment(a.month) - moment(b.month)
  )
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
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
        <p style={{ color: 'green' }}>Inflow: ₹{payload[0].value.toFixed(2)}</p>
        <p style={{ color: 'red' }}>Outflow: ₹{payload[1].value.toFixed(2)}</p>
      </div>
    )
  }
  return null
}

const MonthlyCashflow = ({ transactions }) => {
  const data = getData(transactions)
  return (
    <div style={{ padding: '20px' }}>
      <h2 style={{ textAlign: 'center' }}>Monthly Inflow vs Outflow</h2>

      <ResponsiveContainer width="100%" height={400}>
        <LineChart
          data={data}
          margin={{ top: 20, right: 20, left: 20, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip content={<CustomTooltip />} />
          <Legend verticalAlign="top" height={36} />

          {/* Inflow Line */}
          <Line
            type="monotone"
            dataKey="inflow"
            stroke="#00C49F"
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
            name="Inflow (₹)"
          />

          {/* Outflow Line */}
          <Line
            type="monotone"
            dataKey="outflow"
            stroke="#FF8042"
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
            name="Outflow (₹)"
          />
        </LineChart>
      </ResponsiveContainer>

      <p
        style={{
          textAlign: 'center',
          marginTop: '10px',
          fontStyle: 'italic',
          color: '#555',
        }}
      >
        * Green line indicates Inflows, Orange line indicates Outflows (in INR
        ₹)
      </p>
    </div>
  )
}

export default MonthlyCashflow
