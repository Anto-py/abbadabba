import { google } from "googleapis";

function getDriveClient() {
  const auth = new google.auth.JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: process.env.GOOGLE_SERVICE_ACCOUNT_KEY?.replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/drive"],
  });
  return google.drive({ version: "v3", auth });
}

async function getOrCreateFolder(
  drive: ReturnType<typeof getDriveClient>,
  name: string,
  parentId: string
): Promise<string> {
  const res = await drive.files.list({
    q: `name='${name}' and '${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: "files(id)",
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
  fileBuffer: Buffer,
  mimeType: string,
  fileName: string,
  year: number,
  categoryCode: string
): Promise<{ driveId: string; webViewLink: string; fileName: string }> {
  const drive = getDriveClient();
  const rootId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID!;

  const yearFolderId = await getOrCreateFolder(drive, String(year), rootId);
  const categoryFolderId = await getOrCreateFolder(drive, categoryCode, yearFolderId);

  const { Readable } = await import("stream");
  const file = await drive.files.create({
    requestBody: {
      name: fileName,
      parents: [categoryFolderId],
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
