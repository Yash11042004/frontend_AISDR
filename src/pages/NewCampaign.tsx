import { useState, useEffect, useRef } from "react";
import DashboardLayout from "../components/DashboardLayout";
import { Button } from "../components/ui/button";
import { toast } from "../components/ui/sonner"; // ✅ use Sonner toast
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const QUICK_PROMPTS = [
  "Tech Directors in US",
  "Marketing Managers in Fintech",
  "Founders in AI startups",
  "Sales executives in HealthTech",
];

export default function NewCampaign() {
  const navigate = useNavigate();
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const [chatHistory, setChatHistory] = useState([
    {
      role: "bot",
      message:
        "👋 Hi! Tell me about the leads you're looking for (e.g., 'I want Directors from the Tech industry in the US').",
    },
  ]);
  const [userInput, setUserInput] = useState("");
  const [answers, setAnswers] = useState({
    role: "",
    department: "",
    industry: "",
    country: "",
    additional: "",
  });
  const [loading, setLoading] = useState(false);
  const [finalPrompt, setFinalPrompt] = useState("");
  const [step, setStep] = useState(0);
  const [showChat, setShowChat] = useState(false);
  const [showQuickPrompts, setShowQuickPrompts] = useState(false);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  // Show quick prompts after 2s
  useEffect(() => {
    const timer = setTimeout(() => setShowQuickPrompts(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  // ✅ Show toast when chat panel opens & dismiss when closed
  useEffect(() => {
    if (showChat) {
      toast.dismiss("chat-tip"); // prevent duplicates
      toast("💡 Tip", {
        id: "chat-tip",
        description:
          "When ready, type 'done', 'continue', or 'yes' to summarize and trigger your workflow.",
        duration: Infinity,
        className:
          "bg-white text-gray-900 border border-gray-200 shadow-lg rounded-xl",
      });
    } else {
      toast.dismiss("chat-tip");
    }

    return () => {
      toast.dismiss("chat-tip"); // cleanup on unmount
    };
  }, [showChat]);

  const generateResponse = async (chatHistory: any[]) => {
    try {
      const res = await axios.post(`${API_BASE}/api/groq-chat`, {
        model: "llama3-70b-8192",
        messages: [
          {
            role: "system",
            content: `You are a helpful assistant for creating B2B lead generation campaigns.

Ask one follow-up question at a time to get:
- Role
- Department
- Industry
- Country
- Additional info

When the user says "done", "continue", or "yes", stop asking questions and summarize into the final campaign prompt.`,
          },
          ...chatHistory.map((msg) => ({
            role: msg.role === "bot" ? "assistant" : msg.role,
            content: msg.message,
          })),
        ],
        temperature: 0.6,
      });

      return res.data?.choices?.[0]?.message?.content?.trim();
    } catch (err: any) {
      console.error("Groq API error:", err.response?.data || err.message);
      return null;
    }
  };

  const updateAnswersFromInput = (input: string) => {
    const lower = input.toLowerCase();
    const updated = { ...answers };

    if (!updated.role && /director|manager|executive|founder/.test(lower)) {
      updated.role = input;
    }
    if (
      !updated.department &&
      /product|sales|marketing|engineering|hr/.test(lower)
    ) {
      updated.department = input;
    }
    if (
      !updated.industry &&
      /tech|fintech|healthtech|ai|e-?commerce/.test(lower)
    ) {
      updated.industry = input;
    }
    if (!updated.country && /(us|united states|india|uk|canada)/.test(lower)) {
      updated.country = input;
    }
    if (
      !updated.additional &&
      /funding|recently raised|growth|expanding/.test(lower)
    ) {
      updated.additional = input;
    }

    return updated;
  };

  const handleSend = async () => {
    if (!userInput.trim()) return;

    // ✅ Chat panel opens only after first input
    if (!showChat) setShowChat(true);

    const newHistory = [...chatHistory, { role: "user", message: userInput }];
    setChatHistory(newHistory);

    const updatedAnswers = updateAnswersFromInput(userInput);

    if (/^(done|continue|yes)$/i.test(userInput.trim())) {
      const summaryPromptRaw = await generateResponse([
        ...newHistory,
        {
          role: "system",
          message: `Summarize into final campaign prompt.
IMPORTANT:
- Output ONLY the campaign sentence itself.
- Wrap the prompt in double quotes.
- No greetings, no closing statements, no markdown formatting, no emojis.
Example:
"Target 25 Indian tech companies with recent funding, focusing on C-Suite executives."`,
        },
      ]);

      if (summaryPromptRaw) {
        const cleanPrompt =
          summaryPromptRaw.match(/"([^"]+)"/)?.[1] || summaryPromptRaw;
        setFinalPrompt(cleanPrompt);
        setChatHistory((prev) => [
          ...prev,
          {
            role: "bot",
            message: `✅ Here's your campaign prompt:\n\n👉 "${cleanPrompt}"\n\nClick confirm to run workflow.`,
          },
        ]);
        setStep(1);
      }
      setUserInput("");
      setAnswers(updatedAnswers);
      return;
    }

    const botReply = await generateResponse(newHistory);
    if (botReply) {
      setChatHistory((prev) => [...prev, { role: "bot", message: botReply }]);
    } else {
      setChatHistory((prev) => [
        ...prev,
        { role: "bot", message: "🤖 Sorry, could you rephrase that?" },
      ]);
    }

    setUserInput("");
    setAnswers(updatedAnswers);
  };

  const handleQuickPrompt = (prompt: string) => {
    setUserInput(prompt);
    handleSend();
  };

  const handleConfirm = async () => {
    if (!finalPrompt.trim()) {
      toast("⚠️ No final prompt available to send to workflow");
      return;
    }

    try {
      setLoading(true);

      const response = await axios.post(
        "https://admin-zicloud1.app.n8n.cloud/webhook/prompt-intent",
        { prompt: finalPrompt },
        { headers: { "Content-Type": "application/json" } }
      );

      const data = Array.isArray(response.data)
        ? response.data[0]
        : response.data;

      const people = (data?.campaignPeople || []).map((p: any) => ({
        name: p?.name || "Not Available",
        email: p?.email || "Not Available",
        designation: p?.title || "Not Available",
        linkedin_url: p?.linkedin_url || "Not Available",
        company: p?.organization_name || "Unknown Company",
        domain: "",
      }));

      const companies = (data?.campaignContacts || []).map((c: any) => ({
        company: c?.company || "Unknown",
        domain: c?.domain || "Not Available",
      }));

      localStorage.setItem("campaignPeople", JSON.stringify(people));
      localStorage.setItem("campaignContacts", JSON.stringify(companies));

      const campaignId = Date.now().toString();
      const campaign = {
        id: campaignId,
        name: finalPrompt.slice(0, 50),
        prompt: finalPrompt,
        filters: {},
        createdAt: new Date().toISOString(),
        campaignPeople: people,
        campaignContacts: companies,
      };

      const existing = JSON.parse(localStorage.getItem("campaigns") || "[]");
      existing.push(campaign);
      localStorage.setItem("campaigns", JSON.stringify(existing));
      localStorage.setItem("currentCampaignId", campaignId);

      navigate("/campaign-leads");
    } catch (error) {
      console.error("Workflow trigger error:", error);
      toast("❌ Failed to trigger workflow");
    } finally {
      setLoading(false);
    }
  };

  const handleStartOver = () => {
    setAnswers({
      role: "",
      department: "",
      industry: "",
      country: "",
      additional: "",
    });
    setFinalPrompt("");
    setChatHistory([
      {
        role: "bot",
        message:
          "👋 Hi! Tell me about the leads you're looking for (e.g., 'I want Directors from the Tech industry in the US').",
      },
    ]);
    setStep(0);
    setShowChat(false);
  };

  return (
    <DashboardLayout>
      <div className="relative min-h-screen flex items-center justify-center px-4">
        {/* Prompt overlay */}
        <AnimatePresence>
          {!showChat && (
            <motion.div
              key="promptScreen"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center px-4"
              style={{
                background:
                  "linear-gradient(135deg, #1E3C72, #2A5298, #00C9FF, #92FE9D)",
                backgroundSize: "400% 400%",
                animation: "gradientShift 18s ease infinite",
              }}
            >
              <h1 className="text-4xl font-bold mb-6 text-center text-white drop-shadow-lg">
                Start Your Lead Campaign
              </h1>
              <div className="relative w-full max-w-xl">
                <input
                  type="text"
                  placeholder="Describe your target leads..."
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  className="w-full px-6 py-4 rounded-xl text-lg text-gray-900 focus:outline-none focus:ring-4 focus:ring-blue-300"
                />
                {/* 3D typing hint */}
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white text-xl animate-bounce"
                >
                  ⌨️
                </motion.div>
              </div>

              {/* Instructions */}
              <p className="mt-4 text-center text-sm text-white/80 max-w-md">
                Type your prompt and press Enter, or choose a quick prompt
                below.
                <br />
                When you're ready, type <span className="font-bold">
                  done
                </span>, <span className="font-bold">continue</span> or{" "}
                <span className="font-bold">yes</span> to summarize and start
                generating.
              </p>

              {/* Sliding quick prompts */}
              <AnimatePresence>
                {showQuickPrompts && (
                  <motion.div
                    key="quickPrompts"
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 50, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 100 }}
                    className="mt-6 flex flex-wrap justify-center gap-3 max-w-xl"
                  >
                    {QUICK_PROMPTS.map((q) => (
                      <Button
                        key={q}
                        size="sm"
                        variant="outline"
                        className="text-gray-900 bg-white hover:bg-gray-100"
                        onClick={() => handleQuickPrompt(q)}
                      >
                        {q}
                      </Button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Chat panel */}
        {showChat && (
          <motion.div
            key="chatPanel"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full max-w-3xl flex flex-col gap-4"
          >
            <div className="flex flex-col gap-3 overflow-y-auto max-h-[70vh] px-4 py-2 bg-white rounded-xl shadow-lg">
              {chatHistory.map((msg, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-xl max-w-[80%] ${
                    msg.role === "bot"
                      ? "bg-blue-100 self-start"
                      : "bg-gray-200 self-end"
                  }`}
                >
                  {msg.message}
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            <div className="flex gap-2 mt-2">
              <input
                type="text"
                className="flex-1 px-4 py-2 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Type here..."
              />
              <Button onClick={handleSend}>Send</Button>
            </div>

            {step === 1 && (
              <div className="flex gap-2 mt-2">
                <Button onClick={handleConfirm} disabled={loading}>
                  {loading ? "Running..." : "Confirm & Run Workflow"}
                </Button>
                <Button
                  variant="outline"
                  className="bg-white text-gray-800 border-gray-300 hover:bg-gray-100"
                  onClick={handleStartOver}
                >
                  Start Over
                </Button>
              </div>
            )}
          </motion.div>
        )}
      </div>

      <style>
        {`
          @keyframes gradientShift {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
        `}
      </style>
    </DashboardLayout>
  );
}
