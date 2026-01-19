import { useEffect, useState } from "react";
import { useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, AlertCircle, CheckCircle } from "lucide-react";

export default function ApprovalPage() {
  const [, params] = useRoute("/approve/:token");
  const token = params?.token as string;
  const [agreed, setAgreed] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Fetch deal data
  const getDealQuery = trpc.approval.getDeal.useQuery(
    { token },
    { enabled: !!token && !submitted }
  );

  // Confirm approval mutation
  const confirmMutation = trpc.approval.confirm.useMutation({
    onSuccess: () => {
      setSubmitted(true);
    },
  });

  const handleApprove = async () => {
    if (!agreed) return;
    confirmMutation.mutate({ token, approved: true });
  };

  const handleReject = async () => {
    confirmMutation.mutate({ token, approved: false });
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-5 h-5" />
              Invalid Link
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-600">The approval link is invalid or missing.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (getDealQuery.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-slate-600">Loading deal details...</p>
        </div>
      </div>
    );
  }

  if (getDealQuery.isError) {
    const error = getDealQuery.error as any;
    const message = error?.message || "Failed to load deal";

    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-5 h-5" />
              Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-600">{message}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    const wasApproved = confirmMutation.data?.status === "APPROVED";

    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="w-5 h-5" />
              {wasApproved ? "Deal Approved" : "Deal Rejected"}
            </CardTitle>
            <CardDescription>
              {wasApproved
                ? "Thank you for approving this deal. The deal owner has been notified."
                : "The deal owner has been notified of your rejection."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600">
              {wasApproved
                ? "You can now close this window."
                : "If you have any questions, please contact the deal owner."}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const deal = getDealQuery.data?.deal;
  if (!deal) {
    return null;
  }

  const total = (deal.total / 100).toFixed(2);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Deal Approval Required</h1>
          <p className="text-slate-600">
            Please review the deal details below and confirm your approval.
          </p>
        </div>

        {/* Deal Card */}
        <Card className="mb-6 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
            <CardTitle>Deal Summary</CardTitle>
            <CardDescription>
              Created on {new Date(deal.createdAt).toLocaleDateString()}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {/* Client Info */}
            <div className="mb-6 pb-6 border-b">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-600">Client Name</p>
                  <p className="text-lg font-semibold text-slate-900">{deal.clientName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600">Total Amount</p>
                  <p className="text-lg font-semibold text-slate-900">
                    {deal.currency} {total}
                  </p>
                </div>
              </div>
            </div>

            {/* Line Items */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-slate-900 mb-4">Line Items</h3>
              <div className="space-y-3">
                {deal.items.map((item: any, idx: number) => (
                  <div
                    key={idx}
                    className="flex justify-between items-start p-3 bg-slate-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-slate-900">{item.description}</p>
                      <p className="text-sm text-slate-600">
                        {item.quantity} × {deal.currency} {(item.unitPrice / 100).toFixed(2)}
                      </p>
                    </div>
                    <p className="font-semibold text-slate-900">
                      {deal.currency} {((item.quantity * item.unitPrice) / 100).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Total */}
            <div className="pt-6 border-t">
              <div className="flex justify-between items-center">
                <p className="text-lg font-semibold text-slate-900">Total</p>
                <p className="text-2xl font-bold text-blue-600">
                  {deal.currency} {total}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Confirmation Checkbox */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Checkbox
                id="agree"
                checked={agreed}
                onCheckedChange={(checked) => setAgreed(checked as boolean)}
                className="mt-1"
              />
              <label
                htmlFor="agree"
                className="text-sm text-slate-700 cursor-pointer flex-1"
              >
                I have reviewed the deal details and confirm my approval of this transaction.
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Button
            onClick={handleApprove}
            disabled={!agreed || confirmMutation.isPending}
            size="lg"
            className="flex-1 bg-green-600 hover:bg-green-700"
          >
            {confirmMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Approving...
              </>
            ) : (
              "Approve Deal"
            )}
          </Button>
          <Button
            onClick={handleReject}
            disabled={confirmMutation.isPending}
            variant="outline"
            size="lg"
            className="flex-1"
          >
            {confirmMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              "Reject Deal"
            )}
          </Button>
        </div>

        {/* Error Message */}
        {confirmMutation.isError && (
          <Card className="mt-6 border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <p className="text-sm text-red-700">
                {(confirmMutation.error as any)?.message || "An error occurred. Please try again."}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
