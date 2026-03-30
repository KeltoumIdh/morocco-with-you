import { useCallback, useEffect, useRef, useState } from "react";
import BottomNav from "./components/layout/BottomNav";
import DesktopSidebar from "./components/layout/DesktopSidebar";
import TabletNav from "./components/layout/TabletNav";
import AuthGateModal from "./components/AuthGateModal";
import HomePage from "./pages/HomePage";
import ExplorePage from "./pages/ExplorePage";
import AIPage from "./pages/AIPage";
import ItineraryPage from "./pages/ItineraryPage";
import BookingPage from "./pages/BookingPage";
import ChatPage from "./pages/ChatPage";
import ProfilePage from "./pages/ProfilePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import GroupTripsPage from "./pages/GroupTripsPage";
import GroupTripDetailPage from "./pages/GroupTripDetailPage";
import EventRequestPage from "./pages/EventRequestPage";
import ExperienceDetailPage from "./pages/ExperienceDetailPage";
import ActivitiesPage from "./pages/ActivitiesPage";
import AccommodationsPage from "./pages/AccommodationsPage";
import RestaurantsPage from "./pages/RestaurantsPage";
import PlanningPage from "./pages/PlanningPage";
import ActivityDetailPage from "./pages/ActivityDetailPage";
import AccommodationDetailPage from "./pages/AccommodationDetailPage";
import RestaurantDetailPage from "./pages/RestaurantDetailPage";
import PackageDetailPage from "./pages/PackageDetailPage";
import BookingSuccessPage from "./pages/BookingSuccessPage";
import { useAuth } from "../context/AuthContext";
import AdminDashboardLink from "./components/AdminDashboardLink";
import { useToast } from "../context/ToastContext";
import {
  experiencesApi,
  activitiesApi,
  accommodationsApi,
  restaurantsApi,
  packagesApi,
  groupTripsApi,
  itinerariesApi,
} from "../lib/api";

const ITINERARY_SESSION_KEY = "mwu_last_itinerary_v1";

function readItineraryFromSession() {
  try {
    const raw = sessionStorage.getItem(ITINERARY_SESSION_KEY);
    if (!raw) return null;
    const v = JSON.parse(raw);
    const days = v?.content?.days ?? v?.days;
    if (Array.isArray(days) && days.length > 0) return v;
    return null;
  } catch {
    return null;
  }
}

// Pages that require authentication
const AUTH_REQUIRED = new Set(["booking", "profile", "itinerary"]);

function ChatIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="white"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
      <circle cx="9" cy="10" r=".8" fill="white" stroke="none" />
      <circle cx="12" cy="10" r=".8" fill="white" stroke="none" />
      <circle cx="15" cy="10" r=".8" fill="white" stroke="none" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  return isMobile;
}

export default function UserApp() {
  const { user, loading: authLoading, isAdmin } = useAuth();
  const toast = useToast();
  const isAuthenticated = !!user;
  const [page, setPage] = useState("home");
  const [generatedItinerary, setGeneratedItinerary] = useState(() =>
    readItineraryFromSession(),
  );
  const [itineraryListLoading, setItineraryListLoading] = useState(false);
  const [selectedExperience, setSelectedExperience] = useState(null);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [selectedAccommodation, setSelectedAccommodation] = useState(null);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [selectedGroupTrip, setSelectedGroupTrip] = useState(null);
  /** Filled on experience page before navigating to booking (date + guests). */
  const [bookingDraft, setBookingDraft] = useState(null);
  const clearBookingDraft = useCallback(() => setBookingDraft(null), []);
  /** Prefill “Plan My Trip” after user requests a quote from the AI itinerary page. */
  const [planningPrefill, setPlanningPrefill] = useState(null);
  const clearPlanningPrefill = useCallback(() => setPlanningPrefill(null), []);
  /** Passed to Explore when opening from the home hero search or destination chips. */
  const [exploreSearchSeed, setExploreSearchSeed] = useState("");
  const [chatOpen, setChatOpen] = useState(false);
  const [unread, setUnread] = useState(1);
  // Auth gate modal: null | { targetPage }
  const [authGate, setAuthGate] = useState(null);
  const panelRef = useRef(null);
  const isMobile = useIsMobile();

  // Auth gate: show modal for protected pages, full redirect for login/register
  const navigateTo = useCallback(
    (target, opts = {}) => {
      if (AUTH_REQUIRED.has(target) && !isAuthenticated) {
        setAuthGate({ targetPage: target });
        return;
      }
      if (target === "explore") {
        setExploreSearchSeed(
          typeof opts.search === "string" ? opts.search.trim() : "",
        );
      }
      setPage(target);
    },
    [isAuthenticated],
  );

  const isChatPage = page === "chat";
  const isAuthPage = page === "login" || page === "register";

  useEffect(() => {
    const h = (e) => {
      if (e.key === "Escape") {
        setChatOpen(false);
        setAuthGate(null);
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  useEffect(() => {
    const path = window.location.pathname.replace(/\/$/, "") || "/";
    if (path === "/booking/success") setPage("booking-success");
    else if (path === "/booking/cancel") setPage("booking");
  }, []);

  useEffect(() => {
    if (chatOpen || isChatPage) setUnread(0);
  }, [chatOpen, isChatPage]);

  useEffect(() => {
    if (!generatedItinerary) {
      try {
        sessionStorage.removeItem(ITINERARY_SESSION_KEY);
      } catch {
        /* ignore */
      }
      return;
    }
    try {
      sessionStorage.setItem(
        ITINERARY_SESSION_KEY,
        JSON.stringify(generatedItinerary),
      );
    } catch {
      /* quota */
    }
  }, [generatedItinerary]);

  /** Opening Itineraries from the nav had no in-memory plan — load latest from API (includes unsaved generations). */
  useEffect(() => {
    if (page !== "itinerary" || generatedItinerary || !user?.id) return;
    let cancelled = false;
    setItineraryListLoading(true);
    itinerariesApi
      .list()
      .then((res) => {
        const list = res.itineraries || [];
        const latest = list[0];
        if (!cancelled && latest?.content?.days?.length)
          setGeneratedItinerary(latest);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setItineraryListLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [page, generatedItinerary, user?.id]);

  const handleFabClick = () => {
    if (isMobile) navigateTo("chat");
    else setChatOpen((o) => !o);
  };

  const handleOpenCatalogueItem = useCallback(
    async (item) => {
      const item_type = String(item?.item_type || "").trim();
      const item_id = item?.item_id;
      if (!item_id || !item_type) return;
      try {
        switch (item_type) {
          case "experience": {
            const exp = await experiencesApi.get(item_id);
            setSelectedExperience(exp);
            setChatOpen(false);
            setPage("experience");
            return;
          }
          case "activity": {
            const act = await activitiesApi.get(item_id);
            setSelectedActivity(act);
            setChatOpen(false);
            setPage("activity");
            return;
          }
          case "accommodation": {
            const row = await accommodationsApi.get(item_id);
            setSelectedAccommodation(row);
            setChatOpen(false);
            setPage("accommodation");
            return;
          }
          case "restaurant": {
            const row = await restaurantsApi.get(item_id);
            setSelectedRestaurant(row);
            setChatOpen(false);
            setPage("restaurant");
            return;
          }
          case "package": {
            const pkg = await packagesApi.get(item_id);
            setSelectedPackage(pkg);
            setChatOpen(false);
            setPage("package");
            return;
          }
          case "group_trip": {
            const trip = await groupTripsApi.get(item_id);
            setSelectedGroupTrip(trip);
            setChatOpen(false);
            setPage("group-trip");
            return;
          }
          case "provider": {
            setChatOpen(false);
            navigateTo("explore");
            toast("Browse hosts and curated experiences on Explore.", "info");
            return;
          }
          default:
            toast("This item type cannot be opened from chat yet.", "warning");
        }
      } catch (e) {
        console.error(e);
        toast(e?.message || "Could not open this listing.", "error");
      }
    },
    [toast, navigateTo],
  );

  const renderPage = () => {
    switch (page) {
      case "home":
        return (
          <HomePage
            setPage={navigateTo}
            setGeneratedItinerary={setGeneratedItinerary}
            setSelectedExperience={setSelectedExperience}
          />
        );
      case "explore":
        return (
          <ExplorePage
            setPage={navigateTo}
            setSelectedExperience={setSelectedExperience}
            initialSearch={exploreSearchSeed}
          />
        );
      case "experience":
        return (
          <ExperienceDetailPage
            experience={selectedExperience}
            setPage={navigateTo}
            setSelectedExperience={setSelectedExperience}
            onBook={(draft) => {
              setBookingDraft(draft);
              navigateTo("booking");
            }}
          />
        );
      case "activities":
        return (
          <ActivitiesPage
            setPage={navigateTo}
            setSelectedActivity={setSelectedActivity}
          />
        );
      case "activity":
        return (
          <ActivityDetailPage
            activity={selectedActivity}
            setPage={navigateTo}
            setSelectedActivity={setSelectedActivity}
          />
        );
      case "accommodations":
        return (
          <AccommodationsPage
            setPage={navigateTo}
            setSelectedAccommodation={setSelectedAccommodation}
          />
        );
      case "accommodation":
        return (
          <AccommodationDetailPage
            accommodation={selectedAccommodation}
            setPage={navigateTo}
            setSelectedAccommodation={setSelectedAccommodation}
          />
        );
      case "restaurants":
        return (
          <RestaurantsPage
            setPage={navigateTo}
            setSelectedRestaurant={setSelectedRestaurant}
          />
        );
      case "restaurant":
        return (
          <RestaurantDetailPage
            restaurant={selectedRestaurant}
            setPage={navigateTo}
            setSelectedRestaurant={setSelectedRestaurant}
          />
        );
      case "planning":
        return (
          <PlanningPage
            setPage={navigateTo}
            setSelectedPackage={setSelectedPackage}
            selectedPackage={selectedPackage}
            planningPrefill={planningPrefill}
            onConsumePlanningPrefill={clearPlanningPrefill}
          />
        );
      case "package":
        return (
          <PackageDetailPage
            pkg={selectedPackage}
            setPage={navigateTo}
            setSelectedPackage={setSelectedPackage}
          />
        );
      case "groups":
        return (
          <GroupTripsPage
            setPage={navigateTo}
            setSelectedGroupTrip={setSelectedGroupTrip}
          />
        );
      case "group-trip":
        return (
          <GroupTripDetailPage trip={selectedGroupTrip} setPage={navigateTo} />
        );
      case "event":
        return <EventRequestPage setPage={navigateTo} />;
      case "ai":
        return (
          <AIPage
            setPage={navigateTo}
            setGeneratedItinerary={setGeneratedItinerary}
          />
        );
      case "itinerary":
        return (
          <ItineraryPage
            setPage={navigateTo}
            generatedItinerary={generatedItinerary}
            itineraryHydrating={itineraryListLoading}
            onRequestTripQuote={(prefill) => {
              setPlanningPrefill(prefill);
              navigateTo("planning");
            }}
          />
        );
      case "booking":
        return (
          <BookingPage
            setPage={navigateTo}
            selectedExperience={selectedExperience}
            bookingDraft={bookingDraft}
            onConsumeBookingDraft={clearBookingDraft}
          />
        );
      case "chat":
        return <ChatPage onOpenCatalogueItem={handleOpenCatalogueItem} />;
      case "profile":
        return <ProfilePage setPage={navigateTo} />;
      case "login":
        return <LoginPage setPage={setPage} />;
      case "register":
        return <RegisterPage setPage={setPage} />;
      case "booking-success":
        return <BookingSuccessPage setPage={navigateTo} />;
      default:
        return (
          <HomePage
            setPage={navigateTo}
            setGeneratedItinerary={setGeneratedItinerary}
            setSelectedExperience={setSelectedExperience}
          />
        );
    }
  };

  if (authLoading) {
    return (
      <div
        className="flex items-center justify-center min-h-screen"
        style={{ background: "var(--parchment)" }}
      >
        <div className="text-center">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-sm mx-auto mb-4"
            style={{
              background:
                "linear-gradient(135deg,var(--terracotta),var(--gold))",
            }}
          >
            MW
          </div>
          <p className="text-sm" style={{ color: "var(--smoke)" }}>
            Loading…
          </p>
        </div>
      </div>
    );
  }

  const showFab = !(isMobile && isChatPage) && !isAuthPage;

  return (
    <div
      style={{
        background: "var(--parchment)",
        color: "var(--ink)",
        minHeight: "100vh",
        fontFamily: "'DM Sans',sans-serif",
      }}
    >
      {/* ── Desktop layout ── */}
      <div className="hidden lg:flex" style={{ minHeight: "100vh" }}>
        {!isAuthPage && <DesktopSidebar active={page} setPage={navigateTo} />}
        <main className="flex-1 overflow-y-auto" style={{ maxHeight: "100vh" }}>
          {renderPage()}
        </main>
      </div>

      {/* ── Tablet layout ── */}
      <div className="hidden md:block lg:hidden">
        {!isAuthPage && <TabletNav active={page} setPage={navigateTo} />}
        <main>{renderPage()}</main>
      </div>

      {/* ── Mobile layout ── */}
      <div
        className={`md:hidden ${isChatPage ? "flex flex-col" : ""}`}
        style={isChatPage ? { height: "100dvh", overflow: "hidden" } : {}}
      >
        {!isChatPage && !isAuthPage && (
          <header
            className="glass fixed top-0 left-0 right-0 z-30 px-4 py-3 flex items-center gap-3"
            style={{ borderBottom: "1px solid var(--light-clay)" }}
          >
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold text-xs"
              style={{
                background:
                  "linear-gradient(135deg,var(--terracotta),var(--gold))",
              }}
            >
              MW
            </div>
            <span
              className="font-display font-medium"
              style={{ fontSize: 14, color: "var(--ink)" }}
            >
              Morocco With You
            </span>
            <div className="ml-auto flex items-center gap-2">
              {isAuthenticated && isAdmin && (
                <AdminDashboardLink variant="inline" />
              )}
              {!isAuthenticated && (
                <button
                  onClick={() => setPage("login")}
                  className="text-xs font-semibold px-3 py-1.5 rounded-xl"
                  style={{
                    background: "var(--light-clay)",
                    color: "var(--ink)",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  Sign in
                </button>
              )}
            </div>
          </header>
        )}
        <main
          className={isChatPage ? "flex-1 flex flex-col overflow-hidden" : ""}
        >
          {renderPage()}
        </main>
        {!isAuthPage && <BottomNav active={page} setPage={navigateTo} />}
      </div>

      {/* ── FAB ── */}
      {showFab && (
        <button
          onClick={handleFabClick}
          aria-label="Open AI chat"
          className="ai-float"
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            zIndex: 50,
            width: 56,
            height: 56,
            borderRadius: 18,
            background: "linear-gradient(135deg,var(--terracotta),var(--deep))",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 8px 32px rgba(192,101,74,.4)",
          }}
        >
          <ChatIcon />
          {unread > 0 && !chatOpen && (
            <span
              className="badge-ping"
              style={{
                position: "absolute",
                top: -3,
                right: -3,
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "#E53E3E",
                border: "2px solid var(--parchment)",
              }}
            />
          )}
        </button>
      )}

      {/* ── Chat slide-up panel (md+) ── */}
      {chatOpen && !isMobile && (
        <>
          <div
            onClick={() => setChatOpen(false)}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 48,
              background: "rgba(26,20,16,.18)",
              backdropFilter: "blur(2px)",
              animation: "fadeIn .25s ease forwards",
            }}
          />
          <div
            ref={panelRef}
            className="slide-up"
            style={{
              position: "fixed",
              bottom: 0,
              right: 24,
              zIndex: 49,
              width: 380,
              height: 580,
              borderRadius: "24px 24px 0 0",
              background: "rgba(250,246,238,.92)",
              backdropFilter: "blur(20px) saturate(160%)",
              WebkitBackdropFilter: "blur(20px) saturate(160%)",
              border: "1px solid rgba(212,168,83,.2)",
              borderBottom: "none",
              boxShadow: "0 -8px 48px rgba(26,20,16,.2)",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "16px 20px 12px",
                borderBottom: "1px solid rgba(232,196,160,.5)",
                flexShrink: 0,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 12,
                    background:
                      "linear-gradient(135deg,var(--terracotta),var(--gold))",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  AI
                </div>
                <div>
                  <p
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: "var(--ink)",
                      margin: 0,
                    }}
                  >
                    Morocco AI Guide
                  </p>
                  <p style={{ fontSize: 11, color: "var(--sage)", margin: 0 }}>
                    ● Online · Instant replies
                  </p>
                </div>
              </div>
              <button
                onClick={() => setChatOpen(false)}
                style={{
                  background: "var(--light-clay)",
                  border: "none",
                  borderRadius: 10,
                  width: 32,
                  height: 32,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: "var(--smoke)",
                  flexShrink: 0,
                }}
              >
                <CloseIcon />
              </button>
            </div>
            <div
              style={{
                flex: 1,
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <ChatPage compact onOpenCatalogueItem={handleOpenCatalogueItem} />
            </div>
          </div>
        </>
      )}

      {/* ── Auth gate modal ── */}
      {authGate && (
        <AuthGateModal
          message={
            authGate.targetPage === "booking"
              ? "Sign in to book experiences and manage your trips."
              : authGate.targetPage === "itinerary"
                ? "Sign in to save and manage your AI-generated itineraries."
                : "Sign in to access your profile and travel history."
          }
          onLogin={() => {
            setAuthGate(null);
            setPage("login");
          }}
          onRegister={() => {
            setAuthGate(null);
            setPage("register");
          }}
          onClose={() => setAuthGate(null)}
        />
      )}
    </div>
  );
}
