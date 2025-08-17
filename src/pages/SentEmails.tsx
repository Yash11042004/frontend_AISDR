import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { useState } from "react";

export default function SentEmails() {
  const location = useLocation();
  const navigate = useNavigate();
  const sentData = location.state?.sentData || [];

  const [search, setSearch] = useState("");

  // Filtering logic
  const filteredData = sentData.filter((emp: any) =>
    [emp.name, emp.email, emp.company, emp.designation]
      .filter(Boolean)
      .some((field) => field.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-indigo-50 to-purple-100 p-6 md:p-10">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
            📨 Sent Emails
          </h1>

          {/* Search + Back */}
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <input
              type="text"
              placeholder="🔍 Search by name, company, or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="px-4 py-2 rounded-lg border border-gray-300 shadow-sm 
                         focus:outline-none focus:ring-2 focus:ring-indigo-400 
                         w-full sm:w-72"
            />
            <Button
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => navigate(-1)}
            >
              ← Back
            </Button>
          </div>
        </div>

        {/* Empty States */}
        {filteredData.length === 0 ? (
          <div className="bg-white shadow-lg rounded-2xl p-10 text-center text-gray-500">
            <p className="text-lg">
              {sentData.length === 0
                ? "No emails were sent yet."
                : "No sent emails match your search."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredData.map((emp: any, idx: number) => (
              <div
                key={idx}
                className="bg-white rounded-2xl shadow-lg border border-gray-100 
                           hover:shadow-2xl transition-all p-5 flex flex-col"
              >
                {/* Employee Info */}
                <div className="mb-4 border-b pb-3">
                  <h2 className="text-lg md:text-xl font-semibold text-gray-900">
                    {emp.name}{" "}
                    <span className="text-sm text-gray-500 font-normal">
                      ({emp.company})
                    </span>
                  </h2>
                  <p className="text-sm text-indigo-600 break-all">
                    {emp.email}
                  </p>
                  {emp.designation && (
                    <p className="text-sm text-gray-500">{emp.designation}</p>
                  )}
                </div>

                {/* Message */}
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">
                    Message Preview:
                  </h3>
                  <div
                    className="rounded-xl bg-gray-50 p-4 text-gray-800 leading-relaxed 
                               shadow-inner whitespace-pre-wrap text-sm max-h-48 md:max-h-60 
                               overflow-y-auto"
                  >
                    {emp.message}
                  </div>
                </div>

                {/* Footer */}
                <div className="mt-4 flex justify-end">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(emp.message);
                    }}
                  >
                    Copy Email
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
