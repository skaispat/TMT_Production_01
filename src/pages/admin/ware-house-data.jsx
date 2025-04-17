"use client"

import { useState, useEffect } from "react"
import { CheckCircle2, Upload, X, Search } from "lucide-react"
import AdminLayout from "../../components/layout/AdminLayout"

// Google Apps Script URL
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyAAyUM9m_Oe_6XAmWYIgO0ENNXgt9ox8vBWwnB4f87Lf883RGvBi4xOL9kxLyDq1dtqA/exec"
// Google Drive folder ID
const DRIVE_FOLDER_ID = "1TBpIcv5bbAsmlje7lpnPFpJRDY5nekTE"

function AccountDataPage() {
  const [accountData, setAccountData] = useState([])
  const [selectedItems, setSelectedItems] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const [sheetHeaders, setSheetHeaders] = useState([])
  const [additionalData, setAdditionalData] = useState({})
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [debugInfo, setDebugInfo] = useState([])

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

  // Fetch sheet data and headers
// Parse date from DD/MM/YYYY format
const parseDateFromDDMMYYYY = (dateStr) => {
  if (!dateStr || typeof dateStr !== 'string') return null
  const parts = dateStr.split('/')
  if (parts.length !== 3) return null
  return new Date(parts[2], parts[1] - 1, parts[0])
}

const fetchSheetData = async () => {
  try {
    setLoading(true);
    const response = await fetch(`https://docs.google.com/spreadsheets/d/1jOBkMxcHrusTlAV9l21JN-B-5QWq1dDyj3-0kxbK6ik/gviz/tq?tqx=out:json&sheet=WAREHOUSE`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch data: ${response.status}`);
    }
    
    const text = await response.text();
    const jsonStart = text.indexOf('{');
    const jsonEnd = text.lastIndexOf('}');
    const jsonString = text.substring(jsonStart, jsonEnd + 1);
    const data = JSON.parse(jsonString);
    
    const username = sessionStorage.getItem('username')
    const userRole = sessionStorage.getItem('role')

    // Extract headers
    const headers = data.table.cols.map((col, index) => ({
      id: `col${index}`,
      label: col.label || `Column ${index + 1}`,
      type: col.type
    })).filter(header => header.label !== '');
    
    setSheetHeaders(headers);
    
    // Get today and tomorrow's dates
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(today.getDate() + 1)
    
    const todayStr = formatDateToDDMMYYYY(today)
    const tomorrowStr = formatDateToDDMMYYYY(tomorrow)
    
    console.log("Filtering dates:", { todayStr, tomorrowStr })
    
    // Debugging array to track row filtering
    const debugRows = [];
    
    const processedData = data.table.rows
      .map((row, rowIndex) => {

        if (rowIndex === 0) return null
        
        // For non-admin users, filter by username in Column E (index 4)
        const assignedTo = getCellValue(row, 4) || 'Unassigned'
        const isUserMatch = userRole === 'admin' || 
                            assignedTo.toLowerCase() === username.toLowerCase()
        
        // If not a match and not admin, skip this row
        if (!isUserMatch) return null
        // Safely get values from column L and M
        const columnLValue = getCellValue(row, 11);
        const columnMValue = getCellValue(row, 12);
        
        // Convert column L value to string and format properly
        let rowDateStr = columnLValue ? String(columnLValue).trim() : '';
        let formattedRowDate = parseGoogleSheetsDate(rowDateStr);
        
        // Check if column L is not null/empty and column M is null/empty
        const hasColumnL = !isEmpty(columnLValue);
        const isColumnMEmpty = isEmpty(columnMValue);
        
        // Debug info
        debugRows.push({
          rowIndex,
          hasColumnL,
          isColumnMEmpty,
          formattedRowDate,
          todayStr,
          tomorrowStr,
          matches: formattedRowDate === todayStr || formattedRowDate === tomorrowStr
        });
        
        // Filter rows where:
        // 1. Column L is not null and column M is null
        // 2. Column L date matches today or tomorrow OR is a past date
        if (!hasColumnL || !isColumnMEmpty || 
            (formattedRowDate !== todayStr && 
             formattedRowDate !== tomorrowStr && 
             parseDateFromDDMMYYYY(formattedRowDate) > today)) {
          return null;
        }
        
        const rowData = {
          _id: Math.random().toString(36).substring(2, 15),  
          _rowIndex: rowIndex + 2 // +2 for header row and 1-indexing
        };
        
        // Populate row data dynamically with proper date formatting
        headers.forEach((header, index) => {
          const cellValue = getCellValue(row, index);
          
          // If this is a date column, format properly
          if (header.type === 'date' || (cellValue && String(cellValue).startsWith('Date('))) {
            rowData[header.id] = cellValue ? parseGoogleSheetsDate(String(cellValue)) : '';
          } else if (header.type === 'number' && cellValue !== null && cellValue !== '') {
            // Handle numeric values
            rowData[header.id] = cellValue;
          } else {
            // Handle all other values
            rowData[header.id] = cellValue !== null ? cellValue : '';
          }
        });
        
        return rowData;
      })
      .filter(row => row !== null);
    
    // Set debug information for display
    setDebugInfo(debugRows);
    
    setAccountData(processedData);
    setLoading(false);
  } catch (error) {
    console.error("Error fetching sheet data:", error);
    setError("Failed to load account data");  
    setLoading(false);
  }
}

  // Load data on component mount
  useEffect(() => {
    fetchSheetData()
  }, [])

  const filteredAccountData = searchTerm
    ? accountData.filter(account => 
        Object.values(account).some(value => 
          value && value.toString().toLowerCase().includes(searchTerm.toLowerCase())
        )  
      )
    : accountData

  const handleSelectItem = (id) => {
    setSelectedItems(prev => {
      const isSelected = prev.includes(id)
      if (isSelected) {
        const newAdditionalData = {...additionalData}
        delete newAdditionalData[id]
        setAdditionalData(newAdditionalData)
        return prev.filter(itemId => itemId !== id)
      } else {
        return [...prev, id]
      }
    })
  }

  // Handle image upload
  const handleImageUpload = async (id, e) => {
    const file = e.target.files[0]
    if (!file) return
    
    // Store file in state temporarily
    setAccountData(prev => prev.map(item =>
      item._id === id 
        ? {...item, image: file}
        : item  
    ))
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

  // Handle submit selected items  
// Handle submit selected items  
const handleSubmit = async () => {
  if (selectedItems.length === 0) {
    alert("Please select at least one item to submit") 
    return
  }

  // Check if any selected item requires an image but doesn't have one
  const missingRequiredImages = selectedItems.filter(id => {
    const item = accountData.find(account => account._id === id)
    // Check if column K (index 10) has "YES" value and no image is uploaded
    const requiresAttachment = item['col10'] && item['col10'].toUpperCase() === "YES"
    return requiresAttachment && !item.image
  })

  if (missingRequiredImages.length > 0) {
    alert(`Please upload images for all required attachments. ${missingRequiredImages.length} item(s) are missing required images.`)
    return
  }

  setIsSubmitting(true)
  
  try {
    // Get today's date formatted as DD/MM/YYYY for column M
    const today = new Date()
    const todayFormatted = formatDateToDDMMYYYY(today)
    
    const submissionData = await Promise.all(selectedItems.map(async (id) => {
      const item = accountData.find(account => account._id === id)
      let imageData = null
      
      // If there's an image and it's a file (not a URL), convert to base64
      if (item.image instanceof File) {
        imageData = await fileToBase64(item.image)
      }
      
      return {
        taskId: id,
        rowIndex: item._rowIndex,
        additionalInfo: additionalData[id] || "",
        imageData: imageData,
        folderId: DRIVE_FOLDER_ID,
        // Add today's date for column M (submission date)
        todayDate: todayFormatted
      }
    }))
    
    const formData = new FormData()
    formData.append('sheetName', 'WAREHOUSE')
    formData.append('action', 'updateSalesData')
    formData.append('rowData', JSON.stringify(submissionData))
    
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      body: formData
    })

    const result = await response.json()
    
    if (result.success) {
      setAccountData(prev => prev.map(item =>
        selectedItems.includes(item._id)
          ? {...item, status: "completed", image: null}
          : item
      ))
      
      setSuccessMessage(`Successfully processed ${selectedItems.length} account records! Columns M, O and P updated.`)
      setSelectedItems([])
      setAdditionalData({})
      
      // Refresh data to see updated image URLs
      setTimeout(() => {
        fetchSheetData()
      }, 2000)
    } else {
      throw new Error(result.error || "Submission failed")
    }
  } catch (error) {
    console.error("Submission error:", error)
    alert("Failed to submit account records: " + error.message)
  } finally {
    setIsSubmitting(false)
  }
}
  
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <h1 className="text-2xl font-bold tracking-tight text-purple-700">Warehouse Data</h1>

          <div className="flex space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-purple-200 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <button
              onClick={handleSubmit}
              disabled={selectedItems.length === 0 || isSubmitting}
              className="rounded-md bg-gradient-to-r from-purple-600 to-pink-600 py-2 px-4 text-white hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Processing..." : `Submit Selected (${selectedItems.length})`}
            </button>
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
            <h2 className="text-purple-700 font-medium">Warehouse Records</h2>
            <p className="text-purple-600 text-sm">
              Showing today and tomorrow's records with pending submissions
            </p>
          </div>
            
          {loading ? (
            <div className="text-center py-10">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500 mb-4"></div>
              <p className="text-purple-600">Loading account data...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 p-4 rounded-md text-red-800 text-center">
              {error} <button className="underline ml-2" onClick={() => window.location.reload()}>Try again</button>
            </div>  
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                        checked={filteredAccountData.length > 0 && selectedItems.length === filteredAccountData.length}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedItems(filteredAccountData.map(item => item._id))
                          } else {
                            setSelectedItems([])
                            setAdditionalData({})
                          }
                        }}
                      />
                    </th>
                    {/* Render headers for columns B to K */}
                    {sheetHeaders.slice(1, 11).map((header) => (
                      <th 
                        key={header.id} 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        {header.label}
                      </th>
                    ))}
                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-yellow-50">
                      Remarks
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-green-50">
                      Upload Image
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAccountData.length > 0 ? (
                    filteredAccountData.map((account) => (
                      <tr
                        key={account._id}
                        className={`${selectedItems.includes(account._id) ? "bg-purple-50" : ""} hover:bg-gray-50`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                            checked={selectedItems.includes(account._id)}
                            onChange={() => handleSelectItem(account._id)}
                          />
                        </td>
                        {/* Render data for columns B to K */}
                        {sheetHeaders.slice(1, 11).map((header) => (
                          <td key={header.id} className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {account[header.id] || '—'}
                            </div>
                          </td>
                        ))}
                        <td className="px-6 py-4 whitespace-nowrap bg-yellow-50">
                          <input
                            type="text"
                            disabled={!selectedItems.includes(account._id)}
                            value={additionalData[account._id] || ""}
                            onChange={(e) => setAdditionalData(prev => ({...prev, [account._id]: e.target.value}))}
                            className="border border-gray-300 rounded-md px-2 py-1 w-full disabled:bg-gray-100 disabled:cursor-not-allowed"
                            placeholder="Enter comments for Column O"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap bg-green-50">
  {account.image ? (
    <div className="flex items-center">
      <img
        src={typeof account.image === 'string' ? account.image : URL.createObjectURL(account.image)}
        alt="Receipt"
        className="h-10 w-10 object-cover rounded-md mr-2"
      />
      <div className="flex flex-col">
        <span className="text-xs text-gray-500">
          {account.image instanceof File ? account.image.name : "Uploaded Receipt"}
        </span>
        {account.image instanceof File ? (
          <span className="text-xs text-green-600">Ready to upload</span>
        ) : (
          <button
            className="text-xs text-purple-600 hover:text-purple-800"
            onClick={() => window.open(account.image, "_blank")}
          >
            View Full Image
          </button>
        )}
      </div>
    </div>
  ) : (
    <label className={`flex items-center cursor-pointer ${account['col10']?.toUpperCase() === "YES" ? "text-red-600 font-medium" : "text-purple-600"} hover:text-purple-800`}>
      <Upload className="h-4 w-4 mr-1" />
      <span className="text-xs">
        {account['col10']?.toUpperCase() === "YES" ? "Required Upload" : "Upload Receipt Image"}
        {account['col10']?.toUpperCase() === "YES" && <span className="text-red-500 ml-1">*</span>}
      </span>
      <input
        type="file" 
        className="hidden"
        accept="image/*"
        onChange={(e) => handleImageUpload(account._id, e)}
        disabled={!selectedItems.includes(account._id)}
      />
    </label>
  )}
</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={sheetHeaders.length + 3} className="px-6 py-4 text-center text-gray-500"> 
                        {searchTerm ? "No transactions matching your search" : "No pending account records found for today or tomorrow"}
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

export default AccountDataPage