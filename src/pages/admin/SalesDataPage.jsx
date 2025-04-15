"use client"

import { useState, useEffect, useMemo } from "react"
import { CheckCircle2, Upload, X, Search } from "lucide-react"
import AdminLayout from "../../components/layout/AdminLayout"

// Google Apps Script URL
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyAAyUM9m_Oe_6XAmWYIgO0ENNXgt9ox8vBWwnB4f87Lf883RGvBi4xOL9kxLyDq1dtqA/exec"
const DRIVE_FOLDER_ID = "1TBpIcv5bbAsmlje7lpnPFpJRDY5nekTE"

function SalesDataPage() {
  const [salesData, setSalesData] = useState([])
  const [selectedItems, setSelectedItems] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const [sheetHeaders, setSheetHeaders] = useState([])
  const [additionalData, setAdditionalData] = useState({})
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [debugInfo, setDebugInfo] = useState([])

  // Fetch sheet data and headers
  const fetchSheetData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`https://docs.google.com/spreadsheets/d/1jOBkMxcHrusTlAV9l21JN-B-5QWq1dDyj3-0kxbK6ik/gviz/tq?tqx=out:json&sheet=SALES`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.status}`)
      }
      
      const text = await response.text()
      const jsonStart = text.indexOf('{')
      const jsonEnd = text.lastIndexOf('}')
      const jsonString = text.substring(jsonStart, jsonEnd + 1)
      const data = JSON.parse(jsonString)
      
      // Extract headers
      const headers = data.table.cols.map((col, index) => ({
        id: `col${index}`,
        label: col.label || `Column ${index + 1}`,
        type: col.type
      })).filter(header => header.label !== '');
      
      setSheetHeaders(headers)
      
      // Get today and tomorrow's dates
      const today = new Date()
      const tomorrow = new Date(today)
      tomorrow.setDate(today.getDate() + 1)
      
      // Format dates as DD/MM/YYYY
      const formatDate = (date) => {
        const day = date.getDate().toString().padStart(2, '0')
        const month = (date.getMonth() + 1).toString().padStart(2, '0')
        const year = date.getFullYear()
        return `${day}/${month}/${year}`
      }
      
      const todayStr = formatDate(today)
      const tomorrowStr = formatDate(tomorrow)
      
      console.log("Filtering dates:", { todayStr, tomorrowStr })
      
      // Debugging array to track row filtering
      const debugRows = []
      
      const processedData = data.table.rows
        .map((row, rowIndex) => {
          // Ensure the row has enough cells and column L exists
          if (!row.c || row.c.length < 12) {
            debugRows.push({
              rowIndex, 
              reason: "Insufficient columns", 
              rowData: row.c ? row.c.map(cell => cell ? cell.v : 'NULL') : 'NO CELLS'
            })
            return null
          }
          
          // Get the date from column L
          const dateCell = row.c[11]
          
          // Check if date cell exists and has a value
          if (!dateCell || !dateCell.v) {
            debugRows.push({
              rowIndex, 
              reason: "No date value", 
              dateCell: dateCell
            })
            return null
          }
          
          // Convert cell value to string
          let rowDateStr = String(dateCell.v).trim()
          let formattedRowDate = rowDateStr
          
          // Handle Google Sheets Date(year,month,day) format
          if (rowDateStr.startsWith('Date(')) {
            const match = /Date\((\d+),(\d+),(\d+)\)/.exec(rowDateStr)
            if (match) {
              const year = parseInt(match[1], 10)
              const month = parseInt(match[2], 10) + 1 // Months are 0-indexed in JS
              const day = parseInt(match[3], 10)
              
              // Format as DD/MM/YYYY
              formattedRowDate = `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${year}`
            }
          }
          
          // Format today and tomorrow dates for comparison
          const today = new Date()
          const tomorrow = new Date(today)
          tomorrow.setDate(today.getDate() + 1)
          
          const formatDateForComparison = (date) => {
            const day = date.getDate().toString().padStart(2, '0')
            const month = (date.getMonth() + 1).toString().padStart(2, '0') 
            const year = date.getFullYear()
            return `${day}/${month}/${year}`
          }
          
          const todayStr = formatDateForComparison(today)
          const tomorrowStr = formatDateForComparison(tomorrow)
          
          // Debug info  
          debugRows.push({
            rowIndex,
            originalDateStr: rowDateStr,  
            formattedRowDate,
            todayStr,
            tomorrowStr,
            matches: formattedRowDate === todayStr || formattedRowDate === tomorrowStr
          })
          
          // Check if the date matches today or tomorrow   
          if (formattedRowDate !== todayStr && formattedRowDate !== tomorrowStr) {
            return null
          }
          
          const rowData = {
            _id: Math.random().toString(36).substring(2, 15),  
            _rowIndex: rowIndex + 2 // +2 for header row and 1-indexing
          }
          
          // Populate row data dynamically
          headers.forEach((header, index) => {
            const cell = row.c && row.c[index] ? row.c[index] : null
            // Special handling for date column (col11)
            if (header.id === 'col11' && cell && cell.v) {
              const dateTime = new Date(cell.f || cell.v)
              const day = dateTime.getDate().toString().padStart(2, '0')
              const month = (dateTime.getMonth() + 1).toString().padStart(2, '0')
              const year = dateTime.getFullYear()
              rowData[header.id] = `${day}/${month}/${year}`
            } else {
              rowData[header.id] = cell ? cell.v : ''
            }
          })
          
          return rowData
        })
        .filter(row => row !== null)
      
      // Set debug information for display
      setDebugInfo(debugRows)
      
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


  
  const filteredSalesData = searchTerm
    ? salesData.filter(sale => 
        Object.values(sale).some(value => 
          value && value.toString().toLowerCase().includes(searchTerm.toLowerCase())
        )  
      )
    : salesData

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
  
    setSalesData(prev => prev.map(item =>
      item._id === id 
        ? {...item, image: file}
        : item  
    ))
  }

  // Handle submit selected items  
  const handleSubmit = async () => {
    if (selectedItems.length === 0) {
      alert("Please select at least one item to submit") 
      return
    }

    setIsSubmitting(true)
    
    try {
      const submissionData = await Promise.all(selectedItems.map(async (id) => {
        const item = salesData.find(sale => sale._id === id)
        
        let imageUrl = item.image || ""
        
        if (item.image instanceof File) {
          const formData = new FormData()
          formData.append('file', item.image)
          formData.append('parents', [DRIVE_FOLDER_ID])
          
          const driveResponse = await fetch(
            `https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart`,
            {
              method: 'POST',
              headers: new Headers({ 'Authorization': 'Bearer ' + gapi.auth.getToken().access_token }),
              body: formData  
            }
          )
          
          const driveResult = await driveResponse.json()
          imageUrl = `https://drive.google.com/uc?export=view&id=${driveResult.id}`
        }
        
        return {
          taskId: id,
          rowIndex: item._rowIndex,
          additionalInfo: additionalData[id] || "",
          imageUrl: imageUrl
        }
      }))
      
      const formData = new FormData()
      formData.append('sheetName', 'SALES')
      formData.append('action', 'updateSalesData')
      formData.append('rowData', JSON.stringify(submissionData))
      
      const response = await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        body: formData
      })

      const result = await response.json()
      
      if (result.success) {
        setSalesData(prev => prev.map(item =>
          selectedItems.includes(item._id)
            ? {...item, status: "completed", image: submissionData.find(d => d.taskId === item._id).imageUrl}
            : item
        ))
        
        setSuccessMessage(`Successfully processed ${selectedItems.length} sales records`)
        setSelectedItems([])
        setAdditionalData({})
      } else {
        throw new Error(result.error || "Submission failed")
      }
    } catch (error) {
      console.error("Submission error:", error)
      alert("Failed to submit sales records")
    } finally {
      setIsSubmitting(false)
    }
  }
  
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <h1 className="text-2xl font-bold tracking-tight text-purple-700">Sales Data</h1>

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
            <h2 className="text-purple-700 font-medium">Sales Records</h2>
            <p className="text-purple-600 text-sm">Select records to process and upload supporting documents</p>
          </div>
            
          {loading ? (
            <div className="text-center py-10">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500 mb-4"></div>
              <p className="text-purple-600">Loading sales data...</p>
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
                        checked={filteredSalesData.length > 0 && selectedItems.length === filteredSalesData.length}
                        onChange={(e) => {
                          if (e.target.checked) {
  setSelectedItems(filteredSalesData.map(item => item._id))
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
<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
  Additional Info
</th>
<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
  Upload Receipt
</th>
</tr>
</thead>
<tbody className="bg-white divide-y divide-gray-200">
{filteredSalesData.length > 0 ? (
filteredSalesData.map((sale) => (
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
  {/* Render data for columns B to K */}
  {sheetHeaders.slice(1, 11).map((header) => (
    <td key={header.id} className="px-6 py-4 whitespace-nowrap">
      <div className="text-sm text-gray-900">
        {header.id === 'col11' 
          ? sale[header.id].split('(')[1].split(')')[0].split(',').map(Number).map(n => n.toString().padStart(2, '0')).join('/')
          : header.type === 'number' && sale[header.id] !== ''
            ? `${(sale[header.id]).toFixed(2)}`
            : sale[header.id] || '—'
        }
      </div>
    </td>
  ))}
  <td className="px-6 py-4 whitespace-nowrap">
    <input
      type="text"
      disabled={!selectedItems.includes(sale._id)}
      value={additionalData[sale._id] || ""}
      onChange={(e) => setAdditionalData(prev => ({...prev, [sale._id]: e.target.value}))}
      className="border border-gray-300 rounded-md px-2 py-1 disabled:bg-gray-100 disabled:cursor-not-allowed"
    />
  </td>
  <td className="px-6 py-4 whitespace-nowrap">
    {sale.image ? (
      <div className="flex items-center">
        <img
          src={sale.image} 
          alt="Receipt"
          className="h-10 w-10 object-cover rounded-md mr-2"
        />
        <button
          className="text-xs text-purple-600 hover:text-purple-800"
          onClick={() => window.open(sale.image, "_blank")}
        >
          View
        </button>
      </div>
    ) : (
      <label className="flex items-center cursor-pointer text-purple-600 hover:text-purple-800">
        <Upload className="h-4 w-4 mr-1" />
        <span className="text-xs">Upload</span>
        <input
          type="file" 
          className="hidden"
          accept="image/*"
          onChange={(e) => handleImageUpload(sale._id, e)}
        />
      </label>
    )}
  </td>
</tr>
))
) : (
<tr>
  <td colSpan={sheetHeaders.length + 3} className="px-6 py-4 text-center text-gray-500"> 
    {searchTerm ? "No transactions matching your search" : "No sales records found"}
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