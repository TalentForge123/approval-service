import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle, Lock, Zap } from "lucide-react";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";

export default function Home() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const [, navigate] = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <Card className="shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
              <CardTitle className="text-2xl">Approval Service</CardTitle>
              <CardDescription>
                Secure deal approval management system
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4 mb-6">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-slate-900">Secure Tokens</p>
                    <p className="text-sm text-slate-600">32+ byte encrypted approval links</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Lock className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-slate-900">Audit Trail</p>
                    <p className="text-sm text-slate-600">Complete approval history with IP logging</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Zap className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-slate-900">Webhooks</p>
                    <p className="text-sm text-slate-600">Real-time status updates to external systems</p>
                  </div>
                </div>
              </div>
              <Button
                onClick={() => window.location.href = getLoginUrl()}
                className="w-full bg-blue-600 hover:bg-blue-700"
                size="lg"
              >
                Sign In to Continue
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto py-12 px-4">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2">
              Welcome, {user?.name || "User"}
            </h1>
            <p className="text-slate-600">
              Manage your deal approvals with secure, time-limited links
            </p>
          </div>
          <Button
            variant="outline"
            onClick={logout}
          >
            Sign Out
          </Button>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg">Create Deal</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600 mb-4">
                Generate a new deal with secure approval link
              </p>
              <Button
                onClick={() => navigate("/dashboard")}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                Go to Dashboard
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg">View Deals</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600 mb-4">
                Track all deals and their approval status
              </p>
              <Button
                onClick={() => navigate("/dashboard")}
                variant="outline"
                className="w-full"
              >
                View All Deals
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg">Audit Trail</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600 mb-4">
                Review complete approval history with IP logs
              </p>
              <Button
                onClick={() => navigate("/dashboard")}
                variant="outline"
                className="w-full"
              >
                Check Audit Trail
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Features */}
        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b">
            <CardTitle>Features</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">Security</h3>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li>• 32+ byte random tokens</li>
                  <li>• SHA-256 hash storage</li>
                  <li>• Single-use tokens</li>
                  <li>• 14-day expiration</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">Tracking</h3>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li>• IP address logging</li>
                  <li>• User agent capture</li>
                  <li>• Event timestamps</li>
                  <li>• Complete audit trail</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">Integration</h3>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li>• Webhook support</li>
                  <li>• Email notifications</li>
                  <li>• Status sync</li>
                  <li>• Retry logic</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">Management</h3>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li>• Deal snapshots</li>
                  <li>• Status tracking</li>
                  <li>• Bulk operations</li>
                  <li>• Export audit logs</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
