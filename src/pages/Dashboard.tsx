import { Card, CardContent } from "../components/ui/card";
import { Headphones, Lock } from "lucide-react";
import { Link } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";

const featureCards = [
  {
    title: "AI SDR",
    description:
      "Automate outreach and qualify leads through smart conversations.",
    icon: Headphones,
    link: "/ai-sdr-dashboard",
    locked: false,
  },
  {
    title: "Invoice",
    description: "Coming soon",
    icon: Lock,
    link: "#",
    locked: true,
  },
];

export default function Dashboard() {
  return (
    <DashboardLayout>
      <div className="relative flex flex-col items-center gap-8 mt-20">
        {/* Background glows */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Moving radial glow circles */}
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

          {/* Floating particles */}
          {[...Array(15)].map((_, i) => (
            <span
              key={`p${i}`}
              className={`absolute w-3 h-3 bg-white/30 rounded-full animate-float`}
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animationDuration: `${5 + Math.random() * 10}s`,
                animationDelay: `${Math.random() * 5}s`,
              }}
            ></span>
          ))}
        </div>

        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-6">
          {featureCards.map((card, index) => {
            const cardContent = (
              <Card
                key={index}
                className={`relative overflow-hidden p-6 flex flex-col items-center text-center gap-4 rounded-3xl shadow-2xl transition-transform transform hover:scale-105 animate-floating-3d ${
                  card.locked
                    ? "bg-gray-100 text-gray-500 cursor-not-allowed"
                    : "text-white"
                }`}
              >
                {/* Aura behind card */}
                {!card.locked && (
                  <span className="absolute inset-0 rounded-3xl bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-500 opacity-40 animate-pulse-slow blur-3xl"></span>
                )}

                {!card.locked && (
                  <span className="absolute top-0 left-0 w-full h-full bg-white/10 animate-shimmer pointer-events-none rounded-3xl"></span>
                )}

                <div
                  className={`relative z-10 w-20 h-20 flex items-center justify-center rounded-full mb-2 shadow-xl ${
                    card.locked
                      ? "bg-gray-300 text-gray-500 shadow-md"
                      : "bg-white/20 backdrop-blur-sm text-white shadow-[0_0_60px_rgba(255,0,200,0.8)]"
                  }`}
                >
                  <card.icon className="w-8 h-8 animate-pulse" />
                </div>

                <h2 className="relative z-10 text-xl font-bold">
                  {card.title}
                </h2>
                <p className="relative z-10 text-sm">{card.description}</p>
              </Card>
            );

            return card.locked ? (
              cardContent
            ) : (
              <Link key={index} to={card.link}>
                {cardContent}
              </Link>
            );
          })}
        </div>

        <p className="text-gray-400 text-sm text-center mt-6">
          Many more features coming soon...
        </p>
      </div>

      <style>
        {`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          position: absolute;
          top: 0; left: 0;
          width: 50%;
          height: 100%;
          background: linear-gradient(to right, rgba(255,255,255,0), rgba(255,255,255,0.2), rgba(255,255,255,0));
          animation: shimmer 2s infinite;
        }

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

        @keyframes floating-3d {
          0% { transform: translateZ(0px) rotateX(0deg) rotateY(0deg); }
          25% { transform: translateZ(5px) rotateX(1deg) rotateY(1deg); }
          50% { transform: translateZ(0px) rotateX(0deg) rotateY(0deg); }
          75% { transform: translateZ(5px) rotateX(-1deg) rotateY(-1deg); }
          100% { transform: translateZ(0px) rotateX(0deg) rotateY(0deg); }
        }
        .animate-floating-3d { animation: floating-3d 10s ease-in-out infinite; }

        @keyframes pulse-slow {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.6; }
        }
        .animate-pulse-slow { animation: pulse-slow 6s ease-in-out infinite; }
        `}
      </style>
    </DashboardLayout>
  );
}
