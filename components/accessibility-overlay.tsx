"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Accessibility, Eye, Type, Volume2, MousePointer, X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface AccessibilitySettings {
  highContrast: boolean
  fontSize: number
  reducedMotion: boolean
  screenReader: boolean
  focusIndicators: boolean
  colorBlindSupport: boolean
}

export function AccessibilityOverlay() {
  const [isOpen, setIsOpen] = useState(false)
  const [settings, setSettings] = useState<AccessibilitySettings>({
    highContrast: false,
    fontSize: 16,
    reducedMotion: false,
    screenReader: false,
    focusIndicators: true,
    colorBlindSupport: false,
  })

  useEffect(() => {
    // Load saved settings from localStorage
    const savedSettings = localStorage.getItem("pinksync_accessibility")
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings))
    }
  }, [])

  useEffect(() => {
    // Apply accessibility settings to document
    applySettings(settings)

    // Save settings to localStorage
    localStorage.setItem("pinksync_accessibility", JSON.stringify(settings))
  }, [settings])

  const applySettings = (newSettings: AccessibilitySettings) => {
    const root = document.documentElement

    // High contrast
    if (newSettings.highContrast) {
      root.classList.add("high-contrast")
    } else {
      root.classList.remove("high-contrast")
    }

    // Font size
    root.style.fontSize = `${newSettings.fontSize}px`

    // Reduced motion
    if (newSettings.reducedMotion) {
      root.classList.add("reduce-motion")
    } else {
      root.classList.remove("reduce-motion")
    }

    // Focus indicators
    if (newSettings.focusIndicators) {
      root.classList.add("enhanced-focus")
    } else {
      root.classList.remove("enhanced-focus")
    }

    // Color blind support
    if (newSettings.colorBlindSupport) {
      root.classList.add("colorblind-support")
    } else {
      root.classList.remove("colorblind-support")
    }
  }

  const updateSetting = (key: keyof AccessibilitySettings, value: any) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const resetSettings = () => {
    const defaultSettings: AccessibilitySettings = {
      highContrast: false,
      fontSize: 16,
      reducedMotion: false,
      screenReader: false,
      focusIndicators: true,
      colorBlindSupport: false,
    }
    setSettings(defaultSettings)
  }

  return (
    <>
      {/* Accessibility Button */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="fixed bottom-6 right-6 z-50"
      >
        <Button
          onClick={() => setIsOpen(true)}
          size="lg"
          className="rounded-full w-14 h-14 pinksync-glow shadow-lg"
          aria-label="Open accessibility settings"
        >
          <Accessibility className="w-6 h-6" />
        </Button>
      </motion.div>

      {/* Accessibility Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Accessibility className="w-5 h-5 text-primary" />
                      Accessibility Settings
                    </CardTitle>
                    <CardDescription>Customize your experience for better accessibility</CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsOpen(false)}
                    aria-label="Close accessibility settings"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Visual Settings */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Eye className="w-5 h-5" />
                      Visual Settings
                    </h3>

                    <div className="grid gap-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <label className="text-sm font-medium">High Contrast Mode</label>
                          <p className="text-xs text-muted-foreground">Increase contrast for better visibility</p>
                        </div>
                        <Switch
                          checked={settings.highContrast}
                          onCheckedChange={(checked) => updateSetting("highContrast", checked)}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium flex items-center gap-2">
                          <Type className="w-4 h-4" />
                          Font Size: {settings.fontSize}px
                        </label>
                        <Slider
                          value={[settings.fontSize]}
                          onValueChange={([value]) => updateSetting("fontSize", value)}
                          min={12}
                          max={24}
                          step={1}
                          className="w-full"
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <label className="text-sm font-medium">Color Blind Support</label>
                          <p className="text-xs text-muted-foreground">Adjust colors for color vision differences</p>
                        </div>
                        <Switch
                          checked={settings.colorBlindSupport}
                          onCheckedChange={(checked) => updateSetting("colorBlindSupport", checked)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Motion Settings */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <MousePointer className="w-5 h-5" />
                      Motion & Interaction
                    </h3>

                    <div className="grid gap-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <label className="text-sm font-medium">Reduced Motion</label>
                          <p className="text-xs text-muted-foreground">Minimize animations and transitions</p>
                        </div>
                        <Switch
                          checked={settings.reducedMotion}
                          onCheckedChange={(checked) => updateSetting("reducedMotion", checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <label className="text-sm font-medium">Enhanced Focus Indicators</label>
                          <p className="text-xs text-muted-foreground">
                            Stronger visual focus indicators for keyboard navigation
                          </p>
                        </div>
                        <Switch
                          checked={settings.focusIndicators}
                          onCheckedChange={(checked) => updateSetting("focusIndicators", checked)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Screen Reader Settings */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Volume2 className="w-5 h-5" />
                      Screen Reader
                    </h3>

                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <label className="text-sm font-medium">Screen Reader Optimizations</label>
                        <p className="text-xs text-muted-foreground">Enhanced compatibility with screen readers</p>
                      </div>
                      <Switch
                        checked={settings.screenReader}
                        onCheckedChange={(checked) => updateSetting("screenReader", checked)}
                      />
                    </div>
                  </div>

                  {/* Current Settings Summary */}
                  <div className="space-y-4 pt-4 border-t">
                    <h3 className="text-lg font-semibold">Active Settings</h3>
                    <div className="flex flex-wrap gap-2">
                      {settings.highContrast && <Badge variant="secondary">High Contrast</Badge>}
                      {settings.fontSize !== 16 && <Badge variant="secondary">Font Size: {settings.fontSize}px</Badge>}
                      {settings.reducedMotion && <Badge variant="secondary">Reduced Motion</Badge>}
                      {settings.screenReader && <Badge variant="secondary">Screen Reader</Badge>}
                      {settings.focusIndicators && <Badge variant="secondary">Enhanced Focus</Badge>}
                      {settings.colorBlindSupport && <Badge variant="secondary">Color Blind Support</Badge>}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between pt-4 border-t">
                    <Button variant="outline" onClick={resetSettings}>
                      Reset to Defaults
                    </Button>
                    <Button onClick={() => setIsOpen(false)} className="pinksync-glow">
                      Apply Settings
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CSS for accessibility classes */}
      <style jsx global>{`
        .high-contrast {
          filter: contrast(150%);
        }
        
        .reduce-motion * {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
        }
        
        .enhanced-focus *:focus {
          outline: 3px solid var(--pinksync-neon) !important;
          outline-offset: 2px !important;
        }
        
        .colorblind-support {
          filter: url('#colorblind-filter');
        }
      `}</style>
    </>
  )
}
