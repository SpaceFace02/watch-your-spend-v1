'use client'
import { useState } from 'react'
import { IoMenu } from 'react-icons/io5'
import { IoClose } from 'react-icons/io5'
import styles from './Sidebar.module.css'
import BeatLoader from 'react-spinners/BeatLoader'
import Link from 'next/link'

export default function Sidebar({ statements, user, loading }) {
  const [isOpen, setIsOpen] = useState(false)

  const toggleSidebar = () => {
    setIsOpen(!isOpen)
  }

  return (
    <>
      <div className={styles.hamburgerMenu} onClick={toggleSidebar}>
        {isOpen ? <IoClose /> : <IoMenu />}
      </div>
      <aside
        className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ''}`}
      >
        <h3>Your Statements</h3>
        {loading && (
          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <BeatLoader color="#fff" />
          </div>
        )}
        {statements.length === 0 ? (
          !user ? (
            <p className={styles.noStatements}>
              Sign in to view your statements
            </p>
          ) : (
            <p>No statements uploaded yet.</p>
          )
        ) : (
          <>
            <Link href={`/`}>
              <div
                className={styles.statementItem}
                onClick={() => {
                  setIsOpen(false) // Close sidebar after selection
                }}
              >
                Home
              </div>
            </Link>

            {statements.map((statement, index) => (
              <Link
                href={`/statement/user/${user}/${statement.file_name}`}
                key={index}
              >
                <div
                  key={index}
                  className={styles.statementItem}
                  onClick={() => {
                    setIsOpen(false) // Close sidebar after selection
                  }}
                >
                  {statement.file_name}
                </div>
              </Link>
            ))}
          </>
        )}
      </aside>
    </>
  )
}
