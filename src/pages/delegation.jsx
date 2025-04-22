"use client"

import { useState, useEffect } from "react"
import { CheckCircle2, Upload, X, Search, History, Clock } from "lucide-react"
import AdminLayout from "../components/layout/AdminLayout"

// Google Apps Script URL
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzCl0b_3-jQtZLNGGFngdMaMz7s6X0WYnCZ7Ct58ejTR_sp_SEdR65NptfS7w7S1Jh4/exec"
// Google Drive folder ID
const DRIVE_FOLDER_ID = "1TzjAIpRAoz017MfzZ0gZaN-v5jyKtg7E"

function SalesDataPage() {
  const [salesData, setSalesData] = useState([])
  const [historyData, setHistoryData] = useState([]) // New state for history data
  const [showHistory, setShowHistory] = useState(false) // Toggle between regular and history view
  const [selectedItems, setSelectedItems] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const [sheetHeaders, setSheetHeaders] = useState([])
  const [historyHeaders, setHistoryHeaders] = useState([]) // Headers for history view
  const [additionalData, setAdditionalData] = useState({})
  const [statusData, setStatusData] = useState({}) // New state for status dropdown
  const [nextTargetDate, setNextTargetDate] = useState({}) // New state for next target date
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [debugInfo, setDebugInfo] = useState([])
  const [taskIDCounts, setTaskIDCounts] = useState({}) // State to track task ID counts

  // Format date as DD/MM/YYYY
  const formatDateToDDMMYYYY = (date) => {
    const day = date.getDate().toString().padStart(2, '0')
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const year = date.getFullYear()
    return `${day}/${month}/${year}`
  }

  // Check if a value is empty or null
  const isEmpty = (value) => {
    return value === null || 
           value === undefined || 
           (typeof value === 'string' && value.trim() === '');
  }

  // Safe access to cell value
  const getCellValue = (row, index) => {
    if (!row || !row.c || index >= row.c.length) return null;
    const cell = row.c[index];
    return cell && 'v' in cell ? cell.v : null;
  }

  // Parse Google Sheets Date format into a proper date string
  const parseGoogleSheetsDate = (dateStr) => {
    if (!dateStr) return '';
    
    if (typeof dateStr === 'string' && dateStr.startsWith('Date(')) {
      // Handle Google Sheets Date(year,month,day) format
      const match = /Date\((\d+),(\d+),(\d+)\)/.exec(dateStr);
      if (match) {
        const year = parseInt(match[1], 10);
        const month = parseInt(match[2], 10); // 0-indexed in Google's format
        const day = parseInt(match[3], 10);
        
        // Format as DD/MM/YYYY
        return `${day.toString().padStart(2, '0')}/${(month + 1).toString().padStart(2, '0')}/${year}`;
      }
    }
    
    // If it's already in DD/MM/YYYY format, return as is
    if (typeof dateStr === 'string' && dateStr.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
      return dateStr;
    }
    
    // If we get here, try to parse as a date and format
    try {
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        return formatDateToDDMMYYYY(date);
      }
    } catch (e) {
      console.error("Error parsing date:", e);
    }
    
    // Return original if parsing fails
    return dateStr;
  }

  // Parse date from DD/MM/YYYY format
  const parseDateFromDDMMYYYY = (dateStr) => {
    if (!dateStr || typeof dateStr !== 'string') return null
    const parts = dateStr.split('/')
    if (parts.length !== 3) return null
    return new Date(parts[2], parts[1] - 1, parts[0])
  }

  // Custom date sorting function - MODIFIED to use Column L instead of H
  const sortDateWise = (a, b) => {
    // Changed to use column L (index 11) instead of column H (index 7)
    const dateStrA = a['col11'] || ''
    const dateStrB = b['col11'] || ''

    const dateA = parseDateFromDDMMYYYY(dateStrA)
    const dateB = parseDateFromDDMMYYYY(dateStrB)

    // Handle cases where dates might be null or invalid
    if (!dateA) return 1
    if (!dateB) return -1

    // Compare dates directly
    return dateA.getTime() - dateB.getTime()
  }

  // Helper function to count task ID occurrences in history data
  const countTaskIDOccurrences = (data) => {
    const counts = {};
    
    data.forEach(item => {
      const taskID = item['col11']; // Column L (Task ID) in history data
      if (taskID) {
        counts[taskID] = (counts[taskID] || 0) + 1;
      }
    });
    
    return counts;
  }

  // Helper function to get text color based on task ID count
  const getTextColorByTaskCount = (taskID) => {
    if (!taskID || !taskIDCounts[taskID]) return '#374151'; // Default color
    
    const count = taskIDCounts[taskID];
    
    if (count === 1) return '#10b981'; // Green
    if (count === 2) return '#eab308'; // Yellow
    return '#ef4444'; // Red (>2)
  }

  // Update filteredSalesData calculation
  const filteredSalesData = searchTerm
    ? salesData
        .filter(sale => 
          Object.values(sale).some(value => 
            value && value.toString().toLowerCase().includes(searchTerm.toLowerCase())
          )
        )
        .sort(sortDateWise)
    : salesData.sort(sortDateWise)

  // Filter for history data
  const filteredHistoryData = searchTerm
    ? historyData
        .filter(item => 
          Object.values(item).some(value => 
            value && value.toString().toLowerCase().includes(searchTerm.toLowerCase())
          )  
        )
    : historyData

  const fetchSheetData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`https://docs.google.com/spreadsheets/d/1a1jPYstX2Wy778hD9OpM_PZkYE3KGktL0JxSL8dJiTY/gviz/tq?tqx=out:json&sheet=DELEGATION`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.status}`)
      }
      
      const text = await response.text()
      const jsonStart = text.indexOf('{')
      const jsonEnd = text.lastIndexOf('}')
      const jsonString = text.substring(jsonStart, jsonEnd + 1)
      const data = JSON.parse(jsonString)
      
      // Get current user details
      const username = sessionStorage.getItem('username')
      const userRole = sessionStorage.getItem('role')
      
      // Extract headers
      const headers = data.table.cols.map((col, index) => ({
        id: `col${index}`,
        label: col.label || `Column ${index + 1}`,
        type: col.type
      })).filter(header => header.label !== '')

      const modifiedHeaders = [...headers];
      if (modifiedHeaders[7]) {
        modifiedHeaders[7].label = "Task End Date";
      }
      
      setSheetHeaders(headers)
      setHistoryHeaders(headers) // Use the same headers for history initially
      
      // Now, let's also fetch data from DELEGATION DONE sheet first to get task ID counts
      try {
        const historyResponse = await fetch(`https://docs.google.com/spreadsheets/d/1a1jPYstX2Wy778hD9OpM_PZkYE3KGktL0JxSL8dJiTY/gviz/tq?tqx=out:json&sheet=DELEGATION%20DONE`)
        
        if (historyResponse.ok) {
          const historyText = await historyResponse.text()
          const historyJsonStart = historyText.indexOf('{')
          const historyJsonEnd = historyText.lastIndexOf('}')
          const historyJsonString = historyText.substring(historyJsonStart, historyJsonEnd + 1)
          const historyData = JSON.parse(historyJsonString)
          
          // Extract headers for history
          const historyHeaders = historyData.table.cols.map((col, index) => ({
            id: `col${index}`,
            label: col.label || `Column ${index + 1}`,
            type: col.type
          })).filter(header => header.label !== '')
          
          setHistoryHeaders(historyHeaders)
          
          // Process history data
          const processedHistoryData = historyData.table.rows
            .map((row, rowIndex) => {
              // Skip header row
              if (rowIndex === 0) return null
              
              // For non-admin users, filter by username if needed
              // Note: We'll have to determine which column contains the username in DELEGATION DONE
              
              const rowData = {
                _id: Math.random().toString(36).substring(2, 15),  
                _rowIndex: rowIndex + 2
              }
              
              // Populate row data dynamically with proper date formatting
              historyHeaders.forEach((header, index) => {
                const cellValue = getCellValue(row, index)
                
                // If this is a date column, format properly
                if (header.type === 'date' || (cellValue && String(cellValue).startsWith('Date('))) {
                  rowData[header.id] = cellValue ? parseGoogleSheetsDate(String(cellValue)) : ''
                } else if (header.type === 'number' && cellValue !== null && cellValue !== '') {
                  // Handle numeric values
                  rowData[header.id] = cellValue
                } else {
                  // Handle all other values
                  rowData[header.id] = cellValue !== null ? cellValue : ''
                }
              })
              
              return rowData
            })
            .filter(row => row !== null)
          
          // Count task ID occurrences and set to state
          const taskIDCounts = countTaskIDOccurrences(processedHistoryData);
          setTaskIDCounts(taskIDCounts);
          
          setHistoryData(processedHistoryData)
        }
      } catch (historyError) {
        console.error("Error fetching history data:", historyError)
      }
      
      // Process regular sales data (Column L is empty or Column M is empty)
      const processedData = data.table.rows
        .map((row, rowIndex) => {
          // Skip header row
          if (rowIndex === 0) return null
          
          // For non-admin users, filter by username in Column E (index 4)
          const assignedTo = getCellValue(row, 4) || 'Unassigned'
          const isUserMatch = userRole === 'admin' || 
                              assignedTo.toLowerCase() === username.toLowerCase()
          
          // If not a match and not admin, skip this row
          if (!isUserMatch) return null
          
          // Column L and M value checks
          const columnLValue = getCellValue(row, 11)
          const columnMValue = getCellValue(row, 12)
          
          // Convert column L value to string and format properly
          let rowDateStr = columnLValue ? String(columnLValue).trim() : ''
          let formattedRowDate = parseGoogleSheetsDate(rowDateStr)
          
          // Check if column L is not null/empty and column M is null/empty
          const hasColumnL = !isEmpty(columnLValue)
          const isColumnMEmpty = isEmpty(columnMValue)
          
          // MODIFIED: Filtering condition to only require Column M to be empty (pending tasks)
          // REMOVED: Date filtering conditions
          if (!hasColumnL || !isColumnMEmpty) {
            return null
          }
          
          const rowData = {
            _id: Math.random().toString(36).substring(2, 15),  
            _rowIndex: rowIndex + 2
          }
          
          // Populate row data dynamically with proper date formatting
          headers.forEach((header, index) => {
            const cellValue = getCellValue(row, index)
            
            // If this is a date column, format properly
            if (header.type === 'date' || (cellValue && String(cellValue).startsWith('Date('))) {
              rowData[header.id] = cellValue ? parseGoogleSheetsDate(String(cellValue)) : ''
            } else if (header.type === 'number' && cellValue !== null && cellValue !== '') {
              // Handle numeric values
              rowData[header.id] = cellValue
            } else {
              // Handle all other values
              rowData[header.id] = cellValue !== null ? cellValue : ''
            }
          })
          
          return rowData
        })
        .filter(row => row !== null)
      
      setSalesData(processedData)
      setLoading(false)
    } catch (error) {
      console.error("Error fetching sheet data:", error)
      setError("Failed to load sales data")  
      setLoading(false)
    }
  }

  // Load data on component mount
  useEffect(() => {
    fetchSheetData()
  }, [])

  const handleSelectItem = (id) => {
    setSelectedItems(prev => {
      const isSelected = prev.includes(id)
      if (isSelected) {
        const newAdditionalData = {...additionalData}
        delete newAdditionalData[id]
        
        const newStatusData = {...statusData}
        delete newStatusData[id]
        
        const newNextTargetDate = {...nextTargetDate}
        delete newNextTargetDate[id]
        
        setAdditionalData(newAdditionalData)
        setStatusData(newStatusData)
        setNextTargetDate(newNextTargetDate)
        
        return prev.filter(itemId => itemId !== id)
      } else {
        // Set default status to "Done" when selecting a new item
        setStatusData(prev => ({...prev, [id]: "Done"}))
        return [...prev, id]
      }
    })
  }

  // Handle image upload
  const handleImageUpload = async (id, e) => {
    const file = e.target.files[0]
    if (!file) return
    
    // Store file in state temporarily
    setSalesData(prev => prev.map(item =>
      item._id === id 
        ? {...item, image: file}
        : item  
    ))
  }

  // Handle next target date change
  const handleNextTargetDateChange = (id, value) => {
    setNextTargetDate(prev => ({...prev, [id]: value}))
  }

  // Handle status change
  const handleStatusChange = (id, value) => {
    setStatusData(prev => ({...prev, [id]: value}))
    // If status is changed to "Done", clear the next target date
    if (value === "Done") {
      setNextTargetDate(prev => {
        const newDates = {...prev}
        delete newDates[id]
        return newDates
      })
    }
  }

  // Convert file to base64
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result)
      reader.onerror = error => reject(error)
    })
  }

  // Toggle between main view and history view
  const toggleHistoryView = () => {
    setShowHistory(prev => !prev)
    setSelectedItems([]) // Clear selections when switching views
    setSearchTerm("") // Clear search when switching views
  }

  // Handle submit selected items  
  const handleSubmit = async () => {
    if (selectedItems.length === 0) {
      alert("Please select at least one item to submit") 
      return
    }

    // Check if any selected item requires an image but doesn't have one
    const missingRequiredImages = selectedItems.filter(id => {
      const item = salesData.find(sale => sale._id === id)
      // Check if column K (index 10) has "YES" value and no image is uploaded
      const requiresAttachment = item['col10'] && item['col10'].toString().toUpperCase() === "YES"
      return requiresAttachment && !item.image
    })

    if (missingRequiredImages.length > 0) {
      alert(`Please upload images for all required attachments. ${missingRequiredImages.length} item(s) are missing required images.`)
      return
    }

    // Check if status is selected for all items
    const missingStatus = selectedItems.filter(id => !statusData[id])
    if (missingStatus.length > 0) {
      alert(`Please select a status for all selected items. ${missingStatus.length} item(s) are missing status.`)
      return
    }

    // Check if next target date is provided for items with "Extend" status
    const missingNextDate = selectedItems.filter(id => 
      statusData[id] === "Extend" && !nextTargetDate[id]
    )
    if (missingNextDate.length > 0) {
      alert(`Please select a next target date for all items with "Extend" status. ${missingNextDate.length} item(s) are missing target date.`)
      return
    }

    setIsSubmitting(true)
    
    try {
      // Process each selected item by inserting a new row in DELEGATION DONE
      for (const id of selectedItems) {
        const item = salesData.find(sale => sale._id === id);
        let imageData = null;
        
        // If there's an image and it's a file (not a URL), convert to base64
        if (item.image instanceof File) {
          imageData = await fileToBase64(item.image);
        }
        
        // Get today's date in DD/MM/YYYY format
        const todayDate = formatDateToDDMMYYYY(new Date());
        
        // Since we can't directly modify columns L, M, N, O, P (using existing methods)
        // we'll insert a new row with all the correct data instead
        const newRowData = [
          '', // A - blank
          '', // B - blank
          '', // C - blank
          '', // D - blank
          '', // E - blank
          '', // F - blank
          '', // G - blank
          '', // H - blank
          '', // I - blank
          '', // J - blank
          todayDate, // K - Today's date in DD/MM/YYYY format
          item['col1'] || id, // L - Task ID
          statusData[id] || "Done", // M - Status
          nextTargetDate[id] || "", // N - Next Target Date
          additionalData[id] || "", // O - Remarks
          '' // P - Image URL (will be updated by the image upload)
        ];
        
        // Insert the new row into DELEGATION DONE
        const insertFormData = new FormData();
        insertFormData.append('sheetName', 'DELEGATION DONE');
        insertFormData.append('action', 'insert');
        insertFormData.append('rowData', JSON.stringify(newRowData));
        
        const insertResponse = await fetch(APPS_SCRIPT_URL, {
          method: 'POST',
          body: insertFormData
        });
        
        const insertResult = await insertResponse.json();
        
        // If we have an image, upload it to the newly inserted row
        if (imageData && insertResult.success) {
          const imageFormData = new FormData();
          imageFormData.append('sheetName', 'DELEGATION DONE');
          imageFormData.append('action', 'uploadImage');
          imageFormData.append('imageData', imageData);
          imageFormData.append('fileName', `Task_${item['col1'] || id}_${new Date().getTime()}.jpg`);
          imageFormData.append('folderId', DRIVE_FOLDER_ID);
          imageFormData.append('rowIndex', insertResult.rowIndex || ""); // Use the row index of the newly inserted row
          
          await fetch(APPS_SCRIPT_URL, {
            method: 'POST',
            body: imageFormData
          });
        }
        
        // Also mark the original task as completed
        // For the original DELEGATION sheet task
        const updateOriginalFormData = new FormData();
        // updateOriginalFormData.append('sheetName', 'DELEGATION');
        updateOriginalFormData.append('action', 'updateSalesData');
        updateOriginalFormData.append('rowData', JSON.stringify([{
          rowIndex: item._rowIndex,
          todayDate: formatDateToDDMMYYYY(new Date()), // Update column M with completion date
          additionalInfo: `Completed: ${statusData[id]}`, // Update column O with status
        }]));
        
        await fetch(APPS_SCRIPT_URL, {
          method: 'POST',
          body: updateOriginalFormData
        });
      }
      
      // Update local state
      setSalesData(prev => prev.filter(item => !selectedItems.includes(item._id)));
      
      setSuccessMessage(`Successfully processed ${selectedItems.length} sales records! Data submitted to DELEGATION DONE sheet.`);
      setSelectedItems([]);
      setAdditionalData({});
      setStatusData({});
      setNextTargetDate({});
      
      // Refresh data to see updated records
      setTimeout(() => {
        fetchSheetData();
      }, 2000);
    } catch (error) {
      console.error("Submission error:", error);
      alert("Failed to submit sales records: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  }
  
  return (
    <AdminLayout>
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <h1 className="text-2xl font-bold tracking-tight text-purple-500">
          {showHistory ? "Sales History" : "Sales Data"}
        </h1>

        <div className="flex space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder={showHistory ? "Search history..." : "Search transactions..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-purple-200 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          
          <button
            onClick={toggleHistoryView}
            className="rounded-md bg-gradient-to-r from-blue-500 to-indigo-600 py-2 px-4 text-white hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            {showHistory ? (
              <div className="flex items-center">
                <Upload className="h-4 w-4 mr-2" />
                View Tasks
              </div>
            ) : (
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-2" />
                View History
              </div>
            )}
          </button>
          
          {!showHistory && (
            <button
              onClick={handleSubmit}
              disabled={selectedItems.length === 0 || isSubmitting}
              className="rounded-md bg-gradient-to-r from-purple-600 to-pink-600 py-2 px-4 text-white hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Processing..." : `Submit Selected (${selectedItems.length})`}
            </button>
          )}
        </div>
      </div>
      
      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md flex items-center justify-between">
          <div className="flex items-center">
            <CheckCircle2 className="h-5 w-5 mr-2 text-green-500" />  
            {successMessage}
          </div>
          <button onClick={() => setSuccessMessage("")} className="text-green-500 hover:text-green-700">
            <X className="h-5 w-5" />
          </button>
        </div>
      )}
      
      <div className="rounded-lg border border-purple-200 shadow-md bg-white overflow-hidden">
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-100 p-4">
          <h2 className="text-purple-700 font-medium">
            {showHistory ? "Completed Sales Records" : "Sales Records"}
          </h2>
          <p className="text-purple-600 text-sm">
            {showHistory 
              ? "Showing historical completed records" 
              : "Showing today and tomorrow's records with pending submissions"}
          </p>
          {!showHistory && (
            <div className="mt-2 flex gap-4 text-xs">
              <div className="flex items-center">
                <span className="inline-block w-3 h-3 rounded-full bg-green-500 mr-2"></span>
                <span className="text-gray-700">Task extend once</span>
              </div>
              <div className="flex items-center">
                <span className="inline-block w-3 h-3 rounded-full bg-yellow-500 mr-2"></span>
                <span className="text-gray-700">Task extend twice</span>
              </div>
              <div className="flex items-center">
                <span className="inline-block w-3 h-3 rounded-full bg-red-500 mr-2"></span>
                <span className="text-gray-700">Task extend more than twice</span>
              </div>
            </div>
          )}
        </div>
          
        {loading ? (
          <div className="text-center py-10">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500 mb-4"></div>
            <p className="text-purple-600">Loading data...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 p-4 rounded-md text-red-800 text-center">
            {error} <button className="underline ml-2" onClick={() => window.location.reload()}>Try again</button>
          </div>  
        ) : showHistory ? (
          /* HISTORY VIEW - No color coding here */
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {/* Column K - Date */}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-red-50">
                    Date
                  </th>
                  {/* Column L - Task ID */}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-green-50">
                    Task ID
                  </th>
                  {/* Column M - Status */}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-blue-50">
                    Status
                  </th>
                  {/* Column N - Next Target Date */}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-indigo-50">
                    Next Target Date
                  </th>
                  {/* Column O - Remarks */}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-yellow-50">
                    Remarks
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
              {filteredHistoryData.length > 0 ? (
                filteredHistoryData.map((item) => (
                  <tr
                    key={item._id}
                    className={`hover:bg-gray-50`}
                  >
                    {/* Column K - Date */}
                    <td className="px-6 py-4 whitespace-nowrap bg-red-50">
                      <div className="text-sm font-medium text-gray-900">
                        {item['col10'] || '—'}
                      </div>
                    </td>
                    {/* Column L - Task ID */}
                    <td className="px-6 py-4 whitespace-nowrap bg-green-50">
                      <div className="text-sm font-medium text-gray-900">
                        {item['col11'] || '—'}
                      </div>
                    </td>
                    {/* Column M - Status */}
                    <td className="px-6 py-4 whitespace-nowrap bg-blue-50">
                      <div className="text-sm font-medium text-gray-900">
                        {item['col12'] || '—'}
                      </div>
                    </td>
                    {/* Column N - Next Target Date */}
                    <td className="px-6 py-4 whitespace-nowrap bg-indigo-50">
                      <div className="text-sm font-medium text-gray-900">
                        {item['col13'] || '—'}
                        </div>
                    </td>
                    {/* Column O - Remarks */}
                    <td className="px-6 py-4 whitespace-nowrap bg-yellow-50">
                      <div className="text-sm text-gray-900">
                        {item['col14'] || '—'}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500"> 
                    {searchTerm ? "No historical records matching your search" : "No historical records found"}
                  </td>
                </tr>
              )}
              </tbody>
            </table>
          </div>
        ) : (
          /* MAIN DATA VIEW - Apply color coding here based on task occurrences in history */
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      checked={filteredSalesData.length > 0 && selectedItems.length === filteredSalesData.length}
                      onChange={(e) => {
                        if (e.target.checked) {
                          const allIds = filteredSalesData.map(item => item._id);
                          setSelectedItems(allIds);
                          
                          // Set default status for all items
                          const newStatusData = {};
                          allIds.forEach(id => {
                            newStatusData[id] = "Done";
                          });
                          setStatusData(prev => ({...prev, ...newStatusData}));
                          
                          // Clear any next target dates
                          setNextTargetDate({});
                        } else {
                          setSelectedItems([]);
                          setAdditionalData({});
                          setStatusData({});
                        }
                      }}
                    />
                  </th>
                  {/* Render headers for columns B to G */}
                  {sheetHeaders.slice(1, 7).map((header) => (
                    <th 
                      key={header.id} 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {header.label}
                    </th>
                  ))}
                  {/* Column - Task Given Date */}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Task Given Date
                  </th>
                  {/* Column H - Task End Date (shows data from column L instead) */}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {sheetHeaders[7]?.label || "Task End Date"}
                  </th>
                  {/* Render headers for columns I to K */}
                  {sheetHeaders.slice(8, 11).map((header) => (
                    <th 
                      key={header.id} 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {header.label}
                    </th>
                  ))}
                  {/* New Status Column */}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-blue-50">
                    Status
                  </th>
                  {/* Next Target Date Column */}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-indigo-50">
                    Next Target Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-yellow-50">
                    Remarks
                  </th>
                  {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-green-50">
                    Upload Image
                  </th> */}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSalesData.length > 0 ? (
                  filteredSalesData.map((sale) => {
                    // Get text color based on the task ID occurrence in history
                    const taskID = sale['col1']; // Task ID in column B (index 1)
                    const rowTextColor = getTextColorByTaskCount(taskID);
                    
                    return (
                      <tr
                        key={sale._id}
                        className={`${selectedItems.includes(sale._id) ? "bg-purple-50" : ""} hover:bg-gray-50`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                            checked={selectedItems.includes(sale._id)}
                            onChange={() => handleSelectItem(sale._id)}
                          />
                        </td>
                        {/* Render data for columns B to G with color coding */}
                        {sheetHeaders.slice(1, 7).map((header) => (
                          <td key={header.id} className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm" style={{ color: rowTextColor }}>
                              {sale[header.id] || '—'}
                            </div>
                          </td>
                        ))}
                        {/* Column - Task Given Date (data from column 0) */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm" style={{ color: rowTextColor }}>
                            {sale['col0'] || '—'}
                          </div>
                        </td>
                        {/* Column H display - shows data from column L (index 11) */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm" style={{ color: rowTextColor }}>
                            {sale['col11'] || '—'}
                          </div>
                        </td>
                        {/* Render data for columns I to K */}
                        {sheetHeaders.slice(8, 11).map((header) => (
                          <td key={header.id} className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm" style={{ color: rowTextColor }}>
                              {sale[header.id] || '—'}
                            </div>
                          </td>
                        ))}
                        {/* Status dropdown */}
                        <td className="px-6 py-4 whitespace-nowrap bg-blue-50">
                          <select
                            disabled={!selectedItems.includes(sale._id)}
                            value={statusData[sale._id] || "Done"}
                            onChange={(e) => handleStatusChange(sale._id, e.target.value)}
                            className="border border-gray-300 rounded-md px-2 py-1 w-full disabled:bg-gray-100 disabled:cursor-not-allowed"
                          >
                            <option value="Done">Done</option>
                            <option value="Extend">Extend</option>
                          </select>
                        </td>
                        {/* Next Target Date */}
                        <td className="px-6 py-4 whitespace-nowrap bg-indigo-50">
                          <input
                            type="date"
                            disabled={!selectedItems.includes(sale._id) || statusData[sale._id] !== "Extend"}
                            value={nextTargetDate[sale._id] || ""}
                            onChange={(e) => handleNextTargetDateChange(sale._id, e.target.value)}
                            className={`border border-gray-300 rounded-md px-2 py-1 w-full disabled:bg-gray-100 disabled:cursor-not-allowed ${
                              selectedItems.includes(sale._id) && statusData[sale._id] === "Extend" && !nextTargetDate[sale._id] 
                                ? "border-red-500" 
                                : ""
                            }`}
                            required={statusData[sale._id] === "Extend"}
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap bg-yellow-50">
                          <input
                            type="text"
                            disabled={!selectedItems.includes(sale._id)}
                            value={additionalData[sale._id] || ""}
                            onChange={(e) => setAdditionalData(prev => ({...prev, [sale._id]: e.target.value}))}
                            className="border border-gray-300 rounded-md px-2 py-1 w-full disabled:bg-gray-100 disabled:cursor-not-allowed"
                            placeholder="Enter comments for Column O"
                          />
                        </td>
                        {/* <td className="px-6 py-4 whitespace-nowrap bg-green-50">
                          {sale.image ? (
                            <div className="flex items-center">
                              <img
                                src={typeof sale.image === 'string' ? sale.image : URL.createObjectURL(sale.image)}
                                alt="Receipt"
                                className="h-10 w-10 object-cover rounded-md mr-2"
                              />
                              <div className="flex flex-col">
                                <span className="text-xs text-gray-500">
                                  {sale.image instanceof File ? sale.image.name : "Uploaded Receipt"}
                                </span>
                                {sale.image instanceof File ? (
                                  <span className="text-xs text-green-600">Ready to upload</span>
                                ) : (
                                  <button
                                    className="text-xs text-purple-600 hover:text-purple-800"
                                    onClick={() => window.open(sale.image, "_blank")}
                                  >
                                    View Full Image
                                  </button>
                                )}
                              </div>
                            </div>
                          ) : (
                            <label className={`flex items-center cursor-pointer ${sale['col10']?.toString().toUpperCase() === "YES" ? "text-red-600 font-medium" : "text-purple-600"} hover:text-purple-800`}>
                              <Upload className="h-4 w-4 mr-1" />
                              <span className="text-xs">
                                {sale['col10']?.toString().toUpperCase() === "YES" ? "Required Upload" : "Upload Receipt Image"}
                                {sale['col10']?.toString().toUpperCase() === "YES" && <span className="text-red-500 ml-1">*</span>}
                              </span>
                              <input
                                type="file" 
                                className="hidden"
                                accept="image/*"
                                onChange={(e) => handleImageUpload(sale._id, e)}
                                disabled={!selectedItems.includes(sale._id)}
                              />
                            </label>
                          )}
                        </td> */}
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={sheetHeaders.length + 4} className="px-6 py-4 text-center text-gray-500"> 
                      {searchTerm ? "No transactions matching your search" : "No pending sales records found for today or tomorrow"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  </AdminLayout>
  )
}

export default SalesDataPage