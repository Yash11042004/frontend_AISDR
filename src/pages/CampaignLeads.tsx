import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import * as XLSX from "xlsx";

function normalize(str: string = "") {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

function exportToCSV(filename: string, rows: any[]) {
  if (!rows || rows.length === 0) return alert("No data to export");
  const headers = Object.keys(rows[0]);
  const csvContent = [
    headers.join(","),
    ...rows.map((row) =>
      headers
        .map((field) => `"${String(row[field] ?? "").replace(/"/g, '""')}"`)
        .join(",")
    ),
  ].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function exportToExcel(filename: string, rows: any[]) {
  if (!rows || rows.length === 0) return alert("No data to export");
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
  XLSX.writeFile(workbook, filename);
}

export default function CampaignLeads() {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState<any[]>([]);
  const [people, setPeople] = useState<any[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<any>(null);
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [generatedEmails, setGeneratedEmails] = useState<
    Record<string, string>
  >({});
  const [selectAll, setSelectAll] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [activeEmail, setActiveEmail] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState<string>(
    "Write a short cold email introducing our product to this person. Keep it professional and friendly. Their name is [NAME] and they work at [COMPANY]."
  );
  const [generating, setGenerating] = useState(false);
  const [currentlyGenerating, setCurrentlyGenerating] = useState<string | null>(
    null
  );

  const API_BASE = "https://ai-sdr-a8gy.onrender.com";

  useEffect(() => {
    try {
      const peopleData = localStorage.getItem("campaignPeople");
      const contactsData = localStorage.getItem("campaignContacts");
      if (!peopleData || !contactsData) return;
      setPeople(JSON.parse(peopleData));
      setCompanies(JSON.parse(contactsData));
    } catch (err) {
      console.error("❌ Failed to load localStorage data", err);
    }
  }, []);

  const fetchEmployees = (company: any) => {
    setSelectedCompany(company);
    setLoading(true);
    try {
      const targetCompany = normalize(company.company);
      const filtered = people.filter(
        (p) => normalize(p.company) === targetCompany
      );

      if (filtered.length === 0) {
        setEmployees([
          {
            company: company.company,
            name: "Not Available",
            email: "Not Available",
            designation: "Not Available",
            linkedin_url: "Not Available",
          },
        ]);
      } else {
        const mapped = filtered.map((p) => ({
          company: p.company || "Not Available",
          name: p.name || "Not Available",
          email: p.email || "Not Available",
          designation: p.designation || "Not Available",
          linkedin_url: p.linkedin_url || "Not Available",
        }));
        setEmployees(mapped);
      }
      setSelectedEmployees([]);
      setGeneratedEmails({});
      setSelectAll(false);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (email: string) => {
    setSelectedEmployees((prev) =>
      prev.includes(email) ? prev.filter((e) => e !== email) : [...prev, email]
    );
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedEmployees([]);
    } else {
      const allEmails = employees.map((emp) => emp.email).filter(Boolean);
      setSelectedEmployees(allEmails);
    }
    setSelectAll(!selectAll);
  };

  const generateEmail = async (emp: any) => {
    const prompt = customPrompt
      .replace(/\[NAME\]/g, emp.name)
      .replace(/\[COMPANY\]/g, emp.company);

    try {
      setCurrentlyGenerating(emp.email);
      const res = await fetch(`${API_BASE}/api/openrouter`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "mistralai/mistral-7b-instruct",
          messages: [
            { role: "system", content: "You are a B2B email writing expert." },
            { role: "user", content: prompt },
          ],
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const content =
        data.choices?.[0]?.message?.content || "⚠️ No content generated.";
      setGeneratedEmails((prev) => ({ ...prev, [emp.email]: content }));
    } catch {
      setGeneratedEmails((prev) => ({
        ...prev,
        [emp.email]: "❌ Error generating email",
      }));
    } finally {
      setCurrentlyGenerating(null);
    }
  };

  const generateSelectedEmails = async () => {
    setGenerating(true);
    const employeesToGenerate = employees.filter(
      (emp) =>
        selectedEmployees.includes(emp.email) && emp.email !== "Not Available"
    );
    for (const emp of employeesToGenerate) {
      await generateEmail(emp);
    }
    setGenerating(false);
  };

  const generateAllEmails = async () => {
    setGenerating(true);
    for (const emp of employees) {
      if (emp.email !== "Not Available") {
        await generateEmail(emp);
      }
    }
    setGenerating(false);
  };

  const sendEmails = async () => {
    const recipients = employees
      .filter((emp) => selectedEmployees.includes(emp.email))
      .map((emp) => ({
        company: emp.company,
        name: emp.name,
        email: emp.email,
        linkedin_url: emp.linkedin_url,
        message: generatedEmails[emp.email] || "",
      }));

    if (recipients.length === 0) return alert("No recipients selected");

    try {
      setSending(true);
      const response = await fetch(
        "https://admin-zicloud1.app.n8n.cloud/webhook/send-emails",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ recipients }),
        }
      );

      if (!response.ok)
        throw new Error(`HTTP error! Status: ${response.status}`);
      alert("✅ Emails sent successfully!");
      navigate("/sent-emails", { state: { sentData: recipients } });
    } catch {
      alert("❌ Failed to send emails.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-indigo-50 to-purple-100 p-6">
      <div className="max-w-6xl mx-auto text-center mb-10">
        <h1 className="text-4xl font-bold text-gray-900 tracking-tight">
          Campaign Leads
        </h1>
        <p className="text-gray-600 mt-2">
          Manage companies, explore employees, and generate personalized
          outreach emails with AI.
        </p>
      </div>

      <div className="max-w-6xl mx-auto bg-white shadow-xl rounded-2xl overflow-hidden">
        {!selectedCompany ? (
          companies.length > 0 ? (
            <>
              {/* ✅ Back to Prompt button when showing companies */}
              <div className="p-6 flex justify-end border-b">
                <Button
                  variant="outline"
                  onClick={() => navigate("/new-campaign")}
                >
                  ← Back to Prompt
                </Button>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                {companies.map((company, idx) => (
                  <div
                    key={idx}
                    className="p-6 rounded-xl border bg-gradient-to-tr from-white to-indigo-50 shadow hover:shadow-lg transition cursor-pointer"
                    onClick={() => fetchEmployees(company)}
                  >
                    <h3 className="text-lg font-semibold text-gray-800">
                      {company.company}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Domain: {company.domain || "N/A"}
                    </p>
                    <Button className="mt-4 w-full">View Employees</Button>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-gray-500 text-center p-6">
              No companies found in localStorage.
            </p>
          )
        ) : loading ? (
          <p className="p-6">Loading...</p>
        ) : (
          <div className="flex flex-col lg:flex-row">
            {/* Sidebar */}
            <div className="w-full lg:w-80 bg-white border-r shadow-inner overflow-y-auto">
              <div className="p-4 font-semibold border-b text-gray-700 flex justify-between items-center">
                {selectedCompany.company}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedCompany(null)}
                >
                  ← Back
                </Button>
              </div>

              {/* Select All */}
              <div className="p-3 border-b flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={selectAll}
                  onChange={toggleSelectAll}
                  className="h-4 w-4"
                />
                <span className="text-sm text-gray-700">Select All</span>
              </div>

              {/* Employee List */}
              {employees.map((emp, idx) => (
                <div
                  key={idx}
                  className={`p-4 cursor-pointer border-b transition-all 
                    hover:bg-indigo-50 ${
                      activeEmail === emp.email
                        ? "bg-indigo-100 font-semibold text-indigo-700"
                        : "text-gray-700"
                    }`}
                  onClick={() => setActiveEmail(emp.email)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={selectedEmployees.includes(emp.email)}
                          onChange={(e) => {
                            e.stopPropagation();
                            toggleSelect(emp.email);
                          }}
                          className="h-4 w-4"
                        />
                        <span>{emp.name}</span>
                      </div>
                      <p className="ml-6 text-sm text-gray-500">
                        {emp.designation}
                      </p>
                    </div>
                    {currentlyGenerating === emp.email && (
                      <span className="animate-spin border-2 border-indigo-600 border-t-transparent rounded-full h-4 w-4"></span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Main Panel */}
            <div className="flex-1 flex flex-col">
              <div className="p-6 border-b bg-white shadow-md flex flex-wrap gap-3">
                <Button onClick={generateSelectedEmails} disabled={generating}>
                  {generating ? "⏳ Generating..." : "✉️ Generate Email"}
                </Button>
                <Button onClick={generateAllEmails} disabled={generating}>
                  {generating ? "⏳ Generating All..." : "✨ Generate All"}
                </Button>
                <Button onClick={sendEmails} disabled={sending}>
                  {sending ? "Sending..." : "Send Selected"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() =>
                    exportToCSV("selected_employees.csv", employees)
                  }
                >
                  Export CSV
                </Button>
                <Button
                  variant="outline"
                  onClick={() =>
                    exportToExcel("selected_employees.xlsx", employees)
                  }
                >
                  Export Excel
                </Button>
              </div>

              <div className="p-6 border-b bg-white shadow-md">
                <label
                  htmlFor="customPrompt"
                  className="block text-base font-semibold text-gray-800 mb-2"
                >
                  ✨ Custom Email Prompt
                </label>
                <textarea
                  id="customPrompt"
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  className="w-full h-40 p-5 rounded-xl shadow-lg border border-gray-200 
                    bg-white/90 text-gray-900 text-lg leading-relaxed
                    focus:outline-none focus:ring-4 focus:ring-indigo-300 focus:border-indigo-400
                    transition-all duration-300"
                />
              </div>

              {/* Email Display */}
              <div className="flex-1 p-6 overflow-y-auto bg-gradient-to-br from-white via-gray-50 to-indigo-50">
                {activeEmail ? (
                  <div className="animate-fadeIn">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">
                      ✉️ Email for{" "}
                      {employees.find((e) => e.email === activeEmail)?.name}
                    </h2>
                    <div
                      className="p-6 rounded-xl bg-white shadow-xl border border-gray-200
                        text-gray-800 leading-relaxed text-lg prose max-w-none
                        whitespace-pre-wrap"
                    >
                      {generatedEmails[activeEmail] ||
                        "⚠️ No email generated yet"}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    👈 Select an employee to preview their personalized email
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
