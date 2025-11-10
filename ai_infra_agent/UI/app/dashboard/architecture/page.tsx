"use client";

import { useEffect, useState } from "react";
import { ChevronDown, Loader2 } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard-layout";

export default function ArchitecturePage() {
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);

  const mockResources = [
    {
      id: 1,
      type: "EC2",
      name: "Web Server",
      region: "ap-southeast-1",
      metadata: { cpu: "2 vCPU", memory: "4GB" },
    },
    {
      id: 2,
      type: "S3",
      name: "App Storage",
      region: "us-east-1",
      metadata: { bucket: "app-files" },
    },
    {
      id: 3,
      type: "Lambda",
      name: "Process Data",
      region: "ap-southeast-1",
      metadata: { runtime: "Node.js 18", timeout: "60s" },
    },
    {
      id: 4,
      type: "RDS",
      name: "Database",
      region: "us-west-2",
      metadata: { engine: "PostgreSQL", version: "15.2" },
    },
  ];

  useEffect(() => {
    const timer = setTimeout(() => {
      setResources(mockResources);
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const toggleDropdown = (id: number) => {
    setOpenDropdown(openDropdown === id ? null : id);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-screen">
          <Loader2 className="animate-spin text-gray-500" size={32} />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50 p-6">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">
          AWS Infrastructure Architecture
        </h1>

        <div className="flex flex-col gap-4">
          {resources.map((res) => (
            <div
              key={res.id}
              className="bg-white border border-gray-200 rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 p-4"
            >
              {/* Tiêu đề box */}
              <div
                className="flex justify-between items-center cursor-pointer"
                onClick={() => toggleDropdown(res.id)}
              >
                <div>
                  <h2 className="text-lg font-semibold text-gray-800">
                    {res.name || `Resource #${res.id}`}
                  </h2>
                  <p className="text-sm text-gray-500">
                    Type: {res.type || "Unknown"}
                  </p>
                </div>

                <ChevronDown
                  className={`transition-transform text-gray-600 ${
                    openDropdown === res.id ? "rotate-180" : ""
                  }`}
                />
              </div>

              {/* Dropdown nội dung */}
              {openDropdown === res.id && (
                <div className="mt-3 border-t border-gray-100 pt-3 text-sm text-gray-700 space-y-1">
                  <p>
                    <strong>Region:</strong> {res.region || "—"}
                  </p>

                  {res.metadata && (
                    <div className="mt-1">
                      <p className="font-medium text-gray-600">Details:</p>
                      <ul className="list-disc ml-5 text-gray-700">
                        {Object.entries(res.metadata).map(([key, value]) => (
                          <li key={key}>
                            <strong>{key}:</strong> {String(value)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {!res.metadata && (
                    <p className="text-gray-500 italic">
                      No additional metadata available
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
