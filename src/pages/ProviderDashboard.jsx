import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import ProviderHeader from "@/components/provider/ProviderHeader";
import ProviderServiceCard from "@/components/provider/ProviderServiceCard";
import ServiceFormDialog from "@/components/provider/ServiceFormDialog";

export default function ProviderDashboard() {
  const [user, setUser] = useState(null);
  const [showNewServiceForm, setShowNewServiceForm] = useState(false);

  useEffect(() => {
    base44.auth.me().then((userData) => {
      setUser(userData);
    }).catch(() => {
      window.location.href = "/";
    });
  }, []);

  const { data: services = [], refetch } = useQuery({
    queryKey: ["provider_services", user?.email],
    queryFn: () => {
      if (!user?.email) return [];
      return base44.entities.LabService.filter({ managed_by: user.email });
    },
    enabled: !!user?.email,
  });

  const { data: requests = [] } = useQuery({
    queryKey: ["provider_requests", user?.email],
    queryFn: () => {
      if (!user?.email) return [];
      return base44.entities.LabRequest.filter({});
    },
    enabled: !!user?.email,
  });

  if (!user) return <div className="p-8">Loading...</div>;

  const relevantRequests = requests.filter(r => 
    services.some(s => s.id === r.service_id)
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <ProviderHeader user={user} />
      
      <div className="max-w-7xl mx-auto p-8">
        {/* Services Section */}
        <div className="mb-12">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">My Services</h2>
              <p className="text-slate-600 text-sm mt-1">Manage your lab services and offerings</p>
            </div>
            <Button
              onClick={() => setShowNewServiceForm(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" /> Add Service
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.length > 0 ? (
              services.map((service) => (
                <ProviderServiceCard
                  key={service.id}
                  service={service}
                  onUpdate={refetch}
                />
              ))
            ) : (
              <div className="col-span-full text-center py-12 bg-white rounded-lg border border-slate-200">
                <p className="text-slate-600">No services yet. Create your first service to get started.</p>
              </div>
            )}
          </div>
        </div>

        {/* Requests Section */}
        <div>
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-900">Incoming Requests</h2>
            <p className="text-slate-600 text-sm mt-1">{relevantRequests.length} pending request{relevantRequests.length !== 1 ? 's' : ''}</p>
          </div>

          {relevantRequests.length > 0 ? (
            <div className="space-y-4">
              {relevantRequests.map((request) => (
                <div key={request.id} className="bg-white rounded-lg border border-slate-200 p-6 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-slate-900">{request.title}</h3>
                      <p className="text-sm text-slate-600 mt-1">{request.description}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      request.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                      request.status === 'completed' ? 'bg-green-100 text-green-800' :
                      'bg-slate-100 text-slate-800'
                    }`}>
                      {request.status}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-200">
                    <span className="text-xs text-slate-500">Requester: {request.requester_email}</span>
                    <Button variant="outline" size="sm">View Details</Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-lg border border-slate-200">
              <p className="text-slate-600">No requests yet. Researchers will start submitting requests once your services are live.</p>
            </div>
          )}
        </div>
      </div>

      <ServiceFormDialog open={showNewServiceForm} onOpenChange={setShowNewServiceForm} onSuccess={refetch} userEmail={user?.email} />
    </div>
  );
}