"use client"

import { useState, useEffect } from "react"

const AllTasks = () => {
  // Google Sheets configuration
  const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyAAyUM9m_Oe_6XAmWYIgO0ENNXgt9ox8vBWwnB4f87Lf883RGvBi4xOL9kxLyDq1dtqA/exec"
  const SHEET_NAME = "DATA"
  const SHEET_ID = "1jOBkMxcHrusTlAV9l21JN-B-5QWq1dDyj3-0kxbK6ik" // Your specific sheet ID

  const [tasks, setTasks] = useState([])
  const [tableHeaders, setTableHeaders] = useState([])
  const [selectedTasks, setSelectedTasks] = useState([])
  const [selectedFiles, setSelectedFiles] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [toast, setToast] = useState({ show: false, message: "", type: "" })
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterFrequency, setFilterFrequency] = useState("all")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [editedTasks, setEditedTasks] = useState({})
  
  // Format a date string to dd/mm/yyyy
  const formatDate = (dateString) => {
    // Check if dateString is valid
    if (!dateString) return '';
    
    try {
      // Parse the date - handle both ISO format and yyyy-mm-dd format
      const date = new Date(dateString);
      
      // Check if date is valid
      if (isNaN(date.getTime())) return dateString;
      
      // Format as dd/mm/yyyy
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0'); // +1 because months are 0-indexed
      const year = date.getFullYear();
      
      return `${day}/${month}/${year}`;
    } catch (error) {
      console.error("Error formatting date:", error);
      return dateString; // Return original string if there's an error
    }
  }
  
  // Parse a formatted date string back to yyyy-mm-dd format for submission
  const parseFormattedDate = (formattedDate) => {
    if (!formattedDate) return '';
    
    try {
      // If it's already in ISO format with time component, extract just the date part
      if (formattedDate.includes('T')) {
        return formattedDate.split('T')[0]; // Extract just the yyyy-mm-dd part
      }
      
      // Try to parse dd/mm/yyyy format
      if (formattedDate.includes('/')) {
        const [day, month, year] = formattedDate.split('/');
        // Create date and format as yyyy-mm-dd (without time component)
        const date = new Date(year, month - 1, day);
        
        // Format as yyyy-mm-dd explicitly
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');
        
        return `${yyyy}-${mm}-${dd}`;
      }
      
      // If it's not in our expected format, return as is
      return formattedDate;
    } catch (error) {
      console.error("Error parsing date:", error);
      return formattedDate;
    }
  }

  // Fetch tasks from Google Sheets
// Modified useEffect with debugging and improved column matching
useEffect(() => {
    const storedUsername = sessionStorage.getItem('username')
    
    if (!storedUsername) {
      // Redirect to login if no username found
      navigate('/login')
      return
    }

    setUsername(storedUsername)
    setIsAdmin(storedUsername.toLowerCase() === 'admin')
  }, [navigate])

  // Fetch tasks from Google Sheets
  useEffect(() => {
    if (!username) return;

    const fetchTasksFromGoogleSheets = async () => {
      try {
        setIsLoading(true)
        
        // Create form data for the request
        const formData = new FormData()
        formData.append('action', 'fetchTasks')
        formData.append('sheetId', SHEET_ID)
        formData.append('sheetName', SHEET_NAME)
  
        const response = await fetch(SCRIPT_URL, {
          method: 'POST',
          body: formData
        })
  
        const data = await response.json()
        
        if (data && data.success) {
          // Find column indices
          const colLIndex = 11; // L column (0-indexed)
          const colMIndex = 12; // M column (0-indexed)
          const userColumnIndex = 4; // E column (0-indexed)
          
          // Find the correct property names for columns
          const colLId = data.headers[colLIndex]?.id || 'colL';
          const colMId = data.headers[colMIndex]?.id || 'colM';
          const userColumnId = data.headers[userColumnIndex]?.id || 'colE';
          
          // Filter tasks based on user role
          const filteredTasks = data.tasks
            .filter(task => {
              // Admin sees all tasks
              if (isAdmin) return true;
              
              // Regular users see only tasks assigned to them
              return task[userColumnId] === username;
            })
            .filter(task => {
              // Additional filter for L not null, M null
              const hasColL = task[colLId] !== undefined && 
                             task[colLId] !== null && 
                             task[colLId].toString().trim() !== '';
                             
              const isColMEmpty = task[colMId] === undefined || 
                                 task[colMId] === null || 
                                 task[colMId].toString().trim() === '';
              
              return hasColL && isColMEmpty;
            })
            .map(task => {
              // Include columns L and M in the filtered data
              const filteredTask = { 
                _id: task._id, 
                _rowIndex: task._rowIndex,
                [colLId]: task[colLId],
                [colMId]: task[colMId]
              }
              
              // Add the visible columns 
              data.headers.forEach(header => {
                filteredTask[header.id] = task[header.id]
              })
              
              return filteredTask
            })
          
          // Determine visible headers (excluding first few administrative columns)
          const visibleHeaders = data.headers.filter((header, index) => 
            index >= 1 && index <= 10 // Columns B to K
          )
          
          setTableHeaders(visibleHeaders)
          setTasks(filteredTasks)
          
          // Initialize editedTasks with the original task data
          const initialEditedTasks = {}
          filteredTasks.forEach(task => {
            initialEditedTasks[task._id] = { ...task }
          })
          setEditedTasks(initialEditedTasks)
        } else {
          console.error("Error fetching tasks:", data?.error || "Unknown error")
          setError(data?.error || "Failed to load tasks")
        }
      } catch (error) {
        console.error("Error fetching tasks:", error)
        setError("Network error or failed to fetch tasks")
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchTasksFromGoogleSheets()
  }, [username, isAdmin])

  // Logout handler
  const handleLogout = () => {
    sessionStorage.removeItem('username')
    navigate('/login')
  }

  // Filter tasks based on search query and filters
  const filteredTasks = tasks.filter((task) => {
    // Find status and frequency columns dynamically
    const statusHeader = tableHeaders.find(h => 
      h.label.toLowerCase().includes('status')
    )?.id

    const frequencyHeader = tableHeaders.find(h => 
      h.label.toLowerCase().includes('frequency')
    )?.id

    // Filter by status
    if (filterStatus !== "all" && 
        statusHeader && 
        task[statusHeader]?.toString().toLowerCase() !== filterStatus) {
      return false
    }

    // Filter by frequency
    if (filterFrequency !== "all" && 
        frequencyHeader && 
        task[frequencyHeader]?.toString().toLowerCase() !== filterFrequency) {
      return false
    }

    // Filter by search query
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase()
      return Object.values(task).some(value => 
        value && value.toString().toLowerCase().includes(searchLower)
      )
    }

    return true
  })

  // Toggle task selection
  const toggleTaskSelection = (taskId) => {
    setSelectedTasks((prev) => {
      if (prev.includes(taskId)) {
        return prev.filter((id) => id !== taskId)
      } else {
        return [...prev, taskId]
      }
    })
  }

  // Toggle all tasks selection
  const toggleAllTasks = () => {
    if (selectedTasks.length === filteredTasks.length) {
      setSelectedTasks([])
    } else {
      setSelectedTasks(filteredTasks.map((task) => task._id))
    }
  }

  // Handle task field editing
  const handleTaskEdit = (taskId, fieldId, value) => {
    setEditedTasks(prev => ({
      ...prev,
      [taskId]: {
        ...prev[taskId],
        [fieldId]: value
      }
    }))
  }

  // Show toast message
  const showToast = (message, type) => {
    setToast({ show: true, message, type })
    setTimeout(() => {
      setToast({ show: false, message: "", type: "" })
    }, 3000)
  }

  // Handle file selection
  const handleFileSelect = (taskId, event) => {
    const file = event.target.files[0]
    if (file) {
      setSelectedFiles(prev => ({
        ...prev,
        [taskId]: file
      }))
      showToast(`File selected for task: ${file.name}`, "success")
      
      // Automatically trigger upload
      uploadFile(taskId, file)
    }
  }

  // Upload file for a specific task
  const uploadFile = async (taskId, file) => {
    if (!file) {
      showToast("No file selected", "error")
      return
    }

    try {
      // Here you would implement the actual file upload logic
      // For example, converting to base64 and sending to server
      
      const reader = new FileReader()
      reader.onload = async (e) => {
        const base64Data = e.target.result.split(',')[1]
        
        // Create form data for file upload
        const formData = new FormData()
        formData.append('action', 'uploadFile')
        formData.append('sheetName', SHEET_NAME) // Add missing sheetName parameter
        formData.append('taskId', taskId)
        formData.append('fileName', file.name)
        formData.append('fileData', base64Data)
        formData.append('rowIndex', tasks.find(t => t._id === taskId)._rowIndex)
        formData.append('columnP', 'P') // Upload to column P
        formData.append('folderUrl', 'https://drive.google.com/drive/u/0/folders/1TBpIcv5bbAsmlje7lpnPFpJRDY5nekTE')
        
        try {
          const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            body: formData
          })
          
          const result = await response.json()
          
          if (result.success) {
            showToast(`File uploaded successfully: ${file.name}`, "success")
            // Update local state if needed
          } else {
            throw new Error(result.error || "Failed to upload file")
          }
        } catch (err) {
          showToast("Failed to upload file", "error")
          console.error("Error uploading file:", err)
        }
      }
      
      reader.readAsDataURL(file)
    } catch (error) {
      showToast("An error occurred during file upload", "error")
      console.error("Error in upload process:", error)
    }
  }

  // Handle form submission with file uploads
  const handleSubmit = async () => {
    if (selectedTasks.length === 0) {
      showToast("Please select at least one task", "error")
      return
    }

    setIsSubmitting(true)

    try {
      // First, upload any pending images
      const uploadPromises = []
      
      // Create a map to store image URLs by task ID
      const imageUrlsByTaskId = {}
      
      // Process each selected task that has a pending image upload
      for (const taskId of selectedTasks) {
        if (selectedFiles[taskId]) {
          const file = selectedFiles[taskId]
          const uploadPromise = new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = async (e) => {
              const base64Data = e.target.result.split(',')[1]
              
              // Create form data for file upload
              const formData = new FormData()
              formData.append('action', 'uploadFile')
              formData.append('sheetName', SHEET_NAME) // Add missing sheetName parameter
              formData.append('taskId', taskId)
              formData.append('fileName', file.name)
              formData.append('fileData', base64Data)
              formData.append('rowIndex', tasks.find(t => t._id === taskId)._rowIndex)
              formData.append('folderUrl', 'https://drive.google.com/drive/u/0/folders/1TBpIcv5bbAsmlje7lpnPFpJRDY5nekTE')
              
              try {
                const response = await fetch(SCRIPT_URL, {
                  method: 'POST',
                  body: formData
                })
                
                const result = await response.json()
                
                if (result.success) {
                  // Store the image URL for this task
                  imageUrlsByTaskId[taskId] = result.fileUrl
                  resolve()
                } else {
                  reject(new Error(result.error || "Failed to upload file"))
                }
              } catch (err) {
                reject(err)
              }
            }
            
            reader.onerror = reject
            reader.readAsDataURL(file)
          })
          
          uploadPromises.push(uploadPromise)
        }
      }
      
      // Wait for all image uploads to complete
      await Promise.all(uploadPromises).catch(error => {
        console.error("Error uploading images:", error)
        showToast("Some images failed to upload", "error")
        // Continue with the form submission even if some images fail
      })

      // Prepare tasks to be updated
   // Prepare tasks to be updated
const tasksToUpdate = selectedTasks.map(taskId => {
    const task = editedTasks[taskId]
    const updates = {}
    
    // Add all editable fields to updates with proper date formatting
    tableHeaders.forEach(header => {
      // Check if this is a date field
      if (header.label.toLowerCase().includes('date')) {
        // Ensure date is in yyyy-mm-dd format (no time component)
        const parsedDate = parseFormattedDate(task[header.id])
        updates[header.id] = parsedDate
      } else {
        updates[header.id] = task[header.id]
      }
    })
    
    // Add today's date to column M
    const today = new Date();
    const formattedToday = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    updates['colM'] = formattedToday;
    
    // Add the image URL to column P if we have one for this task
    if (imageUrlsByTaskId[taskId]) {
      updates['colP'] = imageUrlsByTaskId[taskId]
    }
    
    return {
      rowIndex: task._rowIndex,
      updates: updates
    }
  })

      // Create form data for batch update
      const formData = new FormData()
      formData.append('action', 'updateTasks')
      formData.append('sheetName', SHEET_NAME)
      formData.append('tasks', JSON.stringify(tasksToUpdate))

      // Make API call to update tasks
      const response = await fetch(SCRIPT_URL, {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (result.success) {
        // Update local state
        setTasks(prevTasks => 
          prevTasks.map(task => 
            selectedTasks.includes(task._id) 
              ? { ...editedTasks[task._id] } 
              : task
          )
        )

        // Clear selected files for processed tasks
        const newSelectedFiles = { ...selectedFiles }
        selectedTasks.forEach(taskId => {
          delete newSelectedFiles[taskId]
        })
        setSelectedFiles(newSelectedFiles)

        // Reset selections
        setSelectedTasks([])

        showToast(`Successfully updated ${selectedTasks.length} tasks`, "success")
      } else {
        throw new Error(result.error || "Failed to update tasks")
      }
    } catch (error) {
      console.error("Error updating tasks:", error)
      showToast("An error occurred while updating tasks", "error")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Render loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    )
  }

  // Render error state
  if (error) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <p className="text-red-500 text-xl mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-purple-600 text-white rounded-md"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-purple-700">
          {isAdmin ? "All Tasks (Admin View)" : `My Tasks (${username})`}
        </h1>
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
        >
          Logout
        </button>
      </div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h1 className="text-2xl font-bold text-purple-700">All Tasks</h1>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || selectedTasks.length === 0}
          className={`px-5 py-2 mt-4 md:mt-0 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium rounded-md shadow-md transition duration-200 ease-in-out ${
            isSubmitting || selectedTasks.length === 0 ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          {isSubmitting ? "Processing..." : `Submit Selected Tasks (${selectedTasks.length})`}
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="flex flex-col md:flex-row gap-4 p-4 border-b">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="overdue">Overdue</option>
          </select>
          <select
            value={filterFrequency}
            onChange={(e) => setFilterFrequency(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">All Frequencies</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedTasks.length === filteredTasks.length && filteredTasks.length > 0}
                    onChange={toggleAllTasks}
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                  />
                </th>
                {tableHeaders.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {header.label}
                  </th>
                ))}
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Upload Image
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTasks.length > 0 ? (
                filteredTasks.map((task) => (
                  <tr key={task._id} className="hover:bg-gray-50">
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selectedTasks.includes(task._id)}
                        onChange={() => toggleTaskSelection(task._id)}
                        className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                      />
                    </td>
                    {tableHeaders.map((header) => (
                      <td key={header.id} className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {selectedTasks.includes(task._id) ? (
                          <input
                            type="text"
                            value={editedTasks[task._id][header.id] || ''}
                            onChange={(e) => handleTaskEdit(task._id, header.id, e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        ) : (
                          // Check if the field might contain a date and format it accordingly
                          header.label.toLowerCase().includes('date') 
                            ? formatDate(task[header.id]) 
                            : task[header.id] || '—'
                        )}
                      </td>
                    ))}
                    <td className="px-4 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center space-x-2">
                        <input
                          type="file"
                          id={`file-${task._id}`}
                          onChange={(e) => handleFileSelect(task._id, e)}
                          className="hidden"
                          accept="image/*"
                        />
                        <label
                          htmlFor={`file-${task._id}`}
                          className="px-3 py-2 bg-blue-500 text-white rounded cursor-pointer hover:bg-blue-600 transition flex items-center justify-center"
                        >
                          Upload Image
                        </label>
                        {selectedFiles[task._id] && (
                          <span className="text-xs text-gray-500">
                            {selectedFiles[task._id].name.length > 15 
                              ? selectedFiles[task._id].name.substring(0, 15) + '...' 
                              : selectedFiles[task._id].name}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={tableHeaders.length + 2} className="px-6 py-4 text-center text-gray-500">
                    {searchQuery ? "No tasks found matching the search" : "No tasks found"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Toast Notification */}
      {toast.show && (
        <div className={`fixed bottom-4 right-4 px-4 py-3 rounded-lg shadow-lg transition-all duration-300 ${
          toast.type === "success"
            ? "bg-green-100 text-green-800 border-l-4 border-green-500"
            : "bg-red-100 text-red-800 border-l-4 border-red-500"
        }`}>
          {toast.message}
        </div>
      )}
    </div>
  )
}

export default AllTasks