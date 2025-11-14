"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Search, Trash2, AlertCircle, Eye, Loader2 } from "lucide-react"

interface Script {
  id: string
  type: string
  created: Date
}
const fetchScriptsFromDB = async (): Promise<Script[]> => {
  console.log("Fetching data from the database...")
  await new Promise(resolve => setTimeout(resolve, 1000)); 

  // 5. Cập nhật dữ liệu mẫu để có nhiều mục hơn và ID duy nhất
  return [
    { id: "scr_1a2b3c", type: "Deploy Kubernetes Cluster", created: new Date("2025-07-22") },
    { id: "scr_5e6f7g", type: "Database Backup Daily", created: new Date("2025-07-20") },
    { id: "scr_9i0j1k", type: "SSL Certificate Renewal", created: new Date("2025-07-15") },
    { id: "scr_3m4n5o", type: "Cleanup Old EC2 Resources", created: new Date("2025-06-30") },
    { id: "scr_7q8r9s", type: "Terraform Load Balancer Config", created: new Date("2025-06-10") },
    { id: "scr_8t9u0v", type: "User Provisioning Script", created: new Date("2025-06-05") },
    { id: "scr_1w2x3y", type: "System Health Check", created: new Date("2025-05-28") },
    { id: "scr_4z5a6b", type: "Firewall Rule Update", created: new Date("2025-05-19") },{ id: "scr_1a2b3c", type: "Deploy Kubernetes Cluster", created: new Date("2025-07-22") },
    { id: "scr_5e6f7g", type: "Database Backup Daily", created: new Date("2025-07-20") },
    { id: "scr_9i0j1k", type: "SSL Certificate Renewal", created: new Date("2025-07-15") },
    { id: "scr_3m4n5o", type: "Cleanup Old EC2 Resources", created: new Date("2025-06-30") },
    { id: "scr_7q8r9s", type: "Terraform Load Balancer Config", created: new Date("2025-06-10") },
    { id: "scr_8t9u0v", type: "User Provisioning Script", created: new Date("2025-06-05") },
    { id: "scr_1w2x3y", type: "System Health Check", created: new Date("2025-05-28") },
    { id: "scr_4z5a6b", type: "Firewall Rule Update", created: new Date("2025-05-19") },{ id: "scr_1a2b3c", type: "Deploy Kubernetes Cluster", created: new Date("2025-07-22") },
    { id: "scr_5e6f7g", type: "Database Backup Daily", created: new Date("2025-07-20") },
    { id: "scr_9i0j1k", type: "SSL Certificate Renewal", created: new Date("2025-07-15") },
    { id: "scr_3m4n5o", type: "Cleanup Old EC2 Resources", created: new Date("2025-06-30") },
    { id: "scr_7q8r9s", type: "Terraform Load Balancer Config", created: new Date("2025-06-10") },
    { id: "scr_8t9u0v", type: "User Provisioning Script", created: new Date("2025-06-05") },
    { id: "scr_1w2x3y", type: "System Health Check", created: new Date("2025-05-28") },
    { id: "scr_4z5a6b", type: "Firewall Rule Update", created: new Date("2025-05-19") },
  ];
};


export default function ProjectsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [scripts, setScripts] = useState<Script[]>([])
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 1. Thêm state cho phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const data = await fetchScriptsFromDB();
        setScripts(data);
      } catch (e) {
        setError("Failed to load scripts.");
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);
  
  // 4. Khi tìm kiếm, quay về trang 1
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const filteredScripts = scripts.filter((script) =>
    script.type.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // 2. Tính toán dữ liệu cho trang hiện tại
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
  const handleDelete = (id: string) => {
    if (confirm(`Are you sure you want to delete script ${id}?`)) {
      setScripts(prev => prev.filter(s => s.id !== id));
      alert(`Deleted script: ${id}`);
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
                  {/* Sử dụng dữ liệu đã được phân trang */}
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
              <Button>Create Your First Script</Button>
            </div>
          )}
          
          {/* 3. Thêm giao diện điều khiển phân trang */}
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