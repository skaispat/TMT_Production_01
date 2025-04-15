// "use client"

// import { useState, useEffect } from "react"
// import {
//   BarChart,
//   Bar,
//   PieChart,
//   Pie,
//   Cell,
//   XAxis,
//   YAxis,
//   CartesianGrid,
//   Tooltip,
//   Legend,
//   ResponsiveContainer,
// } from "recharts"

// export default function TaskDashboard() {
//   // Google Sheets configuration - same as in your AllTasks component
//   const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyAAyUM9m_Oe_6XAmWYIgO0ENNXgt9ox8vBWwnB4f87Lf883RGvBi4xOL9kxLyDq1dtqA/exec"
//   const SHEET_NAME = "DATA"
//   const SHEET_ID = "1jOBkMxcHrusTlAV9l21JN-B-5QWq1dDyj3-0kxbK6ik" // Your specific sheet ID
//   const MASTER_SHEET = "MASTER" // Sheet containing staff info

//   // States
//   const [timeframe, setTimeframe] = useState("weekly")
//   const [taskView, setTaskView] = useState("recent")
//   const [filterStatus, setFilterStatus] = useState("all")
//   const [filterStaff, setFilterStaff] = useState("all")
//   const [searchQuery, setSearchQuery] = useState("")
//   const [activeTab, setActiveTab] = useState("overview")
  
//   // Data states
//   const [allTasks, setAllTasks] = useState([])
//   const [staffMembers, setStaffMembers] = useState([])
//   const [activeStaffCount, setActiveStaffCount] = useState(0)
//   const [isLoading, setIsLoading] = useState(true)
//   const [error, setError] = useState(null)
  
//   // Derived task counts
//   const [taskCounts, setTaskCounts] = useState({
//     total: 0,
//     completed: 0,
//     pending: 0,
//     overdue: 0
//   })
  
//   // Chart data
//   const [monthlyData, setMonthlyData] = useState([])
//   const [pieData, setPieData] = useState([])
  
//   // Helper function to parse and format dates in the specific format "14/04/2025 12:48:29"
//   const parseDate = (dateString) => {
//     if (!dateString) return null;
    
//     try {
//       // Try to handle the format "14/04/2025 12:48:29"
//       if (dateString.includes('/')) {
//         const [datePart, timePart] = dateString.split(' ');
//         const [day, month, year] = datePart.split('/');
        
//         // Create date object (month is 0-indexed in JS Date)
//         return new Date(year, month - 1, day);
//       }
      
//       // Fallback to standard date parsing
//       return new Date(dateString);
//     } catch (e) {
//       console.error("Error parsing date:", dateString, e);
//       return null;
//     }
//   }
  
//   // Helper to check if a date matches today's date (only comparing day, month, year)
//   const isToday = (dateStr) => {
//     if (!dateStr) return false;
    
//     const date = parseDate(dateStr);
//     if (!date) return false;
    
//     const today = new Date();
//     return date.getDate() === today.getDate() && 
//            date.getMonth() === today.getMonth() && 
//            date.getFullYear() === today.getFullYear();
//   }
  
//   // Helper to check if a date matches tomorrow's date (only comparing day, month, year)
//   const isTomorrow = (dateStr) => {
//     if (!dateStr) return false;
    
//     const date = parseDate(dateStr);
//     if (!date) return false;
    
//     const tomorrow = new Date();
//     tomorrow.setDate(tomorrow.getDate() + 1);
    
//     return date.getDate() === tomorrow.getDate() && 
//            date.getMonth() === tomorrow.getMonth() && 
//            date.getFullYear() === tomorrow.getFullYear();
//   }
  
//   // Helper to check if a date is before 2 months from today
//   const isOverdue = (dateStr) => {
//     if (!dateStr) return false;
    
//     const date = parseDate(dateStr);
//     if (!date) return false;
    
//     const twoMonthsAgo = new Date();
//     twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
    
//     return date < twoMonthsAgo;
//   }

//   // Fetch tasks from Google Sheets
//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         setIsLoading(true);
        
//         // Create form data for the tasks request
//         const formData = new FormData();
//         formData.append('action', 'fetchTasks');
//         formData.append('sheetId', SHEET_ID);
//         formData.append('sheetName', SHEET_NAME);
        
//         const response = await fetch(SCRIPT_URL, {
//           method: 'POST',
//           body: formData
//         });
        
//         const data = await response.json();
        
//         if (data && data.success) {
//           console.log("Task data fetched:", data);
//           setAllTasks(data.tasks);
          
//           // Process task counts based on columns L and M
//           const colLIndex = 11; // 0-indexed, L is 12th column (0-11)
//           const colMIndex = 12; // 0-indexed, M is 13th column (0-12)
//           // Column E for staff names (4th column, 0-indexed)
//           const colEIndex = 4;
          
//           // Get column IDs
//           const colLId = data.headers[colLIndex]?.id || 'colL';
//           const colMId = data.headers[colMIndex]?.id || 'colM';
//           const colEId = data.headers[colEIndex]?.id || 'colE';
          
//           console.log("Column IDs:", {L: colLId, M: colMId, E: colEId});
          
//           // Count tasks
//           const total = data.tasks.length;
//           const completed = data.tasks.filter(task => 
//             task[colLId] !== undefined && 
//             task[colLId] !== null && 
//             task[colLId].toString().trim() !== '' &&
//             task[colMId] !== undefined && 
//             task[colMId] !== null && 
//             task[colMId].toString().trim() !== ''
//           ).length;
          
//           const pending = data.tasks.filter(task => 
//             task[colLId] !== undefined && 
//             task[colLId] !== null && 
//             task[colLId].toString().trim() !== '' &&
//             (task[colMId] === undefined || 
//              task[colMId] === null || 
//              task[colMId].toString().trim() === '') &&
//             !isOverdue(task[colLId])
//           ).length;
          
//           const overdue = data.tasks.filter(task => 
//             task[colLId] !== undefined && 
//             task[colLId] !== null && 
//             task[colLId].toString().trim() !== '' &&
//             (task[colMId] === undefined || 
//              task[colMId] === null || 
//              task[colMId].toString().trim() === '') &&
//             isOverdue(task[colLId])
//           ).length;
          
//           setTaskCounts({
//             total,
//             completed,
//             pending,
//             overdue
//           });
          
//           // Get unique staff names from column E
//           const uniqueStaffNames = new Set();
//           data.tasks.forEach(task => {
//             if (task[colEId] && task[colEId].toString().trim() !== '') {
//               uniqueStaffNames.add(task[colEId].toString().trim());
//             }
//           });
          
//           // Generate staff member data based on column E
//           const staffData = Array.from(uniqueStaffNames).map((name, index) => {
//             // Count tasks for this staff member
//             const staffTasks = data.tasks.filter(task => 
//               task[colEId] && task[colEId].toString().trim() === name
//             );
            
//             const totalTasks = staffTasks.length;
            
//             // Count completed tasks (column L and M not null)
//             const completedTasks = staffTasks.filter(task => 
//               task[colLId] !== undefined && 
//               task[colLId] !== null && 
//               task[colLId].toString().trim() !== '' &&
//               task[colMId] !== undefined && 
//               task[colMId] !== null && 
//               task[colMId].toString().trim() !== ''
//             ).length;
            
//             const pendingTasks = totalTasks - completedTasks;
//             const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
            
//             return {
//               id: index + 1,
//               name: name,
//               email: `${name.toLowerCase().replace(/\s+/g, '.')}@example.com`, // Placeholder email
//               totalTasks: totalTasks,
//               completedTasks: completedTasks,
//               pendingTasks: pendingTasks,
//               progress: progress
//             };
//           });
          
//           setStaffMembers(staffData);
          
//           // Prepare monthly data for charts
//           const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
//           const currentMonth = new Date().getMonth();
//           const lastSixMonths = [];
          
//           for (let i = 6; i >= 0; i--) {
//             const monthIndex = (currentMonth - i + 12) % 12;
//             lastSixMonths.push(monthNames[monthIndex]);
//           }
          
//           // Create chart data based on the task completion status per month
//           const chartData = lastSixMonths.map(monthName => {
//             const monthIndex = monthNames.indexOf(monthName);
            
//             // Count tasks for this month
//             const monthTasks = data.tasks.filter(task => {
//               if (!task[colLId]) return false;
              
//               const taskDate = parseDate(task[colLId]);
//               return taskDate && taskDate.getMonth() === monthIndex;
//             });
            
//             const monthCompleted = monthTasks.filter(task => 
//               task[colMId] !== undefined && 
//               task[colMId] !== null && 
//               task[colMId].toString().trim() !== ''
//             ).length;
            
//             const monthPending = monthTasks.filter(task => 
//               task[colMId] === undefined || 
//               task[colMId] === null || 
//               task[colMId].toString().trim() === ''
//             ).length;
            
//             return {
//               name: monthName,
//               completed: monthCompleted,
//               pending: monthPending
//             };
//           });
          
//           setMonthlyData(chartData);
          
//           // Create pie chart data
//           setPieData([
//             { name: "Completed", value: completed, color: "#4ade80" },
//             { name: "Pending", value: pending, color: "#facc15" },
//             { name: "Overdue", value: overdue, color: "#fb7185" }
//           ]);
          
//           // Fetch staff data from MASTER sheet
//           fetchStaffData();
//         } else {
//           console.error("Error fetching tasks:", data?.error || "Unknown error");
//           setError(data?.error || "Failed to load tasks");
//         }
//       } catch (error) {
//         console.error("Error fetching tasks:", error);
//         setError("Network error or failed to fetch tasks");
//       } finally {
//         setIsLoading(false);
//       }
//     };
    
//    // Modified fetchStaffData function that uses the existing 'fetchTasks' action
// const fetchStaffData = async () => {
//   try {
//     // Use the existing 'fetchTasks' action but specify MASTER sheet
//     const formData = new FormData();
//     formData.append('action', 'fetchTasks'); // Use fetchTasks instead of fetchStaff
//     formData.append('sheetId', SHEET_ID);
//     formData.append('sheetName', MASTER_SHEET);
    
//     const response = await fetch(SCRIPT_URL, {
//       method: 'POST',
//       body: formData
//     });
    
//     const data = await response.json();
    
//     if (data && data.success) {
//       console.log("Staff data fetched from MASTER sheet:", data);
      
//       // Find the index for column C
//       const columnCIndex = 2; // 0-indexed, C is the 3rd column (0-2)
//       const colCId = data.headers?.[columnCIndex]?.id || 'colC';
      
//       // Count non-empty rows in column C (excluding header row)
//       const staffCount = data.tasks.filter(row => 
//         row[colCId] !== undefined && 
//         row[colCId] !== null && 
//         row[colCId].toString().trim() !== ''
//       ).length;
      
//       console.log("Active staff count from column C:", staffCount);
//       setActiveStaffCount(staffCount);
//     } else {
//       console.error("Error fetching staff data:", data?.error || "Unknown error");
//       // If there's an error, we'll set a default count - you might have a different fallback strategy
//       setActiveStaffCount(data.tasks?.length || 0);
//     }
//   } catch (error) {
//     console.error("Error in fetchStaffData:", error);
//     setActiveStaffCount(0); // Fallback in case of error
//   }
// };

// // To implement this fix, replace your current fetchStaffData function with this one
// // in your useEffect that fetches the data
    
//     fetchData();
//   }, []);

//   // Filter tasks based on the filter criteria
//   const filteredTasks = allTasks.filter((task) => {
//     // Find column indices
//     const colLIndex = 11; // 0-indexed, L is 12th column (0-11)
//     const colMIndex = 12; // 0-indexed, M is 13th column (0-12)
//     const colEIndex = 4;  // 0-indexed, E is 5th column (0-4)
    
//     // Get column IDs
//     const colLId = 'colL';
//     const colMId = 'colM';
//     const colEId = 'colE';
    
//     // Filter by status
//     if (filterStatus !== "all") {
//       if (filterStatus === "completed" && 
//           (!task[colLId] || !task[colMId])) {
//         return false;
//       }
//       if (filterStatus === "pending" && 
//           (!task[colLId] || task[colMId] || isOverdue(task[colLId]))) {
//         return false;
//       }
//       if (filterStatus === "overdue" && 
//           (!task[colLId] || task[colMId] || !isOverdue(task[colLId]))) {
//         return false;
//       }
//     }

//     // Filter by staff (using column E)
//     if (filterStaff !== "all") {
//       if (!task[colEId] || task[colEId].toString().trim() !== filterStaff) {
//         return false;
//       }
//     }

//     // Filter by search query (searches all fields)
//     if (searchQuery) {
//       const query = searchQuery.toLowerCase();
//       return Object.values(task).some(value => 
//         value && value.toString().toLowerCase().includes(query)
//       );
//     }

//     return true;
//   });

//   // Filter tasks based on the tab view
//   const getTasksByView = (view) => {
//     // Column L ID
//     const colLId = 'colL';
//     const colMId = 'colM';
    
//     switch (view) {
//       case "recent":
//         // Tasks with column L matching today's date (format: "14/04/2025 12:48:29")
//         return filteredTasks.filter(task => isToday(task[colLId]));
        
//       case "upcoming":
//         // Tasks with column L matching tomorrow's date
//         return filteredTasks.filter(task => isTomorrow(task[colLId]));
        
//       case "overdue":
//         // Tasks with column L with date at least 2 months ago and column M is null
//         return filteredTasks.filter(task => 
//           isOverdue(task[colLId]) && 
//           (!task[colMId] || task[colMId].toString().trim() === '')
//         );
        
//       default:
//         return filteredTasks;
//     }
//   };

//   // Get status badge color
//   const getStatusBadge = (status) => {
//     switch (status) {
//       case "completed":
//         return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-500 text-white">Completed</span>;
//       case "pending":
//         return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-amber-500 text-white">Pending</span>;
//       case "overdue":
//         return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-500 text-white">Overdue</span>;
//       default:
//         return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-500 text-white">Unknown</span>;
//     }
//   };

//   // Get frequency badge color
//   const getFrequencyBadge = (frequency) => {
//     switch (frequency) {
//       case "daily":
//         return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-500 text-white">Daily</span>;
//       case "weekly":
//         return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-purple-500 text-white">Weekly</span>;
//       case "monthly":
//         return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-orange-500 text-white">Monthly</span>;
//       default:
//         return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-500 text-white">One-time</span>;
//     }
//   };

//   // Render loading state
//   if (isLoading) {
//     return (
//       <div className="flex justify-center items-center h-screen">
//         <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-purple-500"></div>
//       </div>
//     );
//   }

//   // Render error state
//   if (error) {
//     return (
//       <div className="flex justify-center items-center h-screen">
//         <div className="text-center">
//           <p className="text-red-500 text-xl mb-4">{error}</p>
//           <button 
//             onClick={() => window.location.reload()}
//             className="px-4 py-2 bg-purple-600 text-white rounded-md"
//           >
//             Try Again
//           </button>
//         </div>
//       </div>
//     );
//   }

//   // Calculate task completion rate
//   const completionRate = taskCounts.total > 0 
//     ? ((taskCounts.completed / taskCounts.total) * 100).toFixed(1)
//     : 0;
    
//   // Calculate on-time vs late completion (placeholder values)
//   const onTimePercentage = parseFloat(completionRate) * 0.9; // 90% of completions are on time (example)
//   const latePercentage = parseFloat(completionRate) - onTimePercentage;

//   return (
//     <div className="min-h-screen bg-gray-50">
//       <div className="overflow-auto">
//         <div className="p-6 max-w-7xl mx-auto">
//           {/* Header */}
//           <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
//             <h1 className="text-2xl font-bold text-purple-700">Admin Dashboard</h1>
//             {/* <div className="mt-2 md:mt-0">
//               <select
//                 value={timeframe}
//                 onChange={(e) => setTimeframe(e.target.value)}
//                 className="border border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
//               >
//                 <option value="weekly">Weekly</option>
//                 <option value="monthly">Monthly</option>
//                 <option value="quarterly">Quarterly</option>
//                 <option value="yearly">Yearly</option>
//               </select>
//             </div> */}
//           </div>

//           {/* Stats cards */}
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
//             <div className="border border-l-4 border-l-blue-500 rounded-lg shadow-sm bg-white">
//               <div className="p-3 pb-2 bg-gradient-to-r from-blue-50 to-blue-100 border-b">
//                 <div className="flex justify-between items-center">
//                   <h3 className="text-sm font-medium text-blue-700">Total Tasks</h3>
//                   <svg
//                     xmlns="http://www.w3.org/2000/svg"
//                     className="h-4 w-4 text-blue-500"
//                     viewBox="0 0 20 20"
//                     fill="currentColor"
//                   >
//                     <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
//                     <path
//                       fillRule="evenodd"
//                       d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z"
//                       clipRule="evenodd"
//                     />
//                   </svg>
//                 </div>
//               </div>
//               <div className="p-4">
//                 <div className="text-3xl font-bold text-blue-700">{taskCounts.total}</div>
//                 <p className="text-xs text-blue-600">All tasks in DATA sheet</p>
//               </div>
//             </div>

//             <div className="border border-l-4 border-l-green-500 rounded-lg shadow-sm bg-white">
//               <div className="p-3 pb-2 bg-gradient-to-r from-green-50 to-green-100 border-b">
//                 <div className="flex justify-between items-center">
//                   <h3 className="text-sm font-medium text-green-700">Completed Tasks</h3>
//                   <svg
//                     xmlns="http://www.w3.org/2000/svg"
//                     className="h-4 w-4 text-green-500"
//                     viewBox="0 0 20 20"
//                     fill="currentColor"
//                   >
//                     <path
//                       fillRule="evenodd"
//                       d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
//                       clipRule="evenodd"
//                     />
//                   </svg>
//                 </div>
//               </div>
//               <div className="p-4">
//                 <div className="text-3xl font-bold text-green-700">{taskCounts.completed}</div>
//                 <p className="text-xs text-green-600">Column L & M not null</p>
//               </div>
//             </div>

//             <div className="border border-l-4 border-l-amber-500 rounded-lg shadow-sm bg-white">
//               <div className="p-3 pb-2 bg-gradient-to-r from-amber-50 to-amber-100 border-b">
//                 <div className="flex justify-between items-center">
//                   <h3 className="text-sm font-medium text-amber-700">Pending Tasks</h3>
//                   <svg
//                     xmlns="http://www.w3.org/2000/svg"
//                     className="h-4 w-4 text-amber-500"
//                     viewBox="0 0 20 20"
//                     fill="currentColor"
//                   >
//                     <path
//                       fillRule="evenodd"
//                       d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
//                       clipRule="evenodd"
//                     />
//                   </svg>
//                 </div>
//               </div>
//               <div className="p-4">
//                 <div className="text-3xl font-bold text-amber-700">{taskCounts.pending}</div>
//                 <p className="text-xs text-amber-600">Column L not null, M null, not overdue</p>
//               </div>
//             </div>

//             <div className="border border-l-4 border-l-red-500 rounded-lg shadow-sm bg-white">
//               <div className="p-3 pb-2 bg-gradient-to-r from-red-50 to-red-100 border-b">
//                 <div className="flex justify-between items-center">
//                   <h3 className="text-sm font-medium text-red-700">Overdue Tasks</h3>
//                   <svg
//                     xmlns="http://www.w3.org/2000/svg"
//                     className="h-4 w-4 text-red-500"
//                     viewBox="0 0 20 20"
//                     fill="currentColor"
//                   >
//                     <path
//                       fillRule="evenodd"
//                       d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
//                       clipRule="evenodd"
//                     />
//                   </svg>
//                 </div>
//               </div>
//               <div className="p-4">
//                 <div className="text-3xl font-bold text-red-700">{taskCounts.overdue}</div>
//                 <p className="text-xs text-red-600">Column L date 2+ months old, M null</p>
//               </div>
//             </div>
//           </div>

//           {/* Task tabs */}
//           {/* <div className="mb-6">
//             <div className="grid grid-cols-3 bg-white border border-gray-200 rounded-t-lg overflow-hidden">
//               <button
//                 className={`py-3 text-center font-medium transition-colors ${
//                   taskView === "recent" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
//                 }`}
//                 onClick={() => setTaskView("recent")}
//               >
//                 Recent Tasks (Today)
//               </button>
//               <button
//                 className={`py-3 text-center font-medium transition-colors ${
//                   taskView === "upcoming" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
//                 }`}
//                 onClick={() => setTaskView("upcoming")}
//               >
//                 Upcoming Tasks (Tomorrow)
//               </button>
//               <button
//                 className={`py-3 text-center font-medium transition-colors ${
//                   taskView === "overdue" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
//                 }`}
//                 onClick={() => setTaskView("overdue")}
//               >
//                 Overdue Tasks (2+ months)
//               </button>
//             </div>

//             <div className="border border-t-0 border-gray-200 rounded-b-lg bg-white p-4">
//               <div className="flex flex-col md:flex-row gap-4 mb-6">
//                 <div className="flex-1">
//                   <div className="flex items-center mb-2">
//                     <svg
//                       xmlns="http://www.w3.org/2000/svg"
//                       className="h-4 w-4 mr-2 text-purple-700"
//                       viewBox="0 0 20 20"
//                       fill="currentColor"
//                     >
//                       <path
//                         fillRule="evenodd"
//                         d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
//                         clipRule="evenodd"
//                       />
//                     </svg>
//                     <label className="text-sm font-medium text-purple-700">Search Tasks</label>
//                   </div>
//                   <input
//                     type="text"
//                     placeholder="Search by task title"
//                     value={searchQuery}
//                     onChange={(e) => setSearchQuery(e.target.value)}
//                     className="w-full border border-purple-200 rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
//                   />
//                 </div>
//                 <div className="w-full md:w-48">
//                   <div className="flex items-center mb-2">
//                     <svg
//                       xmlns="http://www.w3.org/2000/svg"
//                       className="h-4 w-4 mr-2 text-purple-700"
//                       viewBox="0 0 20 20"
//                       fill="currentColor"
//                     >
//                       <path
//                         fillRule="evenodd"
//                         d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z"
//                         clipRule="evenodd"
//                       />
//                     </svg>
//                     <label className="text-sm font-medium text-purple-700">Filter by Status</label>
//                   </div>
//                   <select
//                     value={filterStatus}
//                     onChange={(e) => setFilterStatus(e.target.value)}
//                     className="w-full border border-purple-200 rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
//                   >
//                     <option value="all">All Statuses</option>
//                     <option value="pending">Pending</option>
//                     <option value="completed">Completed</option>
//                     <option value="overdue">Overdue</option>
//                   </select>
//                 </div>
//                 <div className="w-full md:w-48">
//                   <div className="flex items-center mb-2">
//                     <svg
//                       xmlns="http://www.w3.org/2000/svg"
//                       className="h-4 w-4 mr-2 text-purple-700"
//                       viewBox="0 0 20 20"
//                       fill="currentColor"
//                     >
//                       <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
//                     </svg>
//                     <label className="text-sm font-medium text-purple-700">Filter by Staff</label>
//                   </div>
//                   <select
//                     value={filterStaff}
//                     onChange={(e) => setFilterStaff(e.target.value)}
//                     className="w-full border border-purple-200 rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
//                   >
//                     <option value="all">All Staff</option>
//                     {staffMembers.map((staff) => (
//                       <option key={staff.id} value={staff.name}>
//                         {staff.name}
//                       </option>
//                     ))}
//                   </select>
//                 </div>
//               </div>

//               {getTasksByView(taskView).length === 0 ? (
//                 <div className="text-center p-8 text-gray-500">
//                   <p>No tasks found matching your filters.</p>
//                 </div>
//               ) : (
//                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//                   {getTasksByView(taskView).map((task, index) => {
//                     // Determine task status based on columns L and M
//                     const colLId = 'colL';
//                     const colMId = 'colM';
                    
//                     let status = "unknown";
//                     if (task[colLId] && task[colMId]) {
//                       status = "completed";
//                     } else if (task[colLId] && !task[colMId] && !isOverdue(task[colLId])) {
//                       status = "pending";
//                     } else if (task[colLId] && !task[colMId] && isOverdue(task[colLId])) {
//                       status = "overdue";
//                     }
                    
//                     // Get frequency value - assuming there's a frequency column
//                     // Replace this with your actual frequency column
//                     const frequency = task.frequency || "daily"; 
                    
//                     return (
//                       <div
//                         key={index}
//                         className="border border-purple-200 rounded-lg shadow-sm hover:shadow-md transition-all bg-white"
//                       >
//                         <div className="p-4 pb-2 bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-200">
//                           <div className="flex items-center justify-between">
//                             <h3 className="text-md font-semibold text-purple-700">{task.title || `Task #${index + 1}`}</h3>
//                             {getStatusBadge(status)}
//                           </div>
//                           <p className="text-sm text-purple-600">Assigned to: {task.colE || "Unassigned"}</p>
//                         </div>
//                         <div className="p-4 pt-4">
//                           <div className="flex items-center justify-between">
//                             <div className="text-sm text-gray-600">Due: {task[colLId] || "No date"}</div>
//                             {getFrequencyBadge(frequency)}
//                           </div>
//                         </div>
//                       </div>
//                     );
//                   })}
//                 </div>
//               )}
//             </div>
//           </div> */}

//           {/* Bottom stats */}
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//             <div className="border border-l-4 border-l-purple-500 rounded-lg shadow-sm bg-white">
//               <div className="p-3 pb-2 bg-gradient-to-r from-purple-50 to-purple-100 border-b">
//                 <div className="flex justify-between items-center">
//                   <h3 className="text-sm font-medium text-purple-700">Active Staff</h3>
//                   <svg
//                     xmlns="http://www.w3.org/2000/svg"
//                     className="h-4 w-4 text-purple-500"
//                     viewBox="0 0 20 20"
//                     fill="currentColor"
//                   >
//                     <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
//                   </svg>
//                 </div>
//               </div>
//               <div className="p-4">
//                 <div className="text-3xl font-bold text-purple-700">{activeStaffCount}</div>
//                 <p className="text-xs text-purple-600">Staff members in MASTER sheet column C</p>
//               </div>
//             </div>

//             <div className="border border-l-4 border-l-purple-500 rounded-lg shadow-sm bg-white">
//               <div className="p-3 pb-2 bg-gradient-to-r from-purple-50 to-purple-100 border-b">
//                 <div className="flex justify-between items-center">
//                   <h3 className="text-sm font-medium text-purple-700">Task Completion Rate</h3>
//                   <div className="h-4 w-4 text-purple-500">📊</div>
//                 </div>
//               </div>
//               <div className="p-4">
//                 <div className="text-3xl font-bold text-purple-700">{completionRate}%</div>
//                 <div className="mt-2">
//                   <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
//                     <div
//                       className="h-full bg-gradient-to-r from-green-500 to-yellow-500"
//                       style={{ width: `${completionRate}%` }}
//                     ></div>
//                   </div>
//                   <div className="flex justify-between mt-1 text-xs">
//                     <div className="flex items-center gap-1">
//                       <div className="w-2 h-2 rounded-full bg-green-500"></div>
//                       <span>On Time: {onTimePercentage.toFixed(1)}%</span>
//                     </div>
//                     <div className="flex items-center gap-1">
//                       <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
//                       <span>Late: {latePercentage.toFixed(1)}%</span>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>

//           {/* Main tabs */}
//           <div className="mb-6">
//             <div className="flex bg-white border border-gray-200 p-0 h-auto">
//               <button
//                 onClick={() => setActiveTab("overview")}
//                 className={`px-4 py-2 ${
//                   activeTab === "overview" ? "bg-purple-600 text-white" : "text-gray-600 hover:bg-gray-100"
//                 }`}
//               >
//                 Overview
//               </button>
//               <button
//                 onClick={() => setActiveTab("mis")}
//                 className={`px-4 py-2 ${
//                   activeTab === "mis" ? "bg-purple-600 text-white" : "text-gray-600 hover:bg-gray-100"
//                 }`}
//               >
//                 MIS Report
//               </button>
//               <button
//                 onClick={() => setActiveTab("staff")}
//                 className={`px-4 py-2 ${
//                   activeTab === "staff" ? "bg-purple-600 text-white" : "text-gray-600 hover:bg-gray-100"
//                 }`}
//               >
//                 Staff Performance
//               </button>
//             </div>

//             {activeTab === "overview" && (
//               <div className="mt-6">
//                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
//                   {/* Tasks Overview Chart */}
//                   <div className="border rounded-lg shadow-sm bg-white">
//                     <div className="p-4 bg-gradient-to-r from-purple-50 to-purple-100 border-b">
//                       <h3 className="text-lg font-semibold text-purple-700">Tasks Overview</h3>
//                       <p className="text-sm text-purple-600">Task completion rate over time</p>
//                     </div>
//                     <div className="p-4 pt-6">
//                       <ResponsiveContainer width="100%" height={300}>
//                         <BarChart data={monthlyData}>
//                           <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
//                           <XAxis dataKey="name" />
//                           <YAxis />
//                           <Tooltip />
//                           <Legend />
//                           <Bar dataKey="completed" name="Completed" fill="#4ade80" />
//                           <Bar dataKey="pending" name="Pending" fill="#fb7185" />
//                         </BarChart>
//                       </ResponsiveContainer>
//                     </div>
//                   </div>

//                   {/* Task Status Chart */}
//                   <div className="border rounded-lg shadow-sm bg-white">
//                     <div className="p-4 bg-gradient-to-r from-purple-50 to-purple-100 border-b">
//                       <h3 className="text-lg font-semibold text-purple-700">Task Status</h3>
//                       <p className="text-sm text-purple-600">Distribution of tasks by status</p>
//                     </div>
//                     <div className="p-4 pt-6">
//                       <ResponsiveContainer width="100%" height={300}>
//                         <PieChart>
//                           <Pie
//                             data={pieData}
//                             cx="50%"
//                             cy="50%"
//                             innerRadius={60}
//                             outerRadius={80}
//                             paddingAngle={2}
//                             dataKey="value"
//                           >
//                             {pieData.map((entry, index) => (
//                               <Cell key={`cell-${index}`} fill={entry.color} />
//                             ))}
//                           </Pie>
//                           <Tooltip />
//                           <Legend />
//                         </PieChart>
//                       </ResponsiveContainer>
//                       <div className="flex justify-center mt-4 gap-4">
//                         <div className="flex items-center gap-1">
//                           <div className="w-3 h-3 rounded-full bg-green-400"></div>
//                           <span className="text-xs">Completed</span>
//                         </div>
//                         <div className="flex items-center gap-1">
//                           <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
//                           <span className="text-xs">Pending</span>
//                         </div>
//                         <div className="flex items-center gap-1">
//                           <div className="w-3 h-3 rounded-full bg-red-500"></div>
//                           <span className="text-xs">Overdue</span>
//                         </div>
//                       </div>
//                     </div>
//                   </div>
//                 </div>

//                 {/* Staff Task Summary */}
//                 <div className="border rounded-lg shadow-sm bg-white mb-6">
//                   <div className="p-4 bg-gradient-to-r from-purple-50 to-purple-100 border-b">
//                     <h3 className="text-lg font-semibold text-purple-700">Staff Task Summary</h3>
//                     <p className="text-sm text-purple-600">Overview of tasks assigned to each staff member (based on column E)</p>
//                   </div>
//                   <div className="p-4">
//                     <div className="overflow-x-auto">
//                       <table className="min-w-full divide-y divide-gray-200">
//                         <thead className="bg-gray-50">
//                           <tr>
//                             <th
//                               scope="col"
//                               className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
//                             >
//                               Name
//                             </th>
//                             <th
//                               scope="col"
//                               className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
//                             >
//                               Total Tasks
//                             </th>
//                             <th
//                               scope="col"
//                               className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
//                             >
//                               Completed
//                             </th>
//                             <th
//                               scope="col"
//                               className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
//                             >
//                               Pending
//                             </th>
//                             <th
//                               scope="col"
//                               className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
//                             >
//                               Progress
//                             </th>
//                             <th
//                               scope="col"
//                               className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
//                             >
//                               Status
//                             </th>
//                           </tr>
//                         </thead>
//                         <tbody className="bg-white divide-y divide-gray-200">
//                           {staffMembers.map((staff) => (
//                             <tr key={staff.id} className="hover:bg-gray-50">
//                               <td className="px-6 py-4 whitespace-nowrap">
//                                 <div>
//                                   <div className="font-medium">{staff.name}</div>
//                                   <div className="text-xs text-gray-500">{staff.email}</div>
//                                 </div>
//                               </td>
//                               <td className="px-6 py-4 whitespace-nowrap">{staff.totalTasks}</td>
//                               <td className="px-6 py-4 whitespace-nowrap">{staff.completedTasks}</td>
//                               <td className="px-6 py-4 whitespace-nowrap">{staff.pendingTasks}</td>
//                               <td className="px-6 py-4 whitespace-nowrap">
//                                 <div className="flex items-center gap-2">
//                                   <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
//                                     <div
//                                       className={`h-full ${
//                                         staff.progress >= 80
//                                           ? "bg-green-500"
//                                           : staff.progress >= 60
//                                             ? "bg-amber-500"
//                                             : "bg-red-500"
//                                       }`}
//                                       style={{ width: `${staff.progress}%` }}
//                                     ></div>
//                                   </div>
//                                   <span className="text-xs text-gray-500">{staff.progress}%</span>
//                                 </div>
//                               </td>
//                               <td className="px-6 py-4 whitespace-nowrap">
//                                 {staff.progress >= 80 ? (
//                                   <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-500 text-white">
//                                     Excellent
//                                   </span>
//                                 ) : staff.progress >= 60 ? (
//                                   <span className="px-2 py-1 text-xs font-semibold rounded-full bg-amber-500 text-white">
//                                     Good
//                                   </span>
//                                 ) : (
//                                   <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-500 text-white">
//                                     Needs Improvement
//                                   </span>
//                                 )}
//                               </td>
//                             </tr>
//                           ))}
//                         </tbody>
//                       </table>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             )}

//             {activeTab === "mis" && (
//               <div className="mt-6">
//                 <div className="border rounded-lg shadow-sm bg-white">
//                   <div className="p-4 bg-gradient-to-r from-purple-50 to-purple-100 border-b">
//                     <h3 className="text-lg font-semibold text-purple-700">MIS Report</h3>
//                     <p className="text-sm text-purple-600">Detailed task analytics and performance metrics</p>
//                   </div>
//                   <div className="p-4 pt-6">
//                     <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
//                       <div className="border rounded-lg shadow-sm bg-white">
//                         <div className="p-3 pb-2">
//                           <h3 className="text-sm text-purple-700">Total Tasks Assigned</h3>
//                         </div>
//                         <div className="p-4">
//                           <div className="text-3xl font-bold">{taskCounts.total}</div>
//                         </div>
//                       </div>
//                       <div className="border rounded-lg shadow-sm bg-white">
//                         <div className="p-3 pb-2">
//                           <h3 className="text-sm text-purple-700">Tasks Completed On Time</h3>
//                         </div>
//                         <div className="p-4">
//                           <div className="text-3xl font-bold">{taskCounts.completed}</div>
//                         </div>
//                       </div>
//                       <div className="border rounded-lg shadow-sm bg-white">
//                         <div className="p-3 pb-2">
//                           <h3 className="text-sm text-purple-700">Tasks Still Pending</h3>
//                         </div>
//                         <div className="p-4">
//                           <div className="text-3xl font-bold">{taskCounts.pending}</div>
//                         </div>
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             )}

//             {activeTab === "staff" && (
//               <div className="mt-6">
//                 <div className="border rounded-lg shadow-sm bg-white">
//                   <div className="p-4 bg-gradient-to-r from-purple-50 to-purple-100 border-b">
//                     <h3 className="text-lg font-semibold text-purple-700">Staff Performance</h3>
//                     <p className="text-sm text-purple-600">Task completion rates by staff member</p>
//                   </div>
//                   <div className="p-4 pt-6">
//                     <div className="space-y-6">
//                       <div className="border border-green-200 rounded-lg shadow-sm bg-white">
//                         <div className="p-4 bg-gradient-to-r from-green-50 to-green-100 border-b border-green-200">
//                           <h3 className="text-lg font-semibold text-green-700">Top Performers</h3>
//                           <p className="text-sm text-green-600">Staff with highest task completion rates</p>
//                         </div>
//                         <div className="p-4 pt-6">
//                           <div className="space-y-4">
//                             {staffMembers
//                               .sort((a, b) => b.progress - a.progress)
//                               .slice(0, 3)
//                               .map((staff, index) => (
//                                 <div
//                                   key={index}
//                                   className="flex items-center justify-between p-3 border border-green-100 rounded-md bg-green-50"
//                                 >
//                                   <div className="flex items-center gap-3">
//                                     <div className="h-10 w-10 rounded-full bg-gradient-to-r from-green-500 to-teal-500 flex items-center justify-center">
//                                       <span className="text-sm font-medium text-white">{staff.name.charAt(0)}</span>
//                                     </div>
//                                     <div>
//                                       <p className="font-medium text-green-700">{staff.name}</p>
//                                       <p className="text-xs text-green-600">{staff.totalTasks} tasks assigned</p>
//                                     </div>
//                                   </div>
//                                   <div className="text-lg font-bold text-green-600">{staff.progress}%</div>
//                                 </div>
//                               ))}
//                           </div>
//                         </div>
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             )}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }



"use client"

import { useState } from "react"
import { BarChart3, CheckCircle2, Clock, ListTodo, Users, AlertTriangle, Filter } from 'lucide-react'
import AdminLayout from "../../components/layout/AdminLayout.jsx"
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts"

// Sample all tasks data
const allTasks = [
  {
    id: 1,
    title: "Complete weekly report",
    assignedTo: "John Doe",
    dueDate: "2023-05-15",
    frequency: "weekly",
    status: "completed",
  },
  {
    id: 2,
    title: "Update inventory records",
    assignedTo: "Jane Smith",
    dueDate: "2023-05-18",
    frequency: "daily",
    status: "pending",
  },
  {
    id: 3,
    title: "Monthly equipment maintenance",
    assignedTo: "Robert Johnson",
    dueDate: "2023-05-20",
    frequency: "monthly",
    status: "pending",
  },
  {
    id: 4,
    title: "Client follow-up calls",
    assignedTo: "Emily Davis",
    dueDate: "2023-05-16",
    frequency: "weekly",
    status: "overdue",
  },
  {
    id: 5,
    title: "Daily safety inspection",
    assignedTo: "Michael Wilson",
    dueDate: "2023-05-17",
    frequency: "daily",
    status: "pending",
  },
  {
    id: 6,
    title: "Quarterly financial review",
    assignedTo: "John Doe",
    dueDate: "2023-06-30",
    frequency: "quarterly",
    status: "pending",
  },
  {
    id: 7,
    title: "Staff performance evaluations",
    assignedTo: "Jane Smith",
    dueDate: "2023-05-25",
    frequency: "monthly",
    status: "pending",
  },
  {
    id: 8,
    title: "Update company policies",
    assignedTo: "Robert Johnson",
    dueDate: "2023-05-10",
    frequency: "yearly",
    status: "overdue",
  },
  {
    id: 9,
    title: "Website content update",
    assignedTo: "Emily Davis",
    dueDate: "2023-05-22",
    frequency: "monthly",
    status: "pending",
  },
  {
    id: 10,
    title: "Supplier contract review",
    assignedTo: "Michael Wilson",
    dueDate: "2023-05-12",
    frequency: "quarterly",
    status: "overdue",
  },
]

// Staff members data
const staffMembers = [
  {
    id: 1,
    name: "John Doe",
    email: "john@example.com",
    totalTasks: 24,
    completedTasks: 18,
    pendingTasks: 6,
    progress: 75,
  },
  {
    id: 2,
    name: "Jane Smith",
    email: "jane@example.com",
    totalTasks: 32,
    completedTasks: 28,
    pendingTasks: 4,
    progress: 88,
  },
  {
    id: 3,
    name: "Robert Johnson",
    email: "robert@example.com",
    totalTasks: 18,
    completedTasks: 12,
    pendingTasks: 6,
    progress: 67,
  },
  {
    id: 4,
    name: "Emily Davis",
    email: "emily@example.com",
    totalTasks: 27,
    completedTasks: 22,
    pendingTasks: 5,
    progress: 81,
  },
  {
    id: 5,
    name: "Michael Wilson",
    email: "michael@example.com",
    totalTasks: 15,
    completedTasks: 9,
    pendingTasks: 6,
    progress: 60,
  },
]

// Chart data
const barChartData = [
  {
    name: "Jan",
    completed: 45,
    pending: 12,
  },
  {
    name: "Feb",
    completed: 52,
    pending: 9,
  },
  {
    name: "Mar",
    completed: 48,
    pending: 14,
  },
  {
    name: "Apr",
    completed: 61,
    pending: 17,
  },
  {
    name: "May",
    completed: 55,
    pending: 15,
  },
  {
    name: "Jun",
    completed: 67,
    pending: 13,
  },
  {
    name: "Jul",
    completed: 62,
    pending: 20,
  },
]

const pieChartData = [
  { name: "Completed", value: 182, color: "#22c55e" },
  { name: "In Progress", value: 32, color: "#facc15" },
  { name: "Pending", value: 24, color: "#f87171" },
  { name: "Overdue", value: 10, color: "#ef4444" },
]

export default function AdminDashboard() {
  const [timeframe, setTimeframe] = useState("weekly")
  const [taskView, setTaskView] = useState("recent")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterStaff, setFilterStaff] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("overview")

  // Filter tasks based on the filter criteria
  const filteredTasks = allTasks.filter((task) => {
    // Filter by status
    if (filterStatus !== "all" && task.status !== filterStatus) return false

    // Filter by staff
    if (filterStaff !== "all" && task.assignedTo !== filterStaff) return false

    // Filter by search query
    if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
    }

    return true
  })

  // Filter tasks based on the tab view
  const getTasksByView = (view) => {
    switch (view) {
      case "recent":
        // Tasks created recently (for demo, we'll just return some)
        return filteredTasks.slice(0, 5)
      case "upcoming":
        // Tasks with upcoming due dates
        return filteredTasks.filter((task) => task.status === "pending")
      case "overdue":
        // Tasks that are overdue
        return filteredTasks.filter((task) => task.status === "overdue")
      default:
        return filteredTasks
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "bg-green-500 hover:bg-green-600 text-white"
      case "pending":
        return "bg-amber-500 hover:bg-amber-600 text-white"
      case "overdue":
        return "bg-red-500 hover:bg-red-600 text-white"
      default:
        return "bg-gray-500 hover:bg-gray-600 text-white"
    }
  }

  const getFrequencyColor = (frequency) => {
    switch (frequency) {
      case "one-time":
        return "bg-gray-500 hover:bg-gray-600 text-white"
      case "daily":
        return "bg-blue-500 hover:bg-blue-600 text-white"
      case "weekly":
        return "bg-purple-500 hover:bg-purple-600 text-white"
      case "fortnightly":
        return "bg-indigo-500 hover:bg-indigo-600 text-white"
      case "monthly":
        return "bg-orange-500 hover:bg-orange-600 text-white"
      case "quarterly":
        return "bg-amber-500 hover:bg-amber-600 text-white"
      case "yearly":
        return "bg-emerald-500 hover:bg-emerald-600 text-white"
      default:
        return "bg-gray-500 hover:bg-gray-600 text-white"
    }
  }

  // Count tasks by status
  const totalTasks = allTasks.length
  const completedTasks = allTasks.filter((task) => task.status === "completed").length
  const pendingTasks = allTasks.filter((task) => task.status === "pending").length
  const overdueTasks = allTasks.filter((task) => task.status === "overdue").length

  // Tasks Overview Chart Component
  const TasksOverviewChart = () => {
    return (
      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={barChartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="name" fontSize={12} stroke="#888888" tickLine={false} axisLine={false} />
          <YAxis fontSize={12} stroke="#888888" tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
          <Tooltip />
          <Legend />
          <Bar dataKey="completed" stackId="a" fill="#22c55e" radius={[4, 4, 0, 0]} />
          <Bar dataKey="pending" stackId="a" fill="#f87171" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    )
  }

  // Tasks Completion Chart Component
  const TasksCompletionChart = () => {
    return (
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie data={pieChartData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={2} dataKey="value">
            {pieChartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    )
  }

  // Staff Tasks Table Component
  const StaffTasksTable = () => {
    return (
      <div className="rounded-md border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Tasks
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Completed
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Pending
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Progress
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {staffMembers.map((staff) => (
              <tr key={staff.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{staff.name}</div>
                    <div className="text-xs text-gray-500">{staff.email}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{staff.totalTasks}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{staff.completedTasks}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{staff.pendingTasks}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <div className="w-[100px] bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${staff.progress}%` }}></div>
                    </div>
                    <span className="text-xs text-gray-500">{staff.progress}%</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {staff.progress >= 80 ? (
                    <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      Excellent
                    </span>
                  ) : staff.progress >= 60 ? (
                    <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                      Good
                    </span>
                  ) : (
                    <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                      Needs Improvement
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  return (
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <h1 className="text-2xl font-bold tracking-tight text-purple-700">Admin Dashboard</h1>
          <div className="flex items-center gap-2">
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className="w-[180px] rounded-md border border-purple-200 p-2 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-l-4 border-l-blue-500 shadow-md hover:shadow-lg transition-all bg-white">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-r from-blue-50 to-blue-100 rounded-tr-lg p-4">
              <h3 className="text-sm font-medium text-blue-700">Total Tasks</h3>
              <ListTodo className="h-4 w-4 text-blue-500" />
            </div>
            <div className="p-4">
              <div className="text-3xl font-bold text-blue-700">{totalTasks}</div>
              <p className="text-xs text-blue-600">+12% from last month</p>
            </div>
          </div>

          <div className="rounded-lg border border-l-4 border-l-green-500 shadow-md hover:shadow-lg transition-all bg-white">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-r from-green-50 to-green-100 rounded-tr-lg p-4">
              <h3 className="text-sm font-medium text-green-700">Completed Tasks</h3>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </div>
            <div className="p-4">
              <div className="text-3xl font-bold text-green-700">{completedTasks}</div>
              <p className="text-xs text-green-600">+8% from last month</p>
            </div>
          </div>

          <div className="rounded-lg border border-l-4 border-l-amber-500 shadow-md hover:shadow-lg transition-all bg-white">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-r from-amber-50 to-amber-100 rounded-tr-lg p-4">
              <h3 className="text-sm font-medium text-amber-700">Pending Tasks</h3>
              <Clock className="h-4 w-4 text-amber-500" />
            </div>
            <div className="p-4">
              <div className="text-3xl font-bold text-amber-700">{pendingTasks}</div>
              <p className="text-xs text-amber-600">-3% from last month</p>
            </div>
          </div>

          <div className="rounded-lg border border-l-4 border-l-red-500 shadow-md hover:shadow-lg transition-all bg-white">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-r from-red-50 to-red-100 rounded-tr-lg p-4">
              <h3 className="text-sm font-medium text-red-700">Overdue Tasks</h3>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </div>
            <div className="p-4">
              <div className="text-3xl font-bold text-red-700">{overdueTasks}</div>
              <p className="text-xs text-red-600">+2 from last month</p>
            </div>
          </div>
        </div>

        {/* Task Navigation Tabs */}
        <div className="w-full overflow-hidden rounded-lg border border-gray-200 bg-white">
          <div className="grid grid-cols-3">
            <button
              className={`py-3 text-center font-medium transition-colors ${
                taskView === "recent" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
              onClick={() => setTaskView("recent")}
            >
              Recent Tasks
            </button>
            <button
              className={`py-3 text-center font-medium transition-colors ${
                taskView === "upcoming" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
              onClick={() => setTaskView("upcoming")}
            >
              Upcoming Tasks
            </button>
            <button
              className={`py-3 text-center font-medium transition-colors ${
                taskView === "overdue" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
              onClick={() => setTaskView("overdue")}
            >
              Overdue Tasks
            </button>
          </div>

          <div className="p-4">
            <div className="flex flex-col gap-4 md:flex-row mb-4">
              <div className="flex-1 space-y-2">
                <label htmlFor="search" className="flex items-center text-purple-700">
                  <Filter className="h-4 w-4 mr-2" />
                  Search Tasks
                </label>
                <input
                  id="search"
                  placeholder="Search by task title"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-md border border-purple-200 p-2 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>
              <div className="space-y-2 md:w-[180px]">
                <label htmlFor="status-filter" className="flex items-center text-purple-700">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter by Status
                </label>
                <select
                  id="status-filter"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full rounded-md border border-purple-200 p-2 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                  <option value="overdue">Overdue</option>
                </select>
              </div>
              <div className="space-y-2 md:w-[180px]">
                <label htmlFor="staff-filter" className="flex items-center text-purple-700">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter by Staff
                </label>
                <select
                  id="staff-filter"
                  value={filterStaff}
                  onChange={(e) => setFilterStaff(e.target.value)}
                  className="w-full rounded-md border border-purple-200 p-2 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                >
                  <option value="all">All Staff</option>
                  <option value="John Doe">John Doe</option>
                  <option value="Jane Smith">Jane Smith</option>
                  <option value="Robert Johnson">Robert Johnson</option>
                  <option value="Emily Davis">Emily Davis</option>
                  <option value="Michael Wilson">Michael Wilson</option>
                </select>
              </div>
            </div>

            {getTasksByView(taskView).length === 0 ? (
              <div className="text-center p-8 text-gray-500">
                <p>No tasks found matching your filters.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {getTasksByView(taskView).map((task) => (
                    <div
                      key={task.id}
                      className="rounded-lg border border-purple-200 shadow-md hover:shadow-lg transition-all bg-white"
                    >
                      <div className="p-4 pb-2 bg-gradient-to-r from-purple-50 to-pink-50">
                        <div className="flex items-center justify-between">
                          <h3 className="text-md text-purple-700">{task.title}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                            {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                          </span>
                        </div>
                        <p className="text-purple-600 text-sm">Assigned to: {task.assignedTo}</p>
                      </div>
                      <div className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-gray-600">Due: {task.dueDate}</div>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${getFrequencyColor(task.frequency)}`}
                          >
                            {task.frequency.charAt(0).toUpperCase() + task.frequency.slice(1)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-l-4 border-l-purple-500 shadow-md hover:shadow-lg transition-all bg-white">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-r from-purple-50 to-purple-100 rounded-tr-lg p-4">
              <h3 className="text-sm font-medium text-purple-700">Active Staff</h3>
              <Users className="h-4 w-4 text-purple-500" />
            </div>
            <div className="p-4">
              <div className="text-3xl font-bold text-purple-700">12</div>
              <p className="text-xs text-purple-600">+2 new staff this month</p>
            </div>
          </div>

          <div className="rounded-lg border border-l-4 border-l-indigo-500 shadow-md hover:shadow-lg transition-all lg:col-span-3 bg-white">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-r from-indigo-50 to-indigo-100 rounded-tr-lg p-4">
              <h3 className="text-sm font-medium text-indigo-700">Task Completion Rate</h3>
              <BarChart3 className="h-4 w-4 text-indigo-500" />
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-indigo-700">73.4%</div>
                <div className="flex items-center space-x-2">
                  <span className="inline-block w-3 h-3 bg-green-500 rounded-full"></span>
                  <span className="text-xs text-gray-600">On Time: 65.2%</span>
                  <span className="inline-block w-3 h-3 bg-amber-500 rounded-full"></span>
                  <span className="text-xs text-gray-600">Late: 8.2%</span>
                </div>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full mt-2">
                <div
                  className="h-full bg-gradient-to-r from-green-500 to-amber-500 rounded-full"
                  style={{ width: "73.4%" }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="space-y-4">
          <div className="bg-purple-100 rounded-md p-1 flex space-x-1">
            <button
              onClick={() => setActiveTab("overview")}
              className={`flex-1 py-2 text-center rounded-md transition-colors ${
                activeTab === "overview" ? "bg-purple-600 text-white" : "text-purple-700 hover:bg-purple-200"
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab("mis")}
              className={`flex-1 py-2 text-center rounded-md transition-colors ${
                activeTab === "mis" ? "bg-purple-600 text-white" : "text-purple-700 hover:bg-purple-200"
              }`}
            >
              MIS Report
            </button>
            <button
              onClick={() => setActiveTab("staff")}
              className={`flex-1 py-2 text-center rounded-md transition-colors ${
                activeTab === "staff" ? "bg-purple-600 text-white" : "text-purple-700 hover:bg-purple-200"
              }`}
            >
              Staff Performance
            </button>
          </div>

          {activeTab === "overview" && (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <div className="lg:col-span-4 rounded-lg border border-purple-200 shadow-md bg-white">
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-100 p-4">
                    <h3 className="text-purple-700 font-medium">Tasks Overview</h3>
                    <p className="text-purple-600 text-sm">Task completion rate over time</p>
                  </div>
                  <div className="p-4 pl-2">
                    <TasksOverviewChart />
                  </div>
                </div>
                <div className="lg:col-span-3 rounded-lg border border-purple-200 shadow-md bg-white">
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-100 p-4">
                    <h3 className="text-purple-700 font-medium">Task Status</h3>
                    <p className="text-purple-600 text-sm">Distribution of tasks by status</p>
                  </div>
                  <div className="p-4">
                    <TasksCompletionChart />
                  </div>
                </div>
              </div>
              <div className="rounded-lg border border-purple-200 shadow-md bg-white">
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-100 p-4">
                  <h3 className="text-purple-700 font-medium">Staff Task Summary</h3>
                  <p className="text-purple-600 text-sm">Overview of tasks assigned to each staff member</p>
                </div>
                <div className="p-4">
                  <StaffTasksTable />
                </div>
              </div>
            </div>
          )}

          {activeTab === "mis" && (
            <div className="rounded-lg border border-purple-200 shadow-md bg-white">
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-100 p-4">
                <h3 className="text-purple-700 font-medium">MIS Report</h3>
                <p className="text-purple-600 text-sm">Detailed task analytics and performance metrics</p>
              </div>
              <div className="p-4">
                <div className="space-y-8">
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-purple-600">Total Tasks Assigned</div>
                      <div className="text-3xl font-bold text-purple-700">{totalTasks}</div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-purple-600">Tasks Completed On Time</div>
                      <div className="text-3xl font-bold text-purple-700">{completedTasks}</div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-purple-600">Tasks Still Pending</div>
                      <div className="text-3xl font-bold text-purple-700">{pendingTasks}</div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-purple-700">Task Completion by Frequency</h3>
                    <div className="grid gap-4 md:grid-cols-4">
                      <div className="rounded-lg border border-purple-200 bg-white">
                        <div className="p-4 pb-2 bg-gradient-to-r from-blue-50 to-blue-100">
                          <h4 className="text-sm text-blue-700">Daily Tasks</h4>
                        </div>
                        <div className="p-4">
                          <div className="text-2xl font-bold text-blue-700">85%</div>
                          <p className="text-xs text-blue-600">Completion rate</p>
                        </div>
                      </div>
                      <div className="rounded-lg border border-purple-200 bg-white">
                        <div className="p-4 pb-2 bg-gradient-to-r from-purple-50 to-purple-100">
                          <h4 className="text-sm text-purple-700">Weekly Tasks</h4>
                        </div>
                        <div className="p-4">
                          <div className="text-2xl font-bold text-purple-700">78%</div>
                          <p className="text-xs text-purple-600">Completion rate</p>
                        </div>
                      </div>
                      <div className="rounded-lg border border-purple-200 bg-white">
                        <div className="p-4 pb-2 bg-gradient-to-r from-orange-50 to-orange-100">
                          <h4 className="text-sm text-orange-700">Monthly Tasks</h4>
                        </div>
                        <div className="p-4">
                          <div className="text-2xl font-bold text-orange-700">72%</div>
                          <p className="text-xs text-orange-600">Completion rate</p>
                        </div>
                      </div>
                      <div className="rounded-lg border border-purple-200 bg-white">
                        <div className="p-4 pb-2 bg-gradient-to-r from-emerald-50 to-emerald-100">
                          <h4 className="text-sm text-emerald-700">Yearly Tasks</h4>
                        </div>
                        <div className="p-4">
                          <div className="text-2xl font-bold text-emerald-700">90%</div>
                          <p className="text-xs text-emerald-600">Completion rate</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "staff" && (
            <div className="rounded-lg border border-purple-200 shadow-md bg-white">
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-100 p-4">
                <h3 className="text-purple-700 font-medium">Staff Performance</h3>
                <p className="text-purple-600 text-sm">Task completion rates by staff member</p>
              </div>
              <div className="p-4">
                <div className="space-y-8">
                  <div className="rounded-md border border-green-200">
                    <div className="p-4 bg-gradient-to-r from-green-50 to-green-100 border-b border-green-200">
                      <h3 className="text-lg font-medium text-green-700">Top Performers</h3>
                      <p className="text-sm text-green-600">Staff with highest task completion rates</p>
                    </div>
                    <div className="p-4">
                      <div className="space-y-4">
                        {[
                          { name: "John Doe", rate: 95, tasks: 42 },
                          { name: "Jane Smith", rate: 92, tasks: 38 },
                          { name: "Robert Johnson", rate: 88, tasks: 35 },
                        ].map((staff, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 border border-green-100 rounded-md bg-green-50"
                          >
                            <div className="flex items-center gap-2">
                              <div className="h-10 w-10 rounded-full bg-gradient-to-r from-green-500 to-teal-500 flex items-center justify-center">
                                <span className="text-sm font-medium text-white">{staff.name.charAt(0)}</span>
                              </div>
                              <div>
                                <p className="font-medium text-green-700">{staff.name}</p>
                                <p className="text-xs text-green-600">{staff.tasks} tasks assigned</p>
                              </div>
                            </div>
                            <div className="text-lg font-bold text-green-600">{staff.rate}%</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-md border border-red-200">
                    <div className="p-4 bg-gradient-to-r from-red-50 to-red-100 border-b border-red-200">
                      <h3 className="text-lg font-medium text-red-700">Needs Improvement</h3>
                      <p className="text-sm text-red-600">Staff with lower task completion rates</p>
                    </div>
                    <div className="p-4">
                      <div className="space-y-4">
                        {[
                          { name: "Michael Wilson", rate: 65, tasks: 28 },
                          { name: "Emily Davis", rate: 70, tasks: 32 },
                        ].map((staff, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 border border-red-100 rounded-md bg-red-50"
                          >
                            <div className="flex items-center gap-2">
                              <div className="h-10 w-10 rounded-full bg-gradient-to-r from-red-500 to-pink-500 flex items-center justify-center">
                                <span className="text-sm font-medium text-white">{staff.name.charAt(0)}</span>
                              </div>
                              <div>
                                <p className="font-medium text-red-700">{staff.name}</p>
                                <p className="text-xs text-red-600">{staff.tasks} tasks assigned</p>
                              </div>
                            </div>
                            <div className="text-lg font-bold text-red-600">{staff.rate}%</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
  )
}
