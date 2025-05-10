"use client"

import { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/Card"
import { useTmtData } from "../contexts/TmtContext"
import { useAuth } from "../contexts/AuthContext"
import Button from "../components/ui/Button"
import Input from "../components/ui/Input"
import Label from "../components/ui/Label"
import Textarea from "../components/ui/Textarea"
import { useToast } from "../components/ui/Toaster"
import Header from "../components/Header"
import Skeleton from "../components/ui/Skeleton"
import Badge from "../components/ui/Badge"
import { Hammer, Save } from "lucide-react"

export default function NewTmtProductionPage() {
  const { addProductionRecord, getPlanningRecordById } = useTmtData()
  const { isAuthenticated, isLoading: authLoading, getUserBrand } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const searchParams = new URLSearchParams(location.search)
  const planningId = searchParams.get("planningId")
  const { toast } = useToast()
  const [isMounted, setIsMounted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [planningRecord, setPlanningRecord] = useState(null)

  // Form state
  const [jobCard, setJobCard] = useState("")
  const [timeRange, setTimeRange] = useState("")
  const [ccmTotalPieces, setCcmTotalPieces] = useState("")
  const [sizeOfTmt, setSizeOfTmt] = useState("")
  const [hrs, setHrs] = useState("")
  const [breakDownTime, setBreakDownTime] = useState("")
  const [breakDownTimeGap, setBreakDownTimeGap] = useState("")
  const [remarks, setRemarks] = useState("")

  // Only render after first mount to prevent hydration mismatch
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Add brand filtering based on user role
  useEffect(() => {
    // Only run this effect if we're mounted and auth is not loading
    if (!isMounted || authLoading) return

    if (!isAuthenticated) {
      navigate("/")
      return
    }

    // Load planning record if planningId is provided
    if (planningId) {
      const record = getPlanningRecordById(planningId)
      if (record) {
        // Check if user has access to this brand
        const userBrand = getUserBrand()
        if (userBrand && record.brandName !== userBrand) {
          toast({
            variant: "destructive",
            title: "Access Denied",
            description: "You don't have permission to access this record.",
          })
          navigate("/full-kitting")
          return
        }

        setPlanningRecord(record)
        // You could pre-fill other fields based on the planning record
      } else {
        toast({
          variant: "destructive",
          title: "Record Not Found",
          description: "The planning record could not be found.",
        })
        navigate("/full-kitting")
      }
    } else {
      navigate("/full-kitting")
    }
  }, [isMounted, authLoading, isAuthenticated, navigate, planningId, getPlanningRecordById, toast, getUserBrand])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Validate form
      if (!jobCard || !timeRange || !ccmTotalPieces || !sizeOfTmt) {
        toast({
          variant: "destructive",
          title: "Validation Error",
          description: "Please fill in all required fields.",
        })
        setIsSubmitting(false)
        return
      }

      if (!planningRecord) {
        toast({
          variant: "destructive",
          title: "Planning Record Required",
          description: "A planning record is required to create a production record.",
        })
        setIsSubmitting(false)
        return
      }

      // Add production record
      const newRecord = addProductionRecord({
        planningId: planningRecord.id,
        heatNo: planningRecord.heatNo,
        jobCard,
        timeRange,
        ccmTotalPieces: Number(ccmTotalPieces),
        brandName: planningRecord.brandName,
        sizeOfTmt,
        hrs: Number(hrs) || 0,
        breakDownTime: Number(breakDownTime) || 0,
        breakDownTimeGap,
        remarks,
      })

      toast({
        title: "Production Record Created",
        description: `Production record for ${jobCard} has been created successfully.`,
      })

      // Redirect to production page
      navigate("/tmt-production")
    } catch (error) {
      console.error("Error creating production record:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "An error occurred while creating the production record.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // If not mounted yet or auth is loading, show a skeleton
  if (!isMounted || authLoading) {
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

  // If not authenticated, don't render anything (will redirect)
  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Header />

      <div className="container mx-auto py-6 px-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-200 flex items-center">
            <Hammer className="mr-2 h-6 w-6" />
            New TMT Production
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">Create a new TMT production record</p>
        </div>

        {planningRecord && (
          <Card className="border-slate-200 dark:border-slate-700 shadow-sm mb-6">
            <CardHeader className="bg-slate-100 dark:bg-slate-800 rounded-t-lg">
              <CardTitle className="text-slate-800 dark:text-slate-200">Planning Record Details</CardTitle>
              <CardDescription className="text-slate-500 dark:text-slate-400">
                Information from the selected planning record
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm font-medium">Heat No.</p>
                  <p className="text-lg">{planningRecord.heatNo}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Brand Name</p>
                  <p className="text-lg">{planningRecord.brandName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Sizes</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {planningRecord.sizes.map((size, index) => (
                      <Badge key={index} className="bg-slate-500">
                        {size.size} ({size.quantity})
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="border-slate-200 dark:border-slate-700 shadow-sm">
          <CardHeader className="bg-slate-100 dark:bg-slate-800 rounded-t-lg">
            <CardTitle className="text-slate-800 dark:text-slate-200">New TMT Production</CardTitle>
            <CardDescription className="text-slate-500 dark:text-slate-400">
              Fill in the details to create a new TMT production record
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="jobCard">
                    Job Card <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="jobCard"
                    placeholder="Enter job card number"
                    value={jobCard}
                    onChange={(e) => setJobCard(e.target.value)}
                    className="border-slate-200 focus-visible:ring-slate-500"
                    disabled={isSubmitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timeRange">
                    Time Range <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="timeRange"
                    placeholder="Enter time range (e.g. 08:00-16:00)"
                    value={timeRange}
                    onChange={(e) => setTimeRange(e.target.value)}
                    className="border-slate-200 focus-visible:ring-slate-500"
                    disabled={isSubmitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ccmTotalPieces">
                    CCM Total Pieces (TMT) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="ccmTotalPieces"
                    type="number"
                    placeholder="Enter total pieces"
                    value={ccmTotalPieces}
                    onChange={(e) => setCcmTotalPieces(e.target.value)}
                    className="border-slate-200 focus-visible:ring-slate-500"
                    disabled={isSubmitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sizeOfTmt">
                    Size of TMT <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="sizeOfTmt"
                    placeholder="Enter TMT size"
                    value={sizeOfTmt}
                    onChange={(e) => setSizeOfTmt(e.target.value)}
                    className="border-slate-200 focus-visible:ring-slate-500"
                    disabled={isSubmitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hrs">Hours</Label>
                  <Input
                    id="hrs"
                    type="number"
                    placeholder="Enter hours"
                    value={hrs}
                    onChange={(e) => setHrs(e.target.value)}
                    className="border-slate-200 focus-visible:ring-slate-500"
                    disabled={isSubmitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="breakDownTime">Break Down Time</Label>
                  <Input
                    id="breakDownTime"
                    type="number"
                    placeholder="Enter breakdown time"
                    value={breakDownTime}
                    onChange={(e) => setBreakDownTime(e.target.value)}
                    className="border-slate-200 focus-visible:ring-slate-500"
                    disabled={isSubmitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="breakDownTimeGap">Break Down Time Gap</Label>
                  <Input
                    id="breakDownTimeGap"
                    placeholder="Enter breakdown time gap"
                    value={breakDownTimeGap}
                    onChange={(e) => setBreakDownTimeGap(e.target.value)}
                    className="border-slate-200 focus-visible:ring-slate-500"
                    disabled={isSubmitting}
                  />
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
                  {isSubmitting ? "Saving..." : "Save Production Record"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
