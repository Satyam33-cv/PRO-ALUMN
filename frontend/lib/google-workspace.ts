// Utilities for Google Workspace APIs (Gmail, Forms, Docs, Calendar, Chat, Keep) using OAuth 2.0 access token

// ---------------- Common Types ----------------

export interface GmailMessageSummary {
  id: string;
  threadId: string;
  snippet: string;
  subject: string;
  from: string;
  to: string;
  date: string;
}

export interface GoogleFormDetails {
  formId: string;
  info: {
    title: string;
    description?: string;
    documentTitle?: string;
  };
  responderUri: string;
  items?: Array<{
    itemId: string;
    title: string;
    questionItem?: {
      question: {
        questionId: string;
        required?: boolean;
        textQuestion?: { paragraph?: boolean };
        choiceQuestion?: {
          type: "RADIO" | "CHECKBOX" | "DROP_DOWN";
          options: Array<{ value: string }>;
        };
      };
    };
  }>;
}

export interface GoogleFormResponse {
  responseId: string;
  createTime: string;
  lastSubmittedTime: string;
  answers?: Record<
    string,
    {
      questionId: string;
      textAnswers?: {
        answers?: Array<{ value: string }>;
      };
    }
  >;
}

export interface GoogleDocDetails {
  documentId: string;
  title: string;
  body?: {
    content?: Array<{
      paragraph?: {
        elements?: Array<{
          textRun?: {
            content?: string;
          };
        }>;
      };
    }>;
  };
}

export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
  htmlLink?: string;
  attendees?: Array<{ email: string; displayName?: string; responseStatus?: string }>;
}

export interface GoogleChatSpace {
  name: string; // "spaces/AAA..."
  displayName?: string;
  spaceType?: "SPACE" | "GROUP_CHAT" | "DIRECT_MESSAGE";
  spaceThreadingState?: string;
}

export interface GoogleChatMessage {
  name: string; // "spaces/AAA.../messages/BBB..."
  text?: string;
  sender?: {
    displayName?: string;
    name?: string;
    type?: string;
    email?: string;
  };
  createTime?: string;
}

export interface GoogleKeepNote {
  id: string;
  name?: string;
  title: string;
  body?: {
    text?: { text?: string };
    list?: { listItems?: Array<{ text?: { text?: string }; checked?: boolean }> };
  };
  createTime?: string;
  updateTime?: string;
  trashTime?: string;
  trashed?: boolean;
}

// Helper to encode base64url for Gmail
function encodeBase64Url(str: string): string {
  const utf8Bytes = new TextEncoder().encode(str);
  let binary = "";
  for (let i = 0; i < utf8Bytes.byteLength; i++) {
    binary += String.fromCharCode(utf8Bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

// Central fetch helper with 401/403 token expiry detection
async function workspaceFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const res = await fetch(input, init);
  if (res.status === 401 || res.status === 403) {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("workspace-token-expired", { detail: { status: res.status } }));
    }
  }
  return res;
}

// ==========================================
// 1. Gmail API
// ==========================================

export async function sendGmailMessage({
  token,
  to,
  subject,
  body,
}: {
  token: string;
  to: string;
  subject: string;
  body: string;
}): Promise<{ id: string; threadId: string }> {
  const emailLines = [
    `To: ${to}`,
    `Subject: =?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: 8bit",
    "",
    body,
  ];
  const rawEmail = emailLines.join("\r\n");
  const rawBase64Url = encodeBase64Url(rawEmail);

  const res = await workspaceFetch(
    "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ raw: rawBase64Url }),
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      err?.error?.message || `Failed to send email (${res.status} ${res.statusText})`
    );
  }

  return res.json();
}

export async function listGmailMessages({
  token,
  maxResults = 15,
  q = "",
}: {
  token: string;
  maxResults?: number;
  q?: string;
}): Promise<GmailMessageSummary[]> {
  const url = new URL("https://gmail.googleapis.com/gmail/v1/users/me/messages");
  url.searchParams.set("maxResults", maxResults.toString());
  if (q) url.searchParams.set("q", q);

  const res = await workspaceFetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      err?.error?.message || `Failed to list messages (${res.status})`
    );
  }

  const data = await res.json();
  const messages: Array<{ id: string; threadId: string }> = data.messages || [];

  const summaries = await Promise.all(
    messages.slice(0, 10).map(async (msg) => {
      try {
        const detailRes = await workspaceFetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=To&metadataHeaders=Date`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!detailRes.ok) {
          return {
            id: msg.id,
            threadId: msg.threadId,
            snippet: "Message loaded",
            subject: "No Subject",
            from: "Unknown",
            to: "Me",
            date: new Date().toLocaleDateString(),
          };
        }
        const details = await detailRes.json();
        const headers: Array<{ name: string; value?: string }> = details.payload?.headers || [];
        const subject =
          headers.find((h) => h.name.toLowerCase() === "subject")?.value ||
          "(No subject)";
        const from =
          headers.find((h) => h.name.toLowerCase() === "from")?.value ||
          "Unknown";
        const to =
          headers.find((h) => h.name.toLowerCase() === "to")?.value || "Me";
        const date =
          headers.find((h) => h.name.toLowerCase() === "date")?.value || "";

        return {
          id: msg.id,
          threadId: msg.threadId,
          snippet: details.snippet || "",
          subject,
          from,
          to,
          date,
        };
      } catch {
        return {
          id: msg.id,
          threadId: msg.threadId,
          snippet: "",
          subject: "(Could not fetch message details)",
          from: "Unknown",
          to: "Me",
          date: "",
        };
      }
    })
  );

  return summaries;
}

// ==========================================
// 2. Google Forms API
// ==========================================

export async function createGoogleForm({
  token,
  title,
  description,
}: {
  token: string;
  title: string;
  description?: string;
}): Promise<GoogleFormDetails> {
  const res = await workspaceFetch("https://forms.googleapis.com/v1/forms", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      info: {
        title,
        documentTitle: title,
        description: description || "Alumni Community Form",
      },
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      err?.error?.message || `Failed to create form (${res.status} ${res.statusText})`
    );
  }

  const createdForm = await res.json();

  try {
    const updateRes = await workspaceFetch(
      `https://forms.googleapis.com/v1/forms/${createdForm.formId}:batchUpdate`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          requests: [
            {
              createItem: {
                item: {
                  title: "Full Name",
                  questionItem: {
                    question: {
                      required: true,
                      textQuestion: { paragraph: false },
                    },
                  },
                },
                location: { index: 0 },
              },
            },
            {
              createItem: {
                item: {
                  title: "Graduation Batch / Year",
                  questionItem: {
                    question: {
                      required: true,
                      textQuestion: { paragraph: false },
                    },
                  },
                },
                location: { index: 1 },
              },
            },
            {
              createItem: {
                item: {
                  title: "Alumni Feedback or Notes",
                  questionItem: {
                    question: {
                      required: false,
                      textQuestion: { paragraph: true },
                    },
                  },
                },
                location: { index: 2 },
              },
            },
          ],
        }),
      }
    );
    if (updateRes.ok) {
      return await getGoogleForm({ token, formId: createdForm.formId });
    }
  } catch (e) {
    console.warn("Could not add initial questions to form:", e);
  }

  return createdForm;
}

export async function getGoogleForm({
  token,
  formId,
}: {
  token: string;
  formId: string;
}): Promise<GoogleFormDetails> {
  const res = await workspaceFetch(`https://forms.googleapis.com/v1/forms/${formId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      err?.error?.message || `Failed to get form (${res.status} ${res.statusText})`
    );
  }

  return res.json();
}

export async function getGoogleFormResponses({
  token,
  formId,
}: {
  token: string;
  formId: string;
}): Promise<GoogleFormResponse[]> {
  const res = await workspaceFetch(
    `https://forms.googleapis.com/v1/forms/${formId}/responses`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      err?.error?.message || `Failed to get responses (${res.status} ${res.statusText})`
    );
  }

  const data = await res.json();
  return data.responses || [];
}

// ==========================================
// 3. Google Docs API
// ==========================================

export async function createGoogleDoc({
  token,
  title,
  initialContent,
}: {
  token: string;
  title: string;
  initialContent?: string;
}): Promise<GoogleDocDetails> {
  const res = await workspaceFetch("https://docs.googleapis.com/v1/documents", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ title }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      err?.error?.message || `Failed to create Google Doc (${res.status})`
    );
  }

  const createdDoc: GoogleDocDetails = await res.json();

  if (initialContent && createdDoc.documentId) {
    try {
      await insertDocText({
        token,
        documentId: createdDoc.documentId,
        text: initialContent,
        index: 1,
      });
    } catch (e) {
      console.warn("Could not insert initial content into doc:", e);
    }
  }

  return createdDoc;
}

export async function getGoogleDoc({
  token,
  documentId,
}: {
  token: string;
  documentId: string;
}): Promise<GoogleDocDetails> {
  const res = await workspaceFetch(`https://docs.googleapis.com/v1/documents/${documentId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      err?.error?.message || `Failed to fetch Google Doc (${res.status})`
    );
  }

  return res.json();
}

export async function insertDocText({
  token,
  documentId,
  text,
  index = 1,
}: {
  token: string;
  documentId: string;
  text: string;
  index?: number;
}) {
  const res = await workspaceFetch(
    `https://docs.googleapis.com/v1/documents/${documentId}:batchUpdate`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        requests: [
          {
            insertText: {
              location: { index },
              text,
            },
          },
        ],
      }),
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      err?.error?.message || `Failed to insert text into Doc (${res.status})`
    );
  }

  return res.json();
}

export async function listUserDocsFromDrive({
  token,
}: {
  token: string;
}): Promise<Array<{ id: string; name: string; modifiedTime: string }>> {
  const query = encodeURIComponent(
    "mimeType = 'application/vnd.google-apps.document' and trashed = false"
  );
  const res = await workspaceFetch(
    `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,modifiedTime)&pageSize=25`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!res.ok) return [];
  const data = await res.json();
  return data.files || [];
}

// ==========================================
// 4. Google Calendar API
// ==========================================

export async function listCalendarEvents({
  token,
  calendarId = "primary",
  timeMin,
  maxResults = 20,
}: {
  token: string;
  calendarId?: string;
  timeMin?: string;
  maxResults?: number;
}): Promise<GoogleCalendarEvent[]> {
  const url = new URL(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
      calendarId
    )}/events`
  );
  url.searchParams.set("singleEvents", "true");
  url.searchParams.set("orderBy", "startTime");
  url.searchParams.set("maxResults", maxResults.toString());
  if (timeMin) {
    url.searchParams.set("timeMin", timeMin);
  } else {
    url.searchParams.set("timeMin", new Date().toISOString());
  }

  const res = await workspaceFetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      err?.error?.message || `Failed to fetch Calendar events (${res.status})`
    );
  }

  const data = await res.json();
  return data.items || [];
}

export async function createCalendarEvent({
  token,
  calendarId = "primary",
  summary,
  description,
  location,
  startDateTime,
  endDateTime,
  attendees = [],
}: {
  token: string;
  calendarId?: string;
  summary: string;
  description?: string;
  location?: string;
  startDateTime: string;
  endDateTime: string;
  attendees?: string[];
}): Promise<GoogleCalendarEvent> {
  const res = await workspaceFetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
      calendarId
    )}/events`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        summary,
        description,
        location,
        start: { dateTime: startDateTime },
        end: { dateTime: endDateTime },
        attendees: attendees.map((email) => ({ email })),
      }),
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      err?.error?.message || `Failed to create calendar event (${res.status})`
    );
  }

  return res.json();
}

export async function deleteCalendarEvent({
  token,
  calendarId = "primary",
  eventId,
}: {
  token: string;
  calendarId?: string;
  eventId: string;
}) {
  const res = await workspaceFetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
      calendarId
    )}/events/${eventId}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!res.ok && res.status !== 204) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      err?.error?.message || `Failed to delete calendar event (${res.status})`
    );
  }

  return true;
}

// ==========================================
// 5. Google Chat API
// ==========================================

export async function listChatSpaces({
  token,
}: {
  token: string;
}): Promise<GoogleChatSpace[]> {
  const res = await workspaceFetch("https://chat.googleapis.com/v1/spaces", {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      err?.error?.message || `Failed to list Google Chat spaces (${res.status})`
    );
  }

  const data = await res.json();
  return data.spaces || [];
}

export async function listChatMessages({
  token,
  spaceName,
  pageSize = 30,
}: {
  token: string;
  spaceName: string;
  pageSize?: number;
}): Promise<GoogleChatMessage[]> {
  const url = new URL(`https://chat.googleapis.com/v1/${spaceName}/messages`);
  url.searchParams.set("pageSize", pageSize.toString());

  const res = await workspaceFetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      err?.error?.message || `Failed to list messages in space (${res.status})`
    );
  }

  const data = await res.json();
  return data.messages || [];
}

export async function sendChatMessage({
  token,
  spaceName,
  text,
}: {
  token: string;
  spaceName: string;
  text: string;
}): Promise<GoogleChatMessage> {
  const res = await workspaceFetch(`https://chat.googleapis.com/v1/${spaceName}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      err?.error?.message || `Failed to send Google Chat message (${res.status})`
    );
  }

  return res.json();
}

export async function createChatSpace({
  token,
  displayName,
}: {
  token: string;
  displayName: string;
}): Promise<GoogleChatSpace> {
  const res = await workspaceFetch("https://chat.googleapis.com/v1/spaces", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      displayName,
      spaceType: "SPACE",
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      err?.error?.message || `Failed to create Chat space (${res.status})`
    );
  }

  return res.json();
}
