import { google } from "googleapis";
import { prisma } from "@/lib/prisma";

const ROOT_FOLDER_NAME = "Abbadaba";
const TAB_TX = "TRANSACTIONS";
const TAB_SUMMARY = "RÉSUMÉ";
const TAB_TRIPS = "TRAJETS";

function getClients(accessToken: string) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  return {
    drive: google.drive({ version: "v3", auth }),
    sheets: google.sheets({ version: "v4", auth }),
  };
}

type Drive = ReturnType<typeof getClients>["drive"];
type Sheets = ReturnType<typeof getClients>["sheets"];

async function getOrCreateFolder(drive: Drive, name: string, parentId: string): Promise<string> {
  const safeName = name.replace(/'/g, "\\'");
  const res = await drive.files.list({
    q: `name='${safeName}' and '${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: "files(id)",
    spaces: "drive",
  });
  if (res.data.files && res.data.files.length > 0) return res.data.files[0].id!;
  const folder = await drive.files.create({
    requestBody: {
      name,
      mimeType: "application/vnd.google-apps.folder",
      parents: [parentId],
    },
    fields: "id",
  });
  return folder.data.id!;
}

async function createSpreadsheetInFolder(
  drive: Drive,
  sheets: Sheets,
  name: string,
  parentId: string,
): Promise<string> {
  const file = await drive.files.create({
    requestBody: {
      name,
      mimeType: "application/vnd.google-apps.spreadsheet",
      parents: [parentId],
    },
    fields: "id",
  });
  const spreadsheetId = file.data.id!;
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [
        {
          updateSheetProperties: {
            properties: { sheetId: 0, title: TAB_TX },
            fields: "title",
          },
        },
        { addSheet: { properties: { title: TAB_SUMMARY } } },
        { addSheet: { properties: { title: TAB_TRIPS } } },
      ],
    },
  });
  return spreadsheetId;
}

async function ensureTabExists(
  sheets: Sheets,
  spreadsheetId: string,
  title: string,
): Promise<void> {
  const meta = await sheets.spreadsheets.get({
    spreadsheetId,
    fields: "sheets.properties.title",
  });
  const exists = meta.data.sheets?.some((s) => s.properties?.title === title);
  if (exists) return;
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: { requests: [{ addSheet: { properties: { title } } }] },
  });
}

async function ensureSpreadsheet(
  drive: Drive,
  sheets: Sheets,
  userId: string,
  year: number,
): Promise<string> {
  const existing = await prisma.yearSheet.findUnique({
    where: { userId_year: { userId, year } },
  });

  if (existing) {
    try {
      const meta = await drive.files.get({
        fileId: existing.spreadsheetId,
        fields: "id,trashed",
      });
      if (meta.data.id && !meta.data.trashed) return existing.spreadsheetId;
    } catch {
      // fall through and recreate
    }
  }

  const rootId = await getOrCreateFolder(drive, ROOT_FOLDER_NAME, "root");
  const yearFolderId = await getOrCreateFolder(drive, String(year), rootId);
  const spreadsheetId = await createSpreadsheetInFolder(
    drive,
    sheets,
    `Abbadaba_${year}`,
    yearFolderId,
  );

  await prisma.yearSheet.upsert({
    where: { userId_year: { userId, year } },
    update: { driveFileId: spreadsheetId, spreadsheetId },
    create: { userId, year, driveFileId: spreadsheetId, spreadsheetId },
  });
  return spreadsheetId;
}

const round = (n: number) => Math.round(n * 100) / 100;

export async function rebuildYearSheet(args: {
  userId: string;
  year: number;
  accessToken: string;
}): Promise<{ spreadsheetId: string }> {
  const { userId, year, accessToken } = args;
  const { drive, sheets } = getClients(accessToken);
  const spreadsheetId = await ensureSpreadsheet(drive, sheets, userId, year);
  await ensureTabExists(sheets, spreadsheetId, TAB_TRIPS);

  const [txs, trips, user] = await Promise.all([
    prisma.transaction.findMany({
      where: { userId, fiscalYear: year },
      include: { category: { select: { code: true, name: true } } },
      orderBy: { date: "asc" },
    }),
    prisma.trip.findMany({
      where: { userId, fiscalYear: year },
      orderBy: { date: "asc" },
    }),
    prisma.user.findUnique({ where: { id: userId }, select: { marginalTaxRate: true } }),
  ]);
  const rate = user?.marginalTaxRate ?? 45;

  const txHeader = [
    "Date",
    "Type",
    "Catégorie (code)",
    "Catégorie (nom)",
    "Montant (€)",
    "Taux déduction (%)",
    "Déductible (€)",
    "Description",
    "Preuve",
  ];
  const txRows: (string | number)[][] = txs.map((t) => [
    t.date.toISOString().slice(0, 10),
    t.type === "INCOME" ? "Recette" : "Dépense",
    t.category?.code ?? "",
    t.category?.name ?? "",
    t.amount,
    t.deductionRate ?? "",
    t.deductibleAmount ?? "",
    t.description ?? "",
    t.proofUrl ?? "",
  ]);

  let totalIncome = 0;
  let totalExpense = 0;
  let totalDeductible = 0;
  const byCategory = new Map<
    string,
    { code: string; name: string; expense: number; deductible: number }
  >();
  for (const t of txs) {
    if (t.type === "INCOME") {
      totalIncome += t.amount;
    } else {
      totalExpense += t.amount;
      totalDeductible += t.deductibleAmount ?? 0;
      if (t.category) {
        const key = t.category.code;
        const cur = byCategory.get(key) ?? {
          code: t.category.code,
          name: t.category.name,
          expense: 0,
          deductible: 0,
        };
        cur.expense += t.amount;
        cur.deductible += t.deductibleAmount ?? 0;
        byCategory.set(key, cur);
      }
    }
  }
  const taxBefore = round((totalIncome * rate) / 100);
  const taxAfter = round((Math.max(0, totalIncome - totalDeductible) * rate) / 100);

  const summaryRows: (string | number)[][] = [
    ["Indicateur", "Valeur"],
    ["Année fiscale", year],
    ["Recettes (€)", round(totalIncome)],
    ["Dépenses (€)", round(totalExpense)],
    ["Déductible (€)", round(totalDeductible)],
    ["Taux marginal IPP (%)", rate],
    ["IPP avant déduction (€)", taxBefore],
    ["IPP après déduction (€)", taxAfter],
    ["Économie IPP estimée (€)", round(taxBefore - taxAfter)],
    [""],
    ["Catégorie (code)", "Nom", "Dépense (€)", "Déductible (€)"],
    ...Array.from(byCategory.values())
      .sort((a, b) => b.deductible - a.deductible)
      .map((c) => [c.code, c.name, round(c.expense), round(c.deductible)]),
  ];

  const tripHeader = [
    "Date",
    "Départ",
    "Destination",
    "Km",
    "A/R",
    "Motif",
    "Taux €/km",
    "Indemnité (€)",
  ];
  const tripRows: (string | number)[][] = trips.map((t) => [
    t.date.toISOString().slice(0, 10),
    t.departure,
    t.destination,
    t.km,
    t.roundTrip ? "Oui" : "Non",
    t.purpose,
    t.ratePerKm,
    round(t.indemnity),
  ]);

  await sheets.spreadsheets.values.batchClear({
    spreadsheetId,
    requestBody: { ranges: [TAB_TX, TAB_SUMMARY, TAB_TRIPS] },
  });
  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId,
    requestBody: {
      valueInputOption: "RAW",
      data: [
        { range: `${TAB_TX}!A1`, values: [txHeader, ...txRows] },
        { range: `${TAB_SUMMARY}!A1`, values: summaryRows },
        { range: `${TAB_TRIPS}!A1`, values: [tripHeader, ...tripRows] },
      ],
    },
  });

  return { spreadsheetId };
}

export function syncYearSheet(args: {
  userId: string;
  year: number;
  accessToken: string;
}): void {
  rebuildYearSheet(args).catch((e) => {
    console.error("YearSheet sync failed", {
      userId: args.userId,
      year: args.year,
      error: e instanceof Error ? e.message : String(e),
    });
  });
}
