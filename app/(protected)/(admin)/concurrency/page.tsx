import ConcurrencyList from "@/components/dashboard/concurrency/concurrency-list";
import ConcurrencyStats from "@/components/dashboard/concurrency/concurrency-stats";

export default function ConcurrencyPage() {
  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">
          Concurrency Management
        </h1>
        <p className="text-muted-foreground mt-2">
          Manage conflict of interest declarations and reviews
        </p>
      </div>

      <ConcurrencyStats />
      <ConcurrencyList />
    </div>
  );
}
