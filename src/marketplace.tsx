import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  demoMode,
  listings as demoListings,
  supabase,
  type Listing,
} from "./lib";

type MarketplaceContextValue = {
  listings: Listing[];
  myListings: Listing[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  saveDemoListing: (listing: Listing) => void;
};
const MarketplaceContext = createContext<MarketplaceContextValue | null>(null);
const demoStorageKey = "rentora-created-listings";

function storedDemoListings(): Listing[] {
  try {
    const stored: unknown = JSON.parse(localStorage.getItem(demoStorageKey) || "[]");
    return Array.isArray(stored)
      ? stored.filter((item): item is Listing =>
          !!item && typeof item.id === "string" &&
          typeof item.title === "string" && typeof item.category === "string" &&
          typeof item.price === "number" && item.ownerId === "demo-owner",
        )
      : [];
  } catch {
    return [];
  }
}

type RawListing = {
  id: string;
  status: string;
  title: string;
  description: string;
  city: string;
  district: string | null;
  daily_price: number | string;
  deposit_amount: number | string;
  created_at: string;
  owner_id: string;
  owner: {
    full_name: string;
    rating: number | string;
    identity_status: string;
  } | null;
  category: { name_az: string } | null;
  listing_images: Array<{ storage_path: string; sort_order: number }>;
  reviews: Array<{ rating: number }>;
};

export function MarketplaceProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Listing[]>(demoMode ? [...storedDemoListings(), ...demoListings] : []);
  const [myListings, setMyListings] = useState<Listing[]>(demoMode ? storedDemoListings() : []);
  const [loading, setLoading] = useState(!demoMode);
  const [error, setError] = useState<string | null>(null);
  const refresh = useCallback(async () => {
    if (!supabase) {
      const own = storedDemoListings();
      setMyListings(own);
      setItems([...own, ...demoListings]);
      return;
    }
    const client = supabase;
    setLoading(true);
    setError(null);
    const { data, error: queryError } = await client
      .from("listings")
      .select(
        "id,status,title,description,city,district,daily_price,deposit_amount,created_at,owner_id,owner:profiles!listings_owner_id_fkey(full_name,rating,identity_status),category:categories(name_az),listing_images(storage_path,sort_order),reviews(rating)",
      )
      .eq("status", "active")
      .order("created_at", { ascending: false });
    if (queryError) {
      setError(queryError.message);
      setLoading(false);
      return;
    }
    const rows = (data ?? []) as unknown as RawListing[];
    const mapRows = (source: RawListing[]) => source.map((row): Listing => {
        const images = [...(row.listing_images ?? [])]
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((image) =>
            /^https?:\/\//.test(image.storage_path)
              ? image.storage_path
              : client.storage
                  .from("listing-images")
                  .getPublicUrl(image.storage_path).data.publicUrl,
          );
        const ratings =
          row.reviews
            ?.map((review) => Number(review.rating))
            .filter(Number.isFinite) ?? [];
        return {
          id: row.id,
          status: row.status,
          title: row.title,
          description: row.description,
          category: row.category?.name_az ?? "Digər",
          location: [row.city, row.district].filter(Boolean).join(", "),
          price: Number(row.daily_price),
          deposit: Number(row.deposit_amount),
          rating: ratings.length
            ? ratings.reduce((sum, value) => sum + value, 0) / ratings.length
            : Number(row.owner?.rating ?? 0),
          reviews: ratings.length,
          owner: row.owner?.full_name ?? "RENTORA istifadəçisi",
          ownerId: row.owner_id,
          image: images[0] ?? "/fallback-product.svg",
          images,
          popularity: ratings.length,
          createdAt: row.created_at,
          verified: row.owner?.identity_status === "verified",
        };
      });
    setItems(mapRows(rows));
    const { data: authData } = await client.auth.getUser();
    if (authData.user) {
      const { data: ownRows, error: ownError } = await client
        .from("listings")
        .select("id,status,title,description,city,district,daily_price,deposit_amount,created_at,owner_id,owner:profiles!listings_owner_id_fkey(full_name,rating,identity_status),category:categories(name_az),listing_images(storage_path,sort_order),reviews(rating)")
        .eq("owner_id", authData.user.id)
        .order("created_at", { ascending: false });
      if (ownError) setError(ownError.message);
      else setMyListings(mapRows((ownRows ?? []) as unknown as RawListing[]));
    } else setMyListings([]);
    setLoading(false);
  }, []);
  const saveDemoListing = useCallback((listing: Listing) => {
    const own = [listing, ...storedDemoListings().filter((item) => item.id !== listing.id)];
    localStorage.setItem(demoStorageKey, JSON.stringify(own));
    setMyListings(own);
    setItems([...own, ...demoListings]);
  }, []);
  useEffect(() => {
    void refresh();
  }, [refresh]);
  const value = useMemo(
    () => ({ listings: items, myListings, loading, error, refresh, saveDemoListing }),
    [items, myListings, loading, error, refresh, saveDemoListing],
  );
  return (
    <MarketplaceContext.Provider value={value}>
      {children}
    </MarketplaceContext.Provider>
  );
}

export function useMarketplace() {
  const value = useContext(MarketplaceContext);
  if (!value)
    throw new Error("useMarketplace must be used inside MarketplaceProvider");
  return value;
}
