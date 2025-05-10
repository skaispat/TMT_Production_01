"use client"

import { useState, createContext, useContext, forwardRef } from "react"

const TabsContext = createContext({
  selectedTab: "",
  setSelectedTab: () => {},
})

const Tabs = forwardRef(({ defaultValue, value, onValueChange, className = "", children, ...props }, ref) => {
  const [selectedTab, setSelectedTab] = useState(value || defaultValue || "")

  const handleValueChange = (newValue) => {
    if (value === undefined) {
      setSelectedTab(newValue)
    }
    onValueChange?.(newValue)
  }

  return (
    <TabsContext.Provider value={{ selectedTab: value || selectedTab, setSelectedTab: handleValueChange }}>
      <div ref={ref} className={className} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  )
})

Tabs.displayName = "Tabs"

const TabsList = forwardRef(({ className = "", ...props }, ref) => (
  <div
    ref={ref}
    className={`inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground ${className}`}
    {...props}
  />
))

TabsList.displayName = "TabsList"

const TabsTrigger = forwardRef(({ className = "", value, ...props }, ref) => {
  const { selectedTab, setSelectedTab } = useContext(TabsContext)

  return (
    <button
      ref={ref}
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${
        selectedTab === value ? "bg-background text-foreground shadow-sm" : "hover:bg-muted hover:text-foreground"
      } ${className}`}
      onClick={() => setSelectedTab(value)}
      {...props}
    />
  )
})

TabsTrigger.displayName = "TabsTrigger"

const TabsContent = forwardRef(({ className = "", value, ...props }, ref) => {
  const { selectedTab } = useContext(TabsContext)

  if (selectedTab !== value) {
    return null
  }

  return (
    <div
      ref={ref}
      className={`mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${className}`}
      {...props}
    />
  )
})

TabsContent.displayName = "TabsContent"

export { Tabs, TabsList, TabsTrigger, TabsContent }
