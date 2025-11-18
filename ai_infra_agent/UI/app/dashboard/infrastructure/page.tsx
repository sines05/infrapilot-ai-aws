"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Trash2,
  RefreshCw,
  Loader2,
  AlertTriangle,
  Server,
  Eye,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// Type for a discovered resource
interface DiscoveredResource {
  id: string;
  user_id: string;
  resource_id: string;
  resource_type: string;
  region: string;
  properties: any;
  discovered_at: string;
}

// Function to get the correct icon path
const getAwsIcon = (resourceType: string) => {
    const typeMap: { [key: string]: string } = {
      aws_ec2_instance: "Arch_Amazon-EC2_48.svg",
      aws_s3_bucket: "Arch_Amazon-S3_48.svg",
      aws_rds_db_subnet_group: "Arch_Amazon-RDS_48.svg",
      aws_rds_instance: "Arch_Amazon-RDS_48.svg",
      aws_vpc: "Arch_Amazon-Virtual-Private-Cloud_48.svg",
      aws_security_group: "Arch_AWS-Shield_48.svg",
      aws_ebs_volume: "Arch_Amazon-Elastic-Block-Store_48.svg",
      aws_ec2_key_pair: "Arch_AWS-Key-Management-Service_48.svg",
      aws_internet_gateway: "Arch_Amazon-Virtual-Private-Cloud_48.svg",
      aws_subnet: "Arch_Amazon-Virtual-Private-Cloud_48.svg",
      aws_elb_load_balancer: "Arch_Elastic-Load-Balancing_48.svg",
    };
    const iconName = typeMap[resourceType] || "Arch_AWS-Cloud_48.svg"; // Fallback icon

    const categoryMap: { [key: string]: string } = {
        aws_ec2_instance: "compute",
        aws_s3_bucket: "storage",
        aws_rds_db_subnet_group: "database",
        aws_rds_instance: "database",
        aws_vpc: "networking-content-delivery",
        aws_security_group: "security-identity-compliance",
        aws_ebs_volume: "storage",
        aws_ec2_key_pair: "security-identity-compliance",
        aws_internet_gateway: "networking-content-delivery",
        aws_subnet: "networking-content-delivery",
        aws_elb_load_balancer: "networking-content-delivery",
    };
    const category = categoryMap[resourceType] || "general-icons"; // Fallback category

    return `/aws-service-icons/${category}/48/${iconName}`;
};

// Helper to extract a display name from resource properties
const getResourceName = (resource: DiscoveredResource) => {
    if (resource.properties?.Tags) {
        const nameTag = resource.properties.Tags.find((tag: any) => tag.Key === 'Name');
        if (nameTag) return nameTag.Value;
    }
     if (resource.properties?.GroupName) return resource.properties.GroupName;
    if (resource.properties?.Name) return resource.properties.Name;
    return resource.resource_id;
};


export default function InfrastructurePage() {
  const { status } = useSession();
  const [resources, setResources] = useState<DiscoveredResource[]>([]);
  const [filteredResources, setFilteredResources] = useState<DiscoveredResource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchResources = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Correct proxy path
      const res = await fetch("/api/agent/resources");
      if (!res.ok) {
        const errData = await res.json().catch(() => ({ detail: "Failed to fetch resources." }));
        throw new Error(errData.detail);
      }
      const data = await res.json();
      setResources(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDiscover = async () => {
    setIsDiscovering(true);
    setError(null);
    try {
      // Correct proxy path
      const res = await fetch("/api/agent/discover", { method: "POST" });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({ detail: "Failed to start discovery." }));
        throw new Error(errData.detail);
      }
      // After discovery, refetch the list
      await fetchResources();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsDiscovering(false);
    }
  };

  useEffect(() => {
    if (status === "authenticated") {
      fetchResources();
    }
  }, [status]);
  
  useEffect(() => {
    const filtered = resources.filter(r => 
        getResourceName(r).toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.resource_id.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredResources(filtered);
  }, [searchTerm, resources]);
  
  const resourceTypes = [...new Set(filteredResources.map(r => r.resource_type))].sort();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Infrastructure Management</h1>
            <p className="text-muted-foreground mt-1">Discover and manage your existing AWS resources.</p>
          </div>
          <Button onClick={handleDiscover} disabled={isDiscovering}>
            {isDiscovering ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            {isDiscovering ? "Scanning..." : "Re-Scan Resources"}
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardContent className="p-4">
            <Input
              placeholder="Search by name or resource ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </CardContent>
        </Card>

        {isLoading ? (
            <div className="flex justify-center items-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
        ) : resources.length === 0 && !error ? (
            <Card className="text-center p-12">
                <Server className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium">No Resources Found</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                    Click the "Re-Scan Resources" button to discover your AWS infrastructure.
                </p>
            </Card>
        ) : (
        <Tabs defaultValue={resourceTypes[0] || 'all'}>
          <TabsList className="flex-wrap h-auto">
            {resourceTypes.map(type => (
                <TabsTrigger key={type} value={type} className="capitalize">
                    {type.replace('aws_', '').replace(/_/g, ' ')}
                </TabsTrigger>
            ))}
          </TabsList>
          
          {resourceTypes.map(type => (
            <TabsContent key={type} value={type}>
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[64px]"></TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Resource ID</TableHead>
                      <TableHead>Region</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredResources.filter(r => r.resource_type === type).map(res => (
                      <TableRow key={res.id}>
                        <TableCell>
                          <Image src={getAwsIcon(res.resource_type)} alt={res.resource_type} width={32} height={32} />
                        </TableCell>
                        <TableCell className="font-medium">{getResourceName(res)}</TableCell>
                        <TableCell className="font-mono text-xs">{res.resource_id}</TableCell>
                        <TableCell>{res.region}</TableCell>
                        <TableCell className="flex gap-1">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="icon" className="h-8 w-8">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-3xl">
                              <DialogHeader>
                                <DialogTitle>Resource Properties: {getResourceName(res)}</DialogTitle>
                              </DialogHeader>
                              <pre className="mt-4 bg-muted p-4 rounded-lg overflow-x-auto text-xs max-h-[60vh]">
                                {JSON.stringify(res.properties, null, 2)}
                              </pre>
                            </DialogContent>
                          </Dialog>

                          <Button variant="destructive" size="icon" className="h-8 w-8">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
        )}
      </div>
    </DashboardLayout>
  );
}