"use client";

import { Provider } from "@/components/ui/provider";
import { Input, Button } from "@chakra-ui/react";
import { useState } from "react";
import { FaSearch } from "react-icons/fa";
import { useRouter } from "next/navigation";
import BackgroundCarousel from "@/components/BackgroundCarousel";
import styles from "./page.module.css";

export default function LandingPage() {
  const [riotId, setRiotId] = useState("");
  const router = useRouter();

  // League of Legends themed background images
  // You can replace these with your own images or videos
  const backgroundImages = [
    "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Ahri_0.jpg",
    "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Jinx_0.jpg",
    "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Yasuo_0.jpg",
    "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Aatrox_0.jpg",
  ];

  const handleSearch = () => {
    if (riotId.trim()) {
      // Navigate to insights page with the Riot ID
      router.push(`/insights?id=${encodeURIComponent(riotId)}`);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    // <Provider>
      <div className={styles.landingContainer}>
        <BackgroundCarousel images={backgroundImages} interval={6000} />
        <div className={styles.contentWrapper}>
          {/* Logo/Title Section */}
          <div className={styles.headerSection}>
            <h1 className={styles.title}>
              League of Legends
            </h1>
            <p className={styles.subtitle}>
              Discover insights and statistics for your Riot account
            </p>
          </div>

          {/* Search Bar Section */}
          <div className={styles.searchSection}>
            <div className={styles.searchForm}>
              <Input
                placeholder="Enter your Riot ID (e.g., PlayerName#TAG)"
                size="lg"
                value={riotId}
                onChange={(e) => setRiotId(e.target.value)}
                onKeyPress={handleKeyPress}
                bg="whiteAlpha.100"
                borderColor="whiteAlpha.300"
                color="white"
                _placeholder={{ color: "whiteAlpha.500" }}
                _hover={{ borderColor: "blue.400" }}
                _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px var(--chakra-colors-blue-500)" }}
                className={styles.searchInput}
              />
              <Button
                colorScheme="blue"
                size="lg"
                w="full"
                onClick={handleSearch}
                className={styles.searchButton}
              >
                <FaSearch className={styles.searchIcon} />
                Search Profile
              </Button>
            </div>
          </div>

          {/* Info Section */}
          <div className={styles.infoSection}>
            <p className={styles.infoText}>
              Enter your Riot ID to view detailed match history, champion statistics, and performance insights
            </p>
          </div>
        </div>
      </div>
    // </Provider>
  );
}
