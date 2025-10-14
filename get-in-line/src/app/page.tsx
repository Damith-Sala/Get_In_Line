import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container-responsive py-16">
        <header className="text-center mb-16 animate-fade-in">
          <h1 className="text-5xl font-bold text-gradient mb-4 animate-slide-up">
            Get In Line
          </h1>
          <p className="text-xl text-muted-foreground mb-8 text-responsive">
            Skip the wait, join the digital queue
          </p>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-responsive">
            Join virtual queues for restaurants, services, and appointments. 
            No more standing in line - get notified when it's your turn!
          </p>
        </header>

        <main className="max-w-4xl mx-auto">
          <div className="grid-responsive mb-16">
            {/* Guest Access */}
            <Card className="text-center card-hover glass-effect border-2 border-info/20">
              <CardHeader>
                <div className="w-16 h-16 bg-info/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-info" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
                <CardTitle>Browse Queues</CardTitle>
                <CardDescription>
                  See all available queues without signing up. Perfect for exploring what's available.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="btn-primary w-full">
                  <Link href="/guest-queues">View All Queues</Link>
                </Button>
                <p className="text-xs text-info mt-2">No account required!</p>
              </CardContent>
            </Card>

            {/* Customer Signup */}
            <Card className="text-center card-hover glass-effect border-2 border-success/20">
              <CardHeader>
                <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <CardTitle>Join as Customer</CardTitle>
                <CardDescription>
                  Sign up to join queues, track your position, and get notifications.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="btn-secondary w-full">
                  <Link href="/signup">Sign Up as Customer</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Business Signup */}
            <Card className="text-center card-hover glass-effect border-2 border-warning/20">
              <CardHeader>
                <div className="w-16 h-16 bg-warning/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <CardTitle>Create as Business</CardTitle>
                <CardDescription>
                  Manage queues for your business, track customers, and reduce wait times.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full bg-warning hover:bg-warning/90 text-warning-foreground">
                  <Link href="/signup/business">Sign Up as Business</Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="text-center animate-fade-in">
            <h2 className="text-2xl font-semibold mb-6 text-gradient">Already have an account?</h2>
            <div className="flex gap-4 justify-center">
              <Button asChild className="btn-primary">
                <Link href="/login">Login</Link>
              </Button>
              <Button asChild variant="outline" className="hover:bg-primary hover:text-primary-foreground">
                <Link href="/dashboard">Go to Dashboard</Link>
              </Button>
            </div>
          </div>
        </main>

        <footer className="mt-16 text-center text-gray-500">
          <p>&copy; 2024 Get In Line. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}
