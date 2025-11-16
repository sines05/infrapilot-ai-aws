"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { getInfrastructureHistoryForCurrentUser } from "@/lib/actions/infrastructure.actions"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Search, Trash2, AlertCircle, Eye, Loader2 } from "lucide-react"
import { deleteInfrastructureHistory } from "@/lib/actions/infrastructure.actions"

// The Script interface remains the same, mapping to your data
interface Script {
  id: string
  type: string
  created: Date
}

/**
 * Fetches infrastructure scripts from database for the currently authenticated user via NextAuth.
 * @returns A promise that resolves to an array of scripts.
 */
const fetchScriptsFromDB = async (): Promise<Script[]> => {
  console.log("Fetching data from database for the current user...")

  try {
    // Use server action to fetch data with NextAuth session
    const data = await getInfrastructureHistoryForCurrentUser();

    // Map the database response to the local Script interface
    // The `created_at` field is converted from a string to a Date object.
    return data.map((script: { id: any; type: any; created_at: string | number | Date }) => ({
      id: script.id,
      type: script.type,
      created: new Date(script.created_at),
    }));
  } catch (error: any) {
    console.error("Error fetching scripts:", error.message);
    throw new Error("Failed to fetch scripts from the database.");
  }
};


export default function ProjectsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [scripts, setScripts] = useState<Script[]>([])
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  // Get NextAuth session
  const { data: session, status } = useSession();

  useEffect(() => {
    const loadData = async () => {
      try {
        // Only load if user is authenticated
        if (status === "unauthenticated") {
          setError("Please sign in to view your scripts.");
          setLoading(false);
          return;
        }

        if (status !== "authenticated") {
          // Still loading session
          return;
        }

        setLoading(true);
        // This now calls the function that fetches real data
        const data = await fetchScriptsFromDB();
        setScripts(data);
        setError(null);
      } catch (e: any) {
        setError(e.message || "Failed to load scripts.");
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [status]);
  
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const filteredScripts = scripts.filter((script) =>
    script.type.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const totalPages = Math.ceil(filteredScripts.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedScripts = filteredScripts.slice(startIndex, startIndex + ITEMS_PER_PAGE);


  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }
  
  const handleRun = (id: string) => alert(`Running script: ${id}`);
  const handleView = (id: string) => alert(`Viewing script: ${id}`);
  
  /**
   * Deletes a script from the database and updates the local state.
   * @param id The UUID of the script to delete.
   */
  const handleDelete = async (id: string) => {
    if (confirm(`Are you sure you want to delete script ${id}?`)) {
      try {
        const result = await deleteInfrastructureHistory(id);
        
        if (!result.success) {
          alert(`Failed to delete script: ${result.error}`);
          console.error("Error deleting script:", result.error);
        } else {
          // On successful deletion, remove the item from the local state
          // to instantly update the UI without a full reload.
          setScripts(prev => prev.filter(s => s.id !== id));
          alert(`Deleted script: ${id}`);
        }
      } catch (error: any) {
        alert(`Error deleting script: ${error.message}`);
        console.error("Error deleting script:", error);
      }
    }
  };


  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Scripts & Projects</h1>
            <p className="text-muted-foreground mt-1">Manage your infrastructure automation scripts</p>
          </div>
        </div>

        <Card className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search scripts by type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </Card>

        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-blue-200">
                  <th className="px-6 py-4 text-left text-sm font-medium">ID</th>
                  <th className="px-6 py-4 text-left text-sm font-medium">Action</th>
                  <th className="px-6 py-4 text-left text-sm font-medium">Type</th>
                  <th className="px-6 py-4 text-left text-sm font-medium">Created</th>
                  <th className="px-6 py-4 text-left text-sm font-medium">Actions</th>
                </tr>
              </thead>
              {!loading && !error && (
                <tbody>
                  {paginatedScripts.map((script) => (
                    <tr key={script.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                      <td className="px-6 py-4 font-mono text-sm text-muted-foreground">{script.id}</td>
                      <td className="px-6 py-4">
                        <Button
                          variant="link"
                          className="p-0 h-auto font-medium text-blue-600 hover:text-blue-700"
                          onClick={() => handleRun(script.id)}
                        >
                          Run
                        </Button>
                      </td>
                      <td className="px-6 py-4 font-medium">{script.type}</td>
                      <td className="px-6 py-4 text-muted-foreground">{formatDate(script.created)}</td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <Button size="icon" variant="ghost" className="w-8 h-8" title="View details" onClick={() => handleView(script.id)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="w-8 h-8 hover:text-destructive"
                            title="Delete script"
                            onClick={() => handleDelete(script.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              )}
            </table>
          </div>

          {loading && (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          )}
          {error && (
             <div className="px-6 py-12 text-center text-destructive">
               <AlertCircle className="w-12 h-12 mx-auto mb-4" />
               <p>{error}</p>
             </div>
          )}
          {!loading && !error && filteredScripts.length === 0 && (
            <div className="px-6 py-12 text-center">
              <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground mb-4">No scripts found</p>
            </div>
          )}
          
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-border">
              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setCurrentPage(prev => prev - 1)}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  disabled={currentPage >= totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  )
}