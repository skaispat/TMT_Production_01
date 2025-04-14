"use client"

import { useState, useEffect } from "react"
import { format, addDays, addWeeks, addMonths, addYears } from "date-fns"

const AssignTaskPage = () => {
  // Google Sheets configuration
  const SCRIPT_URL =
    "https://script.google.com/macros/s/AKfycbyAAyUM9m_Oe_6XAmWYIgO0ENNXgt9ox8vBWwnB4f87Lf883RGvBi4xOL9kxLyDq1dtqA/exec"
  const SHEET_NAME = "data"
  const MASTER_SHEET = "master" // Master sheet for dropdown data
  const SHEET_ID = "1jOBkMxcHrusTlAV9l21JN-B-5QWq1dDyj3-0kxbK6ik" // Your specific sheet ID

  const [date, setSelectedDate] = useState(new Date())
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [generatedTasks, setGeneratedTasks] = useState([])
  const [toast, setToast] = useState({ show: false, message: "", type: "" })
  const [lastTaskId, setLastTaskId] = useState(0) // Track the last task ID
  const [formData, setFormData] = useState({
    department: "",
    givenBy: "",
    doer: "",
    title: "",
    description: "",
    frequency: "daily",
    enableReminders: true,
    requireAttachment: false,
  })

  // State for master data
  const [masterData, setMasterData] = useState({
    departments: [],
    givenBy: [],
    doers: [],
  })

  // Fetch master data and last task ID when component mounts
  useEffect(() => {
    const fetchMasterData = async () => {
      try {
        // Create form data for the request - using URLSearchParams for better compatibility
        const formData = new URLSearchParams()
        formData.append("sheetName", MASTER_SHEET)
        formData.append("action", "getMasterData")
        formData.append("sheetId", SHEET_ID)

        console.log("Fetching master data from sheet:", MASTER_SHEET)

        const response = await fetch(SCRIPT_URL, {
          method: "POST",
          body: formData,
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        })

        const result = await response.json()
        console.log("Master data response:", result)

        if (result && result.success && result.data) {
          // Process the column data from the master sheet
          // Expecting result.data to contain A, B, C arrays for the columns
          const processColumnData = (columnData) => {
            if (!columnData || !Array.isArray(columnData)) return []

            // Skip header row (index 0) and filter out empty values
            return columnData
              .slice(1)
              .filter((item) => item && item.trim() !== "")
              .map((item, index) => ({
                id: index + 1,
                name: item.trim(),
              }))
          }

          setMasterData({
            departments: processColumnData(result.data.A),
            givenBy: processColumnData(result.data.B),
            doers: processColumnData(result.data.C),
          })

          console.log("Processed master data:", {
            departments: processColumnData(result.data.A),
            givenBy: processColumnData(result.data.B),
            doers: processColumnData(result.data.C),
          })
        } else {
          console.error("Failed to fetch master data:", result?.error || "No data received")
          setMasterData({
            departments: [],
            givenBy: [],
            doers: [],
          })
        }

        // Try to fetch the last task ID from Google Sheets
        try {
          const idFormData = new URLSearchParams()
          idFormData.append("action", "getLastTaskId")
          idFormData.append("sheetName", SHEET_NAME)
        
          const idResponse = await fetch(SCRIPT_URL, {
            method: "POST",
            body: idFormData,
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
          })
        
          const idResult = await idResponse.json()
        
          if (idResult && idResult.success && idResult.lastTaskId !== null && idResult.lastTaskId !== undefined) {
            console.log("Retrieved last task ID from sheet:", idResult.lastTaskId);
            
            // Reset the lastTaskId in both state and localStorage
            setLastTaskId(idResult.lastTaskId)
            localStorage.setItem("lastTaskId", idResult.lastTaskId.toString())
          } else {
            // Handle the case where the API doesn't return a valid lastTaskId
            console.warn("Could not retrieve last task ID from sheet, using fallback methods");
            
            // Only use localStorage as a last resort
            const storedId = localStorage.getItem("lastTaskId")
            if (storedId) {
              const parsedId = Number.parseInt(storedId, 10)
              setLastTaskId(parsedId)
              console.log("Using stored ID from localStorage:", parsedId);
            } else {
              // Default to 0 if no ID exists anywhere
              setLastTaskId(0)
              localStorage.setItem("lastTaskId", "0")
              console.log("No task ID found, starting from 0");
            }
          }
        } catch (error) {
          console.error("Error fetching last task ID:", error)
          // Fallback to localStorage
          const storedId = localStorage.getItem("lastTaskId")
          if (storedId) {
            setLastTaskId(Number.parseInt(storedId, 10))
          }
        }
      } catch (error) {
        console.error("Error fetching master data:", error)
        // Fallback data in case fetch fails
        setMasterData({
          departments: [],
          givenBy: [],
          doers: []
        })

        // Fallback to localStorage for last task ID
        const storedId = localStorage.getItem("lastTaskId")
        if (storedId) {
          setLastTaskId(Number.parseInt(storedId, 10))
        }
      }
    }

    fetchMasterData()
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSwitchChange = (name) => {
    setFormData((prev) => ({ ...prev, [name]: !prev[name] }))
  }

  const showToast = (message, type) => {
    setToast({ show: true, message, type })
    setTimeout(() => {
      setToast({ show: false, message: "", type: "" })
    }, 3000)
  }

  // Generate a new task ID (e.g., 001, 002, etc.)
  const generateTaskId = (offset = 0) => {
    const newId = lastTaskId + 1 + offset
    // Format with leading zeros (001, 002, etc.)
    return newId.toString().padStart(3, "0")
  }

  const generateTasks = () => {
    if (
      !date ||
      !formData.doer ||
      !formData.title ||
      !formData.frequency ||
      !formData.department ||
      !formData.givenBy
    ) {
      showToast("Please fill in all required fields.", "error")
      return false
    }

    const tasks = []
    const startDate = new Date(date)
    const doerName = masterData.doers.find((person) => person.id.toString() === formData.doer)?.name || "Unknown"
    const departmentName =
      masterData.departments.find((dept) => dept.id.toString() === formData.department)?.name || "Unknown"
    const givenByName =
      masterData.givenBy.find((person) => person.id.toString() === formData.givenBy)?.name || "Unknown"

    // Generate tasks for 2 years based on frequency
    let currentDate = new Date(startDate)
    const endDate = addYears(startDate, 2)

    // Counter for sequential task IDs
    let taskCounter = 0

    while (currentDate <= endDate) {
      // Generate a unique sequential ID for each task
      const taskId = generateTaskId(taskCounter)
      taskCounter++

      tasks.push({
        id: taskId,
        department: departmentName,
        departmentId: formData.department,
        givenBy: givenByName,
        givenById: formData.givenBy,
        title: formData.title,
        description: formData.description,
        doerId: formData.doer,
        doerName: doerName,
        dueDate: format(currentDate, "yyyy-MM-dd"),
        status: "pending",
        frequency: formData.frequency,
        enableReminders: formData.enableReminders,
        requireAttachment: formData.requireAttachment,
        assignedDate: format(new Date(), "yyyy-MM-dd"),
      })

      // Increment date based on frequency
      switch (formData.frequency) {
        case "one-time":
          // For one-time tasks, just add the task once and then break out of the loop
          currentDate = new Date(endDate.getTime() + 86400000) // Set to after endDate to exit loop
          break
        case "daily":
          currentDate = addDays(currentDate, 1)
          break
        case "weekly":
          currentDate = addWeeks(currentDate, 1)
          break
        case "fortnightly":
          currentDate = addWeeks(currentDate, 2)
          break
        case "monthly":
          currentDate = addMonths(currentDate, 1)
          break
        case "quarterly":
          currentDate = addMonths(currentDate, 3)
          break
        case "yearly":
          currentDate = addYears(currentDate, 1)
          break
        // Handle week-ending frequencies
        case "end-of-1st-week":
        case "end-of-2nd-week":
        case "end-of-3rd-week":
        case "end-of-4th-week":
        case "end-of-last-week":
          // For demo purposes, just add a month for these special frequencies
          currentDate = addMonths(currentDate, 1)
          break
        default:
          currentDate = addDays(currentDate, 1)
      }
    }

    setGeneratedTasks(tasks)
    return tasks
  }

  // Save all tasks to the data sheet when clicking Assign & Save Task button
  const saveAllTasksToGoogleSheets = async (tasks) => {
    let success = true;
    let highestTaskId = lastTaskId;
  
    try {
      // Convert all tasks to a format suitable for the Google Sheets API
      const allRowsData = tasks.map((task) => [
        format(new Date(), "dd/MM/yyyy HH:mm:ss"),
        `TI-${task.id}`,
        task.department,
        task.givenBy,
        task.doerName,
        task.title,
        task.description,
        task.dueDate,
        task.frequency,
        task.enableReminders ? "Yes" : "No",
        task.requireAttachment ? "Yes" : "No",
      ]);
  
      // Split into batches of 20 tasks maximum
      const BATCH_SIZE = 20;
      const batches = [];
      
      for (let i = 0; i < allRowsData.length; i += BATCH_SIZE) {
        batches.push(allRowsData.slice(i, i + BATCH_SIZE));
      }
      
      console.log(`Splitting ${allRowsData.length} tasks into ${batches.length} batches`);
      
      // Process each batch sequentially
      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        console.log(`Processing batch ${i+1} of ${batches.length} (${batch.length} tasks)`);
        
        const formData = new URLSearchParams();
        formData.append("sheetName", SHEET_NAME);
        formData.append("action", "insertMultiple");
        formData.append("rowsData", JSON.stringify(batch));
        
        console.log(`Sending batch ${i+1} to Google Sheets...`);
        const response = await fetch(SCRIPT_URL, {
          method: "POST",
          body: formData,
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        });
        
        const result = await response.json();
        console.log(`Batch ${i+1} response:`, result);
        
        if (!result.success) {
          console.error(`Error in batch ${i+1}:`, result.error);
          success = false;
          break; // Stop on first error
        }
      }
  
      // Update the highest task ID
      const lastTask = tasks[tasks.length - 1];
      const lastTaskId = Number.parseInt(lastTask.id, 10);
      if (!isNaN(lastTaskId) && lastTaskId > highestTaskId) {
        highestTaskId = lastTaskId;
      }
    } catch (error) {
      console.error("Error saving tasks to Google Sheets:", error);
      success = false;
    }
  
    // Update the last task ID and save to localStorage
    if (highestTaskId > lastTaskId) {
      setLastTaskId(highestTaskId);
      localStorage.setItem("lastTaskId", highestTaskId.toString());
    }
  
    // Save all generated tasks to local storage for the All Tasks view
    saveTasksToLocalStorage(tasks);
  
    return success;
  };

  // Function to save all tasks to localStorage for the All Tasks view
  const saveTasksToLocalStorage = (tasks) => {
    // Get existing tasks from localStorage
    const existingTasksJSON = localStorage.getItem("allTasks")
    let allTasks = []

    if (existingTasksJSON) {
      try {
        allTasks = JSON.parse(existingTasksJSON)
      } catch (e) {
        console.error("Error parsing tasks from localStorage:", e)
        allTasks = []
      }
    }

    // Add all the new tasks with timestamps
    const tasksWithTimestamp = tasks.map((task) => ({
      ...task,
      createdAt: new Date().toISOString(), // Add timestamp for sorting
    }))

    // Combine with existing tasks
    allTasks = [...allTasks, ...tasksWithTimestamp]

    // Save back to localStorage
    localStorage.setItem("allTasks", JSON.stringify(allTasks))
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Check if already submitting to prevent multiple submissions
      if (isSubmitting) {
        return;
      }

      setIsSubmitting(true);

      // First generate tasks if not already generated
      let tasksToSubmit = generatedTasks;
      if (tasksToSubmit.length === 0) {
        // Generate tasks now
        tasksToSubmit = generateTasks();
        
        // If task generation failed, stop here
        if (!tasksToSubmit || tasksToSubmit.length === 0) {
          setIsSubmitting(false);
          return;
        }
      }

      console.log("About to save tasks:", tasksToSubmit.length);

      // Save the generated tasks to Google Sheets
      const success = await saveAllTasksToGoogleSheets(tasksToSubmit);

      if (success) {
        showToast(`${tasksToSubmit.length} tasks for "${formData.title}" have been assigned successfully.`, "success");

        // Reset form
        setFormData({
          department: "",
          givenBy: "",
          doer: "",
          title: "",
          description: "",
          frequency: "daily",
          enableReminders: true,
          requireAttachment: false,
        });
        setSelectedDate(new Date());
        setGeneratedTasks([]);
      } else {
        showToast("There was an error saving tasks to Google Sheets. Some tasks may not have been saved.", "error");
      }
    } catch (error) {
      console.error("Form submission error:", error);
      showToast("There was an error assigning the tasks. Please try again.", "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  const frequencies = [
    { value: "one-time", label: "One Time (No Recurrence)" },
    { value: "daily", label: "Daily" },
    { value: "weekly", label: "Weekly" },
    { value: "fortnightly", label: "Fortnightly" },
    { value: "monthly", label: "Monthly" },
    { value: "quarterly", label: "Quarterly" },
    { value: "yearly", label: "Yearly" },
    { value: "end-of-1st-week", label: "End of 1st Week" },
    { value: "end-of-2nd-week", label: "End of 2nd Week" },
    { value: "end-of-3rd-week", label: "End of 3rd Week" },
    { value: "end-of-4th-week", label: "End of 4th Week" },
    { value: "end-of-last-week", label: "End of Last Week" },
  ]

  return (
    <div className="max-w-2xl mx-auto bg-blue-50 p-6 rounded-lg shadow-md">
      <h1 className="text-2xl font-bold tracking-tight mb-6 text-purple-700">Assign New Task</h1>

      <div className="border border-purple-200 rounded-lg shadow-md">
        <form onSubmit={handleSubmit}>
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-t-lg border-b border-purple-200">
            <h2 className="text-lg font-medium text-purple-700">Task Details</h2>
            <p className="text-sm text-purple-600">Fill in the details to assign a new task to a staff member.</p>
          </div>
          <div className="p-6 space-y-4 bg-white">
            {/* Department Dropdown */}
            <div className="space-y-2">
              <label htmlFor="department" className="block text-purple-700 font-medium">
                Department
              </label>
              <select
                id="department"
                name="department"
                value={formData.department}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 rounded-md bg-white border border-purple-200 text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-300"
              >
                <option value="">Select a department</option>
                {masterData.departments.map((dept) => (
                  <option key={dept.id} value={dept.id.toString()}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Given By Dropdown */}
            <div className="space-y-2">
              <label htmlFor="givenBy" className="block text-purple-700 font-medium">
                Given By
              </label>
              <select
                id="givenBy"
                name="givenBy"
                value={formData.givenBy}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 rounded-md bg-white border border-purple-200 text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-300"
              >
                <option value="">Select who is assigning this task</option>
                {masterData.givenBy.map((person) => (
                  <option key={person.id} value={person.id.toString()}>
                    {person.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="doer" className="block text-purple-700 font-medium">
                Doer's Name
              </label>
              <select
                id="doer"
                name="doer"
                value={formData.doer}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 rounded-md bg-white border border-purple-200 text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-300"
              >
                <option value="">Select a staff member</option>
                {masterData.doers.map((person) => (
                  <option key={person.id} value={person.id.toString()}>
                    {person.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label htmlFor="title" className="block text-purple-700 font-medium">
                Task Title
              </label>
              <input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Enter task title"
                required
                className="w-full px-4 py-2 rounded-md bg-white border border-purple-200 text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-300"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="description" className="block text-purple-700 font-medium">
                Task Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Enter task description"
                rows={4}
                className="w-full px-4 py-2 rounded-md bg-white border border-purple-200 text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-300"
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="date" className="block text-purple-700 font-medium">
                  Task Start Date
                </label>
                <input
                  id="date"
                  type="date"
                  value={format(date, "yyyy-MM-dd")}
                  onChange={(e) => setSelectedDate(new Date(e.target.value))}
                  className="w-full px-4 py-2 rounded-md bg-white border border-purple-200 text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-300"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="frequency" className="block text-purple-700 font-medium">
                  Frequency
                </label>
                <select
                  id="frequency"
                  name="frequency"
                  value={formData.frequency}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-md bg-white border border-purple-200 text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-300"
                >
                  {frequencies.map((freq) => (
                    <option key={freq.value} value={freq.value}>
                      {freq.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-purple-100">
              <h3 className="text-lg font-medium text-purple-700 pt-2">Additional Options</h3>

              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-md">
                <div className="space-y-0.5">
                  <label htmlFor="enable-reminders" className="block text-purple-700 font-medium">
                    Enable Reminders
                  </label>
                  <p className="text-sm text-purple-600">Send reminders before task due date</p>
                </div>
                <div className="flex items-center space-x-2">
                  <i className="fas fa-bell h-4 w-4 text-purple-500"></i>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      id="enable-reminders"
                      checked={formData.enableReminders}
                      onChange={() => handleSwitchChange("enableReminders")}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-md">
                <div className="space-y-0.5">
                  <label htmlFor="require-attachment" className="block text-purple-700 font-medium">
                    Require Attachment
                  </label>
                  <p className="text-sm text-purple-600">User must upload a file when completing task</p>
                </div>
                <div className="flex items-center space-x-2">
                  <i className="fas fa-file-check h-4 w-4 text-purple-500"></i>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      id="require-attachment"
                      checked={formData.requireAttachment}
                      onChange={() => handleSwitchChange("requireAttachment")}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={generateTasks}
              className="w-full py-2 px-4 mt-4 bg-purple-50 hover:bg-purple-100 text-purple-700 font-medium border border-purple-200 hover:border-purple-300 rounded-md transition duration-200 ease-in-out shadow-sm"
            >
              {generatedTasks.length > 0 ? "Regenerate Tasks" : "Preview Generated Tasks"}
            </button>

            {generatedTasks.length > 0 && (
              <div className="border border-purple-200 rounded-md shadow-sm mt-4">
                <div
                  className="p-3 border-b border-purple-200 text-purple-700 font-medium cursor-pointer flex justify-between items-center bg-purple-50"
                  onClick={() => {
                    const accordion = document.getElementById("tasks-accordion")
                    if (accordion) {
                      accordion.classList.toggle("hidden")
                    }
                  }}
                >
                  <span>{generatedTasks.length} Tasks Generated</span>
                  <i className="fas fa-chevron-down"></i>
                </div>
                <div id="tasks-accordion" className="hidden">
                  <div className="max-h-60 overflow-y-auto space-y-2 p-3 bg-white">
                    {generatedTasks.slice(0, 20).map((task, index) => (
                      <div
                        key={index}
                        className="text-sm p-3 border rounded-md border-purple-200 bg-purple-50 hover:bg-purple-100 transition-colors"
                      >
                        <div className="font-medium text-purple-700">
                          <span className="bg-purple-200 text-purple-800 px-2 py-1 rounded-md mr-2">TI-{task.id}</span>
                          {task.title}
                        </div>
                        <div className="text-xs text-purple-600">
                          <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full mr-2">
                            {task.department}
                          </span>
                          Due: {task.dueDate}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Assigned by: {task.givenBy} • To: {task.doerName}
                        </div>
                        <div className="flex space-x-2 mt-2">
                          {task.enableReminders && (
                            <span className="inline-flex items-center text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                              <i className="fas fa-bell h-3 w-3 mr-1"></i> Reminders
                            </span>
                          )}
                          {task.requireAttachment && (
                            <span className="inline-flex items-center text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full">
                              <i className="fas fa-file-check h-3 w-3 mr-1"></i> Attachment Required
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                    {generatedTasks.length > 20 && (
                      <button
                        onClick={() => {
                          const accordion = document.getElementById("tasks-accordion")
                          if (accordion) {
                            const currentTasks = accordion.querySelectorAll("div > div")
                            if (currentTasks.length <= 20) {
                              // Show all tasks
                              accordion.querySelector("div").innerHTML = ""
                              generatedTasks.forEach((task, index) => {
                                const taskDiv = document.createElement("div")
                                taskDiv.className =
                                  "text-sm p-3 border rounded-md border-purple-200 bg-purple-50 hover:bg-purple-100 transition-colors"
                                taskDiv.innerHTML = `
                                  <div class="font-medium text-purple-700">
                                    <span class="bg-purple-200 text-purple-800 px-2 py-1 rounded-md mr-2">TI-${task.id}</span>
                                    ${task.title}
                                  </div>
                                  <div class="text-xs text-purple-600">
                                    <span class="bg-blue-100 text-blue-700 px-2 py-1 rounded-full mr-2">${task.department}</span>
                                    Due: ${task.dueDate}
                                  </div>
                                  <div class="text-xs text-gray-500 mt-1">
                                    Assigned by: ${task.givenBy} • To: ${task.doerName}
                                  </div>
                                  <div class="flex space-x-2 mt-2">
                                    ${
                                      task.enableReminders
                                        ? `
                                      <span class="inline-flex items-center text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                                        <i class="fas fa-bell h-3 w-3 mr-1"></i> Reminders
                                      </span>
                                    `
                                        : ""
                                    }
                                    ${
                                      task.requireAttachment
                                        ? `
                                      <span class="inline-flex items-center text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full">
                                        <i class="fas fa-file-check h-3 w-3 mr-1"></i> Attachment Required
                                      </span>
                                    `
                                        : ""
                                    }
                                  </div>
                                `
                                accordion.querySelector("div").appendChild(taskDiv)
                              })
                            }
                          }
                        }}
                        className="block text-center text-purple-600 hover:text-purple-800 font-medium py-2"
                      >
                        Show All Tasks
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-3 px-4 mt-6 ${
                generatedTasks.length > 0 
                ? "bg-purple-600 hover:bg-purple-700" 
                : "bg-purple-600 hover:bg-purple-700"
              } text-white font-medium rounded-md transition duration-200 ease-in-out shadow-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50`}
            >
              {isSubmitting ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i> Assigning Tasks...
                </>
              ) : (
                generatedTasks.length > 0 ? "Assign & Save Tasks" : "Generate & Save Tasks"
              )}
            </button>
          </div>
        </form>
      </div>

      {toast.show && (
        <div
          className={`fixed bottom-6 right-6 z-50 max-w-sm rounded-md shadow-lg overflow-hidden pointer-events-auto ring-1 ring-black ring-opacity-5 ${
            toast.type === "success" ? "bg-green-50" : "bg-red-50"
          }`}
        >
          <div className="p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                {toast.type === "success" ? (
                  <i className="fas fa-check-circle text-green-600 h-6 w-6" aria-hidden="true"></i>
                ) : (
                  <i className="fas fa-exclamation-circle text-red-600 h-6 w-6" aria-hidden="true"></i>
                )}
              </div>
              <div className="ml-3 w-0 flex-1 pt-0.5">
                <p className="text-sm font-medium text-gray-900">{toast.type === "success" ? "Success!" : "Error!"}</p>
                <p className="mt-1 text-sm text-gray-500">{toast.message}</p>
              </div>
              <div className="ml-4 flex-shrink-0">
                <button
                  type="button"
                  className="bg-transparent rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  onClick={() => setToast({ show: false, message: "", type: "" })}
                >
                  <span className="sr-only">Close</span>
                  <i className="fas fa-times h-5 w-5"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AssignTaskPage
