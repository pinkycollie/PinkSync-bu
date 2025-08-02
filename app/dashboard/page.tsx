"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Camera,
  Users,
  MessageSquare,
  Zap,
  TrendingUp,
  Calendar,
  Settings,
  Bell,
  Clock,
  Globe,
  Shield,
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { TranslationHistory } from "@/components/dashboard/translation-history"
import { InterpreterBookings } from "@/components/dashboard/interpreter-bookings"
import { AccessibilityReports } from "@/components/dashboard/accessibility-reports"
import { CommunityFeed } from "@/components/dashboard/community-feed"

export default function DashboardPage() {
  const { user, isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState({
    translations: 0,
    interpreterSessions: 0,
    accessibilityScans: 0,
    communityPosts: 0,
  })

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/auth/login")
    }
  }, [isAuthenticated, isLoading, router])

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchDashboardStats()
    }
  }, [isAuthenticated, user])

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/dashboard/stats`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("pinksync_token")}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error("Failed to fetch dashboard stats:", error)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  const quickActions = [
    {
      title: "Start Translation",
      description: "Translate sign language to text",
      icon: Camera,
      color: "from-pink-500 to-purple-600",
      href: "/translate",
    },
    {
      title: "Find Interpreter",
      description: "Book a certified interpreter",
      icon: Users,
      color: "from-teal-400 to-blue-500",
      href: "/interpreters",
    },
    {
      title: "Accessibility Scan",
      description: "Check website accessibility",
      icon: Shield,
      color: "from-green-400 to-teal-500",
      href: "/accessibility",
    },
    {
      title: "Community",
      description: "Connect with the deaf community",
      icon: Globe,
      color: "from-orange-400 to-red-500",
      href: "/community",
    },
  ]

  const statCards = [
    {
      title: "Translations",
      value: stats.translations,
      icon: MessageSquare,
      change: "+12%",
      changeType: "positive",
    },
    {
      title: "Interpreter Sessions",
      value: stats.interpreterSessions,
      icon: Users,
      change: "+8%",
      changeType: "positive",
    },
    {
      title: "Accessibility Scans",
      value: stats.accessibilityScans,
      icon: Shield,
      change: "+15%",
      changeType: "positive",
    },
    {
      title: "Community Posts",
      value: stats.communityPosts,
      icon: Globe,
      change: "+5%",
      changeType: "positive",
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="border-b border-border/40 backdrop-blur-sm bg-background/80 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 rounded-full cosmic-gradient flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold neon-text">PinkSync</h1>
              <p className="text-sm text-muted-foreground">Dashboard</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm">
              <Bell className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Settings className="w-4 h-4" />
            </Button>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-sm font-medium">{user?.username?.charAt(0).toUpperCase()}</span>
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-medium">{user?.full_name}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Welcome back, {user?.username}! 👋</h2>
          <p className="text-muted-foreground">Here's what's happening with your accessibility tools today.</p>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          {statCards.map((stat, index) => (
            <Card key={stat.title}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </div>
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <stat.icon className="w-6 h-6 text-primary" />
                  </div>
                </div>
                <div className="flex items-center mt-4">
                  <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-500">{stat.change}</span>
                  <span className="text-sm text-muted-foreground ml-1">from last month</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <h3 className="text-xl font-semibold mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <Card key={action.title} className="hover:shadow-lg transition-all duration-300 cursor-pointer group">
                <CardContent className="p-6">
                  <div
                    className={`w-12 h-12 rounded-lg bg-gradient-to-r ${action.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
                  >
                    <action.icon className="w-6 h-6 text-white" />
                  </div>
                  <h4 className="font-semibold mb-2">{action.title}</h4>
                  <p className="text-sm text-muted-foreground">{action.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>

        {/* Main Content Tabs */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="translations">Translations</TabsTrigger>
              <TabsTrigger value="interpreters">Interpreters</TabsTrigger>
              <TabsTrigger value="accessibility">Accessibility</TabsTrigger>
              <TabsTrigger value="community">Community</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Activity */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="w-5 h-5" />
                      Recent Activity
                    </CardTitle>
                    <CardDescription>Your latest interactions with PinkSync</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-pink-500/20 flex items-center justify-center">
                        <Camera className="w-4 h-4 text-pink-500" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Sign language translation</p>
                        <p className="text-xs text-muted-foreground">2 hours ago</p>
                      </div>
                      <Badge variant="secondary">Completed</Badge>
                    </div>

                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-teal-500/20 flex items-center justify-center">
                        <Users className="w-4 h-4 text-teal-500" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Interpreter session</p>
                        <p className="text-xs text-muted-foreground">1 day ago</p>
                      </div>
                      <Badge variant="secondary">Completed</Badge>
                    </div>

                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                        <Shield className="w-4 h-4 text-green-500" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Accessibility scan</p>
                        <p className="text-xs text-muted-foreground">2 days ago</p>
                      </div>
                      <Badge variant="secondary">Completed</Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* Upcoming Sessions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="w-5 h-5" />
                      Upcoming Sessions
                    </CardTitle>
                    <CardDescription>Your scheduled interpreter sessions</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                        <Users className="w-4 h-4 text-blue-500" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Medical appointment</p>
                        <p className="text-xs text-muted-foreground">Tomorrow at 2:00 PM</p>
                      </div>
                      <Badge>Confirmed</Badge>
                    </div>

                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                        <Users className="w-4 h-4 text-purple-500" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Business meeting</p>
                        <p className="text-xs text-muted-foreground">Friday at 10:00 AM</p>
                      </div>
                      <Badge variant="outline">Pending</Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="translations">
              <TranslationHistory />
            </TabsContent>

            <TabsContent value="interpreters">
              <InterpreterBookings />
            </TabsContent>

            <TabsContent value="accessibility">
              <AccessibilityReports />
            </TabsContent>

            <TabsContent value="community">
              <CommunityFeed />
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  )
}
