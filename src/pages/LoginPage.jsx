"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import Button from "../components/ui/Button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../components/ui/Card"
import Input from "../components/ui/Input"
import Label from "../components/ui/Label"
import { useToast } from "../components/ui/Toaster"
import { Factory } from "lucide-react"

export default function LoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { login, isAuthenticated, isLoading, user } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard")
    }
  }, [isAuthenticated, navigate])

  // Combine component's submitting state with auth context loading state
  const isButtonDisabled = isSubmitting || isLoading

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Attempt login with username and password
      const success = await login(username, password)

      if (success) {
        toast({
          title: "Login successful",
          description: `Welcome back, ${username}!`,
        })
        navigate("/dashboard")
      } else {
        toast({
          variant: "destructive",
          title: "Login failed",
          description: "Invalid username or password. Please try again.",
        })
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Login error",
        description: "An unexpected error occurred. Please try again.",
      })
      console.error("Login error:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg border-slate-200">
        <CardHeader className="bg-slate-100 rounded-t-lg">
          <div className="flex items-center justify-center mb-2">
            <Factory className="h-12 w-12 text-slate-700" />
          </div>
          <CardTitle className="text-2xl font-bold text-center text-slate-800">
            TMT Production App
          </CardTitle>
          <CardDescription className="text-center text-slate-500">
            Enter your credentials to access the system
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4 pt-6">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={isButtonDisabled}
                className="border-slate-200 focus-visible:ring-slate-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isButtonDisabled}
                className="border-slate-200 focus-visible:ring-slate-500"
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button
              type="submit"
              className="w-full bg-slate-700 hover:bg-slate-800 text-white"
              disabled={isButtonDisabled}
            >
              {isButtonDisabled ? "Logging in..." : "Login"}
            </Button>
          </CardFooter>
        </form>
        <CardFooter className="flex-col space-y-2 border-t pt-4">
          <div className="text-sm text-slate-500 text-center">
            <p>Test accounts configured in Google Sheets:</p>
            <p>Login sheet - Column A for username, Column B for password</p>
            <p>Column C for user type (admin/user)</p>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}