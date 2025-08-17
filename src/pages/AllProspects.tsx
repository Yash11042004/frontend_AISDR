import { useEffect, useState } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { ArrowLeft, Linkedin, Upload } from "lucide-react";
import { Input } from "../components/ui/input";
import { API_BASE_URL } from "../utils/api";

type CampaignPerson = {
  name: string;
  title: string;
  email: string;
  organization_name: string;
  linkedin_url: string;
  _id: string;
};

export default function AllProspects() {
  const [campaignPeople, setCampaignPeople] = useState<CampaignPerson[]>([]);
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const companyFilter = searchParams.get("company");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/campaigns/prospects`);
        const data = await res.json();
        setCampaignPeople(data || []);
      } catch (err) {
        console.error("Error fetching prospects:", err);
      }
    };

    fetchAll();
  }, []);

  const filtered = campaignPeople.filter((p) => {
    const matchesCompany = companyFilter
      ? p.organization_name === companyFilter
      : true;
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.organization_name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCompany && matchesSearch;
  });

  const groupedByCompany: { [key: string]: CampaignPerson[] } = {};
  filtered.forEach((person) => {
    const org = person.organization_name;
    if (!groupedByCompany[org]) groupedByCompany[org] = [];
    groupedByCompany[org].push(person);
  });

  const companiesToShow = Object.keys(groupedByCompany).sort();

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
          <div className="flex items-center gap-4 flex-wrap">
            <Link to="/ai-sdr-dashboard">
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                {companyFilter
                  ? `Prospects at ${companyFilter}`
                  : "All Prospects"}
              </h1>
              {!companyFilter && (
                <p className="text-sm text-gray-500">
                  Showing grouped prospects by company
                </p>
              )}
            </div>
          </div>

          <Button
            variant="default"
            className="bg-gradient-to-r from-indigo-600 to-blue-500 text-white hover:from-indigo-700 hover:to-blue-600 w-full sm:w-auto"
            onClick={() => navigate("/import")}
          >
            <Upload className="w-4 h-4 mr-2" />
            Import Data
          </Button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <Input
            placeholder="Search by company or person name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-white shadow-sm rounded-lg w-full sm:w-96"
          />
        </div>

        {/* Prospects */}
        {companiesToShow.length === 0 ? (
          <Card className="bg-white shadow-md rounded-xl">
            <CardContent className="p-6 text-center text-gray-500">
              No prospects found.
            </CardContent>
          </Card>
        ) : (
          companiesToShow.map((company) => (
            <Card
              key={company}
              className="mb-6 shadow-lg rounded-xl hover:shadow-xl transition-all"
            >
              <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-gradient-to-r from-indigo-100 to-blue-50 p-4 rounded-t-xl">
                <CardTitle className="text-lg font-bold text-gray-800">
                  {company}
                </CardTitle>
                {!companyFilter && (
                  <div className="flex gap-2 flex-wrap w-full sm:w-auto">
                    <Link
                      to={`/prospects?company=${encodeURIComponent(company)}`}
                      className="w-full sm:w-auto"
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-indigo-500 text-indigo-600 hover:bg-indigo-50 w-full sm:w-auto"
                      >
                        View Only
                      </Button>
                    </Link>
                    <Link
                      to={`/email?company=${encodeURIComponent(company)}`}
                      className="w-full sm:w-auto"
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-blue-500 text-blue-600 hover:bg-blue-50 w-full sm:w-auto"
                      >
                        Create Email
                      </Button>
                    </Link>
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-4 p-4 bg-white">
                {groupedByCompany[company]
                  .sort((a, b) => a.title.localeCompare(b.title))
                  .map((person) => (
                    <div
                      key={person._id}
                      className="p-4 rounded-lg border border-gray-200 hover:shadow-md transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center bg-gradient-to-r from-gray-50 to-white gap-2 sm:gap-0"
                    >
                      <div>
                        <p className="text-base font-semibold text-gray-900">
                          {person.name}
                        </p>
                        <p className="text-sm text-gray-500">{person.title}</p>
                        <p className="text-sm text-gray-500">{person.email}</p>
                      </div>
                      <a
                        href={person.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 sm:mt-0"
                      >
                        <Linkedin className="w-5 h-5 text-blue-600 hover:text-blue-800 transition-colors" />
                      </a>
                    </div>
                  ))}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </DashboardLayout>
  );
}
