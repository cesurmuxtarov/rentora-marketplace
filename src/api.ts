import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "./lib";

export type ListingInput = {
  title: string;
  description: string;
  category: string;
  city: string;
  district?: string;
  price: number;
  deposit: number;
  deliveryFee?: number;
};

const categoryAliases: Record<string, string> = {
  "Kamera & Foto": "Kamera və video",
  Alətlər: "Alətlər və tikinti",
  Tədbir: "Tədbir avadanlığı",
};

export async function createListing(values: ListingInput, files: File[]) {
  if (!supabase) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Daxil olmaq tələb olunur.");
  const categoryName = categoryAliases[values.category] ?? values.category;
  const { data: category, error: categoryError } = await supabase
    .from("categories")
    .select("id")
    .eq("name_az", categoryName)
    .single();
  if (categoryError || !category)
    throw new Error(
      "Kateqoriya tapılmadı. Əvvəl seed məlumatlarını tətbiq edin.",
    );
  for (const file of files.slice(0, 10)) {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 8 * 1024 * 1024)
      throw new Error(`${file.name}: yalnız JPG, PNG və WebP, maksimum 8 MB.`);
  }
  const { error: roleError } = await supabase
    .from("user_roles")
    .upsert(
      { user_id: user.id, role: "owner" },
      { onConflict: "user_id,role", ignoreDuplicates: true },
    );
  if (roleError) throw roleError;
  const { data: listing, error } = await supabase
    .from("listings")
    .insert({
      owner_id: user.id,
      category_id: category.id,
      title: values.title,
      description: values.description,
      city: values.city,
      district: values.district || null,
      daily_price: values.price,
      deposit_amount: values.deposit,
      delivery_fee: values.deliveryFee ?? 0,
      status: "draft",
    })
    .select("id")
    .single();
  if (error || !listing) throw error ?? new Error("Elan yaradılmadı.");
  for (const [index, file] of files.slice(0, 10).entries()) {
    const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
    const path = `${listing.id}/${crypto.randomUUID()}-${safe}`;
    const { error: uploadError } = await supabase.storage
      .from("listing-images")
      .upload(path, file, { contentType: file.type, upsert: false });
    if (uploadError) throw uploadError;
    const { error: imageError } = await supabase.from("listing_images").insert({
      listing_id: listing.id,
      storage_path: path,
      alt_text: values.title,
      sort_order: index,
    });
    if (imageError) throw imageError;
  }
  const { data: published, error: publishError } = await supabase
    .from("listings")
    .update({ status: "active" })
    .eq("id", listing.id)
    .eq("owner_id", user.id)
    .select("id")
    .single();
  if (publishError || !published) throw publishError ?? new Error("Elan yayımlanmadı.");
  return listing.id as string;
}

export async function updateListing(listingId: string, values: ListingInput) {
  if (!supabase) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Daxil olmaq tələb olunur.");
  const { error } = await supabase
    .from("listings")
    .update({
      title: values.title,
      description: values.description,
      city: values.city,
      district: values.district || null,
      daily_price: values.price,
      deposit_amount: values.deposit,
      delivery_fee: values.deliveryFee ?? 0,
      updated_at: new Date().toISOString(),
    })
    .eq("id", listingId)
    .eq("owner_id", user.id);
  if (error) throw error;
}

export async function getFavoriteIds() {
  if (!supabase) return [];
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await supabase
    .from("favorites")
    .select("listing_id")
    .eq("user_id", user.id);
  if (error) throw error;
  return (data ?? []).map((row) => row.listing_id as string);
}

export async function setFavorite(listingId: string, active: boolean) {
  if (!supabase) return;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Seçilmişlər üçün daxil olmaq tələb olunur.");
  const query = active
    ? supabase
        .from("favorites")
        .upsert({ user_id: user.id, listing_id: listingId })
    : supabase
        .from("favorites")
        .delete()
        .eq("user_id", user.id)
        .eq("listing_id", listingId);
  const { error } = await query;
  if (error) throw error;
}

export async function createBookingRequest(
  listingId: string,
  start: string,
  end: string,
  deliveryFee = 0,
) {
  if (!supabase) return null;
  const { data, error } = await supabase.rpc("create_booking_request", {
    p_listing_id: listingId,
    p_starts_on: start,
    p_ends_on: end,
    p_delivery_fee: deliveryFee,
  });
  if (error) throw error;
  return data as string;
}

export async function getMyBookings(owner = false) {
  if (!supabase) return [];
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await supabase
    .from("bookings")
    .select(
      "id,listing_id,starts_on,ends_on,total_amount,status,renter:profiles!bookings_renter_id_fkey(full_name)",
    )
    .eq(owner ? "owner_id" : "renter_id", user.id)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function transitionBooking(bookingId: string, status: string) {
  if (!supabase) return;
  const { error } = await supabase.rpc("transition_booking", {
    p_booking_id: bookingId,
    p_to_status: status,
    p_note: null,
  });
  if (error) throw error;
}

export async function startConversation(
  listingId: string,
  ownerId: string,
  subject: string,
) {
  if (!supabase) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Mesaj yazmaq üçün daxil olun.");
  if (user.id === ownerId)
    throw new Error("Öz elanınıza mesaj yaza bilməzsiniz.");
  const { data: conversation, error } = await supabase
    .from("conversations")
    .insert({ listing_id: listingId, created_by: user.id, subject })
    .select("id")
    .single();
  if (error || !conversation) throw error ?? new Error("Yazışma yaradılmadı.");
  const { error: participantError } = await supabase
    .from("conversation_participants")
    .insert([
      { conversation_id: conversation.id, user_id: user.id },
      { conversation_id: conversation.id, user_id: ownerId },
    ]);
  if (participantError) throw participantError;
  return conversation.id as string;
}

async function getConversationRecipient(conversationId: string) {
  if (!supabase) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Daxil olmaq tələb olunur.");
  const { data, error } = await supabase
    .from("conversation_participants")
    .select("user_id")
    .eq("conversation_id", conversationId)
    .neq("user_id", user.id)
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Yazışmanın digər iştirakçısı tapılmadı.");
  return { user, recipientId: data.user_id as string };
}

export async function getMyProfile() {
  if (!supabase) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase
    .from("profiles")
    .select("id,full_name,phone,avatar_url,city,bio,identity_status,rating")
    .eq("id", user.id)
    .single();
  if (error) throw error;
  return data;
}

export async function updateMyProfile(values: {
  full_name: string;
  phone?: string;
  city?: string;
  bio?: string;
}) {
  if (!supabase) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Daxil olmaq tələb olunur.");
  const { data, error } = await supabase
    .from("profiles")
    .update({ ...values, updated_at: new Date().toISOString() })
    .eq("id", user.id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getConversationMessages(conversationId: string) {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("messages")
    .select(
      "id,sender_id,body,attachment_path,attachment_type,read_at,created_at",
    )
    .eq("conversation_id", conversationId)
    .order("created_at");
  if (error) throw error;
  return data ?? [];
}

export async function sendConversationMessage(
  conversationId: string,
  body: string,
) {
  if (!supabase) return null;
  const recipient = await getConversationRecipient(conversationId);
  if (!recipient) return null;
  const { data, error } = await supabase
    .from("messages")
    .insert({
      conversation_id: conversationId,
      sender_id: recipient.user.id,
      recipient_id: recipient.recipientId,
      body,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function uploadConversationAttachment(
  conversationId: string,
  file: File,
) {
  if (!supabase) return null;
  const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
  if (!allowed.includes(file.type) || file.size > 8 * 1024 * 1024)
    throw new Error(
      "Yalnız JPG, PNG, WebP və PDF (maksimum 8 MB) qəbul edilir.",
    );
  const recipient = await getConversationRecipient(conversationId);
  if (!recipient) return null;
  const user = recipient.user;
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
  const path = `${conversationId}/${user.id}/${crypto.randomUUID()}-${safeName}`;
  const { error: uploadError } = await supabase.storage
    .from("message-attachments")
    .upload(path, file, { contentType: file.type, upsert: false });
  if (uploadError) throw uploadError;
  const { data, error } = await supabase
    .from("messages")
    .insert({
      conversation_id: conversationId,
      sender_id: user.id,
      recipient_id: recipient.recipientId,
      body: file.name,
      attachment_path: path,
      attachment_type: file.type,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export function subscribeToConversation(
  conversationId: string,
  onMessage: (message: Record<string, unknown>) => void,
): RealtimeChannel | null {
  if (!supabase) return null;
  return supabase
    .channel(`conversation:${conversationId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => onMessage(payload.new),
    )
    .subscribe();
}

export async function unsubscribe(channel: RealtimeChannel | null) {
  if (supabase && channel) await supabase.removeChannel(channel);
}
