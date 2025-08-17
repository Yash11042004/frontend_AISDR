import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Checkbox } from "../components/ui/checkbox";
import { Loader2 } from "lucide-react";
import { useToast } from "../components/ui/use-toast";
import { API_BASE_URL } from "../utils/api";

type CampaignPerson = {
  name: string;
  title: string;
  email: string;
  organization_name: string;
  linkedin_url: string;
};

export default function SendEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const company = searchParams.get("company") || "";

  const [people, setPeople] = useState<CampaignPerson[]>([]);
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [generatedEmails, setGeneratedEmails] = useState<
    Record<string, string>
  >({});
  const [loadingEmails, setLoadingEmails] = useState<Record<string, boolean>>(
    {}
  );
  const [prompt, setPrompt] = useState(
    "Write a short cold email introducing our product to this person. Keep it professional and friendly. Their name is [NAME] and they work at [COMPANY]."
  );
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    const fetchPeople = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/campaigns/prospects`);
        const data = await res.json();
        const filtered = data.filter(
          (p: CampaignPerson) => p.organization_name === company
        );
        setPeople(filtered);
      } catch (err: any) {
        toast({
          title: "❌ Failed to load prospects",
          description: err.message,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPeople();
  }, [company, toast]);

  const toggleSelect = (email: string) => {
    setSelectedEmails((prev) =>
      prev.includes(email) ? prev.filter((e) => e !== email) : [...prev, email]
    );
  };

  const generateEmail = async (person: CampaignPerson) => {
    const personPrompt = prompt
      .replace(/\[NAME\]/g, person.name || "there")
      .replace(/\[COMPANY\]/g, person.organization_name || "your company");

    setLoadingEmails((prev) => ({ ...prev, [person.email]: true }));
    try {
      const res = await fetch(`${API_BASE_URL}/api/generate-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: personPrompt,
          model: "mistralai/mistral-7b-instruct",
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      const content = data.content || "No content generated.";
      setGeneratedEmails((prev) => ({ ...prev, [person.email]: content }));
    } catch (err: any) {
      toast({
        title: "❌ Error generating email",
        description: err.message,
        variant: "destructive",
      });
      setGeneratedEmails((prev) => ({
        ...prev,
        [person.email]: "❌ Error generating email",
      }));
    } finally {
      setLoadingEmails((prev) => ({ ...prev, [person.email]: false }));
    }
  };

  const generateAllEmails = async () => {
    const selectedPeople = people.filter((p) =>
      selectedEmails.includes(p.email)
    );
    setGenerating(true);
    await Promise.all(
      selectedPeople.map(async (person) => {
        if (!generatedEmails[person.email]) {
          await generateEmail(person);
        }
      })
    );
    setGenerating(false);
  };

  const sendEmails = async () => {
    await generateAllEmails();

    const recipients = people
      .filter((p) => selectedEmails.includes(p.email))
      .map((p) => ({
        company: p.organization_name,
        email: p.email,
        linkedin_url: p.linkedin_url,
        message: generatedEmails[p.email] || "",
      }));

    if (recipients.length === 0) {
      toast({
        title: "⚠️ No recipients selected",
        description: "Please select at least one prospect.",
      });
      return;
    }

    try {
      setSending(true);
      const res = await fetch(
        "https://admin-zicloud1.app.n8n.cloud/webhook/send-emails",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ recipients }),
        }
      );

      if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);

      toast({
        title: "✅ Emails sent successfully!",
        description: `${recipients.length} emails were delivered.`,
      });

      navigate("/sent-emails", { state: { sentData: recipients } });
    } catch (err: any) {
      toast({
        title: "❌ Failed to send emails",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-indigo-50 to-purple-100 p-6 md:p-10">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Prompt Section */}
          <Card className="backdrop-blur-lg bg-white/80 shadow-xl border border-gray-200">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-gray-900">
                ✍️ Craft Your Prompt
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="w-full min-h-[120px] resize-none p-4 text-base border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-400"
                placeholder="Enter prompt. Use [NAME] and [COMPANY] as placeholders."
              />
            </CardContent>
          </Card>

          {/* Prospects Section */}
          {loading ? (
            <p className="text-center text-gray-500">Loading prospects...</p>
          ) : people.length === 0 ? (
            <p className="text-center text-gray-500">
              No prospects found for <b>{company}</b>.
            </p>
          ) : (
            <Card className="backdrop-blur-lg bg-white/80 shadow-xl border border-gray-200">
              <CardHeader>
                <CardTitle className="text-2xl font-semibold text-gray-900">
                  👥 Prospects ({selectedEmails.length}/{people.length}{" "}
                  selected)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2">
                  {people.map((person) => (
                    <div
                      key={person.email}
                      className="p-5 rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-lg transition-all flex flex-col gap-3"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-lg text-gray-900">
                            {person.name}
                          </p>
                          <p className="text-sm text-gray-600">
                            {person.title} • {person.organization_name}
                          </p>
                          <p className="text-xs text-indigo-600 break-all">
                            {person.email}
                          </p>
                        </div>
                        <Checkbox
                          checked={selectedEmails.includes(person.email)}
                          onCheckedChange={() => toggleSelect(person.email)}
                        />
                      </div>

                      <div className="flex items-center gap-3">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => generateEmail(person)}
                          disabled={loadingEmails[person.email]}
                        >
                          {generatedEmails[person.email]
                            ? "Regenerate"
                            : "Generate Email"}
                        </Button>

                        {loadingEmails[person.email] && (
                          <Loader2 className="animate-spin w-4 h-4 text-gray-500" />
                        )}
                      </div>

                      {generatedEmails[person.email] && (
                        <div className="rounded-lg bg-gray-50 p-3 text-sm text-gray-800 shadow-inner max-h-48 overflow-y-auto whitespace-pre-wrap">
                          {generatedEmails[person.email]}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-4 justify-end">
            <Button
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg shadow-md"
              disabled={selectedEmails.length === 0 || sending}
              onClick={sendEmails}
            >
              {sending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Sending...
                </>
              ) : (
                "🚀 Send Email to Selected"
              )}
            </Button>

            <Button
              variant="outline"
              className="px-6 py-2 rounded-lg"
              onClick={generateAllEmails}
              disabled={selectedEmails.length === 0 || generating}
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Generating...
                </>
              ) : (
                "⚡ Generate All Emails"
              )}
            </Button>

            <Button
              variant="secondary"
              className="px-6 py-2 rounded-lg"
              onClick={() => navigate("/prospects")}
            >
              ← Back
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
