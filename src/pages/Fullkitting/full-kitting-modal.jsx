"use client"

import { X, Plus } from "lucide-react"
import { useState, useEffect, useRef, useCallback, useMemo } from "react"

// Initial row data structure
const initialRowData = {
  particulars: "",
  yield1: "",
  fem1: "",
  price1: "",
  percent: "",
  yield2: "",
  fem2: "",
  price2: "",
}

export function FullKittingModal({ isOpen, onClose, recordData, onProcessed, showToast }) {
  const [rows, setRows] = useState([{ ...initialRowData, id: 1 }])
  const [heatNumber, setHeatNumber] = useState(recordData?.heatNo || "")
  const [productName, setProductName] = useState(recordData?.brandName || "")
  const [manufacturingCost, setManufacturingCost] = useState("0")
  const [interestDays, setInterestDays] = useState("0")
  const [transporting, setTransporting] = useState("0")
  const [materialOptions, setMaterialOptions] = useState([])
  const [materialData, setMaterialData] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [sellingPriceInput, setSellingPriceInput] = useState("") // Add state for selling price
  const modalRef = useRef(null)

  // Google Sheets configuration
  const SHEET_ID = "1TjJufd9uDojTHK9cYogTgaBQQEqfo1x8aJ9SJ9zbR6s"
  const KYC_SHEET_NAME = "KYC of stock"
  const COMPOSITION_SHEET_NAME = "Composition Response"
  const APP_SCRIPT_URL =
    "https://script.google.com/macros/s/AKfycbyJ5saA255yPCq_yb2p8LfVJH7CX2h6hOJ4hDHQAw8TjrTqe4KpffjWlG0Sx5rA3krIDQ/exec"

  // Fetch material options from KYC of stock sheet
  const fetchMaterialOptions = useCallback(async () => {
    try {
      const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${KYC_SHEET_NAME}`

      const response = await fetch(url)
      const text = await response.text()

      // Extract the JSON part from the response
      const jsonStart = text.indexOf("{")
      const jsonEnd = text.lastIndexOf("}") + 1
      const jsonData = text.substring(jsonStart, jsonEnd)

      const data = JSON.parse(jsonData)

      if (data && data.table && data.table.rows) {
        const options = []
        const materialInfo = {}

        // Skip header row and process each row
        data.table.rows.slice(0).forEach((row, index) => {
          if (row.c && row.c[0] && row.c[0].v) {
            const material = row.c[0].v // Column A - Material name
            const price = row.c[1] ? row.c[1].v : "" // Column B - Price
            const yield1 = row.c[2] ? row.c[2].v : "" // Column C - Yield
            const fem1 = row.c[3] ? row.c[3].v : "" // Column D - Fem

            options.push(material)
            materialInfo[material] = {
              price: price.toString(),
              yield1: yield1.toString(),
              fem1: fem1.toString(),
            }
          }
        })

        setMaterialOptions(options)
        setMaterialData(materialInfo)
      }
    } catch (error) {
      console.error("Error fetching material options:", error)
      showToast && showToast("Error", "Failed to fetch material options", "error")
    }
  }, [SHEET_ID, KYC_SHEET_NAME, showToast])

  // Fetch material options when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchMaterialOptions()
    }
  }, [isOpen, fetchMaterialOptions])

  // Handle click outside to close modal
  useEffect(() => {
    function handleClickOutside(event) {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen, onClose])

  // Prevent scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "auto"
    }

    return () => {
      document.body.style.overflow = "auto"
    }
  }, [isOpen])

  // Calculated totals
  const [totals, setTotals] = useState({
    percentTotal: 0,
    yield2Total: 0,
    fem2Total: 0,
    price2Total: 0,
  })

  // Add a new row (max 15)
  const addRow = () => {
    if (rows.length < 15) {
      setRows([...rows, { ...initialRowData, id: rows.length + 1 }])
    }
  }

  // Remove a row
  const removeRow = (id) => {
    if (rows.length > 1) {
      setRows(rows.filter((row) => row.id !== id))
    }
  }

  // Update row data and calculate derived values
  const updateRowData = (id, field, value) => {
    const updatedRows = rows.map((row) => {
      if (row.id === id) {
        const updatedRow = { ...row, [field]: value }

        // When material is selected, autofill the related fields
        if (field === "particulars" && value && materialData[value]) {
          updatedRow.yield1 = materialData[value].yield1
          updatedRow.fem1 = materialData[value].fem1
          updatedRow.price1 = materialData[value].price
        }

        // Calculate derived values when percent, yield1, or price1 changes
        if (field === "percent" || field === "yield1" || field === "price1") {
          if (updatedRow.yield1 && updatedRow.percent) {
            updatedRow.yield2 = (
              (Number.parseFloat(updatedRow.yield1) * Number.parseFloat(updatedRow.percent)) /
              100
            ).toFixed(4)
          }

          if (updatedRow.price1 && updatedRow.percent) {
            updatedRow.price2 = (
              (Number.parseFloat(updatedRow.price1) * Number.parseFloat(updatedRow.percent)) /
              100
            ).toFixed(2)
          }
        }

        // Calculate fem2 when fem1 and percent changes
        if (field === "fem1" || field === "percent") {
          if (updatedRow.fem1 && updatedRow.percent) {
            updatedRow.fem2 = (
              (Number.parseFloat(updatedRow.fem1) * Number.parseFloat(updatedRow.percent)) /
              100
            ).toFixed(4)
          }
        }

        return updatedRow
      }
      return row
    })

    setRows(updatedRows)
  }

  // Calculate totals whenever rows change
  useEffect(() => {
    const newTotals = rows.reduce(
      (acc, row) => {
        return {
          percentTotal: acc.percentTotal + (Number.parseFloat(row.percent) || 0),
          yield2Total: acc.yield2Total + (Number.parseFloat(row.yield2) || 0),
          fem2Total: acc.fem2Total + (Number.parseFloat(row.fem2) || 0),
          price2Total: acc.price2Total + (Number.parseFloat(row.price2) || 0),
        }
      },
      { percentTotal: 0, yield2Total: 0, fem2Total: 0, price2Total: 0 },
    )

    setTotals({
      percentTotal: newTotals.percentTotal.toFixed(2),
      yield2Total: newTotals.yield2Total.toFixed(4),
      fem2Total: newTotals.fem2Total.toFixed(2),
      price2Total: newTotals.price2Total.toFixed(2),
    })
  }, [rows])

  // Calculate interest amount using the formula: =sum(J5:J18)*18%*G19/365
  const interestAmount = useMemo(() => {
    const totalPrice2 = Number.parseFloat(totals.price2Total) || 0
    const interestRate = 0.18 // 18%
    const days = Number.parseFloat(interestDays) || 0
    return ((totalPrice2 * interestRate * days) / 365).toFixed(2)
  }, [totals.price2Total, interestDays])

  // Calculate total price including manufacturing cost, interest and transporting
  const totalPrice = useMemo(() => {
    const price2Total = Number.parseFloat(totals.price2Total) || 0
    const manufacturingCostNumber = Number.parseFloat(manufacturingCost) || 0
    const interestAmountNumber = Number.parseFloat(interestAmount) || 0
    const transportingCost = Number.parseFloat(transporting) || 0

    return price2Total + manufacturingCostNumber + interestAmountNumber + transportingCost
  }, [totals.price2Total, manufacturingCost, interestAmount, transporting])

  // Calculate selling price by dividing total price by 0.75
  const sellingPrice = useMemo(() => {
    // Use the manually entered selling price if it exists, otherwise calculate automatically
    if (sellingPriceInput) {
      return Number.parseFloat(sellingPriceInput).toFixed(2)
    }
    return totalPrice > 0 ? (totalPrice / 0.75).toFixed(2) : "0.00"
  }, [totalPrice, sellingPriceInput])

  // Calculate variable cost and GP percentage
  const transportingCost = Number.parseFloat(transporting) || 0
  const manufacturingCostNumber = Number.parseFloat(manufacturingCost) || 0
  const interestAmountNumber = Number.parseFloat(interestAmount) || 0

  const variableCost = Number.parseFloat(totals.price2Total) //+ manufacturingCostNumber + interestAmountNumber + transportingCost

  // GP percentage using the formula: =IFERROR((SellingPrice-VariableCost)/SellingPrice, 0)
  const gpPercentage =
    sellingPrice > 0
      ? (((Number.parseFloat(sellingPrice) - variableCost) / Number.parseFloat(sellingPrice)) * 100).toFixed(2)
      : "0.00"

  // Generate composition number
  const generateCompositionNumber = async () => {
    try {
      // Fetch existing records to get the next composition number
      const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${COMPOSITION_SHEET_NAME}`

      const response = await fetch(url)
      const text = await response.text()

      // Extract the JSON part from the response
      const jsonStart = text.indexOf("{")
      const jsonEnd = text.lastIndexOf("}") + 1
      const jsonData = text.substring(jsonStart, jsonEnd)

      const data = JSON.parse(jsonData)

      let compositionNumber = "CN-001"

      if (data && data.table && data.table.rows && data.table.rows.length > 1) {
        // Find the highest composition number
        let maxNumber = 0
        data.table.rows.slice(1).forEach((row) => {
          if (row.c && row.c[0] && row.c[0].v) {
            const existingNumber = row.c[0].v
            if (existingNumber.startsWith("CN-")) {
              const num = Number.parseInt(existingNumber.substring(3))
              if (!isNaN(num) && num > maxNumber) {
                maxNumber = num
              }
            }
          }
        })

        // Generate next composition number
        compositionNumber = `CN-${String(maxNumber + 1).padStart(3, "0")}`
      }

      return compositionNumber
    } catch (error) {
      console.error("Error generating composition number:", error)
      // Fallback to CN-001 if there's an error
      return "CN-001"
    }
  }

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Generate composition number
      const compositionNumber = await generateCompositionNumber()

      // Filter out empty rows and prepare materials data
      const materialsData = rows.filter((row) => row.particulars)

      // Create an array with 44 empty strings (columns A to AR)
      const recordData = Array(44).fill("")

      // Fill the basic information in the first columns
      recordData[0] = compositionNumber // A - Composition Number
      recordData[1] = new Date().toLocaleDateString() // B - Date
      recordData[2] = heatNumber // C - Heat Number
      recordData[3] = productName // D - Product Name

      // Fill financial data
      recordData[4] = totals.price2Total // J - Total Price2
      recordData[5] = manufacturingCost // K - Manufacturing Cost
      recordData[6] = interestDays // L - Interest Days
      recordData[7] = interestAmount // M - Interest Cost
      recordData[8] = transporting // N - Transporting (FOR)
      //   recordData[14] = totalPrice.toFixed(2) // O - Total Price
      recordData[9] = sellingPriceInput || sellingPrice // P - Selling Price
      recordData[10] = variableCost.toFixed(2) // Q - Variable Cost
      recordData[11] = gpPercentage + "%" // Z - GP %AGE
      recordData[12] = totals.yield2Total // AA - Total Yield
      recordData[13] = totals.fem2Total // AB - Total Fem

      // Fill particulars in columns O to AC (indexes 14-28)
      materialsData.forEach((material, index) => {
        if (index < 14) {
          // Limit to 15 materials
          const columnIndex = 14 + index // Starting from O (14)
          if (columnIndex <= 28) {
            // Up to AC (28)
            recordData[columnIndex] = material.particulars
          }
        }
      })

      // Fill percent values in columns AD to AR (indexes 29-43)
      materialsData.forEach((material, index) => {
        if (index < 14) {
          // Limit to 15 materials
          const columnIndex = 29 + index // Starting from AD (29)
          if (columnIndex <= 43) {
            // Up to AR (43)
            recordData[columnIndex] = material.percent
          }
        }
      })

      // Create form data for POST request to Apps Script
      const formData = new FormData()
      formData.append("action", "insert")
      formData.append("sheetName", COMPOSITION_SHEET_NAME)
      formData.append("rowData", JSON.stringify(recordData))

      const response = await fetch(APP_SCRIPT_URL, {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`Failed to submit: ${response.status}`)
      }

      const result = await response.json()

      if (result.success) {
        showToast &&
          showToast(
            "Success",
            "Full kitting data has been submitted successfully with composition number: " + compositionNumber,
          )

        // Call onProcessed callback to mark the record as processed
        if (onProcessed && recordData?.id) {
          onProcessed(recordData.id)
        }

        onClose()
      } else {
        throw new Error(result.message || "Unknown error occurred")
      }
    } catch (error) {
      console.error("Error submitting data:", error)
      showToast && showToast("Error", "Failed to submit full kitting data", "error")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4 overflow-y-auto">
      <form onSubmit={handleSubmit}>
        <div
          ref={modalRef}
          className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto mx-2 sm:mx-4"
        >
          {/* Modal Header */}
          <div className="flex justify-between items-center p-4 border-b border-slate-200">
            <h2 className="text-xl font-semibold text-slate-800 ">Full Kitting Details</h2>
            <button type="button" onClick={onClose} className="text-slate-500 hover:text-slate-700">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Modal Content */}
          <div className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="heatNumber" className="block text-sm font-medium text-slate-700 mb-1">
                  Heat Number
                </label>
                <input
                  id="heatNumber"
                  type="text"
                  value={heatNumber}
                  onChange={(e) => setHeatNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300  rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
                  required
                />
              </div>
              <div>
                <label htmlFor="productName" className="block text-sm font-medium text-slate-700  mb-1">
                  Product Name
                </label>
                <input
                  id="productName"
                  type="text"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-500 "
                  required
                />
              </div>
            </div>

            <div className="flex justify-end mb-2">
              <button
                type="button"
                onClick={addRow}
                disabled={rows.length >= 15}
                className="flex items-center px-3 py-2 bg-slate-700 text-white rounded-md hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Row
              </button>
            </div>

            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <div className="inline-block min-w-full align-middle">
                <table className="min-w-full border-collapse">
                  <thead>
                    <tr className="bg-slate-100 ">
                      <th className="border border-slate-300 p-1 sm:p-2 text-left w-16">SI no</th>
                      <th className="border border-slate-300 p-1 sm:p-2 text-left">Particulars</th>
                      <th className="border border-slate-300 p-1 sm:p-2 text-left">Yield</th>
                      <th className="border border-slate-300 p-1 sm:p-2 text-left">Fem</th>
                      <th className="border border-slate-300 p-1 sm:p-2 text-left">Price</th>
                      <th className="border border-slate-300 p-1 sm:p-2 text-left bg-yellow-100">%</th>
                      <th className="border border-slate-300 p-1 sm:p-2 text-left">Yield</th>
                      <th className="border border-slate-300 p-1 sm:p-2 text-left">Fem</th>
                      <th className="border border-slate-300 p-1 sm:p-2 text-left">Price</th>
                      <th className="border border-slate-300 p-1 sm:p-2 text-left w-16">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.id} className={row.id % 2 === 0 ? "" : "bg-yellow-50"}>
                        <td className="border border-slate-300 p-1 sm:p-2">{row.id}</td>
                        <td className="border border-slate-300 p-1 sm:p-2">
                          <select
                            value={row.particulars}
                            onChange={(e) => updateRowData(row.id, "particulars", e.target.value)}
                            className="w-full px-2 py-1 border border-slate-300 text-sm rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-500  "
                          >
                            <option value="">Select material</option>
                            {materialOptions.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="border border-slate-300 p-1 sm:p-2">
                          <input
                            type="number"
                            value={row.yield1}
                            onChange={(e) => updateRowData(row.id, "yield1", e.target.value)}
                            className="w-full px-2 py-1 border border-slate-300 text-sm rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-500  "
                          />
                        </td>
                        <td className="border border-slate-300 p-1 sm:p-2">
                          <input
                            type="number"
                            value={row.fem1}
                            onChange={(e) => updateRowData(row.id, "fem1", e.target.value)}
                            className="w-full px-2 py-1 border border-slate-300 text-sm rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-500  "
                          />
                        </td>
                        <td className="border border-slate-300 p-1 sm:p-2">
                          <input
                            type="number"
                            value={row.price1}
                            onChange={(e) => updateRowData(row.id, "price1", e.target.value)}
                            className="w-full px-2 py-1 border border-slate-300 text-sm rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-500  "
                          />
                        </td>
                        <td className="border border-slate-300 p-1 sm:p-2 bg-yellow-100">
                          <input
                            type="number"
                            value={row.percent}
                            onChange={(e) => updateRowData(row.id, "percent", e.target.value)}
                            className="w-full px-2 py-1 border border-slate-300 text-sm rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-500  "
                            placeholder="Enter %"
                          />
                        </td>
                        <td className="border border-slate-300 p-1 sm:p-2">
                          <input
                            type="text"
                            value={row.yield2}
                            onChange={(e) => updateRowData(row.id, "yield2", e.target.value)}
                            className="w-full px-2 py-1 border border-slate-300 text-sm rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-500  "
                          />
                        </td>
                        <td className="border border-slate-300 p-1 sm:p-2">
                          <input
                            type="text"
                            value={row.fem2}
                            onChange={(e) => updateRowData(row.id, "fem2", e.target.value)}
                            className="w-full px-2 py-1 border border-slate-300 text-sm rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-500  "
                          />
                        </td>
                        <td className="border border-slate-300 p-1 sm:p-2">
                          <input
                            type="text"
                            value={row.price2}
                            onChange={(e) => updateRowData(row.id, "price2", e.target.value)}
                            className="w-full px-2 py-1 border border-slate-300 text-sm rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-500  "
                          />
                        </td>
                        <td className="border border-slate-300 p-1 sm:p-2">
                          {rows.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeRow(row.id)}
                              className="p-1 text-slate-500 hover:text-slate-700 rounded-md"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}

                    {/* Manufacturing Cost Row */}
                    <tr>
                      <td colSpan={5} className="border border-slate-300 p-1 sm:p-2 text-right font-medium">
                        Manufacturing Cost
                      </td>
                      <td colSpan={3} className="border border-slate-300 p-1 sm:p-2 bg-yellow-100"></td>
                      <td className="border border-slate-300 p-1 sm:p-2">
                        <input
                          type="number"
                          value={manufacturingCost}
                          onChange={(e) => setManufacturingCost(e.target.value)}
                          className="w-full px-2 py-1 border border-slate-300 text-sm rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-500  "
                        />
                      </td>
                      <td className="border border-slate-300 p-1 sm:p-2"></td>
                    </tr>

                    {/* Interest Days Row */}
                    <tr>
                      <td colSpan={5} className="border border-slate-300 p-1 sm:p-2 text-right font-medium">
                        interest (days)
                      </td>
                      <td className="border border-slate-300 p-1 sm:p-2 bg-yellow-100">
                        <input
                          type="number"
                          value={interestDays}
                          onChange={(e) => setInterestDays(e.target.value)}
                          className="w-full px-2 py-1 border border-slate-300 text-sm rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-500  "
                        />
                      </td>
                      <td colSpan={2} className="border border-slate-300 p-1 sm:p-2"></td>
                      <td className="border border-slate-300 p-1 sm:p-2">
                        <input
                          type="text"
                          value={interestAmount}
                          readOnly
                          className="w-full px-2 py-1 border border-slate-300 text-sm rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-500  "
                        />
                      </td>
                      <td className="border border-slate-300 p-1 sm:p-2"></td>
                    </tr>

                    {/* Transporting Row */}
                    <tr>
                      <td colSpan={5} className="border border-slate-300 p-1 sm:p-2 text-right font-medium">
                        transporting (FOR)
                      </td>
                      <td colSpan={4} className="border border-slate-300 p-1 sm:p-2">
                        <input
                          type="number"
                          value={transporting}
                          onChange={(e) => setTransporting(e.target.value)}
                          className="w-full px-2 py-1 border border-slate-300 text-sm rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-500  "
                        />
                      </td>
                      <td className="border border-slate-300 p-1 sm:p-2"></td>
                    </tr>

                    {/* Total Row */}
                    <tr className="font-bold">
                      <td colSpan={5} className="border border-slate-300 p-1 sm:p-2 text-right">
                        Total
                      </td>
                      <td className="border border-slate-300 p-1 sm:p-2 bg-yellow-100">{totals.percentTotal}%</td>
                      <td className="border border-slate-300 p-1 sm:p-2">{totals.yield2Total}</td>
                      <td className="border border-slate-300 p-1 sm:p-2">{totals.fem2Total}</td>
                      <td className="border border-slate-300 p-1 sm:p-2">{totalPrice.toFixed(2)}</td>
                      <td className="border border-slate-300 p-1 sm:p-2"></td>
                    </tr>

                    {/* Selling Price Row */}
                    <tr>
                      <td colSpan={5} className="border border-slate-300 p-1 sm:p-2 text-right font-medium">
                        SELLING PRICE
                      </td>
                      <td className="border border-slate-300 p-1 sm:p-2">
                        <input
                          type="text"
                          value={sellingPriceInput}
                          onChange={(e) => setSellingPriceInput(e.target.value)}
                          className="w-full px-2 py-1 border border-slate-300 text-sm rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-500  "
                          placeholder={sellingPrice}
                        />
                      </td>
                      {/* <td
                    colSpan={2}
                    className="border border-slate-300  p-2 text-center"
                  >
                    BD
                  </td> */}
                      {/* <td className="border border-slate-300  p-2">{sellingPrice}</td> */}
                      <td className="border border-slate-300 p-1 sm:p-2"></td>
                    </tr>

                    {/* Variable Cost Row */}
                    <tr>
                      <td colSpan={5} className="border border-slate-300 p-1 sm:p-2 text-right font-medium">
                        VARIABLE COST
                      </td>
                      <td colSpan={3} className="border border-slate-300 p-1 sm:p-2">
                        {variableCost.toFixed(2)}
                      </td>
                      <td className="border border-slate-300 p-1 sm:p-2"></td>
                      <td className="border border-slate-300 p-1 sm:p-2"></td>
                    </tr>

                    {/* GP Percentage Row */}
                    <tr>
                      <td colSpan={5} className="border border-slate-300 p-1 sm:p-2 text-right font-medium">
                        GP %AGE
                      </td>
                      <td colSpan={3} className="border border-slate-300 p-1 sm:p-2">
                        {gpPercentage}%
                      </td>
                      <td className="border border-slate-300 p-1 sm:p-2"></td>
                      <td className="border border-slate-300 p-1 sm:p-2"></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex flex-col sm:flex-row justify-end gap-2 mt-4 pt-4 border-t border-slate-200 p-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-300 w-full sm:w-auto rounded-md shadow-sm text-slate-700  hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-slate-700 text-white rounded-md w-full sm:w-auto hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Submitting..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
