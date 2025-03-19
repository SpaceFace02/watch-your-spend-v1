'use client'
import styles from './page.module.css'
import { Button } from '@/components/ui/button'
import { useEffect, useState, useRef } from 'react'
import { FileUploadComponent } from '@/components/custom/FileInput'
import toast from 'react-hot-toast'
import BounceLoader from 'react-spinners/BounceLoader'
import Sidebar from './Sidebar'
import 'dotenv/config'

const login_url = `${process.env.NEXT_PUBLIC_COGNITO_HOSTED_UI}/login?client_id=${process.env.NEXT_PUBLIC_COGNITO_APP_CLIENT_ID}&response_type=code&scope=email+openid+phone&redirect_uri=${process.env.NEXT_PUBLIC_REDIRECT_URI}`

export default function Home() {
  // Get the auth_code from query_params
  const [user, setUser] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const [statements, setStatements] = useState([])

  // Create the websocket connection.
  const socketRef = useRef(null)

  useEffect(() => {
    if (user && user.email && !socketRef.current) {
      const wsURL = `${process.env.NEXT_PUBLIC_WEB_SOCKET_URI}?user_id=${user.email}`
      const ws = new WebSocket(wsURL)
      socketRef.current = ws

      socketRef.current.onopen = () => {
        toast('Connected to WebSocket')
      }

      socketRef.current.onerror = (error) => {
        // Display error message
        toast.error(`WebSocket error: ${error.message}`)
      }

      socketRef.current.onclose = () => {
        toast('Disconnected from WebSocket')
      }

      socketRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data)
        const fileName = data.file_name
        toast(`${fileName} has finished processing!`, {
          icon: '🚀',
          duration: 15000,
        })
      }
    }
  }, [user])

  const getStatements = async () => {
    setLoading(true)
    const response = await fetch('/api/dynamodb/get', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tableName: process.env.NEXT_PUBLIC_AWS_DYNAMODB_TABLE_NAME,
        userId: user.email,
      }),
    })

    if (response.status === 200) {
      const statements = await response.json()
      setStatements(statements)
    }
    setLoading(false)
  }

  const makeLambdaCall = async (fileName) => {
    setLoading(true)
    const response = await fetch('/api/lambda/post', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ file_name: fileName, user_id: user.email }),
    })

    if (response.ok) {
      toast.success(
        'Processing job created, please check back in some time, your pdf should appear in the sidebar.'
      )
      const timestamp = new Date().toISOString()
      const new_statement = {
        file_name: fileName,
        status: 'processing',
        data: null,
        uploaded_on: timestamp,
      }
      // If the statement doesn't exist, only then update the DynamoDB item
      const updateDynamoDBResponse = await fetch('/api/dynamodb/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableName: process.env.NEXT_PUBLIC_AWS_DYNAMODB_TABLE_NAME,
          userId: user.email,
          newStatement: new_statement,
        }),
      })

      if (updateDynamoDBResponse.ok) {
        toast.success(
          'Skeleton statement created successfully. Please view in sidebar for more details. ',
          {
            duration: 5000,
          }
        )
        getStatements()
      } else {
        setError('Failed to update DynamoDB item')
        toast.error('Failed to update DynamoDB item')
      }
    } else {
      const errorText = await response.text()
      setError(errorText)
      toast.error(errorText)
    }
    setLoading(false)
  }

  useEffect(() => {
    setLoading(true)
    const getUserData = async () => {
      const authenticateResponse = await fetch('/api/cognito/authenticate', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      })

      if (authenticateResponse.status === 200) {
        const userData = await authenticateResponse.json()
        // Replace @ with _ and . with _ in email
        const parsedUserData = JSON.parse(userData.value)
        parsedUserData.email = parsedUserData.email
          .replace('@', '_')
          .replace('.', '_')
        setUser(parsedUserData)
      }
    }

    getUserData()
    setLoading(false)
  }, [])

  useEffect(() => {
    if (user && user.email) {
      // Get the statements for the user
      getStatements()
    }
  }, [user])

  const onUpload = async (file, fileName) => {
    setLoading(true)

    // If any statement has the same name, return
    if (statements.some((statement) => statement.file_name === fileName)) {
      // setError('Statement with the same name already exists!')
      toast.error('Statement with the same name already exists!')
      setLoading(false)
      return
    }

    const response = await fetch('/api/s3', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileName: fileName, fileContent: file }),
    })

    if (response.ok) {
      toast.success('File uploaded successfully!')
      // Make API call to Lmabda endpoint.
      makeLambdaCall(fileName)
    } else {
      console.error('Failed to upload file')
      const error = await response.json().then((data) => data.error)
      toast.error(error)
    }
    setLoading(false)
  }

  const logout = async () => {
    const response = await fetch('/api/cognito/logout', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })

    if (response.ok) {
      // No User
      const logoutURL = `${process.env.NEXT_PUBLIC_COGNITO_HOSTED_UI}/logout?client_id=${process.env.NEXT_PUBLIC_COGNITO_APP_CLIENT_ID}&logout_uri=${process.env.NEXT_PUBLIC_BASE_URL}`
      window.location.href = logoutURL
      setUser(null)
      // When we logout, disconnect.
      if (socketRef.current) {
        socketRef.current.close()
      }
    } else {
      toast.error('Failed to logout')
      setError('Failed to logout')
    }
  }

  if (loading) {
    // Center the loader
    return (
      <div className={styles.loaderContainer}>
        <BounceLoader color="#2b8eff" size={40} />
      </div>
    )
  }

  return (
    <div className={styles.pageContainer}>
      {/* Sidebar */}
      <Sidebar
        statements={statements}
        // onSelect={onSelect}
        user={user?.email}
        loading={loading}
      />

      {/* Main Content */}
      <main className={styles.mainContent}>
        <h1>Watch Your Spend</h1>

        {/* If the user is not logged in */}
        {!user && !error && !loading && (
          <a href={login_url} className={styles.actionButton}>
            <Button
              type="primary"
              shape="round"
              size="large"
              style={{
                padding: '10px 20px',
                backgroundColor: '#1f2937',
                color: '#fff',
              }}
            >
              Login
            </Button>
          </a>
        )}

        {/* If the user is logged in */}
        {user && !error && (
          <div>
            <h2 className={styles.welcomeMessage}>
              Welcome, {user.email.split('_')[0]}!
            </h2>
            <p className={styles.successText}>
              Your authentication was successful.
            </p>

            {/* File Upload Section */}
            <div className={styles.uploadSection}>
              <FileUploadComponent onUpload={onUpload} />
            </div>

            {/* Logout Button */}
            <Button
              onClick={logout}
              danger
              shape="round"
              className={styles.actionButton}
              style={{
                padding: '10px 20px',
                backgroundColor: '#1f2937',
                color: '#fff',
              }}
            >
              Logout
            </Button>
          </div>
        )}

        {/* If there is an error */}
        {error && (
          <div className={styles.errorSection}>
            <p>{error}</p>
            <a href="/" className={styles.backButton}>
              <Button danger>Back</Button>
            </a>
          </div>
        )}

        {/* Side note */}
        <p className={styles.sideNote}>
          1. Please upload a PDF file having tables with transaction data from
          the statement. Unnecessary advertisements or images will affect the
          LLM's performance.
          <br />
          2. If your statement is not processed within 5 minutes, please reduce
          the number of transactions that you are uploading in the statement.
          <br />
          3. Your statements are deleted from our servers after processing.
          <br />
          4. Please upload a pdf file with no more than 3 pages, for effective
          results.
        </p>
      </main>
    </div>
  )
}
