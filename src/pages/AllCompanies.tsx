import { useEffect, useState } from "react";
import DashboardLayout from "../components/DashboardLayout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { ArrowLeft, Building2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../utils/api";

type CampaignPerson = {
  name: string;
  title: string;
  email: string;
  organization_name: string;
  linkedin_url: string;
  _id: string;
};

export default function AllCompanies() {
  const [companyPeople, setCompanyPeople] = useState<CampaignPerson[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const res = await fetch(
          `${API_BASE_URL}/api/campaigns/unique-companies`
        );
        const data = await res.json();
        setCompanyPeople(data || []);
      } catch (err) {
        console.error("Error fetching companies:", err);
      }
    };

    fetchCompanies();
  }, []);

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto py-6 px-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center mb-8 gap-4">
          <Link to="/ai-sdr-dashboard">
            <Button
              variant="secondary"
              size="sm"
              className="flex items-center bg-indigo-600 text-white hover:bg-indigo-700"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900">
            All Companies
          </h1>
        </div>

        {/* Companies Card */}
        <Card className="bg-gray-50 shadow-lg border border-gray-200">
          <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle className="text-lg sm:text-xl text-gray-900">
              Companies in Latest Campaign
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {companyPeople.length === 0 ? (
              <p className="text-gray-500">No companies found.</p>
            ) : (
              companyPeople.map((person) => (
                <div
                  key={person._id}
                  className="p-4 bg-white rounded-md border border-gray-200 flex justify-between items-center shadow-sm hover:shadow-md transition"
                >
                  <div className="flex items-center gap-3">
                    <Building2 className="text-indigo-600 w-6 h-6" />
                    <div>
                      <p className="text-base font-semibold text-gray-900">
                        {person.organization_name}
                      </p>
                      <p className="text-sm text-gray-600">
                        {person.name} - {person.title}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="bg-green-500 text-white hover:bg-green-600"
                    onClick={() =>
                      navigate(
                        `/prospects?company=${encodeURIComponent(
                          person.organization_name
                        )}`
                      )
                    }
                  >
                    View Prospects
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
