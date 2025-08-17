import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import { Button } from "../components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Input } from "../components/ui/input";
import { useToast } from "../components/ui/use-toast";
import { API_BASE_URL } from "../utils/api";

export default function ImportPage() {
  const [uploading, setUploading] = useState(false);
  const [importedProspects, setImportedProspects] = useState<any[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setImportedProspects([]);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${API_BASE_URL}/api/import/upload`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Upload failed");

      setImportedProspects(data.data || []);

      toast({
        title: "✅ File uploaded",
        description: `${
          data.data?.length || 0
        } prospects imported successfully.`,
      });
    } catch (err: any) {
      toast({
        title: "❌ Upload failed",
        description: err.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="relative max-w-3xl mx-auto mt-20">
        {/* Background floating particles */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          {[...Array(5)].map((_, i) => (
            <span
              key={i}
              className="absolute rounded-full opacity-20"
              style={{
                width: `${150 + Math.random() * 200}px`,
                height: `${150 + Math.random() * 200}px`,
                background: `radial-gradient(circle, rgba(255,200,255,0.4), transparent 70%)`,
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animation: `float-bg ${
                  20 + Math.random() * 20
                }s ease-in-out infinite`,
                animationDelay: `${Math.random() * 5}s`,
              }}
            />
          ))}

          {[...Array(20)].map((_, i) => (
            <span
              key={`p${i}`}
              className="absolute w-2 h-2 bg-white/30 rounded-full animate-float"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animationDuration: `${5 + Math.random() * 10}s`,
                animationDelay: `${Math.random() * 5}s`,
              }}
            />
          ))}
        </div>

        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="mr-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-semibold">Import Excel Prospects</h1>
        </div>

        <div className="mb-4 space-y-2">
          <Input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileUpload}
            disabled={uploading}
          />
          {uploading && (
            <p className="flex items-center text-muted-foreground text-sm">
              <Loader2 className="animate-spin w-4 h-4 mr-2" />
              Uploading...
            </p>
          )}
        </div>

        {importedProspects.length > 0 && (
          <div className="space-y-4 mt-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">
                {importedProspects.length} Prospects Imported
              </h2>
              <Button onClick={() => navigate("/prospects")} variant="default">
                Go to All Prospects
              </Button>
            </div>
            <div className="grid gap-3">
              {importedProspects.map((p, i) => (
                <div
                  key={i}
                  className="border p-3 rounded bg-secondary/30 text-sm backdrop-blur-sm shadow-md"
                >
                  <p className="font-medium">
                    {p.name} ({p.title})
                  </p>
                  <p className="text-muted-foreground">{p.email}</p>
                  <p className="text-muted-foreground">{p.organization_name}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <style>
        {`
          @keyframes float {
            0% { transform: translateY(0) translateX(0) scale(1); opacity: 0.3; }
            50% { transform: translateY(-20px) translateX(10px) scale(1.05); opacity: 0.6; }
            100% { transform: translateY(0) translateX(0) scale(1); opacity: 0.3; }
          }
          .animate-float { animation-name: float; animation-timing-function: ease-in-out; animation-iteration-count: infinite; }

          @keyframes float-bg {
            0% { transform: translateY(0px) translateX(0px); }
            50% { transform: translateY(-30px) translateX(20px); }
            100% { transform: translateY(0px) translateX(0px); }
          }
        `}
      </style>
    </DashboardLayout>
  );
}
