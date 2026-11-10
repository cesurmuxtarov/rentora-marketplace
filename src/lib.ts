import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
export const supabase = url && key ? createClient(url, key) : null;
export const demoMode = !supabase;

export const money = (value: number) => `${value.toFixed(2)} ₼`;
export const daysBetween = (start: string, end: string) => {
  if (!start || !end) return 0;
  const from = Date.parse(`${start}T00:00:00Z`);
  const to = Date.parse(`${end}T00:00:00Z`);
  if (!Number.isFinite(from) || !Number.isFinite(to) || to <= from) return 0;
  return Math.ceil((to - from) / 86400000);
};
export const cx = (...values: Array<string | false | undefined>) =>
  values.filter(Boolean).join(" ");

export type Role = "renter" | "owner" | "admin";
export type BookingStatus =
  | "pending"
  | "confirmed"
  | "active"
  | "completed"
  | "rejected"
  | "cancelled"
  | "disputed";

export type Listing = {
  id: string;
  status?: string;
  title: string;
  category: string;
  location: string;
  price: number;
  deposit: number;
  rating: number;
  reviews: number;
  owner: string;
  image: string;
  popularity: number;
  createdAt: string;
  verified?: boolean;
  description: string;
  ownerId?: string;
  images?: string[];
};

export const categories = [
  "Kamera & Foto",
  "Elektronika",
  "Nəqliyyat",
  "Alətlər",
  "Tədbir",
  "İdman",
];

const image = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1200&q=82`;

export const listings: Listing[] = [
  {
    id: "sony-a7",
    title: "Sony Alpha A7 IV Full-Frame Kamera Dəsti",
    category: "Kamera & Foto",
    location: "Bakı, Səbail",
    price: 30,
    deposit: 50,
    rating: 4.98,
    reviews: 42,
    owner: "Rəşad Məmmədov",
    image: image("photo-1516035069371-29a1b244cc32"),
    popularity: 98,
    createdAt: "2026-10-28",
    verified: true,
    description:
      "33MP sensor, 4K 60p video, iki batareya və zərbəyə davamlı çanta ilə peşəkar çəkiliş dəsti.",
  },
  {
    id: "cinema-kit",
    title: "Film çəkilişi üçün rejissor klapanı",
    category: "Kamera & Foto",
    location: "Bakı, Nərimanov",
    price: 48,
    deposit: 90,
    rating: 4.91,
    reviews: 19,
    owner: "Nicat Əliyev",
    image: image("photo-1485846234645-a62644f84728"),
    popularity: 87,
    createdAt: "2026-11-02",
    verified: true,
    description:
      "Film, reklam və tələbə layihələri üçün peşəkar rejissor klapanı.",
  },
  {
    id: "sony-lens",
    title: "Canon DSLR fotoaparat dəsti",
    category: "Kamera & Foto",
    location: "Bakı, Yasamal",
    price: 22,
    deposit: 45,
    rating: 4.87,
    reviews: 31,
    owner: "Aysel Həsənova",
    image: image("photo-1502920917128-1aa500764cbd"),
    popularity: 82,
    createdAt: "2026-10-22",
    description:
      "Portret və tədbir çəkilişləri üçün DSLR fotoaparat, obyektiv və qoruyucu çanta.",
  },
  {
    id: "retro-camera",
    title: "Polaroid instant fotoaparat",
    category: "Kamera & Foto",
    location: "Bakı, İçərişəhər",
    price: 19,
    deposit: 45,
    rating: 4.82,
    reviews: 16,
    owner: "FotoLab Baku",
    image: image("photo-1526170375885-4d8ecf77b99f"),
    popularity: 78,
    createdAt: "2026-11-07",
    description:
      "Tədbir və xatirə çəkilişləri üçün retro dizaynlı instant fotoaparat.",
  },
  {
    id: "projector",
    title: "Apple iMac masaüstü kompüter",
    category: "Elektronika",
    location: "Bakı, Nəsimi",
    price: 40,
    deposit: 80,
    rating: 4.89,
    reviews: 23,
    owner: "OfficePro",
    image: image("photo-1527443224154-c4a3942d3acf"),
    popularity: 73,
    createdAt: "2026-10-18",
    verified: true,
    description:
      "Ofis, təqdimat və studiya işi üçün masaüstü kompüter, klaviatura və siçan.",
  },
  {
    id: "macbook-pro",
    title: "MacBook Pro 14 — təqdimat və montaj üçün",
    category: "Elektronika",
    location: "Bakı, Nərimanov",
    price: 38,
    deposit: 150,
    rating: 4.92,
    reviews: 36,
    owner: "TechRent Baku",
    image: image("photo-1496181133206-80ce9b88a853"),
    popularity: 91,
    createdAt: "2026-11-06",
    verified: true,
    description:
      "M3 Pro prosessorlu noutbuk, şarj cihazı və qoruyucu çanta ilə.",
  },
  {
    id: "studio-headphones",
    title: "Studiya üçün naqilsiz qulaqlıq",
    category: "Elektronika",
    location: "Bakı, Səbail",
    price: 12,
    deposit: 35,
    rating: 4.8,
    reviews: 24,
    owner: "Audio Point",
    image: image("photo-1505740420928-5e560c06d30e"),
    popularity: 74,
    createdAt: "2026-11-04",
    description:
      "Musiqi, montaj və onlayn görüşlər üçün rahat naqilsiz qulaqlıq.",
  },
  {
    id: "ultrabook-13",
    title: "13 düymlük yüngül noutbuk",
    category: "Elektronika",
    location: "Bakı, Xətai",
    price: 29,
    deposit: 100,
    rating: 4.85,
    reviews: 21,
    owner: "Notebook Rent",
    image: image("photo-1517336714731-489689fd1ca8"),
    popularity: 81,
    createdAt: "2026-11-03",
    description:
      "Səfər, təqdimat və gündəlik ofis işi üçün yüngül noutbuk.",
  },
  {
    id: "porsche-911",
    title: "Porsche 911 — günlük avtomobil",
    category: "Nəqliyyat",
    location: "Bakı, Nizami",
    price: 95,
    deposit: 300,
    rating: 4.86,
    reviews: 18,
    owner: "CityDrive",
    image: image("photo-1503376780353-7e6692767b70"),
    popularity: 84,
    createdAt: "2026-11-03",
    verified: true,
    description:
      "Avtomatik sürətlər qutusu, sığorta və 200 km günlük limit.",
  },
  {
    id: "city-scooter",
    title: "Şəhər və səfər üçün motosiklet",
    category: "Nəqliyyat",
    location: "Bakı, Ağ Şəhər",
    price: 24,
    deposit: 70,
    rating: 4.78,
    reviews: 29,
    owner: "Move Baku",
    image: image("photo-1558981806-ec527fa84c39"),
    popularity: 76,
    createdAt: "2026-10-29",
    description: "Motosiklet, qoruyucu dəbilqə və kilid dəstə daxildir.",
  },
  {
    id: "classic-coupe",
    title: "Ford Mustang Shelby GT350",
    category: "Nəqliyyat",
    location: "Bakı, Səbail",
    price: 110,
    deposit: 350,
    rating: 4.9,
    reviews: 13,
    owner: "Retro Drive",
    image: image("photo-1494976388531-d1058494cdd8"),
    popularity: 86,
    createdAt: "2026-10-27",
    description:
      "Fotosessiya və xüsusi günlər üçün Ford Mustang Shelby GT350 kupe avtomobili.",
  },
  {
    id: "red-sports-car",
    title: "Ferrari 458 Italia",
    category: "Nəqliyyat",
    location: "Bakı, Nərimanov",
    price: 140,
    deposit: 450,
    rating: 4.93,
    reviews: 12,
    owner: "Premium Garage",
    image: image("photo-1503736334956-4c8f8e92946d"),
    popularity: 89,
    createdAt: "2026-11-01",
    description:
      "Şəhər gəzintisi və çəkilişlər üçün Ferrari 458 Italia idman avtomobili.",
  },
  {
    id: "drill-set",
    title: "Bosch Professional akkumulyatorlu alət dəsti",
    category: "Alətlər",
    location: "Bakı, Binəqədi",
    price: 18,
    deposit: 35,
    rating: 4.76,
    reviews: 14,
    owner: "Elvin Quliyev",
    image: image("photo-1504148455328-c376907d081c"),
    popularity: 61,
    createdAt: "2026-11-05",
    description: "Təmir işləri üçün iki akkumulyator, ucluq dəsti və çanta.",
  },
  {
    id: "garden-tools",
    title: "Emalatxana üçün əl alətləri dəsti",
    category: "Alətlər",
    location: "Bakı, Xəzər",
    price: 26,
    deposit: 60,
    rating: 4.81,
    reviews: 11,
    owner: "Usta Market",
    image: image("photo-1530124566582-a618bc2615dc"),
    popularity: 58,
    createdAt: "2026-10-25",
    verified: true,
    description:
      "Təmir və montaj işləri üçün açar, kəlbətin və əl alətləri paketi.",
  },
  {
    id: "circular-saw",
    title: "Bucaq cilalayıcısı və qoruyucu dəst",
    category: "Alətlər",
    location: "Bakı, Nəsimi",
    price: 21,
    deposit: 55,
    rating: 4.79,
    reviews: 18,
    owner: "Usta Alət",
    image: image("photo-1504917595217-d4dc5ebe6122"),
    popularity: 69,
    createdAt: "2026-10-30",
    description:
      "Metal kəsmə və səth cilalama işləri üçün elektrik aləti və qoruyucu vasitələr.",
  },
  {
    id: "hand-toolbox",
    title: "Çəkic və tənzimlənən açar dəsti",
    category: "Alətlər",
    location: "Bakı, Yasamal",
    price: 16,
    deposit: 40,
    rating: 4.75,
    reviews: 15,
    owner: "FixPoint",
    image: image("photo-1586864387789-628af9feed72"),
    popularity: 63,
    createdAt: "2026-10-24",
    description:
      "Sadə ev təmiri və montaj üçün çəkic və tənzimlənən açar dəsti.",
  },
  {
    id: "event-kit",
    title: "Tədbir üçün səhnə işıqlandırma paketi",
    category: "Tədbir",
    location: "Bakı, Xətai",
    price: 75,
    deposit: 120,
    rating: 4.95,
    reviews: 27,
    owner: "Lumina Studio",
    image: image("photo-1506157786151-b8491531f063"),
    popularity: 90,
    createdAt: "2026-10-30",
    verified: true,
    description:
      "Toy və təqdimatlar üçün idarə olunan işıq sistemi və stendlər.",
  },
  {
    id: "sound-system",
    title: "Canlı tədbir üçün səs və səhnə paketi",
    category: "Tədbir",
    location: "Bakı, Yasamal",
    price: 64,
    deposit: 100,
    rating: 4.9,
    reviews: 22,
    owner: "SoundLab",
    image: image("photo-1524368535928-5b5e00ddc76b"),
    popularity: 85,
    createdAt: "2026-11-01",
    verified: true,
    description:
      "Kiçik canlı tədbirlər üçün səs sistemi, mikser və səhnə quruluşu.",
  },
  {
    id: "wedding-decor",
    title: "Toy masası və dekorasiya dəsti",
    category: "Tədbir",
    location: "Bakı, Nizami",
    price: 90,
    deposit: 150,
    rating: 4.88,
    reviews: 20,
    owner: "Event Decor",
    image: image("photo-1519167758481-83f550bb49b3"),
    popularity: 83,
    createdAt: "2026-10-26",
    description:
      "Nişan və toy mərasimləri üçün masa, stul və sadə dekorasiya dəsti.",
  },
  {
    id: "festival-stage",
    title: "Festival səhnəsi və işıq paketi",
    category: "Tədbir",
    location: "Bakı, Xətai",
    price: 130,
    deposit: 220,
    rating: 4.94,
    reviews: 17,
    owner: "Stage Baku",
    image: image("photo-1492684223066-81342ee5ff30"),
    popularity: 92,
    createdAt: "2026-11-05",
    description:
      "Açıq hava tədbirləri üçün səhnə konstruksiyası və işıqlandırma paketi.",
  },
  {
    id: "surf-board",
    title: "Sörf lövhəsi və təhlükəsizlik dəsti",
    category: "İdman",
    location: "Bakı, Bilgəh",
    price: 22,
    deposit: 50,
    rating: 4.88,
    reviews: 17,
    owner: "Sea Club",
    image: image("photo-1502680390469-be75c86b636f"),
    popularity: 72,
    createdAt: "2026-11-04",
    verified: true,
    description:
      "Sörf lövhəsi, qoruyucu kəmər və təhlükəsizlik jileti daxildir.",
  },
  {
    id: "mountain-bike",
    title: "Trek dağ velosipedi və dəbilqə",
    category: "İdman",
    location: "Bakı, Səbail",
    price: 20,
    deposit: 45,
    rating: 4.84,
    reviews: 25,
    owner: "Bike Point",
    image: image("photo-1571068316344-75bc76f77890"),
    popularity: 79,
    createdAt: "2026-10-31",
    description:
      "Şəhər və yüngül dağ marşrutları üçün saz vəziyyətdə velosiped.",
  },
  {
    id: "basketball-kit",
    title: "Basketbol topu və məşq dəsti",
    category: "İdman",
    location: "Bakı, Nərimanov",
    price: 10,
    deposit: 25,
    rating: 4.77,
    reviews: 19,
    owner: "Court Store",
    image: image("photo-1546519638-68e109498ffc"),
    popularity: 67,
    createdAt: "2026-11-02",
    description:
      "Fərdi və komanda məşqləri üçün basketbol topu və nişanlama konusları.",
  },
  {
    id: "fitness-kit",
    title: "Fitnes və funksional məşq dəsti",
    category: "İdman",
    location: "Bakı, Gənclik",
    price: 15,
    deposit: 35,
    rating: 4.83,
    reviews: 22,
    owner: "FitRent",
    image: image("photo-1518611012118-696072aa579a"),
    popularity: 75,
    createdAt: "2026-10-29",
    description:
      "Ev və açıq hava məşqləri üçün funksional fitnes avadanlığı paketi.",
  },
];

export const bookingMath = (
  listing: Listing,
  start: string,
  end: string,
  commission = 5.5,
  delivery = 0,
) => {
  const days = daysBetween(start, end);
  const rental = Math.round(listing.price * days * 100) / 100;
  const fee = Math.round(rental * commission) / 100;
  const total =
    Math.round((rental + fee + listing.deposit + delivery) * 100) / 100;
  return { days, rental, fee, deposit: listing.deposit, delivery, total };
};
