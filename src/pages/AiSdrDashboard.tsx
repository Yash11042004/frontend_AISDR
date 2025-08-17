import { useEffect, useState } from "react";
import DashboardLayout from "../components/DashboardLayout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import {
  ArrowLeft,
  Users,
  Mail,
  TrendingUp,
  Calendar,
  Building2,
} from "lucide-react";
import { Link } from "react-router-dom";
import { API_BASE_URL } from "../utils/api";

type CampaignPerson = {
  name: string;
  title: string;
  email: string;
  organization_name: string;
  linkedin_url: string;
  _id: string;
};

type AnalyticsData = {
  totalProspects: number;
  uniqueCompanies: number;
  emailsSentToday: number;
  responseRate: number;
  meetingsScheduled: number;
};

export default function AiSdrDashboard() {
  const [topCompanies, setTopCompanies] = useState<CampaignPerson[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    const fetchTopCompanies = async () => {
      try {
        const res = await fetch(
          `${API_BASE_URL}/api/campaigns/unique-companies?limit=3`
        );
        const data = await res.json();
        setTopCompanies(data || []);
      } catch (err) {
        console.error("Failed to fetch top companies:", err);
        setTopCompanies([]);
      }
    };

    const fetchAnalytics = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/campaigns/analytics`);
        const data = await res.json();
        setAnalytics(data);
      } catch (err) {
        console.error("Failed to fetch analytics:", err);
      }
    };

    fetchTopCompanies();
    fetchAnalytics();
  }, []);

  const analyticsCards = [
    {
      title: "Total Prospects",
      value: analytics?.totalProspects ?? "-",
      icon: <Users className="w-10 h-10 text-indigo-700 animate-bounce-slow" />,
      bg: "bg-gradient-to-r from-indigo-50 to-indigo-100",
      textColor: "text-indigo-900",
    },
    {
      title: "Emails Sent Today",
      value: analytics?.emailsSentToday ?? "-",
      icon: <Mail className="w-10 h-10 text-green-700 animate-bounce-slow" />,
      bg: "bg-gradient-to-r from-green-50 to-green-100",
      textColor: "text-green-900",
    },
    {
      title: "Response Rate",
      value: analytics ? `${(analytics.responseRate * 100).toFixed(1)}%` : "-",
      icon: (
        <TrendingUp className="w-10 h-10 text-orange-700 animate-bounce-slow" />
      ),
      bg: "bg-gradient-to-r from-orange-50 to-orange-100",
      textColor: "text-orange-900",
    },
    {
      title: "Meetings Scheduled",
      value: analytics?.meetingsScheduled ?? "-",
      icon: (
        <Calendar className="w-10 h-10 text-purple-700 animate-bounce-slow" />
      ),
      bg: "bg-gradient-to-r from-purple-50 to-purple-100",
      textColor: "text-purple-900",
    },
  ];

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto py-6 px-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center mb-8 gap-4">
          <Link to="/">
            <Button
              variant="secondary"
              size="sm"
              className="flex items-center bg-indigo-600 text-white px-4 py-2 rounded-lg shadow hover:bg-indigo-700 transition"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-semibold text-gray-900">
              AI SDR Dashboard
            </h1>
            <p className="text-gray-600 text-base">
              Companies you're reaching out to
            </p>
          </div>
        </div>

        {/* Analytics Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          {analyticsCards.map((card, idx) => (
            <Card
              key={idx}
              className={`${card.bg} shadow-xl rounded-2xl w-full relative overflow-hidden transform transition hover:-translate-y-1 hover:shadow-2xl group`}
            >
              {/* Gradient shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 via-white/10 to-white/20 opacity-0 group-hover:opacity-100 animate-shimmer pointer-events-none rounded-2xl"></div>
              <CardContent className="p-6 flex items-center gap-4 relative z-10">
                {card.icon}
                <div>
                  <p className={`text-2xl font-bold ${card.textColor}`}>
                    {card.value}
                  </p>
                  <p className="text-sm text-gray-700">{card.title}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Top Companies */}
        <Card className="bg-gradient-to-r from-gray-50 to-gray-100 shadow-xl rounded-2xl mb-8 overflow-hidden">
          <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10">
            <CardTitle className="text-xl text-gray-900">
              Top Prospect Companies
            </CardTitle>
            <Link to="/companies">
              <Button
                variant="secondary"
                size="sm"
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg shadow hover:bg-indigo-700 transition"
              >
                View All Companies
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-4 relative z-10">
            {topCompanies.length === 0 ? (
              <p className="text-gray-500">No companies found.</p>
            ) : (
              topCompanies.map((company) => (
                <div
                  key={company._id}
                  className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-white rounded-xl shadow hover:bg-indigo-50 transition transform hover:-translate-y-0.5"
                >
                  <div className="flex items-center gap-3 mb-2 sm:mb-0">
                    <Building2 className="text-indigo-600 animate-bounce-slow" />
                    <span className="font-medium text-gray-900">
                      {company.organization_name}
                    </span>
                  </div>
                  <Link
                    to={`/prospects?company=${encodeURIComponent(
                      company.organization_name
                    )}`}
                  >
                    <Button
                      variant="secondary"
                      size="sm"
                      className="bg-indigo-600 text-white px-4 py-2 rounded-lg shadow hover:bg-indigo-700 transition"
                    >
                      View Prospects
                    </Button>
                  </Link>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link to="/new-campaign">
            <Button
              variant="secondary"
              className="bg-indigo-600 text-white px-6 py-3 rounded-lg shadow hover:bg-indigo-700 transition w-full sm:w-auto"
            >
              Start New Campaign
            </Button>
          </Link>
          <Link to="/prospects">
            <Button
              variant="outline"
              className="text-indigo-600 border-indigo-600 px-6 py-3 rounded-lg hover:bg-indigo-600 hover:text-white shadow w-full sm:w-auto transition"
            >
              View All Prospects
            </Button>
          </Link>
          <Button
            variant="outline"
            className="text-indigo-600 border-indigo-600 px-6 py-3 rounded-lg hover:bg-indigo-600 hover:text-white shadow w-full sm:w-auto transition"
          >
            Analytics Report
          </Button>
        </div>
      </div>

      {/* Custom Animations */}
      <style>
        {`
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        .animate-bounce-slow { animation: bounce-slow 3s infinite; }

        @keyframes shimmer {
          0% { background-position: -300px 0; }
          100% { background-position: 300px 0; }
        }
        .animate-shimmer {
          animation: shimmer 1.5s infinite linear;
          background-size: 600px 100%;
        }
        `}
      </style>
    </DashboardLayout>
  );
}
