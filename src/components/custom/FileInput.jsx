'use client'
import { CloseButton } from '@/components/ui/close-button'
import {
  FileInput,
  FileUploadClearTrigger,
  FileUploadLabel,
  FileUploadRoot,
} from '@/components/ui/file-upload'
import { InputGroup } from '@/components/ui/input-group'
import { LuFileUp } from 'react-icons/lu'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'react-hot-toast'

export const FileUploadComponent = ({ onUpload }) => {
  const [file, setFile] = useState(null)
  const [error, setError] = useState(null)

  const handleFileChange = (event) => {
    setError(null)
    const selectedFile = event.acceptedFiles[0]
    setFile(selectedFile)
  }

  const handleUpload = async () => {
    if (!file) {
      console.error('No file selected')
      setError('No file selected')
      return
    }

    if (file.type !== 'application/pdf') {
      console.error('Invalid file type')
      setError('Invalid file type')
      return
    }

    // If file has spaces, throw error.
    if (file.name.includes(' ')) {
      console.error('File name cannot contain spaces')
      setError('File name cannot contain spaces')
      return
    }

    // Convert file to Base64
    const reader = new FileReader()
    reader.onload = () => {
      const base64String = reader.result
      const base64Data = base64String.split(',')[1]
      onUpload(base64Data, file.name)
    }
    reader.onerror = (error) => {
      toast.error(error)
    }
    reader.readAsDataURL(file)
  }

  return (
    <FileUploadRoot gap="1" maxWidth="300px" onFileChange={handleFileChange}>
      <FileUploadLabel style={{ color: 'black' }}>Upload file</FileUploadLabel>
      <InputGroup
        w="full"
        startElement={<LuFileUp />}
        style={{ color: 'black' }}
        endElement={
          <FileUploadClearTrigger asChild>
            <CloseButton
              me="-1"
              size="xs"
              variant="plain"
              focusVisibleRing="inside"
              focusRingWidth="2px"
              pointerEvents="auto"
              color="fg.subtle"
              onClick={() => setFile(null)}
            />
          </FileUploadClearTrigger>
        }
      >
        <FileInput />
      </InputGroup>
      <Button
        onClick={handleUpload}
        style={{ marginTop: '10px', backgroundColor: '#ccc' }}
      >
        Upload File!
      </Button>
      {error && <p>{error}</p>}
    </FileUploadRoot>
  )
}
