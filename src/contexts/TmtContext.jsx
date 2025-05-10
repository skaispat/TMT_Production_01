"use client"

import { createContext, useContext, useState, useEffect } from "react"

const TmtContext = createContext(undefined)

// Generate a simple ID
const generateId = () => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

// Sample dummy data for TMT Planning
const dummyPlanningData = [
  {
    id: "plan-1",
    heatNo: "H-1001",
    personName: "John Smith",
    brandName: "JSW",
    sizes: [
      { size: "8mm", quantity: 2000 },
      { size: "10mm", quantity: 3000 },
    ],
    supervisorName: "Michael Chen",
    dateOfProduction: "2023-05-15",
    remarks: "Standard production run",
    status: "completed",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(), // 5 days ago
    syncedToSheet: true,
  },
  {
    id: "plan-2",
    heatNo: "H-1002",
    personName: "Sarah Williams",
    brandName: "Sarthak",
    sizes: [
      { size: "12mm", quantity: 1500 },
      { size: "16mm", quantity: 2000 },
    ],
    supervisorName: "David Rodriguez",
    dateOfProduction: "2023-05-16",
    remarks: "Priority order for Project X",
    status: "completed",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(), // 3 days ago
    syncedToSheet: true,
  },
  {
    id: "plan-3",
    heatNo: "H-1003",
    personName: "Robert Johnson",
    brandName: "JSW",
    sizes: [
      { size: "20mm", quantity: 1000 },
      { size: "25mm", quantity: 1800 },
    ],
    supervisorName: "Emily Wong",
    dateOfProduction: "2023-05-18",
    remarks: "Special grade for high-rise construction",
    status: "pending",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(), // 1 day ago
    syncedToSheet: false,
  },
]

// Sample dummy data for TMT Production
const dummyProductionData = [
  {
    id: "prod-1",
    planningId: "plan-1",
    heatNo: "H-1001",
    jobCard: "JC-501",
    timeRange: "08:00-16:00",
    ccmTotalPieces: 95,
    brandName: "JSW",
    sizeOfTmt: "8mm",
    hrs: 8,
    breakDownTime: 0.5,
    breakDownTimeGap: "10:30-11:00",
    remarks: "Regular production",
    status: "completed",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(), // 4 days ago
  },
  {
    id: "prod-2",
    planningId: "plan-2",
    heatNo: "H-1002",
    jobCard: "JC-502",
    timeRange: "16:00-00:00",
    ccmTotalPieces: 110,
    brandName: "Sarthak",
    sizeOfTmt: "12mm",
    hrs: 8,
    breakDownTime: 0,
    breakDownTimeGap: "N/A",
    remarks: "Smooth operation",
    status: "completed",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 days ago
  },
]

export function TmtDataProvider({ children }) {
  const [planningRecords, setPlanningRecords] = useState(dummyPlanningData)
  const [productionRecords, setProductionRecords] = useState(dummyProductionData)
  const [isLoading, setIsLoading] = useState(false)

  // Load data from localStorage on mount
  useEffect(() => {
    const loadData = () => {
      const storedPlanningRecords = localStorage.getItem("tmtPlanningRecords")
      const storedProductionRecords = localStorage.getItem("tmtProductionRecords")

      if (storedPlanningRecords) {
        try {
          setPlanningRecords(JSON.parse(storedPlanningRecords))
        } catch (error) {
          console.error("Failed to parse stored planning records:", error)
        }
      }

      if (storedProductionRecords) {
        try {
          setProductionRecords(JSON.parse(storedProductionRecords))
        } catch (error) {
          console.error("Failed to parse stored production records:", error)
        }
      }
    }

    loadData()
  }, [])

  // Save data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("tmtPlanningRecords", JSON.stringify(planningRecords))
  }, [planningRecords])

  useEffect(() => {
    localStorage.setItem("tmtProductionRecords", JSON.stringify(productionRecords))
  }, [productionRecords])

  // Planning functions
  const addPlanningRecord = (data) => {
    const newRecord = {
      ...data,
      id: generateId(),
      timestamp: new Date().toISOString(),
      status: "pending",
      syncedToSheet: false,
    }
    setPlanningRecords((prev) => [newRecord, ...prev])
    return newRecord
  }

  const updatePlanningRecord = (id, data) => {
    setPlanningRecords((prev) => {
      const index = prev.findIndex((r) => r.id === id)
      if (index === -1) {
        throw new Error("Record not found")
      }
      const updatedRecords = [...prev]
      updatedRecords[index] = {
        ...updatedRecords[index],
        ...data,
      }
      return updatedRecords
    })
  }

  const deletePlanningRecord = (id) => {
    setPlanningRecords((prev) => prev.filter((r) => r.id !== id))
  }

  const getPlanningRecordById = (id) => {
    return planningRecords.find((r) => r.id === id)
  }

  const getPendingPlanningRecords = (brandFilter) => {
    let records = planningRecords.filter((r) => r.status === "pending")

    // Apply brand filter if provided
    if (brandFilter) {
      records = records.filter((r) => r.brandName === brandFilter)
    }

    return records
  }

  const getCompletedPlanningRecords = (brandFilter) => {
    let records = planningRecords.filter((r) => r.status === "completed")

    // Apply brand filter if provided
    if (brandFilter) {
      records = records.filter((r) => r.brandName === brandFilter)
    }

    return records
  }

  // Production functions
  const addProductionRecord = (data) => {
    const newRecord = {
      ...data,
      id: generateId(),
      timestamp: new Date().toISOString(),
      status: "pending",
    }
    setProductionRecords((prev) => [newRecord, ...prev])

    // Update the corresponding planning record to completed
    updatePlanningRecord(data.planningId, { status: "completed" })

    return newRecord
  }

  const updateProductionRecord = (id, data) => {
    setProductionRecords((prev) => {
      const index = prev.findIndex((r) => r.id === id)
      if (index === -1) {
        throw new Error("Record not found")
      }
      const updatedRecords = [...prev]
      updatedRecords[index] = {
        ...updatedRecords[index],
        ...data,
      }
      return updatedRecords
    })
  }

  const deleteProductionRecord = (id) => {
    setProductionRecords((prev) => prev.filter((r) => r.id !== id))
  }

  const getProductionRecordById = (id) => {
    return productionRecords.find((r) => r.id === id)
  }

  const getPendingProductionRecords = (brandFilter) => {
    let records = productionRecords.filter((r) => r.status === "pending")

    // Apply brand filter if provided
    if (brandFilter) {
      records = records.filter((r) => r.brandName === brandFilter)
    }

    return records
  }

  const getCompletedProductionRecords = (brandFilter) => {
    let records = productionRecords.filter((r) => r.status === "completed")

    // Apply brand filter if provided
    if (brandFilter) {
      records = records.filter((r) => r.brandName === brandFilter)
    }

    return records
  }

  // Google Sheets integration (mock implementation)
  const syncToGoogleSheet = async (recordId) => {
    setIsLoading(true)

    // Simulate API call to Google Sheets
    await new Promise((resolve) => setTimeout(resolve, 1500))

    // Update the record to mark as synced
    setPlanningRecords((prev) => {
      const index = prev.findIndex((r) => r.id === recordId)
      if (index === -1) {
        return prev
      }
      const updatedRecords = [...prev]
      updatedRecords[index] = {
        ...updatedRecords[index],
        syncedToSheet: true,
      }
      return updatedRecords
    })

    setIsLoading(false)
    return true
  }

  // Refresh data (simulated)
  const refreshData = async () => {
    setIsLoading(true)
    // In a real app, this would fetch from an API
    await new Promise((resolve) => setTimeout(resolve, 500))
    setIsLoading(false)
    return Promise.resolve()
  }

  return (
    <TmtContext.Provider
      value={{
        planningRecords,
        productionRecords,
        addPlanningRecord,
        updatePlanningRecord,
        deletePlanningRecord,
        getPlanningRecordById,
        getPendingPlanningRecords,
        getCompletedPlanningRecords,
        addProductionRecord,
        updateProductionRecord,
        deleteProductionRecord,
        getProductionRecordById,
        getPendingProductionRecords,
        getCompletedProductionRecords,
        syncToGoogleSheet,
        refreshData,
        isLoading,
      }}
    >
      {children}
    </TmtContext.Provider>
  )
}

export function useTmtData() {
  const context = useContext(TmtContext)
  if (context === undefined) {
    throw new Error("useTmtData must be used within a TmtDataProvider")
  }
  return context
}
