import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const NOMINATIM = "https://nominatim.openstreetmap.org/search";
const OSRM = "https://router.project-osrm.org/route/v1/driving";
const UA = "AbbadabaApp/1.0 (https://abbadaba.antoninbareau.eu)";

type Geocoded = { lat: number; lon: number; label: string };

async function geocode(query: string): Promise<Geocoded | null> {
  const url = `${NOMINATIM}?${new URLSearchParams({
    q: query,
    format: "json",
    limit: "1",
    addressdetails: "0",
  })}`;
  const res = await fetch(url, {
    headers: { "User-Agent": UA, "Accept-Language": "fr" },
    cache: "no-store",
  });
  if (!res.ok) return null;
  const data = (await res.json()) as Array<{
    lat: string;
    lon: string;
    display_name: string;
  }>;
  if (!Array.isArray(data) || data.length === 0) return null;
  const first = data[0];
  const lat = Number(first.lat);
  const lon = Number(first.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  return { lat, lon, label: first.display_name };
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const fromInput = typeof body?.from === "string" ? body.from.trim() : "";
  const toInput = typeof body?.to === "string" ? body.to.trim() : "";

  if (!toInput) {
    return NextResponse.json({ error: "Destination requise" }, { status: 400 });
  }

  let fromQuery = fromInput;
  if (!fromQuery || fromQuery.toLowerCase() === "domicile") {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { homeAddress: true },
    });
    if (!user?.homeAddress?.trim()) {
      return NextResponse.json(
        { error: "Adresse du domicile non configurée — voir Réglages" },
        { status: 400 },
      );
    }
    fromQuery = user.homeAddress.trim();
  }

  const [from, to] = await Promise.all([geocode(fromQuery), geocode(toInput)]);
  if (!from) {
    return NextResponse.json({ error: `Adresse de départ introuvable : « ${fromQuery} »` }, { status: 404 });
  }
  if (!to) {
    return NextResponse.json({ error: `Destination introuvable : « ${toInput} »` }, { status: 404 });
  }

  const osrmUrl = `${OSRM}/${from.lon},${from.lat};${to.lon},${to.lat}?overview=false`;
  const osrmRes = await fetch(osrmUrl, {
    headers: { "User-Agent": UA },
    cache: "no-store",
  });
  if (!osrmRes.ok) {
    return NextResponse.json({ error: "Service de routage indisponible" }, { status: 502 });
  }
  const osrm = (await osrmRes.json()) as {
    code?: string;
    routes?: Array<{ distance?: number }>;
  };
  if (osrm.code !== "Ok" || !osrm.routes?.[0]?.distance) {
    return NextResponse.json({ error: "Itinéraire introuvable" }, { status: 404 });
  }

  const km = Math.round((osrm.routes[0].distance / 1000) * 10) / 10;
  return NextResponse.json({
    km,
    from: { label: from.label },
    to: { label: to.label },
  });
}
