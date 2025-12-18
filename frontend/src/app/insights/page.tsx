"use client";

import { Provider } from "@/components/ui/provider";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { FaArrowLeft, FaCheckCircle, FaExclamationTriangle, FaTimesCircle } from "react-icons/fa";
import PerformanceRadarChart from "@/components/charts/PerformanceRadarChart";
import TrendLineChart from "@/components/charts/TrendLineChart";
import BarChart from "@/components/charts/BarChart";
import styles from "./page.module.css";

export default function InsightsPage() {
  const searchParams = useSearchParams();
  const riotId = searchParams.get("id") || "Player#TAG";

  // Mock data - Replace with actual API calls
  const radarData = [
    { axis: "KDA", value: 75, maxValue: 100 },
    { axis: "Vision", value: 60, maxValue: 100 },
    { axis: "CS/Min", value: 85, maxValue: 100 },
    { axis: "Objective Control", value: 70, maxValue: 100 },
    { axis: "Team Fighting", value: 80, maxValue: 100 },
    { axis: "Map Awareness", value: 55, maxValue: 100 },
  ];

  const trendData = [
    { date: "2025-10-01", value: 65 },
    { date: "2025-10-02", value: 70 },
    { date: "2025-10-03", value: 68 },
    { date: "2025-10-04", value: 75 },
    { date: "2025-10-05", value: 78 },
    { date: "2025-10-06", value: 80 },
    { date: "2025-10-07", value: 82 },
  ];

  const championData = [
    { label: "Yasuo", value: 65, color: "#3B82F6" },
    { label: "Zed", value: 58, color: "#8B5CF6" },
    { label: "Lee Sin", value: 72, color: "#10B981" },
    { label: "Thresh", value: 68, color: "#F59E0B" },
    { label: "Jinx", value: 75, color: "#EF4444" },
  ];

  const strengthsData = [
    {
      title: "Excellent CS/Min Performance",
      description: "You're averaging 8.2 CS/min, which is 25% higher than your rank average. Keep maintaining this strong farming pattern.",
      stat: "8.2 CS/Min"
    },
    {
      title: "Strong Team Fighting",
      description: "Your team fight win rate is 68%, showing great positioning and decision-making in crucial moments.",
      stat: "68% Team Fight WR"
    },
    {
      title: "High Objective Participation",
      description: "You're present for 75% of objectives, demonstrating excellent map awareness and priority.",
      stat: "75% Objective Participation"
    }
  ];

  const improvementsData = [
    {
      title: "Ward Placement Needs Work",
      description: "You're placing 12 wards per game, but 40% are ineffective. Focus on strategic ward placement in river and jungle entrances.",
      stat: "12 Wards/Game"
    },
    {
      title: "Death Count Too High",
      description: "Averaging 6.2 deaths per game. Try to improve positioning in late game and avoid unnecessary trades.",
      stat: "6.2 Deaths/Game"
    },
    {
      title: "Early Game Presence",
      description: "Your first 15 minutes are your weakest phase. Focus on safer laning and jungle tracking to avoid early deaths.",
      stat: "0-15 Min Weakness"
    }
  ];

  const stopData = [
    {
      title: "Stop Overextending Without Vision",
      description: "60% of your deaths occur when you have no vision in the fog of war. Always check your minimap before pushing.",
      stat: "60% Deaths Without Vision"
    },
    {
      title: "Stop Ignoring Pings",
      description: "You're missing 45% of danger pings from teammates. This leads to avoidable deaths and lost objectives.",
      stat: "45% Missed Pings"
    },
    {
      title: "Stop Building Same Items Every Game",
      description: "You use the same build 85% of the time. Adapt your itemization based on enemy team composition.",
      stat: "85% Build Repetition"
    }
  ];

  const championStats = [
    { champion: "Yasuo", games: 45, winRate: 52, kda: 3.2, cs: 8.5 },
    { champion: "Zed", games: 38, winRate: 48, kda: 2.8, cs: 7.9 },
    { champion: "Lee Sin", games: 32, winRate: 58, kda: 3.6, cs: 6.2 },
    { champion: "Thresh", games: 28, winRate: 55, kda: 2.9, cs: 2.1 },
    { champion: "Jinx", games: 25, winRate: 62, kda: 4.1, cs: 8.8 },
  ];

  return (
    <Provider>
      <div className={styles.insightsContainer}>
        <Link href="/landing" className={styles.backButton}>
          <FaArrowLeft /> Back to Search
        </Link>

        <div className={styles.header}>
          <h1 className={styles.playerName}>{riotId}</h1>
          <p className={styles.subtitle}>Performance Insights & Improvement Recommendations</p>
        </div>

        <div className={styles.contentGrid}>
          {/* What You're Doing Well */}
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <FaCheckCircle className={`${styles.sectionIcon} ${styles.strengthsIcon}`} />
              <h2 className={styles.sectionTitle}>What You are Doing Well</h2>
            </div>
            <div className={styles.insightList}>
              {strengthsData.map((item, index) => (
                <div key={index} className={`${styles.insightItem} ${styles.insightItemStrength}`}>
                  <h3 className={styles.insightTitle}>{item.title}</h3>
                  <p className={styles.insightDescription}>{item.description}</p>
                  <span className={styles.insightStat}>{item.stat}</span>
                </div>
              ))}
            </div>
          </section>

          {/* How to Improve */}
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <FaExclamationTriangle className={`${styles.sectionIcon} ${styles.improvementsIcon}`} />
              <h2 className={styles.sectionTitle}>How to Improve</h2>
            </div>
            <div className={styles.insightList}>
              {improvementsData.map((item, index) => (
                <div key={index} className={`${styles.insightItem} ${styles.insightItemImprovement}`}>
                  <h3 className={styles.insightTitle}>{item.title}</h3>
                  <p className={styles.insightDescription}>{item.description}</p>
                  <span className={styles.insightStat}>{item.stat}</span>
                </div>
              ))}
            </div>
          </section>

          {/* What to Stop Doing */}
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <FaTimesCircle className={`${styles.sectionIcon} ${styles.stopIcon}`} />
              <h2 className={styles.sectionTitle}>What to Stop Doing</h2>
            </div>
            <div className={styles.insightList}>
              {stopData.map((item, index) => (
                <div key={index} className={`${styles.insightItem} ${styles.insightItemStop}`}>
                  <h3 className={styles.insightTitle}>{item.title}</h3>
                  <p className={styles.insightDescription}>{item.description}</p>
                  <span className={styles.insightStat}>{item.stat}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Charts Section */}
          <section className={`${styles.section} ${styles.chartsSection}`}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Performance Analytics</h2>
            </div>
            
            <div className={styles.chartsGrid}>
              <div className={styles.chartCard}>
                <PerformanceRadarChart data={radarData} width={400} height={400} />
              </div>
              
              <div className={styles.chartCard}>
                <TrendLineChart 
                  data={trendData} 
                  title="Win Rate Trend (Last 7 Days)"
                  color="#10B981"
                  width={500}
                  height={350}
                />
              </div>

              <div className={styles.chartCard}>
                <BarChart 
                  data={championData}
                  title="Champion Win Rates"
                  width={500}
                  height={350}
                />
              </div>

              {/* Champion Stats Table */}
              <div className={styles.chartCard}>
                <div style={{ width: "100%" }}>
                  <h4 style={{ color: "#E5E7EB", marginBottom: "15px", fontSize: "14px" }}>
                    Champion Performance
                  </h4>
                  <table className={styles.statsTable}>
                    <thead>
                      <tr>
                        <th>Champion</th>
                        <th>Games</th>
                        <th>Win Rate</th>
                        <th>KDA</th>
                        <th>CS/Min</th>
                      </tr>
                    </thead>
                    <tbody>
                      {championStats.map((stat, index) => (
                        <tr key={index}>
                          <td className={styles.championName}>{stat.champion}</td>
                          <td>{stat.games}</td>
                          <td className={
                            stat.winRate >= 55 ? styles.positiveValue :
                            stat.winRate >= 50 ? styles.neutralValue :
                            styles.negativeValue
                          }>
                            {stat.winRate}%
                          </td>
                          <td className={
                            stat.kda >= 3.5 ? styles.positiveValue :
                            stat.kda >= 2.5 ? styles.neutralValue :
                            styles.negativeValue
                          }>
                            {stat.kda}
                          </td>
                          <td>{stat.cs}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </Provider>
  );
}
