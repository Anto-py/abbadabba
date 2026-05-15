import { google } from "googleapis";
import { Readable } from "node:stream";

const ROOT_FOLDER_NAME = "Abbadaba";

function getDriveClient(accessToken: string) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  return google.drive({ version: "v3", auth });
}

async function getOrCreateFolder(
  drive: ReturnType<typeof getDriveClient>,
  name: string,
  parentId: string
): Promise<string> {
  const safeName = name.replace(/'/g, "\\'");
  const res = await drive.files.list({
    q: `name='${safeName}' and '${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: "files(id)",
    spaces: "drive",
  });
  if (res.data.files && res.data.files.length > 0) {
    return res.data.files[0].id!;
  }
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

export async function uploadToDrive(
  accessToken: string,
  fileBuffer: Buffer,
  mimeType: string,
  fileName: string,
  year: number,
  type: "EXPENSE" | "INCOME",
  categoryCode?: string,
): Promise<{ driveId: string; webViewLink: string; fileName: string }> {
  const drive = getDriveClient(accessToken);

  const rootId = await getOrCreateFolder(drive, ROOT_FOLDER_NAME, "root");
  const yearFolderId = await getOrCreateFolder(drive, String(year), rootId);

  let parentId: string;
  if (type === "INCOME") {
    parentId = await getOrCreateFolder(drive, "recettes", yearFolderId);
  } else {
    if (!categoryCode) throw new Error("categoryCode requis pour une dépense");
    const expensesId = await getOrCreateFolder(drive, "depenses", yearFolderId);
    parentId = await getOrCreateFolder(drive, categoryCode, expensesId);
  }

  const file = await drive.files.create({
    requestBody: {
      name: fileName,
      parents: [parentId],
    },
    media: {
      mimeType,
      body: Readable.from(fileBuffer),
    },
    fields: "id,webViewLink",
  });

  return {
    driveId: file.data.id!,
    webViewLink: file.data.webViewLink!,
    fileName,
  };
}
