"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Zap,
  Users,
  Shield,
  Sparkles,
  Camera,
  MessageSquare,
  Accessibility,
  Globe,
  ArrowRight,
  Play,
  Star,
} from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { SignLanguageDemo } from "@/components/sign-language-demo"
import { AccessibilityOverlay } from "@/components/accessibility-overlay"

export default function HomePage() {
  const { user, isAuthenticated } = useAuth()
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    setIsLoaded(true)
  }, [])

  const features = [
    {
      icon: Camera,
      title: "Sign Language Recognition",
      description: "AI-powered real-time sign language translation with 95%+ accuracy",
      color: "from-pink-500 to-purple-600",
    },
    {
      icon: Users,
      title: "Interpreter Matching",
      description: "Connect with certified interpreters instantly using smart matching algorithms",
      color: "from-teal-400 to-blue-500",
    },
    {
      icon: Accessibility,
      title: "Universal Overlay",
      description: "Make any website accessible with our intelligent accessibility overlay",
      color: "from-purple-500 to-pink-500",
    },
    {
      icon: Shield,
      title: "Biometric Security",
      description: "Secure authentication using sign language biometrics",
      color: "from-green-400 to-teal-500",
    },
    {
      icon: Globe,
      title: "Global Community",
      description: "Connect with deaf creators and accessibility professionals worldwide",
      color: "from-orange-400 to-red-500",
    },
    {
      icon: Zap,
      title: "Developer APIs",
      description: "Integrate deaf-accessible technology into your applications",
      color: "from-yellow-400 to-orange-500",
    },
  ]

  const stats = [
    { label: "Active Users", value: "50K+", icon: Users },
    { label: "Translations", value: "2M+", icon: MessageSquare },
    { label: "Interpreters", value: "5K+", icon: Star },
    { label: "Accuracy", value: "95%+", icon: Zap },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Navigation */}
      <nav className="border-b border-border/40 backdrop-blur-sm bg-background/80 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full cosmic-gradient flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-2xl font-bold neon-text">PinkSync</span>
          </div>

          <div className="hidden md:flex items-center space-x-6">
            <Link href="/features" className="text-muted-foreground hover:text-primary transition-colors">
              Features
            </Link>
            <Link href="/community" className="text-muted-foreground hover:text-primary transition-colors">
              Community
            </Link>
            <Link href="/developers" className="text-muted-foreground hover:text-primary transition-colors">
              Developers
            </Link>
            <Link href="/pricing" className="text-muted-foreground hover:text-primary transition-colors">
              Pricing
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-muted-foreground">Welcome, {user?.username}</span>
                <Link href="/dashboard">
                  <Button className="pinksync-glow">Dashboard</Button>
                </Link>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link href="/auth/login">
                  <Button variant="ghost">Sign In</Button>
                </Link>
                <Link href="/auth/register">
                  <Button className="pinksync-glow">Get Started</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: isLoaded ? 1 : 0, y: isLoaded ? 0 : 20 }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-4xl mx-auto"
        >
          <Badge variant="secondary" className="mb-6 text-sm px-4 py-2">
            <Sparkles className="w-4 h-4 mr-2" />
            Where Deaf Syncs with Power
          </Badge>

          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            <span className="neon-text">Deaf-First</span>
            <br />
            <span className="bg-gradient-to-r from-primary via-purple-500 to-teal-400 bg-clip-text text-transparent">
              AI Accessibility
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-muted-foreground mb-8 leading-relaxed">
            Automate accessibility, sync humans with AI, and elevate deaf technology ecosystems through inclusive
            innovation. Think Zapier × Slack × Disability Services.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Link href="/auth/register">
              <Button size="lg" className="pinksync-glow text-lg px-8 py-6">
                Start Free Trial
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="text-lg px-8 py-6 bg-transparent">
              <Play className="w-5 h-5 mr-2" />
              Watch Demo
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-2xl mx-auto">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: isLoaded ? 1 : 0, y: isLoaded ? 0 : 20 }}
                transition={{ duration: 0.8, delay: 0.2 + index * 0.1 }}
                className="text-center"
              >
                <div className="flex items-center justify-center mb-2">
                  <stat.icon className="w-6 h-6 text-primary" />
                </div>
                <div className="text-2xl font-bold text-primary">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Sign Language Demo */}
      <section className="container mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: isLoaded ? 1 : 0, y: isLoaded ? 0 : 20 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Experience Real-Time Translation</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Try our AI-powered sign language recognition technology right in your browser
          </p>
        </motion.div>

        <SignLanguageDemo />
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: isLoaded ? 1 : 0, y: isLoaded ? 0 : 20 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Powerful Features for Everyone</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Built with deaf people at the center, not as an afterthought
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: isLoaded ? 1 : 0, y: isLoaded ? 0 : 20 }}
              transition={{ duration: 0.8, delay: 0.8 + index * 0.1 }}
            >
              <Card className="h-full hover:shadow-lg transition-all duration-300 border-border/50 hover:border-primary/50">
                <CardHeader>
                  <div
                    className={`w-12 h-12 rounded-lg bg-gradient-to-r ${feature.color} flex items-center justify-center mb-4`}
                  >
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base leading-relaxed">{feature.description}</CardDescription>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: isLoaded ? 1 : 0, y: isLoaded ? 0 : 20 }}
          transition={{ duration: 0.8, delay: 1.2 }}
          className="text-center"
        >
          <Card className="max-w-4xl mx-auto cosmic-gradient p-1">
            <div className="bg-background rounded-lg p-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Transform Accessibility?</h2>
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Join thousands of deaf professionals, developers, and organizations building a more accessible world
                together.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/auth/register">
                  <Button size="lg" className="pinksync-glow text-lg px-8 py-6">
                    Start Your Journey
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
                <Link href="/contact">
                  <Button size="lg" variant="outline" className="text-lg px-8 py-6 bg-transparent">
                    Contact Sales
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        </motion.div>
      </section>

      {/* Accessibility Overlay Demo */}
      <AccessibilityOverlay />
    </div>
  )
}
