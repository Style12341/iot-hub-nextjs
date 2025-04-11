import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, BarChart2, Cloud, Database, Gauge, GitBranch, Shield, Zap } from "lucide-react";
import { LiveChartDemo } from "./LiveChartDemo";

export default function Home() {
  return (
    <>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-background to-secondary/5 overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-30">
          {/* Abstract IoT background pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]"></div>
          <div className="absolute right-0 bottom-0 -mr-[40%] -mb-[25%] w-[80%] h-[80%] rounded-full bg-primary/10 blur-[100px]"></div>
        </div>

        <div className="container relative z-10 mx-auto px-4 py-32 md:py-40">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <Badge variant="secondary" className="px-4 py-1 text-sm font-medium">
                Real-time IoT Management Platform
              </Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
                Monitor Your Devices <span className="text-primary">In Real-time</span>
              </h1>
              <p className="text-xl text-muted-foreground">
                Seamlessly connect, collect, visualize and manage all your IoT devices in one powerful platform.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" asChild>
                  <Link href="/dashboard">Get Started <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <Link href="#features">Learn More</Link>
                </Button>
              </div>
            </div>
            <div className="relative h-[400px] lg:h-[500px]">
              {/* Dashboard Preview Image */}
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-primary/5 rounded-lg overflow-hidden border border-border shadow-xl">
                <div className="p-4 h-full flex flex-col">
                  <div className="bg-background/90 backdrop-blur-sm rounded-md p-2 mb-3 flex items-center">
                    <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                    <div className="text-xs text-muted-foreground ml-2">IoT Hub Dashboard</div>
                  </div>
                  <div className="relative flex-1 bg-background/50 backdrop-blur-sm rounded-md overflow-hidden">
                    {/* Replace with actual dashboard screenshot */}
                    <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                      <Image
                        src="/dashboard-preview.png"
                        alt="IoT Dashboard Preview"
                        fill
                        className="object-cover"
                        priority
                      />
                    </div>
                  </div>
                </div>
              </div>
              {/* Floating elements for visual interest */}
              <div className="absolute -right-8 top-1/4 w-16 h-16 bg-primary/20 backdrop-blur-md rounded-lg shadow-lg flex items-center justify-center text-primary">
                <Gauge className="h-8 w-8" />
              </div>
              <div className="absolute -left-5 top-1/2 w-16 h-16 bg-primary/20 backdrop-blur-md rounded-lg shadow-lg flex items-center justify-center text-primary">
                <BarChart2 className="h-8 w-8" />
              </div>
              <div className="absolute right-1/4 -bottom-5 w-16 h-16 bg-primary/20 backdrop-blur-md rounded-lg shadow-lg flex items-center justify-center text-primary">
                <Cloud className="h-8 w-8" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-background py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="space-y-2">
              <p className="text-4xl font-bold text-primary">99.9%</p>
              <p className="text-muted-foreground">Uptime</p>
            </div>
            <div className="space-y-2">
              <p className="text-4xl font-bold text-primary">50ms</p>
              <p className="text-muted-foreground">Avg. Latency</p>
            </div>
            <div className="space-y-2">
              <p className="text-4xl font-bold text-primary">10K+</p>
              <p className="text-muted-foreground">Devices Connected</p>
            </div>
            <div className="space-y-2">
              <p className="text-4xl font-bold text-primary">24/7</p>
              <p className="text-muted-foreground">Monitoring</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-secondary/5">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge variant="outline" className="mb-4">Features</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">All the tools you need for IoT management</h2>
            <p className="text-muted-foreground">Our platform provides comprehensive tools for connecting, monitoring, and managing your IoT devices at scale.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-background p-6 rounded-lg border border-border shadow-sm">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Real-time Monitoring</h3>
              <p className="text-muted-foreground mb-4">Monitor sensor data in real-time with interactive dashboards and instant alerts.</p>
              <Link href="/dashboard" className="text-primary flex items-center hover:underline text-sm">
                Learn more <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </div>

            <div className="bg-background p-6 rounded-lg border border-border shadow-sm">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                <Database className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Data Visualization</h3>
              <p className="text-muted-foreground mb-4">Interactive charts and graphs that make complex sensor data easy to understand.</p>
              <Link href="/dashboard" className="text-primary flex items-center hover:underline text-sm">
                Learn more <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </div>

            <div className="bg-background p-6 rounded-lg border border-border shadow-sm">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Secure API</h3>
              <p className="text-muted-foreground mb-4">Authenticate devices with secure tokens and encrypt all data in transit and at rest.</p>
              <Link href="/dashboard/settings" className="text-primary flex items-center hover:underline text-sm">
                Learn more <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </div>

            <div className="bg-background p-6 rounded-lg border border-border shadow-sm">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                <GitBranch className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Remote Firmware Updates</h3>
              <p className="text-muted-foreground mb-4">Push firmware updates to your devices remotely and monitor deployment progress.</p>
              <Link href="/dashboard" className="text-primary flex items-center hover:underline text-sm">
                Learn more <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </div>

            <div className="bg-background p-6 rounded-lg border border-border shadow-sm">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                <BarChart2 className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Advanced Analytics</h3>
              <p className="text-muted-foreground mb-4">Gain insights through historical data analysis and predictive maintenance.</p>
              <Link href="/dashboard" className="text-primary flex items-center hover:underline text-sm">
                Learn more <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </div>

            <div className="bg-background p-6 rounded-lg border border-border shadow-sm">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                <Cloud className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Scalable Infrastructure</h3>
              <p className="text-muted-foreground mb-4">Handle millions of devices and messages with our cloud-native architecture.</p>
              <Link href="/dashboard" className="text-primary flex items-center hover:underline text-sm">
                Learn more <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Real-time Visualization Demo */}
      <section className="py-24 bg-gradient-to-b from-background to-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1">
              <div className="relative h-[400px] overflow-hidden rounded-lg border border-border shadow-xl">
                {/* Replace with actual visualization demo image */}
                <div className="order-2 lg:order-1">
                  <LiveChartDemo />
                </div>
              </div>
            </div>
            <div className="order-1 lg:order-2 space-y-6">
              <Badge variant="secondary">Data Visualization</Badge>
              <h2 className="text-3xl md:text-4xl font-bold">See your data come alive in real-time</h2>
              <p className="text-muted-foreground text-lg">
                Our interactive charts turn complex sensor data into clear insights. Watch as your device readings update in real-time, with automatic scaling and context-aware tooltips.
              </p>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <div className="mr-2 h-6 w-6 text-primary flex-shrink-0">✓</div>
                  <span>Time-series visualization with adjustable views</span>
                </li>
                <li className="flex items-start">
                  <div className="mr-2 h-6 w-6 text-primary flex-shrink-0">✓</div>
                  <span>Synchronized multi-sensor graphing</span>
                </li>
                <li className="flex items-start">
                  <div className="mr-2 h-6 w-6 text-primary flex-shrink-0">✓</div>
                  <span>Custom dashboard layouts for different device types</span>
                </li>
                <li className="flex items-start">
                  <div className="mr-2 h-6 w-6 text-primary flex-shrink-0">✓</div>
                  <span>Export data in multiple formats for further analysis</span>
                </li>
              </ul>
              <Button asChild>
                <Link href="/dashboard">Try the Demo <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* API Integration Section */}
      <section className="py-24 bg-secondary/5">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 gap-12 items-center">
            <div className="space-y-6">
              <Badge variant="secondary">Easy Integration</Badge>
              <h2 className="text-3xl md:text-4xl font-bold">Simple API for developers</h2>
              <p className="text-muted-foreground text-lg">
                Integrate your devices with our platform using our well-documented RESTful API. Send data, receive commands, and manage firmware updates with just a few lines of code.
              </p>
            </div>
            <div className="relative">
              <div className="bg-background/95 backdrop-blur-sm rounded-lg border border-border shadow-xl p-6 mx-5 md:mx-10 lg:mx-20">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Supported Platforms</h3>
                    <Badge>REST API</Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 bg-muted/30 rounded flex flex-col items-center justify-center">
                      <div className="h-12 w-12 mb-2">
                        <Image src="/arduino-logo.png" alt="Arduino" width={48} height={48} />
                      </div>
                      <span className="text-sm">Arduino</span>
                    </div>
                    <div className="p-4 bg-muted/30 rounded flex flex-col items-center justify-center">
                      <div className="h-12 w-12 mb-2">
                        <Image src="/esp32-logo.png" alt="ESP32" width={48} height={48} />
                      </div>
                      <span className="text-sm">ESP32</span>
                    </div>
                    <div className="p-4 bg-muted/30 rounded flex flex-col items-center justify-center">
                      <div className="h-12 w-12 mb-2">
                        <Image src="/nodejs-logo.png" alt="Node.js" width={48} height={48} />
                      </div>
                      <span className="text-sm">Node.js</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground text-center pt-2">
                    And many more platforms supported through our HTTP endpoints
                  </p>
                </div>
              </div>
            </div>
            <div className="flex gap-4 items-center justify-center">
              <Button asChild variant="outline">
                <Link href="/docs">API Documentation</Link>
              </Button>
              <Button asChild>
                <Link href="/dashboard/settings">Get API Keys</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-24 bg-primary/5">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold">Ready to connect your devices?</h2>
            <p className="text-xl text-muted-foreground">
              Start monitoring your IoT ecosystem today with our powerful, easy-to-use platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button size="lg" asChild>
                <Link href="/dashboard">Get Started for Free</Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="/contact">Contact Sales</Link>
              </Button>
            </div>
            <p className="text-sm text-muted-foreground pt-6">
              No credit card required • Free tier available • Upgrade anytime
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-background border-t border-border py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2">
                <li><Link href="#" className="text-muted-foreground hover:text-foreground text-sm">Features</Link></li>
                <li><Link href="#" className="text-muted-foreground hover:text-foreground text-sm">Pricing</Link></li>
                <li><Link href="#" className="text-muted-foreground hover:text-foreground text-sm">Use Cases</Link></li>
                <li><Link href="#" className="text-muted-foreground hover:text-foreground text-sm">Roadmap</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Resources</h3>
              <ul className="space-y-2">
                <li><Link href="#" className="text-muted-foreground hover:text-foreground text-sm">Documentation</Link></li>
                <li><Link href="#" className="text-muted-foreground hover:text-foreground text-sm">API Reference</Link></li>
                <li><Link href="#" className="text-muted-foreground hover:text-foreground text-sm">Tutorials</Link></li>
                <li><Link href="#" className="text-muted-foreground hover:text-foreground text-sm">Blog</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2">
                <li><Link href="#" className="text-muted-foreground hover:text-foreground text-sm">About</Link></li>
                <li><Link href="#" className="text-muted-foreground hover:text-foreground text-sm">Careers</Link></li>
                <li><Link href="#" className="text-muted-foreground hover:text-foreground text-sm">Contact</Link></li>
                <li><Link href="#" className="text-muted-foreground hover:text-foreground text-sm">Press</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2">
                <li><Link href="#" className="text-muted-foreground hover:text-foreground text-sm">Privacy</Link></li>
                <li><Link href="#" className="text-muted-foreground hover:text-foreground text-sm">Terms</Link></li>
                <li><Link href="#" className="text-muted-foreground hover:text-foreground text-sm">Security</Link></li>
                <li><Link href="#" className="text-muted-foreground hover:text-foreground text-sm">Compliance</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <Image
                src="/logo.png"
                alt="IoT Hub Logo"
                width={32}
                height={32}
                className="mr-2"
              />
              <span className="font-semibold">IoT Hub</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} IoT Hub. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}