// Delete component
'use client'
import React from 'react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

export default function Delete({ user, fileName, disabled }) {
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()

  const confirmDelete = () => {
    // React hot toast to confirm delete with a button

    toast(
      (t) => (
        <div>
          Are you sure you want to delete this statement?
          <span style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Button onClick={() => toast.dismiss(t.id)}>No</Button>
            <Button
              onClick={() => {
                handleDelete()
                toast.dismiss(t.id)
              }}
            >
              Yes
            </Button>
          </span>
        </div>
      ),
      {
        icon: '🗑️',
        duration: 10000,
        position: 'top-right',
        style: {
          backgroundColor: '#333',
          color: '#fff',
        },
      }
    )
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const response = await fetch('/api/dynamodb/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user,
          file_name: fileName,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to delete statement')
      }

      router.push(`/`)
      router.refresh()
    } catch (error) {
      console.error('Error deleting statement:', error)
      toast.error('Failed to delete statement')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Button
      onClick={confirmDelete}
      disabled={isDeleting || disabled}
      style={{ backgroundColor: '#1f2937', color: 'white' }}
    >
      {isDeleting ? 'Deleting...' : 'Delete'}
    </Button>
  )
}
