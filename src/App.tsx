import { useEffect, useMemo, useState } from "react";
import {
  Link,
  Navigate,
  NavLink,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Bell,
  CalendarDays,
  Camera,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  FileBadge,
  Gauge,
  Heart,
  HelpCircle,
  Home,
  ImagePlus,
  LayoutDashboard,
  LifeBuoy,
  ListFilter,
  LockKeyhole,
  LogOut,
  MapPin,
  Menu,
  MessageSquare,
  PackageCheck,
  Plus,
  Search,
  Send,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Star,
  Store,
  User,
  Users,
  WalletCards,
  X,
  XCircle,
  Zap,
} from "lucide-react";
import {
  bookingMath,
  categories,
  cx,
  demoMode,
  listings,
  money,
  type BookingStatus,
  type Listing,
  type Role,
} from "./lib";
import { useAuth } from "./auth";
import {
  createBookingRequest,
  createListing,
  getFavoriteIds,
  getConversationMessages,
  getMyBookings,
  getMyProfile,
  setFavorite,
  sendConversationMessage,
  startConversation,
  subscribeToConversation,
  transitionBooking,
  unsubscribe,
  updateMyProfile,
  updateListing,
  uploadConversationAttachment,
} from "./api";
import { ProductImage } from "./components/ProductImage";
import { useMarketplace } from "./marketplace";

type Toast = { id: number; text: string; tone?: "ok" | "warn" };
type Booking = {
  id: string;
  listingId: string;
  start: string;
  end: string;
  total: number;
  status: BookingStatus;
  renter: string;
};
type AppState = {
  role: Role;
  favorites: string[];
  bookings: Booking[];
  notifications: number;
};

const initialState: AppState = {
  role: "renter",
  favorites: ["sony-lens"],
  notifications: 3,
  bookings: [
    {
      id: "RNT-24019",
      listingId: "projector",
      start: "2026-11-12",
      end: "2026-11-14",
      total: 164.4,
      status: "confirmed",
      renter: "Aysel Məmmədli",
    },
    {
      id: "RNT-23940",
      listingId: "sony-a7",
      start: "2026-10-20",
      end: "2026-10-22",
      total: 113.3,
      status: "completed",
      renter: "Murad Əliyev",
    },
  ],
};

function useStoredState() {
  const [state, setState] = useState<AppState>(() => {
    try {
      return JSON.parse(
        localStorage.getItem("rentora-state") || "",
      ) as AppState;
    } catch {
      return initialState;
    }
  });
  useEffect(
    () => localStorage.setItem("rentora-state", JSON.stringify(state)),
    [state],
  );
  return [state, setState] as const;
}

function Protected({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading)
    return (
      <main className="page">
        <div className="card-pad animate-pulse text-muted">
          Hesab yoxlanılır...
        </div>
      </main>
    );
  if (!demoMode && !user)
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return <>{children}</>;
}

export default function App() {
  const { user } = useAuth();
  const [state, setState] = useStoredState();
  const [toasts, setToasts] = useState<Toast[]>([]);
  const notify = (text: string, tone: "ok" | "warn" = "ok") => {
    const id = Date.now();
    setToasts((t) => [...t, { id, text, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  };
  useEffect(() => {
    if (!demoMode && user) {
      getFavoriteIds()
        .then((favorites) => setState((current) => ({ ...current, favorites })))
        .catch((error) => notify(error.message, "warn"));
    }
  }, [user]);
  const favorite = async (id: string) => {
    const active = !state.favorites.includes(id);
    setState((current) => ({
      ...current,
      favorites: active
        ? [...current.favorites, id]
        : current.favorites.filter((value) => value !== id),
    }));
    if (!demoMode) {
      try {
        await setFavorite(id, active);
      } catch (error) {
        setState((current) => ({
          ...current,
          favorites: active
            ? current.favorites.filter((value) => value !== id)
            : [...current.favorites, id],
        }));
        notify(
          error instanceof Error ? error.message : "Seçilmişlər yenilənmədi",
          "warn",
        );
      }
    }
  };
  const addBooking = (booking: Booking) =>
    setState((s) => ({ ...s, bookings: [booking, ...s.bookings] }));
  const updateBooking = (id: string, status: BookingStatus) =>
    setState((s) => ({
      ...s,
      bookings: s.bookings.map((b) => (b.id === id ? { ...b, status } : b)),
    }));
  return (
    <div className="min-h-screen bg-surface">
      <Header state={state} setState={setState} />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route
          path="/explore"
          element={<ExplorePage state={state} favorite={favorite} />}
        />
        <Route
          path="/search"
          element={<ExplorePage state={state} favorite={favorite} />}
        />
        <Route
          path="/category/:category"
          element={<ExplorePage state={state} favorite={favorite} />}
        />
        <Route
          path="/listing/:id"
          element={
            <ListingPage state={state} favorite={favorite} notify={notify} />
          }
        />
        <Route
          path="/checkout/:id"
          element={<CheckoutPage addBooking={addBooking} notify={notify} />}
        />
        <Route
          path="/login"
          element={<AuthPage mode="login" notify={notify} />}
        />
        <Route
          path="/register"
          element={<AuthPage mode="register" notify={notify} />}
        />
        <Route
          path="/forgot-password"
          element={<AuthPage mode="forgot" notify={notify} />}
        />
        <Route
          path="/profile"
          element={
            <Protected>
              <ProfilePage notify={notify} />
            </Protected>
          }
        />
        <Route
          path="/profile/edit"
          element={
            <Protected>
              <ProfilePage notify={notify} />
            </Protected>
          }
        />
        <Route
          path="/favorites"
          element={
            <Protected>
              <SimpleListings
                title="Seçilmişlərim"
                ids={state.favorites}
                state={state}
                favorite={favorite}
              />
            </Protected>
          }
        />
        <Route
          path="/listings/new"
          element={
            <Protected>
              <ListingFormPage notify={notify} />
            </Protected>
          }
        />
        <Route
          path="/listings/:id/edit"
          element={
            <Protected>
              <ListingFormPage notify={notify} edit />
            </Protected>
          }
        />
        <Route
          path="/bookings"
          element={
            <Protected>
              <BookingsPage
                state={state}
                updateBooking={updateBooking}
                owner={false}
                notify={notify}
              />
            </Protected>
          }
        />
        <Route
          path="/bookings/:id"
          element={
            <Protected>
              <BookingDetailPage
                state={state}
                updateBooking={updateBooking}
                notify={notify}
              />
            </Protected>
          }
        />
        <Route
          path="/owner"
          element={
            <Protected>
              <OwnerDashboard state={state} />
            </Protected>
          }
        />
        <Route
          path="/owner/listings"
          element={
            <Protected>
              <MyListings />
            </Protected>
          }
        />
        <Route
          path="/owner/bookings"
          element={
            <Protected>
              <BookingsPage
                state={state}
                updateBooking={updateBooking}
                owner
                notify={notify}
              />
            </Protected>
          }
        />
        <Route
          path="/owner/earnings"
          element={
            <Protected>
              <EarningsPage />
            </Protected>
          }
        />
        <Route
          path="/messages/:conversationId?"
          element={
            <Protected>
              <MessagesPage notify={notify} />
            </Protected>
          }
        />
        <Route
          path="/notifications"
          element={
            <Protected>
              <NotificationsPage
                clear={() => setState((s) => ({ ...s, notifications: 0 }))}
              />
            </Protected>
          }
        />
        <Route path="/passport/:id?" element={<PassportPage />} />
        <Route path="/reviews" element={<ReviewsPage notify={notify} />} />
        <Route path="/help" element={<HelpPage />} />
        <Route path="/faq" element={<FaqPage />} />
        <Route path="/terms" element={<LegalPage type="terms" />} />
        <Route path="/privacy" element={<LegalPage type="privacy" />} />
        <Route
          path="/cancellation-policy"
          element={<PolicyPage type="cancellation" />}
        />
        <Route
          path="/deposit-dispute-policy"
          element={<PolicyPage type="deposit" />}
        />
        <Route
          path="/prohibited-items"
          element={<PolicyPage type="prohibited" />}
        />
        <Route
          path="/admin"
          element={
            <Protected>
              <AdminPage />
            </Protected>
          }
        />
        <Route
          path="/admin/:section"
          element={
            <Protected>
              <AdminSectionPage />
            </Protected>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Footer />
      <div className="fixed bottom-4 right-4 z-[80] space-y-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={cx(
              "flex items-center gap-2 rounded-xl border px-4 py-3 shadow-2xl",
              t.tone === "warn"
                ? "border-amber/30 bg-[#2b2118] text-amber"
                : "border-emerald/30 bg-[#10251f] text-emerald",
            )}
          >
            <CheckCircle2 size={18} />
            {t.text}
          </div>
        ))}
      </div>
    </div>
  );
}

function Header({
  state,
  setState,
}: {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
}) {
  const { listings: catalog } = useMarketplace();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const runSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/search?q=${encodeURIComponent(query)}`);
    setOpen(false);
  };
  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.07] bg-ink/95 backdrop-blur-xl">
      <div className="mx-auto flex h-[68px] max-w-[1440px] items-center gap-3 px-4 sm:px-6 lg:px-8">
        <Link
          to="/"
          className="flex shrink-0 items-center"
          aria-label="RENTORA ana səhifə"
        >
          <span className="relative block h-[34px] w-[53px] overflow-hidden rounded-md bg-white sm:h-[39px] sm:w-[60px]">
            <img
              src="/rentora-logo.png"
              alt="Rentora"
              className="absolute left-[-25px] top-0 w-[102px] max-w-none sm:left-[-28px] sm:w-[115px]"
            />
          </span>
        </Link>

        <button className="hidden min-h-10 items-center gap-2 rounded-lg px-2.5 text-sm text-muted hover:bg-white/5 hover:text-text lg:flex">
          <MapPin size={16} /> Bakı
          <ChevronDown size={14} />
        </button>

        <form
          onSubmit={runSearch}
          className="mx-auto hidden h-10 max-w-xl flex-1 items-center rounded-lg border border-white/10 bg-panel md:flex"
        >
          <Search className="ml-3 shrink-0 text-muted" size={17} />
          <input
            list="rentora-suggestions"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-full w-full bg-transparent px-3 text-sm outline-none placeholder:text-slate-500"
            placeholder="Nə icarə etmək istəyirsiniz?"
            aria-label="Elan axtar"
          />
          <datalist id="rentora-suggestions">
            {catalog.map((item) => (
              <option key={item.id} value={item.title} />
            ))}
          </datalist>
          <button
            aria-label="Axtar"
            className="grid h-9 w-10 place-items-center text-mint"
          >
            <Search size={17} />
          </button>
        </form>

        <nav className="ml-auto hidden items-center gap-1 xl:flex">
          {[
            ["Kataloq", "/explore"],
            ["Elan yerləşdir", "/listings/new"],
          ].map(([label, path]) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) =>
                cx(
                  "rounded-lg px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-white/[0.06] text-text"
                    : "text-muted hover:text-text",
                )
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        {demoMode && (
          <>
            <span className="hidden rounded-md bg-white/[0.05] px-2 py-1 text-[11px] text-muted sm:inline">
              Demo
            </span>
            <select
              aria-label="Demo rolu"
              value={state.role}
              onChange={(e) =>
                setState((s) => ({ ...s, role: e.target.value as Role }))
              }
              className="hidden rounded-md border border-white/10 bg-panel px-2 py-1.5 text-xs text-muted xl:block"
            >
              <option value="renter">İcarəçi</option>
              <option value="owner">Sahibkar</option>
              <option value="admin">Admin</option>
            </select>
          </>
        )}
        <Link
          to="/notifications"
          aria-label="Bildirişlər"
          className="relative grid h-10 w-10 place-items-center rounded-lg text-muted hover:bg-white/5 hover:text-text"
        >
          <Bell size={19} />
          {state.notifications > 0 && (
            <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-emerald" />
          )}
        </Link>
        <Link
          to={user || demoMode ? "/profile" : "/login"}
          aria-label={user || demoMode ? "Profil" : "Daxil ol"}
          className="hidden h-10 items-center gap-2 rounded-lg border border-white/10 px-3 text-sm text-muted hover:border-white/20 hover:text-text sm:flex"
        >
          <User size={17} />
          <span className="hidden lg:inline">
            {user ? "Profil" : demoMode ? "Hesab" : "Daxil ol"}
          </span>
        </Link>
        <button
          aria-label="Menyu"
          aria-expanded={open}
          className="grid h-10 w-10 place-items-center rounded-lg text-muted hover:bg-white/5 hover:text-text xl:hidden"
          onClick={() => setOpen(!open)}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {open && (
        <div className="border-t border-white/[0.07] bg-ink p-4 xl:hidden">
          <form
            onSubmit={runSearch}
            className="mb-3 flex rounded-lg border border-white/10 bg-panel p-2 md:hidden"
          >
            <Search size={18} className="ml-1 text-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-transparent px-2 text-sm outline-none"
              placeholder="Elan axtar"
              aria-label="Mobil axtarış"
            />
          </form>
          <div className="grid grid-cols-2 gap-1 sm:grid-cols-3">
            {[
              ["Kataloq", "/explore"],
              ["Seçilmişlər", "/favorites"],
              ["Bronlar", "/bookings"],
              ["Mesajlar", "/messages"],
              ["Elan yerləşdir", "/listings/new"],
              ["Profil", "/profile"],
            ].map(([label, path]) => (
              <Link
                key={path}
                to={path}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm text-muted hover:bg-white/5 hover:text-text"
              >
                {label}
              </Link>
            ))}
          </div>
          {demoMode && (
            <label className="mt-3 flex items-center justify-between border-t border-white/[0.07] pt-3 text-xs text-muted">
              Demo rolu
              <select
                aria-label="Demo rolu"
                value={state.role}
                onChange={(e) =>
                  setState((s) => ({ ...s, role: e.target.value as Role }))
                }
                className="rounded-md border border-white/10 bg-panel px-2 py-1.5"
              >
                <option value="renter">İcarəçi</option>
                <option value="owner">Sahibkar</option>
                <option value="admin">Admin</option>
              </select>
            </label>
          )}
          {!demoMode && user && (
            <button
              onClick={() => void signOut()}
              className="mt-3 flex items-center gap-2 text-sm text-muted"
            >
              <LogOut size={16} /> Çıxış
            </button>
          )}
        </div>
      )}
    </header>
  );
}

function SectionTitle({
  eyebrow,
  title,
  copy,
  action,
}: {
  eyebrow?: string;
  title: string;
  copy?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <div>
        {eyebrow && (
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-[.14em] text-mint">
            {eyebrow}
          </p>
        )}
        <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
          {title}
        </h1>
        {copy && (
          <p className="mt-1.5 max-w-2xl text-sm text-muted sm:text-base">
            {copy}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}

function HomePage() {
  const { listings: catalog, loading, error } = useMarketplace();
  if (loading)
    return (
      <main className="page">
        <SectionTitle
          title="Elanlar yüklənir"
          copy="Bir neçə saniyə gözləyin."
        />
        <ListingGridSkeleton />
      </main>
    );
  if (error)
    return (
      <main className="page">
        <Empty icon={XCircle} title="Kataloq yüklənmədi" copy={error} />
      </main>
    );
  return (
    <main>
      <section className="hero-grid overflow-hidden border-b border-white/[0.06]">
        <div className="page grid min-h-[500px] items-center gap-10 py-14 lg:grid-cols-[1.05fr_.95fr]">
          <div className="fade-up">
            <p className="mb-4 text-sm font-semibold text-mint">
              Azərbaycanda rahat icarə
            </p>
            <h1 className="max-w-2xl font-display text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl lg:text-[3.4rem]">
              Hər şeyə sahib olmaq lazım deyil,
              <span className="block text-mint">Rentora kifayətdir!</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-muted">
              Kamera, elektronika, nəqliyyat və daha çoxunu yerli sahiblərdən
              şəffaf şərtlərlə icarə edin.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link className="btn-primary" to="/explore">
                <Search size={18} /> Elanlara bax
              </Link>
              <Link className="btn-secondary" to="/listings/new">
                <Plus size={18} /> Elan yerləşdir
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted">
              <span className="flex items-center gap-2">
                <ShieldCheck size={16} className="text-emerald" /> Təsdiqlənmiş
                profillər
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald" /> Şəffaf
                qiymətlər
              </span>
            </div>
          </div>
          <div className="relative hidden lg:block">
            <div className="card relative overflow-hidden p-2">
              <ProductImage
                className="aspect-[4/3] w-full rounded-lg object-cover"
                src={catalog[0]?.image}
                alt="Sony Alpha kamera"
              />
              <div className="absolute bottom-5 left-5 right-5 flex items-center justify-between rounded-lg bg-ink/90 p-4 backdrop-blur">
                <div>
                  <p className="font-semibold">Sony Alpha A7 IV</p>
                  <p className="text-sm text-muted">Bakı, Səbail</p>
                </div>
                <b className="text-xl text-emerald">
                  30 ₼<span className="text-xs text-muted">/gün</span>
                </b>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="page py-16">
        <SectionTitle
          eyebrow="Kateqoriyalar"
          title="Nə axtarırsınız?"
          copy="Ehtiyacınıza uyğun kateqoriyanı seçin."
        />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          {categories.map((c, i) => (
            <Link
              to={`/category/${encodeURIComponent(c)}`}
              key={c}
              className="card-pad group text-center transition-colors hover:border-white/20 hover:bg-elevated"
            >
              <span className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-xl bg-teal/15 text-mint">
                {[Camera, Zap, Home, Settings, Sparkles, Gauge].map(
                  (Icon, n) => n === i && <Icon key={n} />,
                )}
              </span>
              <b className="text-sm">{c}</b>
            </Link>
          ))}
        </div>
      </section>
      <section className="page pb-16">
        <SectionTitle
          eyebrow="Seçilmiş elanlar"
          title="Bu həftə ən çox baxılanlar"
          action={
            <Link to="/explore" className="text-sm text-mint">
              Hamısına bax →
            </Link>
          }
        />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {catalog.slice(0, 3).map((x) => (
            <ListingCard key={x.id} item={x} />
          ))}
        </div>
      </section>
      <section className="page pb-16">
        <div className="card grid gap-6 p-8 md:grid-cols-3">
          {[
            [
              ShieldCheck,
              "Təsdiqlənmiş profillər",
              "İstifadəçi məlumatları və reputasiya siqnalları.",
            ],
            [
              FileBadge,
              "Şəffaf müqavilə",
              "Qiymət, depozit və qaydalar ayrıca göstərilir.",
            ],
            [
              LifeBuoy,
              "Dəstək və mübahisə",
              "Təhvil qeydləri və dəstək prosesi bir yerdə.",
            ],
          ].map(([I, t, c]) => {
            const Icon = I as typeof ShieldCheck;
            return (
              <div key={t as string} className="flex gap-4">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-emerald/10 text-emerald">
                  <Icon />
                </span>
                <div>
                  <h3 className="font-display font-semibold">{t as string}</h3>
                  <p className="mt-1 text-sm text-muted">{c as string}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}

function ListingCard({
  item,
  favorite,
  onFavorite,
}: {
  item: Listing;
  favorite?: boolean;
  onFavorite?: () => void;
}) {
  return (
    <article className="card group flex h-full flex-col overflow-hidden transition-colors hover:border-white/15 hover:bg-[#191e29]">
      <div className="relative overflow-hidden bg-elevated">
        <Link to={`/listing/${item.id}`}>
          <ProductImage
            loading="lazy"
            className="aspect-[4/3] w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            src={item.image}
            alt={item.title}
          />
        </Link>
        {onFavorite && (
          <button
            onClick={onFavorite}
            aria-label={
              favorite ? "Seçilmişlərdən çıxar" : "Seçilmişlərə əlavə et"
            }
            className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-ink/85 text-white backdrop-blur transition-colors hover:bg-ink"
          >
            <Heart
              size={17}
              className={favorite ? "fill-emerald text-emerald" : ""}
            />
          </button>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <div className="mb-2 flex items-center justify-between gap-3 text-xs text-muted">
          <span className="flex min-w-0 items-center gap-1.5 truncate">
            {item.category}
            {item.verified && (
              <CheckCircle2
                size={13}
                className="shrink-0 text-emerald"
                aria-label="Təsdiqlənmiş sahib"
              />
            )}
          </span>
          <span className="flex items-center gap-1 text-amber">
            <Star size={12} fill="currentColor" />
            {item.rating} <span className="text-muted">({item.reviews})</span>
          </span>
        </div>
        <Link
          to={`/listing/${item.id}`}
          className="listing-title min-h-[3rem] font-display text-base font-semibold leading-6 hover:text-mint sm:text-lg"
        >
          {item.title}
        </Link>
        <p className="mt-2 flex items-center gap-1 text-sm text-muted">
          <MapPin size={14} />
          {item.location}
        </p>
        <div className="mt-auto flex items-end justify-between gap-3 border-t border-white/[0.06] pt-4">
          <div>
            <b className="tabular text-xl text-emerald">{money(item.price)}</b>
            <span className="text-xs text-muted"> / gün</span>
          </div>
          <span className="text-right text-xs text-muted">
            Depozit
            <br />
            <b className="font-medium text-slate-300">{money(item.deposit)}</b>
          </span>
        </div>
      </div>
    </article>
  );
}

function ListingGridSkeleton() {
  return (
    <div
      className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
      aria-label="Elanlar yüklənir"
    >
      {Array.from({ length: 6 }, (_, index) => (
        <div className="card overflow-hidden" key={index}>
          <div className="skeleton aspect-[4/3] rounded-none" />
          <div className="space-y-3 p-5">
            <div className="skeleton h-3 w-1/3" />
            <div className="skeleton h-5 w-4/5" />
            <div className="skeleton h-4 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

function ExplorePage({
  state,
  favorite,
}: {
  state: AppState;
  favorite: (id: string) => void;
}) {
  const { listings: catalog, loading, error } = useMarketplace();
  const [sp] = useSearchParams();
  const { category } = useParams();
  const navigate = useNavigate();
  const [max, setMax] = useState(Number(sp.get("max") || 200));
  const [sort, setSort] = useState(sp.get("sort") || "popular");
  const [location, setLocation] = useState(sp.get("location") || "");
  const [start, setStart] = useState(sp.get("start") || "");
  const [end, setEnd] = useState(sp.get("end") || "");
  const [page, setPage] = useState(1);
  const query = sp.get("q") || "";
  const cat = category
    ? decodeURIComponent(category)
    : sp.get("category") || "";
  const validDates = !start || !end || new Date(end) > new Date(start);
  const results = useMemo(
    () =>
      catalog
        .filter(
          (x) =>
            (!query ||
              `${x.title} ${x.description}`
                .toLowerCase()
                .includes(query.toLowerCase())) &&
            (!cat || x.category === cat) &&
            (!location ||
              x.location.toLowerCase().includes(location.toLowerCase())) &&
            x.price <= max &&
            validDates,
        )
        .sort((a, b) =>
          sort === "price-low"
            ? a.price - b.price
            : sort === "price-high"
              ? b.price - a.price
              : sort === "newest"
                ? b.createdAt.localeCompare(a.createdAt)
                : sort === "rating"
                  ? b.rating - a.rating
                  : b.popularity - a.popularity,
        ),
    [catalog, query, cat, location, max, sort, validDates],
  );
  const perPage = 9,
    totalPages = Math.max(1, Math.ceil(results.length / perPage)),
    visible = results.slice((page - 1) * perPage, page * perPage);
  useEffect(() => setPage(1), [query, cat, location, max, sort, start, end]);
  const chooseCategory = (value: string) =>
    navigate(
      value ? `/explore?category=${encodeURIComponent(value)}` : "/explore",
    );
  const reset = () => {
    setMax(200);
    setSort("popular");
    setLocation("");
    setStart("");
    setEnd("");
    navigate("/explore");
  };
  if (loading)
    return (
      <main className="page">
        <SectionTitle
          title="Elanlar yüklənir"
          copy="Bir neçə saniyə gözləyin."
        />
        <ListingGridSkeleton />
      </main>
    );
  if (error)
    return (
      <main className="page">
        <Empty icon={XCircle} title="Elanlar yüklənmədi" copy={error} />
      </main>
    );
  return (
    <main className="page">
      <SectionTitle
        eyebrow="Marketplace"
        title={
          cat || query ? `“${cat || query}” nəticələri` : "Kataloqu kəşf et"
        }
        copy={`${results.length} uyğun elan tapıldı`}
        action={
          <label className="hidden items-center gap-2 text-sm text-muted sm:flex">
            <span>Sırala</span>
            <select
              className="field min-h-10 w-auto py-0"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              aria-label="Elanları sırala"
            >
              <option value="popular">Populyar</option>
              <option value="rating">Reytinq</option>
              <option value="price-low">Ucuzdan bahaya</option>
              <option value="price-high">Bahadan ucuza</option>
              <option value="newest">Ən yeni</option>
            </select>
          </label>
        }
      />
      <div className="mb-6 rounded-xl border border-white/[0.07] bg-panel p-3 sm:p-4">
        <div className="flex gap-1.5 overflow-auto pb-1">
          {["", ...categories].map((c) => (
            <button
              key={c || "all"}
              onClick={() => chooseCategory(c)}
              className={cx(
                "whitespace-nowrap rounded-lg px-3 py-2 text-sm transition-colors",
                cat === c
                  ? "bg-teal text-white"
                  : "text-muted hover:bg-white/5 hover:text-text",
              )}
            >
              {c || "Hamısı"}
            </button>
          ))}
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_1.2fr]">
          <label>
            <span className="label">Məkan</span>
            <select
              className="field"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            >
              <option value="">Bütün Bakı</option>
              {[
                "Səbail",
                "Nərimanov",
                "Yasamal",
                "Xətai",
                "Binəqədi",
                "Nəsimi",
              ].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
          <label>
            <span className="label">Başlanğıc</span>
            <input
              className="field"
              type="date"
              value={start}
              onChange={(e) => setStart(e.target.value)}
            />
          </label>
          <label>
            <span className="label">Son tarix</span>
            <input
              className="field"
              type="date"
              min={start}
              value={end}
              onChange={(e) => setEnd(e.target.value)}
            />
          </label>
          <label>
            <span className="label">Maksimum: {max} ₼</span>
            <span className="field flex items-center gap-2">
              <SlidersHorizontal size={16} />
              <input
                aria-label="Maksimum günlük qiymət"
                type="range"
                min="15"
                max="200"
                value={max}
                onChange={(e) => setMax(+e.target.value)}
                className="w-full accent-[#0f766e]"
              />
            </span>
          </label>
        </div>
        <div className="mt-3 flex items-center justify-between gap-3 border-t border-white/[0.06] pt-3 sm:hidden">
          <select
            className="field min-h-10"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            aria-label="Elanları sırala"
          >
            <option value="popular">Populyar</option>
            <option value="rating">Reytinq</option>
            <option value="price-low">Ucuzdan bahaya</option>
            <option value="price-high">Bahadan ucuza</option>
            <option value="newest">Ən yeni</option>
          </select>
          <button onClick={reset} className="shrink-0 text-sm text-mint">
            Sıfırla
          </button>
        </div>
        {!validDates && (
          <p className="mt-3 text-sm text-red-300 sm:hidden">
            Son tarix başlanğıc tarixindən sonra olmalıdır.
          </p>
        )}
        <div className="mt-3 hidden items-center justify-between sm:flex">
          {!validDates ? (
            <p className="text-sm text-red-300">
              Son tarix başlanğıc tarixindən sonra olmalıdır.
            </p>
          ) : (
            <span />
          )}
          <button onClick={reset} className="text-sm text-mint">
            Sıfırla
          </button>
        </div>
      </div>
      {visible.length ? (
        <>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((x) => (
              <ListingCard
                key={x.id}
                item={x}
                favorite={state.favorites.includes(x.id)}
                onFavorite={() => favorite(x.id)}
              />
            ))}
          </div>
          {totalPages > 1 && (
            <nav
              aria-label="Səhifələmə"
              className="mt-8 flex justify-center gap-2"
            >
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i + 1)}
                  className={cx(
                    "h-10 w-10 rounded-lg",
                    page === i + 1 ? "bg-teal" : "bg-elevated",
                  )}
                >
                  {i + 1}
                </button>
              ))}
            </nav>
          )}
        </>
      ) : (
        <Empty
          icon={Search}
          title="Uyğun elan tapılmadı"
          copy="Filtrləri dəyişdirin və ya başqa açar söz sınayın."
        />
      )}
    </main>
  );
}

function ListingPage({
  state,
  favorite,
  notify,
}: {
  state: AppState;
  favorite: (id: string) => void;
  notify: (s: string, tone?: "ok" | "warn") => void;
}) {
  const { listings: catalog } = useMarketplace();
  const { id } = useParams();
  const item = catalog.find((x) => x.id === id);
  const navigate = useNavigate();
  const [start, setStart] = useState("2026-11-15");
  const [end, setEnd] = useState("2026-11-18");
  const [startingChat, setStartingChat] = useState(false);
  const today = new Date().toISOString().slice(0, 10);
  useEffect(() => {
    if (start && end && new Date(end) <= new Date(start)) {
      const next = new Date(`${start}T00:00:00Z`);
      next.setUTCDate(next.getUTCDate() + 1);
      setEnd(next.toISOString().slice(0, 10));
    }
  }, [start, end]);
  if (!item) return <NotFound />;
  const calc = bookingMath(item, start, end);
  const validRange = calc.days > 0 && start >= today;
  const openChat = async () => {
    if (demoMode) {
      navigate("/messages");
      return;
    }
    if (!item.ownerId) {
      notify("Elan sahibinin məlumatı tapılmadı", "warn");
      return;
    }
    setStartingChat(true);
    try {
      const conversationId = await startConversation(
        item.id,
        item.ownerId,
        item.title,
      );
      if (conversationId) navigate(`/messages/${conversationId}`);
    } catch (error) {
      notify(
        error instanceof Error ? error.message : "Yazışma yaradıla bilmədi",
        "warn",
      );
    } finally {
      setStartingChat(false);
    }
  };
  return (
    <main className="page">
      <div className="mb-5 flex items-center gap-2 text-sm text-muted">
        <Link to="/explore">Kataloq</Link>
        <ChevronRight size={14} />
        <Link to={`/category/${encodeURIComponent(item.category)}`}>
          {item.category}
        </Link>
        <ChevronRight size={14} />
        <span className="truncate text-text">{item.title}</span>
      </div>
      <div className="grid items-start gap-8 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-8">
          <div className="card overflow-hidden">
            <div className="relative">
              <ProductImage
                src={item.image}
                alt={item.title}
                className="h-[340px] w-full object-cover sm:h-[520px]"
              />
              <div className="absolute left-4 top-4 flex gap-2">
                <span className="badge bg-ink/90 text-mint">
                  <span className="h-2 w-2 rounded-full bg-emerald" /> mövcuddur
                </span>
                {item.verified && (
                  <span className="badge bg-ink/90 text-amber">
                    <ShieldCheck size={13} /> pro aktiv
                  </span>
                )}
              </div>
              <button
                onClick={() => favorite(item.id)}
                className="absolute right-4 top-4 rounded-full bg-ink/90 p-3"
              >
                <Heart
                  className={
                    state.favorites.includes(item.id)
                      ? "fill-emerald text-emerald"
                      : ""
                  }
                />
              </button>
            </div>
            <div className="flex gap-3 bg-elevated p-3">
              {(item.images?.length
                ? item.images
                : [
                    item.image,
                    ...catalog
                      .filter((x) => x.id !== item.id)
                      .slice(0, 2)
                      .map((x) => x.image),
                  ]
              ).map((im, i) => (
                <ProductImage
                  key={i}
                  src={im}
                  alt="Məhsul görünüşü"
                  className={cx(
                    "h-16 w-20 rounded-lg object-cover",
                    i === 0 && "ring-2 ring-mint",
                  )}
                />
              ))}
            </div>
          </div>
          <div className="card-pad">
            <div className="flex flex-col justify-between gap-4 sm:flex-row">
              <div>
                <span className="badge bg-teal text-white">
                  {item.category}
                </span>
                <h1 className="mt-3 font-display text-3xl font-bold">
                  {item.title}
                </h1>
              </div>
              <div className="shrink-0 sm:text-right">
                <b className="tabular text-3xl text-emerald">
                  {money(item.price)}
                </b>
                <p className="text-sm text-muted">günlük icarə</p>
              </div>
            </div>
            <p className="mt-5 leading-7 text-muted">{item.description}</p>
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                ["Reytinq", `${item.rating} / 5`],
                ["Rəylər", String(item.reviews)],
                ["Cavab", "~12 dəq"],
                ["Təhvil", "Bakı"],
              ].map(([a, b]) => (
                <div className="stat" key={a}>
                  <p className="text-xs text-muted">{a}</p>
                  <b>{b}</b>
                </div>
              ))}
            </div>
          </div>
          <div className="card-pad">
            <h2 className="font-display text-xl font-bold">Avadanlıq sahibi</h2>
            <div className="mt-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="grid h-14 w-14 place-items-center rounded-xl bg-teal text-xl font-bold">
                  {item.owner[0]}
                </span>
                <div>
                  <b>{item.owner}</b>
                  <p className="text-sm text-muted">
                    <ShieldCheck
                      size={14}
                      className="mr-1 inline text-emerald"
                    />
                    Profil təsdiqlənib • {item.location}
                  </p>
                </div>
              </div>
              <button
                type="button"
                disabled={startingChat}
                onClick={() => void openChat()}
                className="btn-secondary"
              >
                <MessageSquare size={17} />{" "}
                <span className="hidden sm:inline">
                  {startingChat ? "Açılır..." : "Mesaj yaz"}
                </span>
              </button>
            </div>
          </div>
          <div className="card-pad">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-teal/20 text-mint">
                <FileBadge />
              </span>
              <div>
                <h2 className="font-display text-xl font-bold">
                  Rentora Item Passport™
                </h2>
                <p className="text-sm text-muted">Audit və təhvil tarixçəsi</p>
              </div>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {[
                ["Seriya №", "3849102-AZ"],
                ["Son audit", "05 noyabr 2026"],
                ["Vəziyyət", "Optika 10/10"],
              ].map(([a, b]) => (
                <div className="stat" key={a}>
                  <p className="text-xs text-muted">{a}</p>
                  <b className="text-sm text-emerald">{b}</b>
                </div>
              ))}
            </div>
            <Link
              to={`/passport/${item.id}`}
              className="mt-4 inline-block text-sm text-mint"
            >
              Tam pasporta bax →
            </Link>
          </div>
        </div>
        <aside className="card-pad sticky top-28 lg:col-span-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-bold">
              <CalendarDays className="mr-2 inline text-mint" />
              İcarə müddəti
            </h2>
            <span className="badge bg-emerald/10 text-emerald">
              {calc.days} gün
            </span>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <label>
              <span className="label">Götürülmə</span>
              <input
                className="field"
                type="date"
                min={today}
                value={start}
                onChange={(e) => setStart(e.target.value)}
              />
            </label>
            <label>
              <span className="label">Təhvil</span>
              <input
                className="field"
                type="date"
                min={start}
                value={end}
                onChange={(e) => setEnd(e.target.value)}
              />
            </label>
          </div>
          {!validRange && (
            <p className="mt-3 text-sm text-red-300">
              Götürülmə tarixi bu gündən əvvəl ola bilməz və təhvil tarixi daha
              sonra olmalıdır.
            </p>
          )}
          <div className="my-5 space-y-3 border-y border-white/[0.07] py-5 text-sm">
            <MoneyRow
              name={`İcarə (${money(item.price)} × ${calc.days})`}
              value={calc.rental}
            />
            <MoneyRow name="Platforma xidməti (5.5%)" value={calc.fee} />
            <MoneyRow name="Logistika / özün götür" value={0} />
            <MoneyRow name="Qaytarılan depozit" value={calc.deposit} amber />
          </div>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-sm text-muted">Cəmi autorizasiya</p>
              <p className="text-xs text-mint">İcarə + xidmət + depozit</p>
            </div>
            <b className="tabular text-3xl text-emerald">{money(calc.total)}</b>
          </div>
          <button
            disabled={!validRange}
            onClick={() =>
              navigate(`/checkout/${item.id}?start=${start}&end=${end}`)
            }
            className="btn-primary mt-6 w-full"
          >
            <LockKeyhole size={18} /> Bron sorğusuna keç
          </button>
          <p className="mt-4 text-center text-xs text-muted">
            Real kart məlumatları bu tətbiqdə saxlanmır.
          </p>
        </aside>
      </div>
    </main>
  );
}

function MoneyRow({
  name,
  value,
  amber,
}: {
  name: string;
  value: number;
  amber?: boolean;
}) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-muted">{name}</span>
      <b className={cx("tabular", amber ? "text-amber" : "text-text")}>
        {money(value)}
      </b>
    </div>
  );
}

const checkoutSchema = z
  .object({
    firstName: z.string().trim().min(2, "Adı daxil edin"),
    lastName: z.string().trim().min(2, "Soyadı daxil edin"),
    email: z.string().trim().email("Düzgün e-poçt ünvanı daxil edin"),
    phone: z.string().refine((value) => value.replace(/\D/g, "").length >= 9, {
      message: "Düzgün telefon nömrəsi daxil edin",
    }),
    startDate: z.string().min(1, "Başlanğıc tarixini seçin"),
    endDate: z.string().min(1, "Son tarixi seçin"),
    delivery: z.enum(["renter_pickup", "owner_delivery", "meeting_point"]),
    cardNumber: z
      .string()
      .regex(/^(\d{4} ){3}\d{4}$/, "16 rəqəmli kart nömrəsi daxil edin"),
    expiry: z
      .string()
      .regex(/^(0[1-9]|1[0-2])\/\d{2}$/, "AA/İİ formatından istifadə edin"),
    cvv: z.string().regex(/^\d{3,4}$/, "3 və ya 4 rəqəm daxil edin"),
    cardholder: z.string().trim().min(5, "Kart sahibinin adını daxil edin"),
    address: z.string().trim().min(5, "Ünvanı daxil edin"),
    city: z.string().trim().min(2, "Şəhəri daxil edin"),
    postalCode: z.string().trim().min(3, "Poçt indeksini daxil edin"),
    accepted: z.boolean().refine(Boolean, "Şərtləri qəbul edin"),
  })
  .refine((values) => values.endDate > values.startDate, {
    path: ["endDate"],
    message: "Son tarix başlanğıc tarixindən sonra olmalıdır",
  });

type CheckoutData = z.infer<typeof checkoutSchema>;

function CheckoutField({
  label,
  error,
  children,
  optional,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
  optional?: boolean;
}) {
  return (
    <label className="block">
      <span className="label">
        {label} {!optional && <span className="text-red-300">*</span>}
      </span>
      {children}
      {error && (
        <span className="field-error" role="alert">
          {error}
        </span>
      )}
    </label>
  );
}

function CheckoutSection({
  step,
  title,
  children,
}: {
  step: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="section-card">
      <div className="mb-5 flex items-center gap-3">
        <span className="grid h-7 w-7 place-items-center rounded-full bg-teal text-xs font-bold text-white">
          {step}
        </span>
        <h2 className="font-display text-lg font-bold">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function formatCardNumber(value: string) {
  return value
    .replace(/\D/g, "")
    .slice(0, 16)
    .replace(/(.{4})/g, "$1 ")
    .trim();
}

function formatExpiry(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  return digits.length > 2
    ? `${digits.slice(0, 2)}/${digits.slice(2)}`
    : digits;
}

function CheckoutPage({
  addBooking,
  notify,
}: {
  addBooking: (b: Booking) => void;
  notify: (s: string, tone?: "ok" | "warn") => void;
}) {
  const { listings: catalog } = useMarketplace();
  const { id } = useParams();
  const [sp] = useSearchParams();
  const item = catalog.find((x) => x.id === id) || catalog[0];
  const initialStart = sp.get("start") || "2026-11-15";
  const initialEnd = sp.get("end") || "2026-11-18";
  const [submitting, setSubmitting] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid },
  } = useForm<CheckoutData>({
    resolver: zodResolver(checkoutSchema),
    mode: "onChange",
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      startDate: initialStart,
      endDate: initialEnd,
      delivery: "renter_pickup",
      cardNumber: "",
      expiry: "",
      cvv: "",
      cardholder: "",
      address: "",
      city: "Bakı",
      postalCode: "",
      accepted: false,
    },
  });
  const values = watch();
  if (!item) return <NotFound />;
  const deliveryFee = values.delivery === "owner_delivery" ? 10 : 0;
  const calc = bookingMath(
    item,
    values.startDate,
    values.endDate,
    5.5,
    deliveryFee,
  );

  const submitPayment = async (data: CheckoutData) => {
    if (submitting) return;
    setSubmitting(true);
    setFailure(null);
    try {
      await new Promise((resolve) => window.setTimeout(resolve, 900));
      if (data.cardNumber.replace(/\D/g, "").endsWith("0000"))
        throw new Error(
          "Ödəniş təsdiqlənmədi. Kart məlumatlarını yoxlayıb yenidən cəhd edin.",
        );
      if (demoMode) {
        addBooking({
          id: `RNT-${Date.now().toString().slice(-5)}`,
          listingId: item.id,
          start: data.startDate,
          end: data.endDate,
          total: calc.total,
          status: "confirmed",
          renter: `${data.firstName} ${data.lastName}`,
        });
      } else {
        await createBookingRequest(
          item.id,
          data.startDate,
          data.endDate,
          deliveryFee,
        );
      }
      setSuccess(true);
      notify("Ödəniş təsdiqləndi");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Ödəniş tamamlanmadı";
      setFailure(message);
      notify(message, "warn");
    } finally {
      setSubmitting(false);
    }
  };

  if (success)
    return (
      <main className="page max-w-2xl py-16">
        <div className="card-pad text-center">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald/10 text-emerald">
            <CheckCircle2 size={34} />
          </span>
          <p className="mt-5 text-sm font-semibold text-emerald">
            Ödəniş təsdiqləndi
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold">
            Bronunuz hazırdır
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-muted">
            {item.title} üçün {values.startDate}–{values.endDate} tarixlərində
            bron yaradıldı. Təhvil detalları bronlar bölməsindədir.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link to="/bookings" className="btn-primary">
              Bronlara bax
            </Link>
            <Link to="/explore" className="btn-secondary">
              Kataloqa qayıt
            </Link>
          </div>
        </div>
      </main>
    );

  return (
    <main className="page max-w-6xl">
      <SectionTitle
        eyebrow="Təhlükəsiz ödəniş"
        title="Ödənişi tamamlayın"
        copy="Məlumatları yoxlayın və bronu təsdiqləyin."
        action={
          demoMode ? (
            <span className="hidden rounded-md bg-white/[0.05] px-2 py-1 text-xs text-muted sm:inline">
              Test ödənişi
            </span>
          ) : undefined
        }
      />
      <form
        onSubmit={handleSubmit(submitPayment)}
        className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_380px]"
      >
        <div className="space-y-5">
          <CheckoutSection step={1} title="Şəxsi məlumatlar">
            <div className="grid gap-4 sm:grid-cols-2">
              <CheckoutField label="Ad" error={errors.firstName?.message}>
                <input
                  className="field"
                  placeholder="Akif"
                  autoComplete="given-name"
                  aria-invalid={!!errors.firstName}
                  {...register("firstName")}
                />
              </CheckoutField>
              <CheckoutField label="Soyad" error={errors.lastName?.message}>
                <input
                  className="field"
                  placeholder="Məmmədov"
                  autoComplete="family-name"
                  aria-invalid={!!errors.lastName}
                  {...register("lastName")}
                />
              </CheckoutField>
              <CheckoutField label="E-poçt" error={errors.email?.message}>
                <input
                  className="field"
                  type="email"
                  placeholder="ad@example.com"
                  autoComplete="email"
                  aria-invalid={!!errors.email}
                  {...register("email")}
                />
              </CheckoutField>
              <CheckoutField label="Telefon" error={errors.phone?.message}>
                <input
                  className="field"
                  type="tel"
                  placeholder="+994 50 123 45 67"
                  autoComplete="tel"
                  aria-invalid={!!errors.phone}
                  {...register("phone")}
                />
              </CheckoutField>
            </div>
          </CheckoutSection>

          <CheckoutSection step={2} title="İcarə detalları">
            <div className="grid gap-4 sm:grid-cols-2">
              <CheckoutField
                label="Başlanğıc tarixi"
                error={errors.startDate?.message}
              >
                <input
                  className="field"
                  type="date"
                  aria-invalid={!!errors.startDate}
                  {...register("startDate")}
                />
              </CheckoutField>
              <CheckoutField label="Son tarix" error={errors.endDate?.message}>
                <input
                  className="field"
                  type="date"
                  min={values.startDate}
                  aria-invalid={!!errors.endDate}
                  {...register("endDate")}
                />
              </CheckoutField>
              <div className="sm:col-span-2">
                <CheckoutField
                  label="Təhvil üsulu"
                  error={errors.delivery?.message}
                >
                  <select className="field" {...register("delivery")}>
                    <option value="renter_pickup">
                      Özüm götürəcəyəm — pulsuz
                    </option>
                    <option value="owner_delivery">
                      Ünvana çatdırılma — 10 ₼
                    </option>
                    <option value="meeting_point">
                      Görüş nöqtəsi — pulsuz
                    </option>
                  </select>
                </CheckoutField>
              </div>
            </div>
          </CheckoutSection>

          <CheckoutSection step={3} title="Kart məlumatları">
            <p className="mb-4 flex items-center gap-2 text-xs text-muted">
              <LockKeyhole size={14} /> Test rejimi: kart məlumatları saxlanmır
              və serverə göndərilmir.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <CheckoutField
                  label="Kart nömrəsi"
                  error={errors.cardNumber?.message}
                >
                  <input
                    className="field tabular"
                    inputMode="numeric"
                    placeholder="4242 4242 4242 4242"
                    autoComplete="cc-number"
                    maxLength={19}
                    aria-invalid={!!errors.cardNumber}
                    {...register("cardNumber")}
                    value={values.cardNumber}
                    onChange={(event) =>
                      setValue(
                        "cardNumber",
                        formatCardNumber(event.target.value),
                        { shouldValidate: true },
                      )
                    }
                  />
                </CheckoutField>
              </div>
              <CheckoutField
                label="Bitmə tarixi"
                error={errors.expiry?.message}
              >
                <input
                  className="field tabular"
                  inputMode="numeric"
                  placeholder="AA/İİ"
                  autoComplete="cc-exp"
                  maxLength={5}
                  aria-invalid={!!errors.expiry}
                  {...register("expiry")}
                  value={values.expiry}
                  onChange={(event) =>
                    setValue("expiry", formatExpiry(event.target.value), {
                      shouldValidate: true,
                    })
                  }
                />
              </CheckoutField>
              <CheckoutField label="CVV" error={errors.cvv?.message}>
                <input
                  className="field tabular"
                  inputMode="numeric"
                  placeholder="123"
                  autoComplete="cc-csc"
                  maxLength={4}
                  aria-invalid={!!errors.cvv}
                  {...register("cvv")}
                  onInput={(event) => {
                    event.currentTarget.value = event.currentTarget.value
                      .replace(/\D/g, "")
                      .slice(0, 4);
                  }}
                />
              </CheckoutField>
              <div className="sm:col-span-2">
                <CheckoutField
                  label="Kart sahibinin adı"
                  error={errors.cardholder?.message}
                >
                  <input
                    className="field uppercase"
                    placeholder="AKIF MAMMADOV"
                    autoComplete="cc-name"
                    aria-invalid={!!errors.cardholder}
                    {...register("cardholder")}
                  />
                </CheckoutField>
              </div>
            </div>
          </CheckoutSection>

          <CheckoutSection step={4} title="Hesab ünvanı">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <CheckoutField label="Ünvan" error={errors.address?.message}>
                  <input
                    className="field"
                    placeholder="Küçə, bina, mənzil"
                    autoComplete="street-address"
                    aria-invalid={!!errors.address}
                    {...register("address")}
                  />
                </CheckoutField>
              </div>
              <CheckoutField label="Şəhər" error={errors.city?.message}>
                <input
                  className="field"
                  autoComplete="address-level2"
                  aria-invalid={!!errors.city}
                  {...register("city")}
                />
              </CheckoutField>
              <CheckoutField
                label="Poçt indeksi"
                error={errors.postalCode?.message}
              >
                <input
                  className="field"
                  placeholder="AZ1000"
                  autoComplete="postal-code"
                  aria-invalid={!!errors.postalCode}
                  {...register("postalCode")}
                />
              </CheckoutField>
            </div>
          </CheckoutSection>

          <section className="section-card">
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 accent-[#0f766e]"
                {...register("accepted")}
              />
              <span className="text-sm leading-6 text-slate-300">
                <Link className="text-mint hover:underline" to="/terms">
                  İcarə müqaviləsi
                </Link>
                , ləğv qaydaları və qaytarılan depozit şərtlərini qəbul edirəm.
              </span>
            </label>
            {errors.accepted && (
              <span className="field-error" role="alert">
                {errors.accepted.message}
              </span>
            )}
          </section>
        </div>

        <aside className="card-pad h-fit lg:sticky lg:top-24">
          <div className="flex gap-4">
            <ProductImage
              className="h-20 w-24 shrink-0 rounded-lg object-cover"
              src={item.image}
              alt={item.title}
            />
            <div className="min-w-0">
              <p className="text-xs text-muted">Sifariş xülasəsi</p>
              <h2 className="listing-title mt-1 font-display font-semibold">
                {item.title}
              </h2>
              <p className="mt-1 text-xs text-muted">{item.location}</p>
            </div>
          </div>
          <div className="mt-5 rounded-lg bg-elevated p-4 text-sm">
            <div className="flex justify-between gap-3">
              <span className="text-muted">Tarixlər</span>
              <b className="text-right">
                {values.startDate}
                <br />
                {values.endDate}
              </b>
            </div>
            <div className="mt-3 flex justify-between">
              <span className="text-muted">Müddət</span>
              <b>{calc.days} gün</b>
            </div>
            <div className="mt-3 flex justify-between">
              <span className="text-muted">Günlük qiymət</span>
              <b>{money(item.price)}</b>
            </div>
          </div>
          <div className="my-5 space-y-3 border-y border-white/[0.07] py-5 text-sm">
            <MoneyRow name="İcarə məbləği" value={calc.rental} />
            <MoneyRow name="Xidmət haqqı" value={calc.fee} />
            {calc.delivery > 0 && (
              <MoneyRow name="Çatdırılma" value={calc.delivery} />
            )}
            <MoneyRow name="Qaytarılan depozit" value={calc.deposit} amber />
          </div>
          <div className="flex items-center justify-between">
            <b>Cəmi</b>
            <b className="tabular text-2xl text-emerald">{money(calc.total)}</b>
          </div>
          <p className="mt-3 rounded-lg bg-amber/5 p-3 text-xs leading-5 text-muted">
            <b className="text-amber">
              {money(calc.deposit)} depozit qaytarılır.
            </b>{" "}
            Əşya razılaşdırılmış vəziyyətdə təhvil verildikdən sonra geri ödəniş
            başladılır.
          </p>
          {failure && (
            <div
              role="alert"
              className="mt-4 rounded-lg border border-red-400/20 bg-red-400/5 p-3 text-sm text-red-300"
            >
              {failure}
            </div>
          )}
          <button
            type="submit"
            disabled={!isValid || submitting || calc.days === 0}
            className="btn-primary mt-5 w-full"
          >
            <LockKeyhole size={17} />{" "}
            {submitting ? "Təsdiqlənir..." : "Ödənişi təsdiqlə"}
          </button>
          <p className="mt-3 text-center text-[11px] text-muted">
            Təkrar göndəriş avtomatik bloklanır.
          </p>
        </aside>
      </form>
    </main>
  );
}

const authSchema = z.object({
  email: z.string().email("Düzgün e-poçt daxil edin"),
  password: z.string().min(8, "Minimum 8 simvol"),
});
type AuthData = z.infer<typeof authSchema>;
function AuthPage({
  mode,
  notify,
}: {
  mode: "login" | "register" | "forgot";
  notify: (s: string, tone?: "ok" | "warn") => void;
}) {
  const navigate = useNavigate();
  const { signIn, signUp, resetPassword } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const schema =
    mode === "forgot" ? z.object({ email: z.string().email() }) : authSchema;
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AuthData>({ resolver: zodResolver(schema as typeof authSchema) });
  const submit = async (values: AuthData) => {
    setSubmitting(true);
    try {
      if (demoMode) {
        notify(
          mode === "forgot"
            ? "Bərpa təlimatı demo olaraq göstərildi"
            : "Demo sessiya açıldı",
        );
        if (mode !== "forgot") navigate("/profile");
      } else if (mode === "login") {
        await signIn(values.email, values.password);
        notify("Hesaba uğurla daxil oldunuz");
        navigate("/profile");
      } else if (mode === "register") {
        await signUp(values.email, values.password);
        notify("Qeydiyyat tamamlandı. E-poçtunuzu təsdiqləyin.");
        navigate("/login");
      } else {
        await resetPassword(values.email);
        notify("Bərpa linki e-poçtunuza göndərildi");
      }
    } catch (error) {
      notify(
        error instanceof Error ? error.message : "Əməliyyat tamamlanmadı",
        "warn",
      );
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <main className="page flex min-h-[620px] items-center justify-center">
      <div className="card-pad w-full max-w-md">
        <span className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-xl bg-teal">
          <LockKeyhole />
        </span>
        <h1 className="text-center font-display text-2xl font-bold">
          {mode === "login"
            ? "Hesabınıza daxil olun"
            : mode === "register"
              ? "Yeni hesab yaradın"
              : "Şifrəni bərpa edin"}
        </h1>
        <p className="mt-2 text-center text-sm text-muted">
          {demoMode
            ? "Demo rejimi aktivdir. Real autentifikasiya üçün Supabase açarları tələb olunur."
            : "Supabase Auth aktivdir. Məlumatlar təhlükəsiz bağlantı ilə ötürülür."}
        </p>
        <form onSubmit={handleSubmit(submit)} className="mt-6 space-y-4">
          <label>
            <span className="label">E-poçt</span>
            <input
              className="field"
              type="email"
              autoComplete="email"
              {...register("email")}
            />
            {errors.email && (
              <span className="text-xs text-red-300">
                {errors.email.message}
              </span>
            )}
          </label>
          {mode !== "forgot" && (
            <label>
              <span className="label">Şifrə</span>
              <input
                className="field"
                type="password"
                autoComplete={
                  mode === "login" ? "current-password" : "new-password"
                }
                {...register("password")}
              />
              {errors.password && (
                <span className="text-xs text-red-300">
                  {errors.password.message}
                </span>
              )}
            </label>
          )}
          <button disabled={submitting} className="btn-primary w-full">
            {submitting
              ? "Yoxlanılır..."
              : mode === "login"
                ? "Daxil ol"
                : mode === "register"
                  ? "Qeydiyyatdan keç"
                  : "Bərpa linki al"}
          </button>
        </form>
        <div className="mt-5 flex justify-center gap-3 text-sm text-muted">
          {mode === "login" ? (
            <>
              <Link to="/forgot-password" className="text-mint">
                Şifrəni unutdum
              </Link>
              <span>•</span>
              <Link to="/register">Qeydiyyat</Link>
            </>
          ) : (
            <Link to="/login" className="text-mint">
              Giriş səhifəsinə qayıt
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}

const listingSchema = z.object({
  title: z.string().min(8),
  category: z.string().min(1),
  city: z.string().min(2),
  district: z.string().min(2),
  price: z.number().positive(),
  deposit: z.number().nonnegative(),
  deliveryFee: z.number().nonnegative(),
  description: z.string().min(30),
});
type ListingData = z.infer<typeof listingSchema>;
function ListingFormPage({
  notify,
  edit,
}: {
  notify: (s: string, tone?: "ok" | "warn") => void;
  edit?: boolean;
}) {
  const navigate = useNavigate();
  const { id } = useParams();
  const { listings: catalog, refresh, saveDemoListing } = useMarketplace();
  const existing = edit ? catalog.find((item) => item.id === id) : undefined;
  const [files, setFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ListingData>({
    resolver: zodResolver(listingSchema),
    defaultValues: {
      title: "",
      category: "",
      city: "Bakı",
      district: "Səbail",
      price: 20,
      deposit: 50,
      deliveryFee: 0,
      description: "",
    },
  });
  useEffect(() => {
    if (existing)
      reset({
        title: existing.title,
        category: existing.category,
        city: existing.location.split(",")[0]?.trim() || "Bakı",
        district: existing.location.split(",")[1]?.trim() || "Səbail",
        price: existing.price,
        deposit: existing.deposit,
        deliveryFee: 0,
        description: existing.description,
      });
  }, [existing, reset]);
  const submitListing = async (values: ListingData) => {
    setSaving(true);
    try {
      if (!demoMode) {
        if (edit && id) await updateListing(id, values);
        else await createListing(values, files);
        await refresh();
      } else {
        let image = existing?.image ?? "/fallback-product.svg";
        if (files[0]) {
          if (!["image/jpeg", "image/png", "image/webp"].includes(files[0].type) || files[0].size > 2 * 1024 * 1024)
            throw new Error("Demo üçün JPG, PNG və ya WebP şəkli maksimum 2 MB olmalıdır.");
          image = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result));
            reader.onerror = () => reject(new Error("Şəkil oxunmadı."));
            reader.readAsDataURL(files[0]);
          });
        }
        saveDemoListing({
          id: existing?.id ?? crypto.randomUUID(),
          status: "active",
          title: values.title,
          description: values.description,
          category: values.category,
          location: [values.city, values.district].filter(Boolean).join(", "),
          price: values.price,
          deposit: values.deposit,
          rating: existing?.rating ?? 0,
          reviews: existing?.reviews ?? 0,
          owner: "Mənim elanım",
          ownerId: "demo-owner",
          image,
          images: [image],
          popularity: existing?.popularity ?? 0,
          createdAt: existing?.createdAt ?? new Date().toISOString(),
          verified: false,
        });
      }
      notify(edit ? "Elan yeniləndi" : "Elan uğurla yerləşdirildi");
      navigate("/owner/listings");
    } catch (error) {
      notify(
        error instanceof Error ? error.message : "Elan saxlanmadı",
        "warn",
      );
    } finally {
      setSaving(false);
    }
  };
  return (
    <main className="page max-w-4xl">
      <SectionTitle
        eyebrow="Sahibkar alətləri"
        title={edit ? "Elanı redaktə edin" : "Yeni elan yaradın"}
        copy="Dəqiq məlumat daha çox etibar və uyğun bron deməkdir."
      />
      <form onSubmit={handleSubmit(submitListing)} className="space-y-5">
        <div className="card-pad grid gap-5 sm:grid-cols-2">
          <label className="sm:col-span-2">
            <span className="label">Elanın adı</span>
            <input className="field" {...register("title")} />
            {errors.title && (
              <span className="text-xs text-red-300">Minimum 8 simvol</span>
            )}
          </label>
          <label>
            <span className="label">Kateqoriya</span>
            <select className="field" {...register("category")}>
              <option value="">Seçin</option>
              {categories.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
            {errors.category && (
              <span className="text-xs text-red-300">Kateqoriya seçin</span>
            )}
          </label>
          <label>
            <span className="label">Şəhər</span>
            <input className="field" {...register("city")} />
            {errors.city && (
              <span className="text-xs text-red-300">Şəhəri daxil edin</span>
            )}
          </label>
          <label>
            <span className="label">Rayon</span>
            <input className="field" {...register("district")} />
            {errors.district && (
              <span className="text-xs text-red-300">Rayonu daxil edin</span>
            )}
          </label>
          <label>
            <span className="label">Günlük qiymət (AZN)</span>
            <input
              className="field"
              type="number"
              {...register("price", { valueAsNumber: true })}
            />
            {errors.price && (
              <span className="text-xs text-red-300">
                Qiymət sıfırdan böyük olmalıdır
              </span>
            )}
          </label>
          <label>
            <span className="label">Qaytarılan depozit (AZN)</span>
            <input
              className="field"
              type="number"
              {...register("deposit", { valueAsNumber: true })}
            />
            {errors.deposit && (
              <span className="text-xs text-red-300">
                Depozit mənfi ola bilməz
              </span>
            )}
          </label>
          <label>
            <span className="label">Çatdırılma haqqı (AZN)</span>
            <input
              className="field"
              type="number"
              {...register("deliveryFee", { valueAsNumber: true })}
            />
            {errors.deliveryFee && (
              <span className="text-xs text-red-300">
                Çatdırılma haqqı mənfi ola bilməz
              </span>
            )}
          </label>
          <label className="sm:col-span-2">
            <span className="label">Təsvir</span>
            <textarea
              rows={5}
              className="field py-3"
              {...register("description")}
            />
            {errors.description && (
              <span className="text-xs text-red-300">
                Ən azı 30 simvol yazın
              </span>
            )}
          </label>
        </div>
        <div className="card-pad">
          <h2 className="font-display font-bold">Şəkillər</h2>
          <label className="mt-4 flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-white/20 bg-elevated text-muted hover:border-mint">
            <ImagePlus />
            <span className="mt-2 text-sm">
              JPG, PNG və WebP • maksimum 8 MB
            </span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="sr-only"
              onChange={(event) =>
                setFiles(Array.from(event.target.files ?? []))
              }
            />
          </label>
          {files.length > 0 && (
            <p className="mt-3 text-sm text-emerald">
              {files.length} şəkil seçildi:{" "}
              {files.map((file) => file.name).join(", ")}
            </p>
          )}
        </div>
        <div className="flex justify-end gap-3">
          <Link to="/owner/listings" className="btn-secondary">
            Ləğv et
          </Link>
          <button disabled={saving} className="btn-primary">
            <Check size={18} />
            {saving
              ? "Saxlanılır..."
              : edit
                ? "Dəyişiklikləri saxla"
                : "Elanı yarat"}
          </button>
        </div>
      </form>
    </main>
  );
}

function ProfilePage({
  notify,
}: {
  notify: (s: string, tone?: "ok" | "warn") => void;
}) {
  const { user } = useAuth();
  const [form, setForm] = useState({
    full_name: "Aynur Qasımova",
    phone: "+994 50 000 00 00",
    city: "Bakı",
    bio: "",
  });
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (!demoMode)
      getMyProfile()
        .then((p) => {
          if (p)
            setForm({
              full_name: p.full_name || "",
              phone: p.phone || "",
              city: p.city || "",
              bio: p.bio || "",
            });
        })
        .catch((e) => notify(e.message, "warn"));
  }, []);
  const save = async () => {
    setSaving(true);
    try {
      if (!demoMode) await updateMyProfile(form);
      notify("Profil məlumatları saxlanıldı");
    } catch (error) {
      notify(
        error instanceof Error ? error.message : "Profil saxlanmadı",
        "warn",
      );
    } finally {
      setSaving(false);
    }
  };
  return (
    <DashboardLayout title="Profil və təhlükəsizlik">
      <div className="card-pad">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <span className="grid h-20 w-20 place-items-center rounded-2xl bg-teal text-3xl font-bold">
            {form.full_name[0] || "R"}
          </span>
          <div className="flex-1">
            <h2 className="font-display text-2xl font-bold">
              {form.full_name}
            </h2>
            <p className="text-muted">
              {user?.email || "demo@rentora.az"} • {form.city}, Azərbaycan
            </p>
            <span className="badge mt-2 bg-emerald/10 text-emerald">
              <CheckCircle2 size={13} />{" "}
              {user?.email_confirmed_at
                ? "E-poçt təsdiqlənib"
                : demoMode
                  ? "Demo profil"
                  : "E-poçt təsdiqi gözlənir"}
            </span>
          </div>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <label>
            <span className="label">Ad və soyad</span>
            <input
              className="field"
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            />
          </label>
          <label>
            <span className="label">Telefon</span>
            <input
              className="field"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </label>
          <label>
            <span className="label">Şəhər</span>
            <input
              className="field"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
            />
          </label>
          <label>
            <span className="label">Dil</span>
            <select className="field">
              <option>Azərbaycan dili</option>
              <option>English</option>
            </select>
          </label>
          <label className="sm:col-span-2">
            <span className="label">Haqqımda</span>
            <textarea
              rows={3}
              className="field py-3"
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
            />
          </label>
        </div>
        <button
          disabled={saving}
          className="btn-primary mt-5"
          onClick={() => void save()}
        >
          {saving ? "Saxlanılır..." : "Yadda saxla"}
        </button>
      </div>
      <div className="card-pad border-amber/20">
        <h2 className="font-display font-bold">Şəxsiyyət təsdiqi</h2>
        <p className="mt-2 text-sm text-muted">
          İnteqrasiya nöqtəsi hazırdır. Asan İmza və ya uyğun KYC provayderi
          konfiqurasiya edilmədən təsdiq iddiası edilmir.
        </p>
        <button
          className="btn-secondary mt-4"
          onClick={() => notify("KYC provayderi hələ qoşulmayıb")}
        >
          Təsdiqi başlat
        </button>
      </div>
    </DashboardLayout>
  );
}

function SimpleListings({
  title,
  ids,
  state,
  favorite,
}: {
  title: string;
  ids: string[];
  state: AppState;
  favorite: (s: string) => void;
}) {
  const { listings: catalog } = useMarketplace();
  const items = catalog.filter((x) => ids.includes(x.id));
  return (
    <main className="page">
      <SectionTitle title={title} copy={`${items.length} elan saxlanılıb`} />
      {items.length ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((x) => (
            <ListingCard
              key={x.id}
              item={x}
              favorite={state.favorites.includes(x.id)}
              onFavorite={() => favorite(x.id)}
            />
          ))}
        </div>
      ) : (
        <Empty
          icon={Heart}
          title="Hələ seçilmiş elan yoxdur"
          copy="Bəyəndiyiniz elanları ürək düyməsi ilə burada saxlayın."
        />
      )}
    </main>
  );
}

function BookingsPage({
  state,
  updateBooking,
  owner,
  notify,
}: {
  state: AppState;
  updateBooking: (id: string, s: BookingStatus) => void;
  owner: boolean;
  notify: (s: string, tone?: "ok" | "warn") => void;
}) {
  const { listings: catalog } = useMarketplace();
  const [rows, setRows] = useState(state.bookings);
  const [loading, setLoading] = useState(!demoMode);
  const [busyId, setBusyId] = useState<string | null>(null);
  useEffect(() => {
    if (demoMode) {
      setRows(state.bookings);
      return;
    }
    let active = true;
    setLoading(true);
    getMyBookings(owner)
      .then((data) => {
        if (!active) return;
        setRows(
          data.map((row) => {
            const raw = row as unknown as {
              id: string;
              listing_id: string;
              starts_on: string;
              ends_on: string;
              total_amount: number | string;
              status: string;
              renter: { full_name?: string } | null;
            };
            const statusMap: Record<string, BookingStatus> = {
              pending: "pending",
              request_submitted: "pending",
              awaiting_owner: "pending",
              accepted: "confirmed",
              awaiting_payment: "confirmed",
              payment_completed: "confirmed",
              handover_pending: "confirmed",
              handover_completed: "active",
              rental_active: "active",
              return_pending: "active",
              return_completed: "completed",
              deposit_refund_pending: "completed",
              deposit_refunded: "completed",
              completed: "completed",
              rejected: "rejected",
              cancelled: "cancelled",
              disputed: "disputed",
            };
            return {
              id: raw.id,
              listingId: raw.listing_id,
              start: raw.starts_on,
              end: raw.ends_on,
              total: Number(raw.total_amount),
              status: statusMap[raw.status] ?? "pending",
              renter: raw.renter?.full_name ?? "İcarəçi",
            };
          }),
        );
      })
      .catch((error) =>
        notify(
          error instanceof Error ? error.message : "Bronlar yüklənmədi",
          "warn",
        ),
      )
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [owner, state.bookings]);
  const changeStatus = async (
    bookingId: string,
    uiStatus: BookingStatus,
    serverStatus: string,
    success: string,
  ) => {
    setBusyId(bookingId);
    try {
      if (demoMode) updateBooking(bookingId, uiStatus);
      else await transitionBooking(bookingId, serverStatus);
      setRows((current) =>
        current.map((row) =>
          row.id === bookingId ? { ...row, status: uiStatus } : row,
        ),
      );
      notify(success);
    } catch (error) {
      notify(
        error instanceof Error ? error.message : "Bron yenilənmədi",
        "warn",
      );
    } finally {
      setBusyId(null);
    }
  };
  return (
    <DashboardLayout title={owner ? "Gələn bron sorğuları" : "Mənim bronlarım"}>
      {loading && (
        <p className="card-pad text-sm text-muted">Bronlar yüklənir...</p>
      )}
      {!loading && rows.length === 0 && (
        <Empty
          icon={CalendarDays}
          title="Hələ bron yoxdur"
          copy="Yeni bronlar burada görünəcək."
        />
      )}
      {!loading &&
        rows.map((b) => {
          const item = catalog.find((x) => x.id === b.listingId);
          if (!item) return null;
          return (
            <div
              className="card-pad flex flex-col gap-4 md:flex-row md:items-center"
              key={b.id}
            >
              <ProductImage
                src={item.image}
                alt={item.title}
                className="h-24 w-full rounded-xl object-cover md:w-36"
              />
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <b className="font-display">{item.title}</b>
                  <Status status={b.status} />
                </div>
                <p className="mt-1 text-sm text-muted">
                  {b.id} • {b.start} → {b.end} • {owner ? b.renter : item.owner}
                </p>
                <p className="mt-2 font-bold text-emerald">{money(b.total)}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {owner && b.status === "pending" && (
                  <>
                    <button
                      className="btn-primary"
                      disabled={busyId === b.id}
                      onClick={() =>
                        void changeStatus(
                          b.id,
                          "confirmed",
                          "accepted",
                          "Bron təsdiqləndi",
                        )
                      }
                    >
                      <Check size={17} />
                      Təsdiq
                    </button>
                    <button
                      className="btn-secondary"
                      disabled={busyId === b.id}
                      onClick={() =>
                        void changeStatus(
                          b.id,
                          "rejected",
                          "rejected",
                          "Bron rədd edildi",
                        )
                      }
                    >
                      <X size={17} />
                      Rədd et
                    </button>
                  </>
                )}
                {!owner && ["pending", "confirmed"].includes(b.status) && (
                  <button
                    className="btn-secondary"
                    disabled={busyId === b.id}
                    onClick={() =>
                      void changeStatus(
                        b.id,
                        "cancelled",
                        "cancelled",
                        "Bron ləğv edildi",
                      )
                    }
                  >
                    Ləğv et
                  </button>
                )}
                <Link className="btn-secondary" to={`/bookings/${b.id}`}>
                  Detallar
                </Link>
                <Link className="btn-secondary" to="/messages">
                  <MessageSquare size={17} />
                </Link>
              </div>
            </div>
          );
        })}
    </DashboardLayout>
  );
}

function Status({ status }: { status: BookingStatus }) {
  const map: Record<BookingStatus, [string, string]> = {
    pending: ["Gözləyir", "bg-amber/10 text-amber"],
    confirmed: ["Təsdiqlənib", "bg-mint/10 text-mint"],
    active: ["Aktiv", "bg-emerald/10 text-emerald"],
    completed: ["Tamamlanıb", "bg-emerald/10 text-emerald"],
    rejected: ["Rədd edilib", "bg-red-400/10 text-red-300"],
    cancelled: ["Ləğv edilib", "bg-slate-400/10 text-slate-300"],
    disputed: ["Mübahisədə", "bg-amber/10 text-amber"],
  };
  return <span className={cx("badge", map[status][1])}>{map[status][0]}</span>;
}

function DashboardLayout({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <main className="page">
      <div className="grid gap-6 lg:grid-cols-[230px_1fr]">
        <aside className="card-pad h-fit">
          <h2 className="mb-4 font-display font-bold">İdarəetmə</h2>
          <nav className="space-y-1">
            {[
              [LayoutDashboard, "Panel", "/owner"],
              [PackageCheck, "Elanlarım", "/owner/listings"],
              [CalendarDays, "Bronlar", "/bookings"],
              [WalletCards, "Gəlirlər", "/owner/earnings"],
              [MessageSquare, "Mesajlar", "/messages"],
              [User, "Profil", "/profile"],
            ].map(([I, n, p]) => {
              const Icon = I as typeof Home;
              return (
                <NavLink
                  key={p as string}
                  to={p as string}
                  className={({ isActive }) =>
                    cx(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm",
                      isActive
                        ? "bg-teal text-white"
                        : "text-muted hover:bg-elevated hover:text-text",
                    )
                  }
                >
                  <Icon size={17} />
                  {n as string}
                </NavLink>
              );
            })}
          </nav>
        </aside>
        <section>
          <SectionTitle title={title} />
          <div className="space-y-5">{children}</div>
        </section>
      </div>
    </main>
  );
}

function OwnerDashboard({ state }: { state: AppState }) {
  return (
    <DashboardLayout title="Sahibkar paneli">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Aktiv elanlar", "4", "text-mint"],
          [
            "Gözləyən bronlar",
            String(state.bookings.filter((x) => x.status === "pending").length),
            "text-amber",
          ],
          ["Bu ay gəlir", "642.50 ₼", "text-emerald"],
          ["Orta reytinq", "4.92", "text-amber"],
        ].map(([a, b, c]) => (
          <div className="card-pad" key={a}>
            <p className="text-sm text-muted">{a}</p>
            <b className={cx("mt-2 block font-display text-2xl", c)}>{b}</b>
          </div>
        ))}
      </div>
      <div className="card-pad">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-bold">Son fəaliyyət</h2>
          <Link to="/listings/new" className="btn-primary">
            <Plus size={17} />
            Yeni elan
          </Link>
        </div>
        <div className="mt-5 divide-y divide-white/[0.06]">
          {state.bookings.map((b) => (
            <div
              className="flex items-center justify-between gap-3 py-4"
              key={b.id}
            >
              <div>
                <b className="text-sm">
                  {listings.find((x) => x.id === b.listingId)?.title}
                </b>
                <p className="text-xs text-muted">
                  {b.id} • {b.renter}
                </p>
              </div>
              <Status status={b.status} />
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}

function MyListings() {
  const { myListings, loading, error } = useMarketplace();
  return (
    <DashboardLayout title="Elanlarım">
      <div className="flex justify-end">
        <Link to="/listings/new" className="btn-primary">
          <Plus size={17} />
          Yeni elan
        </Link>
      </div>
      {loading && <p className="text-muted">Elanlar yüklənir...</p>}
      {error && <p className="text-red-300">{error}</p>}
      {!loading && !error && myListings.length === 0 && (
        <p className="text-muted">Hələ elan yerləşdirməmisiniz.</p>
      )}
      {myListings.map((x) => (
        <div
          className="card-pad flex flex-col gap-4 sm:flex-row sm:items-center"
          key={x.id}
        >
          <img
            src={x.image}
            className="h-24 w-full rounded-xl object-cover sm:w-36"
            alt=""
          />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <b>{x.title}</b>
              <span
                className={cx(
                  "badge",
                  x.status && x.status !== "active"
                    ? "bg-amber/10 text-amber"
                    : "bg-emerald/10 text-emerald",
                )}
              >
                {x.status === "draft" ? "qaralama" : x.status === "paused" ? "dayandırılıb" : "aktiv"}
              </span>
            </div>
            <p className="mt-1 text-sm text-muted">
              {money(x.price)} / gün • {x.reviews} rəy
            </p>
          </div>
          <Link className="btn-secondary" to={`/listings/${x.id}/edit`}>
            Redaktə
          </Link>
        </div>
      ))}
    </DashboardLayout>
  );
}

function EarningsPage() {
  const tx = [
    ["TRX-82914", "Sony Alpha A7 IV", "+ 85.05 ₼", "Tamamlanıb"],
    ["TRX-82801", "Apple iMac", "+ 113.70 ₼", "Payout gözləyir"],
    ["TRX-82744", "Platforma komissiyası", "- 6.60 ₼", "Tutulub"],
  ];
  return (
    <DashboardLayout title="Gəlirlər və tranzaksiyalar">
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          ["Mövcud balans", "642.50 ₼"],
          ["Gözləyən payout", "113.70 ₼"],
          ["Qaytarılan depozitlər", "0.00 ₼"],
        ].map(([a, b]) => (
          <div className="card-pad" key={a}>
            <p className="text-sm text-muted">{a}</p>
            <b className="mt-2 block text-2xl text-emerald">{b}</b>
          </div>
        ))}
      </div>
      <div className="card overflow-hidden">
        <div className="p-5">
          <h2 className="font-display font-bold">Tranzaksiya tarixçəsi</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] text-left text-sm">
            <thead className="bg-elevated text-muted">
              <tr>
                {["ID", "Təsvir", "Məbləğ", "Status"].map((x) => (
                  <th className="px-5 py-3" key={x}>
                    {x}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tx.map((r) => (
                <tr className="border-t border-white/[0.06]" key={r[0]}>
                  {r.map((c, i) => (
                    <td
                      className={cx(
                        "px-5 py-4",
                        i === 2 && "font-bold text-emerald",
                      )}
                      key={c}
                    >
                      {c}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <p className="card-pad text-sm text-muted">
        <CircleDollarSign className="mr-2 inline text-amber" />
        Qaytarılan depozit platforma gəliri hesablanmır. Payout provayderi
        production üçün ayrıca qoşulmalıdır.
      </p>
    </DashboardLayout>
  );
}

function MessagesPage({
  notify,
}: {
  notify: (s: string, tone?: "ok" | "warn") => void;
}) {
  const { conversationId } = useParams();
  const { user } = useAuth();
  const [messages, setMessages] = useState<
    Array<{
      id: string;
      body: string;
      sender_id?: string;
      created_at?: string;
      attachment_path?: string | null;
    }>
  >([
    {
      id: "demo-1",
      body: "Salam! Kamera 15–18 noyabr tarixlərində mövcuddur.",
      sender_id: "owner",
    },
    {
      id: "demo-2",
      body: "Əla, götürmə saatını 10:00 seçmək istəyirəm.",
      sender_id: "demo-user",
    },
  ]);
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (demoMode || !conversationId) return;
    let active = true;
    setLoading(true);
    getConversationMessages(conversationId)
      .then((rows) => {
        if (active) setMessages(rows);
      })
      .catch((e) => notify(e.message, "warn"))
      .finally(() => setLoading(false));
    const channel = subscribeToConversation(conversationId, (message) =>
      setMessages((current) =>
        current.some((x) => x.id === message.id)
          ? current
          : [...current, message as (typeof current)[number]],
      ),
    );
    return () => {
      active = false;
      void unsubscribe(channel);
    };
  }, [conversationId]);
  const send = async () => {
    if (!value.trim()) return;
    const body = value.trim();
    setValue("");
    try {
      if (demoMode || !conversationId) {
        setMessages((m) => [
          ...m,
          {
            id: crypto.randomUUID(),
            body,
            sender_id: "demo-user",
            created_at: new Date().toISOString(),
          },
        ]);
      } else await sendConversationMessage(conversationId, body);
      notify("Mesaj göndərildi");
    } catch (error) {
      setValue(body);
      notify(
        error instanceof Error ? error.message : "Mesaj göndərilmədi",
        "warn",
      );
    }
  };
  const attach = async (file?: File) => {
    if (!file) return;
    try {
      if (demoMode || !conversationId)
        setMessages((m) => [
          ...m,
          {
            id: crypto.randomUUID(),
            body: `Qoşma: ${file.name}`,
            sender_id: "demo-user",
          },
        ]);
      else await uploadConversationAttachment(conversationId, file);
      notify("Qoşma göndərildi");
    } catch (error) {
      notify(
        error instanceof Error ? error.message : "Qoşma göndərilmədi",
        "warn",
      );
    }
  };
  return (
    <main className="page">
      <SectionTitle
        title="Mesajlar"
        copy={
          demoMode
            ? "Demo yazışmaları lokal saxlanılır. Supabase qoşulduqda Realtime aktivləşir."
            : "Şəxsi yazışmalar Supabase Realtime ilə yenilənir."
        }
      />
      <div className="card grid min-h-[600px] overflow-hidden md:grid-cols-[300px_1fr]">
        <aside className="border-r border-white/[0.07] p-3">
          <div className="rounded-xl bg-elevated p-3">
            <b>Rəşad Məmmədov</b>
            <p className="mt-1 truncate text-sm text-muted">
              Sony Alpha A7 IV • indi
            </p>
          </div>
          {["OfficePro", "Nicat Əliyev"].map((n) => (
            <div
              className="mt-2 rounded-xl p-3 text-muted hover:bg-elevated"
              key={n}
            >
              {n}
            </div>
          ))}
        </aside>
        <section className="flex flex-col">
          <header className="border-b border-white/[0.07] p-4">
            <b>Rəşad Məmmədov</b>
            <p className="text-xs text-emerald">● iştirakçı</p>
          </header>
          <div className="flex-1 space-y-3 p-4">
            {loading ? (
              <p className="text-sm text-muted">Mesajlar yüklənir...</p>
            ) : (
              messages.map((m, i) => {
                const mine = demoMode ? i % 2 === 1 : m.sender_id === user?.id;
                return (
                  <div
                    key={m.id}
                    className={cx(
                      "max-w-[75%] rounded-xl px-4 py-3 text-sm",
                      mine
                        ? "ml-auto bg-teal text-white"
                        : "bg-elevated text-text",
                    )}
                  >
                    <p>{m.body}</p>
                    {m.created_at && (
                      <time className="mt-1 block text-[10px] opacity-70">
                        {new Date(m.created_at).toLocaleString("az-AZ")}
                      </time>
                    )}
                  </div>
                );
              })
            )}
          </div>
          <div className="flex gap-2 border-t border-white/[0.07] p-4">
            <label
              className="btn-secondary cursor-pointer px-3"
              aria-label="Fayl əlavə et"
            >
              <ImagePlus size={18} />
              <input
                type="file"
                className="sr-only"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                onChange={(e) => {
                  void attach(e.target.files?.[0]);
                  e.currentTarget.value = "";
                }}
              />
            </label>
            <input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void send()}
              className="field"
              placeholder="Mesaj yazın..."
            />
            <button
              onClick={() => void send()}
              className="btn-primary"
              aria-label="Göndər"
            >
              <Send size={18} />
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}

function NotificationsPage({ clear }: { clear: () => void }) {
  const items = [
    ["Bron sorğunuz təsdiqləndi", "Apple iMac • 12–14 noyabr", "2 dəq"],
    ["Yeni mesaj", "Rəşad Məmmədov sizə yazdı", "18 dəq"],
    ["Təhvil xatırlatması", "Sabah saat 10:00 • Nizami küçəsi 142", "1 saat"],
  ];
  return (
    <main className="page max-w-4xl">
      <SectionTitle
        title="Bildirişlər"
        action={
          <button className="text-sm text-mint" onClick={clear}>
            Hamısını oxunmuş et
          </button>
        }
      />
      <div className="card divide-y divide-white/[0.06]">
        {items.map(([a, b, c], i) => (
          <div className="flex gap-4 p-5" key={a}>
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-teal/15 text-mint">
              <Bell size={18} />
            </span>
            <div className="flex-1">
              <b>{a}</b>
              <p className="text-sm text-muted">{b}</p>
            </div>
            <span className="text-xs text-muted">{c}</span>
            {i < 2 && <span className="mt-2 h-2 w-2 rounded-full bg-emerald" />}
          </div>
        ))}
      </div>
    </main>
  );
}

function PassportPage() {
  return (
    <main className="page max-w-5xl">
      <SectionTitle
        eyebrow="Rentora Item Passport™"
        title="Aktivin rəqəmsal tarixçəsi"
        copy="Təhvil, texniki audit və vəziyyət qeydləri dəyişiklik jurnalında birləşdirilir."
      />
      <div className="grid gap-6 md:grid-cols-[1fr_320px]">
        <div className="card-pad">
          <div className="flex items-center gap-4">
            <span className="grid h-16 w-16 place-items-center rounded-2xl bg-teal/20 text-mint">
              <FileBadge size={32} />
            </span>
            <div>
              <h2 className="font-display text-xl font-bold">
                Sony Alpha A7 IV
              </h2>
              <p className="text-sm text-muted">
                Passport ID: REN-AZ-4491 • Seriya: 3849102-AZ
              </p>
            </div>
          </div>
          <div className="mt-7 space-y-0">
            {[
              [
                "05 noyabr 2026",
                "Laboratoriya auditi",
                "Optika 10/10 • Sensor təmiz",
              ],
              [
                "22 oktyabr 2026",
                "İcarədən qaytarılıb",
                "Sahib və icarəçi təsdiqi",
              ],
              [
                "19 oktyabr 2026",
                "Təhvil verilib",
                "Foto sübutlar əlavə edilib",
              ],
              [
                "02 sentyabr 2026",
                "Passport yaradılıb",
                "Seriya nömrəsi yoxlanıb",
              ],
            ].map((r, i) => (
              <div className="grid grid-cols-[18px_1fr] gap-4" key={r[0]}>
                <div className="flex flex-col items-center">
                  <span className="mt-1 h-3 w-3 rounded-full bg-emerald" />
                  {i < 3 && <span className="h-full w-px bg-line" />}
                </div>
                <div className="pb-7">
                  <p className="text-xs text-mint">{r[0]}</p>
                  <b>{r[1]}</b>
                  <p className="text-sm text-muted">{r[2]}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <aside className="space-y-4">
          <div className="card-pad">
            <p className="text-sm text-muted">Cari vəziyyət</p>
            <b className="mt-2 block text-2xl text-emerald">Əla</b>
            <p className="mt-2 text-sm text-muted">
              Son auditdən sonra yeni zədə qeydə alınmayıb.
            </p>
          </div>
          <div className="card-pad">
            <p className="text-sm text-muted">Audit heşi</p>
            <code className="mt-2 block break-all rounded-lg bg-ink p-3 text-xs text-mint">
              SHA256:A7IV-9402-E7BA-33D1
            </code>
            <p className="mt-3 text-xs text-muted">
              Bu demo heş real blokçeyn və ya dövlət reyestri təsdiqi deyil.
            </p>
          </div>
        </aside>
      </div>
    </main>
  );
}

function ReviewsPage({ notify }: { notify: (s: string) => void }) {
  return (
    <main className="page max-w-4xl">
      <SectionTitle
        title="Rəylər və reytinqlər"
        copy="Yalnız tamamlanmış icarələrdən sonra rəy yazmaq mümkündür."
      />
      <div className="grid gap-6 md:grid-cols-[1fr_300px]">
        <div className="space-y-4">
          {[
            [
              "Aysel Məmmədli",
              "5.0",
              "Avadanlıq tam təsvir edildiyi kimi idi. Təhvil prosesi çox rahat keçdi.",
            ],
            [
              "Murad Əliyev",
              "4.8",
              "Sahib tez cavab verdi, dəst tam və səliqəli idi.",
            ],
          ].map((r) => (
            <article className="card-pad" key={r[0]}>
              <div className="flex justify-between">
                <b>{r[0]}</b>
                <span className="text-amber">
                  <Star size={15} className="inline" fill="currentColor" />{" "}
                  {r[1]}
                </span>
              </div>
              <p className="mt-3 text-sm text-muted">{r[2]}</p>
            </article>
          ))}
        </div>
        <aside className="card-pad">
          <h2 className="font-display font-bold">Rəy yazın</h2>
          <select className="field mt-4">
            <option>Sony Alpha A7 IV</option>
          </select>
          <div className="my-4 flex gap-1 text-amber">
            {[1, 2, 3, 4, 5].map((x) => (
              <button key={x} aria-label={`${x} ulduz`}>
                <Star fill="currentColor" />
              </button>
            ))}
          </div>
          <textarea
            className="field py-3"
            rows={4}
            placeholder="Təcrübənizi paylaşın..."
          />
          <button
            onClick={() => notify("Rəy dərc edildi")}
            className="btn-primary mt-3 w-full"
          >
            Rəyi dərc et
          </button>
        </aside>
      </div>
    </main>
  );
}

function HelpPage() {
  return (
    <main className="page">
      <SectionTitle
        eyebrow="Dəstək mərkəzi"
        title="Sizə necə kömək edə bilərik?"
        copy="İcarə prosesinin hər mərhələsi üçün aydın bələdçilər."
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Bron və ödəniş", "Qiymət, depozit və ləğv"],
          ["Təhvil və qaytarma", "Foto sübut və təsdiq"],
          ["Hesab təhlükəsizliyi", "Profil və giriş"],
          ["Mübahisə dəstəyi", "Sübut və eskalasiya"],
        ].map(([a, b]) => (
          <Link to="/faq" className="card-pad hover:border-teal" key={a}>
            <HelpCircle className="text-mint" />
            <h2 className="mt-4 font-display font-bold">{a}</h2>
            <p className="mt-1 text-sm text-muted">{b}</p>
          </Link>
        ))}
      </div>
      <div className="card-pad mt-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="font-display text-xl font-bold">
            Cavab tapa bilmədiniz?
          </h2>
          <p className="text-muted">Dəstək komandası üçün müraciət yaradın.</p>
        </div>
        <Link to="/messages" className="btn-primary">
          <LifeBuoy size={18} />
          Dəstəyə yaz
        </Link>
      </div>
    </main>
  );
}

function FaqPage() {
  const [open, setOpen] = useState(0);
  const qa = [
    [
      "Depozit necə işləyir?",
      "Depozit ayrıca göstərilir və gəlir hesab edilmir. Production ödəniş axınında bloklama və qaytarma provayder imkanlarına uyğun icra edilməlidir.",
    ],
    [
      "Bronu necə ləğv edə bilərəm?",
      "Mənim bronlarım bölməsindən aktiv bronu seçib ləğv edə bilərsiniz. Qaytarılma məbləği seçilmiş siyasətə əsasən hesablanır.",
    ],
    [
      "Elanı kim yayımlaya bilər?",
      "Təsdiqlənmiş profilə sahib olan istifadəçilər sahibkar rejimindən elan yarada bilər.",
    ],
    [
      "Mübahisə zamanı nə etməliyəm?",
      "Təhvil fotoşəkilləri, yazışma və müqavilə məlumatları ilə dəstək müraciəti yaradın.",
    ],
  ];
  return (
    <main className="page max-w-4xl">
      <SectionTitle title="Tez-tez verilən suallar" />
      {qa.map((q, i) => (
        <div className="card mb-3" key={q[0]}>
          <button
            onClick={() => setOpen(open === i ? -1 : i)}
            className="flex w-full items-center justify-between p-5 text-left font-semibold"
          >
            {q[0]}
            <ChevronDown
              className={cx("transition", open === i && "rotate-180")}
            />
          </button>
          {open === i && <p className="px-5 pb-5 text-muted">{q[1]}</p>}
        </div>
      ))}
    </main>
  );
}

function LegalPage({ type }: { type: "terms" | "privacy" }) {
  const terms = type === "terms";
  return (
    <main className="page max-w-4xl">
      <SectionTitle
        eyebrow="Hüquqi sənəd"
        title={terms ? "İstifadə və icarə şərtləri" : "Məxfilik siyasəti"}
        copy="Son yenilənmə: 7 noyabr 2026"
      />
      <div className="card-pad space-y-7 leading-7 text-muted">
        <div className="rounded-xl border border-amber/20 bg-amber/10 p-4 text-sm text-amber">
          <b>Hüquqi baxış tələb olunur.</b> Bu mətn məhsul strukturu üçün
          hazırlanmış işçi layihədir və Azərbaycanda fəaliyyətə başlamazdan
          əvvəl yerli hüquqşünas tərəfindən yoxlanılmalıdır.
        </div>
        {(terms
          ? [
              [
                "1. Platformanın rolu",
                "RENTORA istifadəçiləri əlaqələndirən texnologiya platformasıdır. Platforma ayrıca yazılı razılaşma olmadan aktivin sahibi, sığortaçısı və ya escrow xidməti kimi çıxış etmir.",
              ],
              [
                "2. Bron və müqavilə",
                "İcarə müddəti, qiymət, depozit, təhvil yeri və ləğv şərtləri bron təsdiqlənməzdən əvvəl ayrıca göstərilir.",
              ],
              [
                "3. Depozit və ödəniş",
                "Qaytarılan depozit platforma gəliri deyil. Faktiki bloklama, geri qaytarma və payout ödəniş provayderinin texniki və hüquqi imkanlarına tabedir.",
              ],
              [
                "4. Ləğv və mübahisə",
                "Ləğv məbləği bron zamanı qəbul edilmiş siyasətə əsasən hesablanır. Mübahisədə tərəflər təhvil qeydləri və yazışmaları təqdim edir.",
              ],
            ]
          : [
              [
                "1. Toplanan məlumatlar",
                "Hesab, əlaqə, bron, ödəniş statusu və təhlükəsizlik məlumatları xidmətin göstərilməsi üçün işlənir. Raw kart nömrəsi və CVV RENTORA sistemində saxlanmır.",
              ],
              [
                "2. İstifadə məqsədi",
                "Məlumatlar autentifikasiya, bronların icrası, fırıldaqçılığın qarşısı, dəstək və qanuni öhdəliklər üçün işlənir.",
              ],
              [
                "3. Saxlama və paylaşma",
                "Məlumat yalnız zəruri müddətə saxlanır və ödəniş, identifikasiya və infrastruktur provayderləri ilə minimum həcmdə paylaşılır.",
              ],
              [
                "4. Hüquqlarınız",
                "Tətbiq olunan qanun çərçivəsində məlumatınıza çıxış, düzəliş və silinmə tələb edə bilərsiniz.",
              ],
            ]
        ).map(([a, b]) => (
          <section key={a}>
            <h2 className="font-display text-xl font-bold text-text">{a}</h2>
            <p className="mt-2">{b}</p>
          </section>
        ))}
      </div>
    </main>
  );
}

function AdminPage() {
  return (
    <main className="page">
      <SectionTitle
        eyebrow="Admin"
        title="Platforma nəzarət mərkəzi"
        copy="Rol və əməliyyat icazələri production-da server və RLS siyasətləri ilə yoxlanmalıdır."
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["İstifadəçilər", "1,842", Users],
          ["Aktiv elanlar", "1,204", Store],
          ["Aktiv bronlar", "286", CalendarDays],
          ["Açıq mübahisələr", "7", HelpCircle],
        ].map(([a, b, I]) => {
          const Icon = I as typeof Users;
          return (
            <div className="card-pad" key={a as string}>
              <Icon className="text-mint" />
              <p className="mt-4 text-sm text-muted">{a as string}</p>
              <b className="text-2xl">{b as string}</b>
            </div>
          );
        })}
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="card-pad">
          <h2 className="font-display text-xl font-bold">Moderasiya növbəsi</h2>
          {[
            "DJI Mavic 3 Pro — sənəd yoxlaması",
            "BMW i4 — sığorta təsdiqi",
            "Event Hall Kit — şəkil şikayəti",
          ].map((x, i) => (
            <div
              className="mt-4 flex items-center justify-between gap-3 rounded-xl bg-elevated p-3"
              key={x}
            >
              <span className="text-sm">{x}</span>
              <button className="text-xs text-mint">Yoxla</button>
            </div>
          ))}
        </div>
        <div className="card-pad">
          <h2 className="font-display text-xl font-bold">
            Platforma parametrləri
          </h2>
          <label className="mt-4 block">
            <span className="label">Komissiya faizi</span>
            <div className="flex gap-2">
              <input className="field" type="number" defaultValue="5.5" />
              <button className="btn-primary">Saxla</button>
            </div>
          </label>
          <p className="mt-4 text-sm text-muted">
            Komissiya dəyişikliyi yalnız yeni bronlara tətbiq olunmalıdır və
            audit jurnalına yazılmalıdır.
          </p>
        </div>
      </div>
    </main>
  );
}

function BookingDetailPage({
  state,
  updateBooking,
  notify,
}: {
  state: AppState;
  updateBooking: (id: string, s: BookingStatus) => void;
  notify: (s: string) => void;
}) {
  const { id } = useParams();
  const booking = state.bookings.find((x) => x.id === id);
  const [delivery, setDelivery] = useState("renter_pickup");
  if (!booking) return <NotFound />;
  const item = listings.find((x) => x.id === booking.listingId)!;
  const steps = [
    ["Sorğu yaradıldı", true],
    ["Sahib təsdiqi", booking.status !== "pending"],
    ["Ödəniş", !["pending", "rejected", "cancelled"].includes(booking.status)],
    ["Təhvil", booking.status === "active" || booking.status === "completed"],
    ["Qaytarma", booking.status === "completed"],
  ];
  return (
    <main className="page max-w-6xl">
      <SectionTitle
        eyebrow={booking.id}
        title="Bron detalları"
        copy={`${item.title} • ${booking.start} → ${booking.end}`}
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-5">
          <div className="card-pad">
            <h2 className="font-display text-xl font-bold">Status tarixçəsi</h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-5">
              {steps.map(([label, done], i) => (
                <div className="text-center" key={label as string}>
                  <span
                    className={cx(
                      "mx-auto grid h-9 w-9 place-items-center rounded-full",
                      done ? "bg-emerald text-ink" : "bg-elevated text-muted",
                    )}
                  >
                    {done ? <Check size={17} /> : i + 1}
                  </span>
                  <p className="mt-2 text-xs text-muted">{label as string}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="card-pad">
            <h2 className="font-display text-xl font-bold">Təhvil üsulu</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {[
                ["owner_delivery", "Sahib çatdırır"],
                ["renter_pickup", "İcarəçi götürür"],
                ["meeting_point", "Görüş nöqtəsi"],
              ].map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => setDelivery(value)}
                  className={cx(
                    "rounded-xl border p-4 text-left text-sm",
                    delivery === value
                      ? "border-mint bg-teal/10 text-mint"
                      : "border-white/10 bg-elevated text-muted",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
            <label className="mt-4 block">
              <span className="label">Ünvan / görüş qeydi</span>
              <textarea
                className="field py-3"
                rows={3}
                defaultValue="Nizami küçəsi 142, saat 10:00"
              />
            </label>
            <button
              className="btn-primary mt-3"
              onClick={() => notify("Təhvil məlumatı saxlanıldı")}
            >
              Təhvili yadda saxla
            </button>
          </div>
          <div className="card-pad">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-xl font-bold">
                  Item Passport sübutları
                </h2>
                <p className="text-sm text-muted">
                  Təhvil və qaytarma üçün foto, checklist və qarşılıqlı təsdiq.
                </p>
              </div>
              <FileBadge className="text-mint" />
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="rounded-xl border border-dashed border-white/20 p-5 text-center text-sm text-muted">
                <ImagePlus className="mx-auto mb-2" />
                Təhvil fotolarını əlavə et
                <input
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                />
              </label>
              <label className="rounded-xl border border-dashed border-white/20 p-5 text-center text-sm text-muted">
                <ImagePlus className="mx-auto mb-2" />
                Qaytarma fotolarını əlavə et
                <input
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                />
              </label>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={() => notify("Təhvil təsdiqi qeydə alındı")}
                className="btn-secondary"
              >
                Təhvili təsdiqlə
              </button>
              <button
                onClick={() => notify("Qaytarma təsdiqi qeydə alındı")}
                className="btn-secondary"
              >
                Qaytarmanı təsdiqlə
              </button>
              <button
                onClick={() => {
                  updateBooking(booking.id, "disputed");
                  notify("Mübahisə açıldı");
                }}
                className="btn-secondary border-amber/30 text-amber"
              >
                Mübahisə aç
              </button>
            </div>
          </div>
        </div>
        <aside className="space-y-5">
          <div className="card-pad">
            <img
              src={item.image}
              className="aspect-[16/10] w-full rounded-xl object-cover"
              alt={item.title}
            />
            <h2 className="mt-4 font-display font-bold">{item.title}</h2>
            <div className="mt-3">
              <Status status={booking.status} />
            </div>
            <div className="mt-5 space-y-3 border-t border-white/10 pt-4 text-sm">
              <MoneyRow name="Yekun autorizasiya" value={booking.total} />
              <MoneyRow name="Qaytarılan depozit" value={item.deposit} amber />
            </div>
          </div>
          <div className="card-pad">
            <h2 className="font-display font-bold">Razılaşma</h2>
            <p className="mt-2 text-sm text-muted">
              Tarix, qiymət və təhvil şərtlərinin versiyalı qeydi. Təsdiqdən
              sonra dəyişiklik yeni qarşı-təklif kimi saxlanmalıdır.
            </p>
            <button
              className="btn-secondary mt-4 w-full"
              onClick={() => notify("Razılaşma təsdiqləndi")}
            >
              Şərtləri təsdiqlə
            </button>
          </div>
        </aside>
      </div>
    </main>
  );
}

function PolicyPage({
  type,
}: {
  type: "cancellation" | "deposit" | "prohibited";
}) {
  const content = {
    cancellation: {
      title: "Ləğv və geri ödəniş siyasəti",
      items: [
        [
          "İcarəçi ləğvi",
          "Geri ödəniş bron zamanı qəbul edilmiş zaman pəncərəsi və sahibin hazırlıq xərclərinə əsasən hesablanır.",
        ],
        [
          "Sahib ləğvi",
          "Sahibin ləğvi zamanı tutulmuş məbləğ provayder təsdiqindən sonra geri qaytarılmalıdır.",
        ],
        [
          "Uğursuz ödəniş",
          "Server webhook-u ödənişi təsdiqləməyibsə bron ödənilmiş sayılmır.",
        ],
      ],
    },
    deposit: {
      title: "Depozit və mübahisə siyasəti",
      items: [
        [
          "Depozitin statusu",
          "Qaytarılan depozit platforma gəliri deyil və ayrıca maliyyə qeydi kimi saxlanır.",
        ],
        [
          "Zərər iddiası",
          "Sahibin tək iddiası depozitin tutulması üçün kifayət deyil; foto sübutlar və hər iki tərəfin cavabı nəzərdən keçirilir.",
        ],
        [
          "Mübahisə",
          "İş admin araşdırmasına yönləndirilir və bütün qərarlar audit jurnalında saxlanır.",
        ],
      ],
    },
    prohibited: {
      title: "Qadağan olunmuş əşyalar",
      items: [
        [
          "Qanunsuz məhsullar",
          "Qanunla qadağan edilən, oğurlanmış və ya mənşəyi sübut edilməyən məhsullar yerləşdirilə bilməz.",
        ],
        [
          "Təhlükəli maddələr",
          "Silah, partlayıcı, toksik maddə və təhlükəli kimyəvilər qadağandır.",
        ],
        [
          "Şəxsi və rəqəmsal məlumat",
          "Şəxsiyyət sənədləri, hesablar, giriş məlumatları və şəxsi məlumat daşıyan aktivlər icarəyə verilə bilməz.",
        ],
      ],
    },
  }[type];
  return (
    <main className="page max-w-4xl">
      <SectionTitle eyebrow="Etibar və təhlükəsizlik" title={content.title} />
      <div className="card-pad space-y-6">
        <div className="rounded-xl border border-amber/20 bg-amber/10 p-4 text-sm text-amber">
          Bu sənəd hüquqi layihədir və istifadəyə verilməzdən əvvəl Azərbaycan
          hüquqşünası tərəfindən yoxlanmalıdır.
        </div>
        {content.items.map(([title, body]) => (
          <section key={title}>
            <h2 className="font-display text-lg font-bold">{title}</h2>
            <p className="mt-2 text-muted">{body}</p>
          </section>
        ))}
      </div>
    </main>
  );
}

function AdminSectionPage() {
  const { section } = useParams();
  const configs: Record<
    string,
    { title: string; columns: string[]; rows: string[][] }
  > = {
    users: {
      title: "İstifadəçi idarəetməsi",
      columns: ["İstifadəçi", "Rollar", "Status"],
      rows: [
        ["Aynur Qasımova", "İcarəçi, Sahibkar", "Aktiv"],
        ["Rəşad Məmmədov", "Sahibkar", "Aktiv"],
      ],
    },
    listings: {
      title: "Elan moderasiyası",
      columns: ["Elan", "Sahib", "Status"],
      rows: [
        ["Sony Alpha A7 IV", "Rəşad Məmmədov", "Təsdiqlənib"],
        ["DJI Mavic 3 Pro", "Nicat Əliyev", "Yoxlamada"],
      ],
    },
    bookings: {
      title: "Bron idarəetməsi",
      columns: ["Bron", "Məhsul", "Status"],
      rows: [
        ["RNT-24019", "Apple iMac", "Təsdiqlənib"],
        ["RNT-23940", "Sony Alpha A7 IV", "Tamamlanıb"],
      ],
    },
    disputes: {
      title: "Mübahisə idarəetməsi",
      columns: ["İş", "Bron", "Status"],
      rows: [["DSP-104", "RNT-23881", "Araşdırılır"]],
    },
    settings: {
      title: "Kateqoriya və platforma parametrləri",
      columns: ["Parametr", "Dəyər", "Status"],
      rows: [
        ["Komissiya", "5.5%", "Aktiv"],
        ["Valyuta", "AZN", "Aktiv"],
      ],
    },
  };
  const data = configs[section || ""] || configs.users;
  return (
    <main className="page">
      <SectionTitle
        eyebrow="Admin"
        title={data.title}
        copy="Production-da bu məlumatlar yalnız admin RLS siyasəti ilə oxunur və dəyişdirilir."
      />
      <div className="mb-5 flex flex-wrap gap-2">
        {Object.entries(configs).map(([key, value]) => (
          <Link
            className={cx(
              "rounded-lg px-3 py-2 text-sm",
              key === section ? "bg-teal" : "bg-elevated text-muted",
            )}
            to={`/admin/${key}`}
            key={key}
          >
            {value.title}
          </Link>
        ))}
      </div>
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-left text-sm">
            <thead className="bg-elevated">
              <tr>
                {data.columns.map((c) => (
                  <th className="px-5 py-3" key={c}>
                    {c}
                  </th>
                ))}
                <th className="px-5 py-3">Əməliyyat</th>
              </tr>
            </thead>
            <tbody>
              {data.rows.map((row, i) => (
                <tr className="border-t border-white/[0.06]" key={i}>
                  {row.map((cell) => (
                    <td className="px-5 py-4" key={cell}>
                      {cell}
                    </td>
                  ))}
                  <td className="px-5 py-4">
                    <button className="text-mint">Yoxla</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}

function Empty({
  icon: Icon,
  title,
  copy,
}: {
  icon: typeof Search;
  title: string;
  copy: string;
}) {
  return (
    <div className="card-pad py-16 text-center">
      <Icon className="mx-auto text-muted" size={38} />
      <h2 className="mt-4 font-display text-xl font-bold">{title}</h2>
      <p className="mt-2 text-muted">{copy}</p>
    </div>
  );
}
function NotFound() {
  return (
    <main className="page flex min-h-[560px] flex-col items-center justify-center text-center">
      <span className="font-display text-8xl font-extrabold text-teal">
        404
      </span>
      <h1 className="mt-4 font-display text-3xl font-bold">Səhifə tapılmadı</h1>
      <p className="mt-2 text-muted">
        Axtardığınız ünvan dəyişdirilib və ya mövcud deyil.
      </p>
      <Link to="/" className="btn-primary mt-6">
        <Home size={18} />
        Ana səhifə
      </Link>
    </main>
  );
}
function Footer() {
  return (
    <footer className="mt-12 border-t border-white/[0.07] bg-ink">
      <div className="page grid gap-8 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <b className="font-display text-xl">RENTORA</b>
          <p className="mt-3 text-sm text-muted">
            Azərbaycanda etibarlı və şəffaf peer-to-peer icarə infrastrukturu.
          </p>
          <p className="mt-3 text-xs uppercase tracking-wider text-mint">
            Own Less. Experience More.
          </p>
        </div>
        <div>
          <b className="text-sm">Platforma</b>
          <div className="mt-3 space-y-2 text-sm text-muted">
            <Link className="block" to="/explore">
              Kataloq
            </Link>
            <Link className="block" to="/listings/new">
              Elan yarat
            </Link>
            <Link className="block" to="/passport">
              Item Passport™
            </Link>
          </div>
        </div>
        <div>
          <b className="text-sm">Dəstək</b>
          <div className="mt-3 space-y-2 text-sm text-muted">
            <Link className="block" to="/help">
              Dəstək mərkəzi
            </Link>
            <Link className="block" to="/faq">
              FAQ
            </Link>
            <Link className="block" to="/messages">
              Əlaqə
            </Link>
            <Link className="block" to="/prohibited-items">
              Qadağan olunmuş əşyalar
            </Link>
          </div>
        </div>
        <div>
          <b className="text-sm">Hüquqi</b>
          <div className="mt-3 space-y-2 text-sm text-muted">
            <Link className="block" to="/terms">
              İstifadə şərtləri
            </Link>
            <Link className="block" to="/privacy">
              Məxfilik
            </Link>
            <Link className="block" to="/cancellation-policy">
              Ləğv və refund
            </Link>
            <Link className="block" to="/deposit-dispute-policy">
              Depozit və mübahisə
            </Link>
            <p>© 2026 RENTORA</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
