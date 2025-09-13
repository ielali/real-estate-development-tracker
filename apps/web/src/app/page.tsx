export default function HomePage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto py-12">
        <div className="text-center space-y-6">
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            Real Estate Development Tracker
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            A comprehensive platform for managing real estate development projects, tracking costs,
            managing contacts, and providing transparent partner dashboards.
          </p>
          <div className="bg-card text-card-foreground rounded-lg p-6 max-w-md mx-auto">
            <h2 className="text-lg font-semibold mb-2">Coming Soon</h2>
            <p className="text-sm text-muted-foreground">
              This is the initial setup for the Real Estate Development Tracker. Features will be
              added in upcoming development phases.
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
