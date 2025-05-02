'use client'
import React from 'react'
import { Table } from 'antd'

const columns = [
  { title: 'Sr No', dataIndex: 'sr_no', key: 'sr_no', width: 80 },
  { title: 'Date', dataIndex: 'date_time', key: 'date_time', width: 120 },
  {
    title: 'Type',
    dataIndex: 'deposit-withdrawal',
    key: 'deposit-withdrawal',
    width: 120,
  },
  {
    title: 'Amount (₹)',
    dataIndex: 'amount',
    key: 'amount',
    width: 120,
    render: (text) => `₹${text.toFixed(2)}`,
  },
  {
    title: 'Category',
    dataIndex: 'transaction_category',
    key: 'transaction_category',
    width: 150,
  },
  { title: 'Remarks', dataIndex: 'remarks', key: 'remarks', width: 300 },
  {
    title: 'Interpreted Name',
    dataIndex: 'interpreted_transaction_name',
    key: 'interpreted_transaction_name',
    width: 250,
  },
]

const InOutFlows = ({ transactions }) => {
  let inflows = 0
  let outflows = 0

  transactions.forEach((tx) => {
    if (tx['deposit-withdrawal'].toLowerCase() === 'deposit') {
      inflows += tx.amount
    } else {
      outflows += tx.amount
    }
  })

  return (
    <div>
      <div>
        <p
          style={{
            color: inflows - outflows < 0 ? 'red' : 'green',
            fontSize: '25px',
          }}
        >
          Net Cashflow: ₹ {(inflows - outflows).toLocaleString('en-IN')}
        </p>
        <p style={styles.paragraph}>
          Inflows: ₹ {inflows.toLocaleString('en-IN')}
        </p>
        <p style={styles.paragraph}>
          Outflows: ₹ {outflows.toLocaleString('en-IN')}
        </p>
        <Table
          dataSource={transactions}
          columns={columns}
          rowKey="sr_no"
          pagination={{ pageSize: 5 }}
          scroll={{ x: 1000 }}
        />
      </div>
    </div>
  )
}

const styles = {
  paragraph: {
    marginBottom: '10px',
    fontSize: '20px',
  },
}

export default InOutFlows
