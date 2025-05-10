"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/Card"
import Button from "../components/ui/Button"
import Input from "../components/ui/Input"
import Label from "../components/ui/Label"
import Textarea from "../components/ui/Textarea"
import { useToast } from "../components/ui/Toaster"
import Header from "../components/Header"
import Skeleton from "../components/ui/Skeleton"
import { ClipboardList, Save, Plus, Trash2 } from "lucide-react"

const MAX_SIZES = 10; // Maximum number of sizes allowed

export default function TmtPlanningPage() {
  const { toast } = useToast()
  const [isMounted, setIsMounted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Form state
  const [heatNo, setHeatNo] = useState("")
  const [personName, setPersonName] = useState("")
  const [brandName, setBrandName] = useState("")
  const [sizes, setSizes] = useState([{ size: "", quantity: 0 }])
  const [supervisorName, setSupervisorName] = useState("")
  const [dateOfProduction, setDateOfProduction] = useState("")
  const [remarks, setRemarks] = useState("")

  // Dropdown options
  const [dropdownOptions, setDropdownOptions] = useState({
    brandName: [],
  })

  // Google Apps Script URLs
  const APPS_SCRIPT_URL =
    "https://script.google.com/macros/s/AKfycbyJ5saA255yPCq_yb2p8LfVJH7CX2h6hOJ4hDHQAw8TjrTqe4KpffjWlG0Sx5rA3krIDQ/exec"
  const SHEET_NAME = "PRODUCTION"
  const SHEET_ID = "1TjJufd9uDojTHK9cYogTgaBQQEqfo1x8aJ9SJ9zbR6s"
  const DROPDOWN_SHEET_NAME = "Drop-Down"

  // Only render after first mount to prevent hydration mismatch
  useEffect(() => {
    setIsMounted(true)
    // Set today's date as default
    const today = new Date().toISOString().split("T")[0]
    setDateOfProduction(today)
  }, [])

  // Fetch dropdown options from Google Sheet
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        // Create a public Google Sheets API URL to fetch dropdown data
        const dropdownUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${DROPDOWN_SHEET_NAME}`

        // Fetch dropdown data
        const response = await fetch(dropdownUrl)
        const csvData = await response.text()

        // Parse CSV data - simple parsing logic
        const rows = csvData.split("\n").map((row) =>
          row.split(",").map(
            (cell) => cell.trim().replace(/^"|"$/g, ""), // Remove quotes
          ),
        )

        // Extract brand names from column A starting from row 2 (skip header)
        const brandNames = rows
          .slice(1) // Skip the first row (header)
          .map((row) => row[0])
          .filter((value) => value.trim() !== "")

        setDropdownOptions({
          brandName: [...new Set(brandNames)], // Remove duplicates
        })
      } catch (error) {
        console.error("Error fetching dropdown data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [SHEET_ID])

  const handleAddSize = () => {
    if (sizes.length < MAX_SIZES) {
      setSizes([...sizes, { size: "", quantity: 0 }])
    } else {
      toast({
        variant: "destructive",
        title: "Maximum Sizes Reached",
        description: `You can only add up to ${MAX_SIZES} sizes.`,
      })
    }
  }

  const handleRemoveSize = (index) => {
    if (sizes.length > 1) {
      const newSizes = [...sizes]
      newSizes.splice(index, 1)
      setSizes(newSizes)
    }
  }

  const handleSizeChange = (index, field, value) => {
    const newSizes = [...sizes]
    newSizes[index] = {
      ...newSizes[index],
      [field]: field === "quantity" ? Number(value) : value,
    }
    setSizes(newSizes)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Validate form
      if (!heatNo || !personName || !brandName || !supervisorName || !dateOfProduction) {
        toast({
          variant: "destructive",
          title: "Validation Error",
          description: "Please fill in all required fields.",
        })
        setIsSubmitting(false)
        return
      }

      // Validate sizes
      const validSizes = sizes.filter((size) => size.size && size.quantity > 0)
      if (validSizes.length === 0) {
        toast({
          variant: "destructive",
          title: "Validation Error",
          description: "Please add at least one size with quantity.",
        })
        setIsSubmitting(false)
        return
      }

      // Format timestamp as DD/MM/YYYY hh:mm:ss
      const now = new Date()
      const day = String(now.getDate()).padStart(2, "0")
      const month = String(now.getMonth() + 1).padStart(2, "0")
      const year = now.getFullYear()
      const hours = String(now.getHours()).padStart(2, "0")
      const minutes = String(now.getMinutes()).padStart(2, "0")
      const seconds = String(now.getSeconds()).padStart(2, "0")
      const timestamp = `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`

      // Convert dateOfProduction to DD/MM/YYYY format
      const [year2, month2, day2] = dateOfProduction.split('-')
      const formattedDate = `${day2}/${month2}/${year2}`

      // Prepare size data - ensure we have exactly 10 size/quantity pairs
      const sizeData = []
      for (let i = 0; i < 10; i++) {
        if (i < validSizes.length) {
          sizeData.push(validSizes[i].size)
          sizeData.push(validSizes[i].quantity)
        } else {
          sizeData.push("")
          sizeData.push("")
        }
      }

      // Format data into an array matching your sheet's column order
      const rowData = [
        timestamp, // Timestamp (Column A)
        heatNo, // Heat No. (Column B)
        personName, // Person Name (Column C)
        brandName, // Brand Name (Column D)
        supervisorName, // Supervisor Name (Column E)
        formattedDate, // Date of Production (Column F) - formatted as DD/MM/YYYY
        remarks, // Remarks (Column G)
        ...sizeData // Size 1-10 and Quantity 1-10 (Columns H-AA)
      ]

      // Create form data for the POST request
      const formPayload = new FormData()
      formPayload.append("sheetName", SHEET_NAME)
      formPayload.append("action", "insert")
      formPayload.append("rowData", JSON.stringify(rowData))

      // Submit to Google Apps Script
      await fetch(APPS_SCRIPT_URL, {
        method: "POST",
        body: formPayload,
        mode: "no-cors", // Required for Google Apps Script
      })

      toast({
        title: "Planning Record Created",
        description: `Planning record for ${heatNo} has been created successfully.`,
      })

      // Reset form
      setHeatNo("")
      setPersonName("")
      setBrandName("")
      setSizes([{ size: "", quantity: 0 }])
      setSupervisorName("")
      setRemarks("")
      setDateOfProduction(new Date().toISOString().split("T")[0])

    } catch (error) {
      console.error("Error creating planning record:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "An error occurred while creating the planning record.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // If not mounted yet or loading dropdown data, show a skeleton
  if (!isMounted || isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        <Header />
        <div className="container mx-auto py-6 px-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div>
              <Skeleton className="h-10 w-64 mb-2" />
              <Skeleton className="h-5 w-96" />
            </div>
          </div>
          <Skeleton className="h-[600px] w-full" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Header />

      <div className="container mx-auto py-6 px-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-200 flex items-center">
            <ClipboardList className="mr-2 h-6 w-6" />
            TMT Planning Form
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Create a new TMT planning record to initiate the production process
          </p>
        </div>

        <Card className="border-slate-200 dark:border-slate-700 shadow-sm">
          <CardHeader className="bg-slate-100 dark:bg-slate-800 rounded-t-lg">
            <CardTitle className="text-slate-800 dark:text-slate-200">New TMT Planning</CardTitle>
            <CardDescription className="text-slate-500 dark:text-slate-400">
              Fill in the details to create a new TMT planning record
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="heatNo">
                    Heat No. <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="heatNo"
                    placeholder="Enter heat number"
                    value={heatNo}
                    onChange={(e) => setHeatNo(e.target.value)}
                    className="border-slate-200 focus-visible:ring-slate-500"
                    disabled={isSubmitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="personName">
                    Person Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="personName"
                    placeholder="Enter person name"
                    value={personName}
                    onChange={(e) => setPersonName(e.target.value)}
                    className="border-slash-200 focus-visible:ring-slate-500"
                    disabled={isSubmitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="brandName">
                    Brand Name <span className="text-red-500">*</span>
                  </Label>
                  <select
                    id="brandName"
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    disabled={isSubmitting}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                  >
                    <option value="">Select brand</option>
                    {dropdownOptions.brandName.map((option, index) => (
                      <option key={`brand-${index}`} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="supervisorName">
                    Supervisor Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="supervisorName"
                    placeholder="Enter supervisor name"
                    value={supervisorName}
                    onChange={(e) => setSupervisorName(e.target.value)}
                    className="border-slate-200 focus-visible:ring-slate-500"
                    disabled={isSubmitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dateOfProduction">
                    Date of Production <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="dateOfProduction"
                    type="date"
                    value={dateOfProduction}
                    onChange={(e) => setDateOfProduction(e.target.value)}
                    className="border-slate-200 focus-visible:ring-slate-500"
                    disabled={isSubmitting}
                  />
                </div>

                <div className="md:col-span-2">
                  <div className="flex justify-between items-center mb-2">
                    <Label>
                      Sizes and Quantities <span className="text-red-500">*</span>
                      <span className="text-sm text-gray-500 ml-2">
                        ({sizes.length}/{MAX_SIZES} sizes added)
                      </span>
                    </Label>
                    <Button
                      type="button"
                      variant="outline"
                      className="border-slate-200 text-slate-700 h-9 rounded-md px-3 text-xs"
                      onClick={handleAddSize}
                      disabled={isSubmitting || sizes.length >= MAX_SIZES}
                    >
                      <Plus className="h-4 w-4 mr-1" /> Add Size
                    </Button>
                  </div>

                  {sizes.map((size, index) => (
                    <div key={index} className="flex gap-4 mb-4">
                      <div className="flex-1">
                        <Label htmlFor={`size-${index}`} className="sr-only">
                          Size
                        </Label>
                        <Input
                          id={`size-${index}`}
                          placeholder="Enter size (e.g., 8mm)"
                          value={size.size}
                          onChange={(e) => handleSizeChange(index, "size", e.target.value)}
                          className="border-slate-200 focus-visible:ring-slate-500"
                          disabled={isSubmitting}
                        />
                      </div>
                      <div className="flex-1">
                        <Label htmlFor={`quantity-${index}`} className="sr-only">
                          Quantity
                        </Label>
                        <Input
                          id={`quantity-${index}`}
                          type="number"
                          placeholder="Enter quantity"
                          value={size.quantity || ""}
                          onChange={(e) => handleSizeChange(index, "quantity", e.target.value)}
                          className="border-slate-200 focus-visible:ring-slate-500"
                          disabled={isSubmitting}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveSize(index)}
                        disabled={sizes.length === 1 || isSubmitting}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 h-10 w-10 flex items-center justify-center rounded-md"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="remarks">Remarks</Label>
                  <Textarea
                    id="remarks"
                    placeholder="Enter any additional remarks"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    className="border-slate-200 focus-visible:ring-slate-500 min-h-[100px]"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button type="submit" className="bg-slate-700 hover:bg-slate-800 text-white" disabled={isSubmitting}>
                  <Save className="mr-2 h-4 w-4" />
                  {isSubmitting ? "Saving..." : "Save Planning Record"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
