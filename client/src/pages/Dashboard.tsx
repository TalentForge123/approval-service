import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Copy, CheckCircle, XCircle, Clock } from "lucide-react";
import { useState } from "react";
import CreateDealDialog from "@/components/CreateDealDialog";

const statusColors = {
  DRAFT: "bg-gray-100 text-gray-800",
  SENT: "bg-blue-100 text-blue-800",
  APPROVED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
  EXPIRED: "bg-yellow-100 text-yellow-800",
};

const statusIcons = {
  DRAFT: <Clock className="w-4 h-4" />,
  SENT: <Clock className="w-4 h-4" />,
  APPROVED: <CheckCircle className="w-4 h-4" />,
  REJECTED: <XCircle className="w-4 h-4" />,
  EXPIRED: <Clock className="w-4 h-4" />,
};

export default function Dashboard() {
  const { user } = useAuth();
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const dealsQuery = trpc.deals.list.useQuery();
  const dealDetailsQuery = trpc.deals.getById.useQuery(
    { dealId: selectedDealId! },
    { enabled: !!selectedDealId }
  );

  const handleCopyLink = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(text);
    setTimeout(() => setCopied(null), 2000);
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Deal Management</h1>
          <p className="text-slate-600">
            Manage deals, generate approval links, and track approval status.
          </p>
        </div>

        {/* Create Deal Button */}
        <div className="mb-8">
          <CreateDealDialog />
        </div>

        {/* Deals List */}
        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
            <CardTitle>All Deals</CardTitle>
            <CardDescription>
              {dealsQuery.data?.length || 0} deals total
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {dealsQuery.isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : dealsQuery.data?.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-slate-600">No deals yet. Create your first deal to get started.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50">
                      <TableHead>Client</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dealsQuery.data?.map((deal) => (
                      <TableRow
                        key={deal.id}
                        className="hover:bg-slate-50 cursor-pointer"
                        onClick={() => setSelectedDealId(deal.id)}
                      >
                        <TableCell className="font-medium">{deal.clientName}</TableCell>
                        <TableCell>
                          {deal.currency} {(deal.total / 100).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Badge className={statusColors[deal.status]}>
                            {statusIcons[deal.status]}
                            <span className="ml-1">{deal.status}</span>
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-slate-600">
                          {new Date(deal.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedDealId(deal.id);
                            }}
                          >
                            View Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Deal Details Panel */}
        {selectedDealId && dealDetailsQuery.data && (
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Deal Info */}
            <Card className="lg:col-span-2 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b">
                <CardTitle>Deal Details</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-slate-600">Client Name</p>
                      <p className="text-lg font-semibold text-slate-900">
                        {dealDetailsQuery.data.deal.clientName}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-600">Email</p>
                      <p className="text-lg font-semibold text-slate-900">
                        {dealDetailsQuery.data.deal.clientEmail || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-600">Total Amount</p>
                      <p className="text-lg font-semibold text-blue-600">
                        {dealDetailsQuery.data.deal.currency}{" "}
                        {(dealDetailsQuery.data.deal.total / 100).toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-600">Status</p>
                      <Badge className={statusColors[dealDetailsQuery.data.deal.status]}>
                        {dealDetailsQuery.data.deal.status}
                      </Badge>
                    </div>
                  </div>

                  {/* Line Items */}
                  <div className="border-t pt-6">
                    <h3 className="font-semibold text-slate-900 mb-4">Line Items</h3>
                    <div className="space-y-2">
                      {JSON.parse(dealDetailsQuery.data.deal.itemsJSON).map(
                        (item: any, idx: number) => (
                          <div key={idx} className="flex justify-between p-2 bg-slate-50 rounded">
                            <span className="text-sm text-slate-700">{item.description}</span>
                            <span className="text-sm font-medium text-slate-900">
                              {dealDetailsQuery.data.deal.currency}{" "}
                              {((item.quantity * item.unitPrice) / 100).toFixed(2)}
                            </span>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Audit Trail */}
            <Card className="shadow-lg">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b">
                <CardTitle className="text-lg">Audit Trail</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  {dealDetailsQuery.data.auditTrail.length === 0 ? (
                    <p className="text-sm text-slate-600">No events yet</p>
                  ) : (
                    dealDetailsQuery.data.auditTrail.map((event: any) => (
                      <div key={event.id} className="text-sm border-l-2 border-blue-300 pl-3">
                        <p className="font-medium text-slate-900">{event.type}</p>
                        <p className="text-xs text-slate-600">
                          {new Date(event.createdAt).toLocaleString()}
                        </p>
                        {event.metaJSON && (
                          <p className="text-xs text-slate-500 mt-1">
                            IP: {JSON.parse(event.metaJSON).ip}
                          </p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
