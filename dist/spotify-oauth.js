import { createHash, randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { stdin, stdout } from "node:process";
import { createInterface } from "node:readline/promises";
const REDIRECT_URI = "http://localhost:8888/callback";
const AUTH_URL = "https://accounts.spotify.com/authorize";
const TOKEN_URL = "https://accounts.spotify.com/api/token";
const USER_PROFILE_URL = "https://api.spotify.com/v1/me";
const SCOPES = [
    "user-read-playback-state",
    "user-modify-playback-state",
    "user-read-currently-playing",
    "user-library-read",
    "user-library-modify",
    "playlist-read-private",
    "playlist-read-collaborative",
    "playlist-modify-public",
    "playlist-modify-private",
    "user-follow-read",
    "user-follow-modify",
    "user-top-read",
    "user-read-recently-played",
];
function isWSL() {
    if (process.platform !== "linux")
        return false;
    try {
        const release = readFileSync("/proc/version", "utf8").toLowerCase();
        return release.includes("microsoft") || release.includes("wsl");
    }
    catch {
        return false;
    }
}
function isWSL2() {
    if (!isWSL())
        return false;
    try {
        const version = readFileSync("/proc/version", "utf8").toLowerCase();
        return version.includes("wsl2") || version.includes("microsoft-standard");
    }
    catch {
        return false;
    }
}
export function isRemoteEnvironment() {
    if (process.env["SSH_CLIENT"] ||
        process.env["SSH_TTY"] ||
        process.env["SSH_CONNECTION"]) {
        return true;
    }
    if (process.env["REMOTE_CONTAINERS"] || process.env["CODESPACES"]) {
        return true;
    }
    if (process.platform === "linux" &&
        !process.env["DISPLAY"] &&
        !process.env["WAYLAND_DISPLAY"] &&
        !isWSL()) {
        return true;
    }
    return false;
}
export function shouldUseManualOAuthFlow() {
    return isWSL2() || isRemoteEnvironment();
}
function generatePKCESync() {
    const verifier = randomBytes(32).toString("hex");
    const challenge = createHash("sha256").update(verifier).digest("base64url");
    return { verifier, challenge };
}
function buildAuthUrl(clientId, challenge, state) {
    const params = new URLSearchParams({
        client_id: clientId,
        response_type: "code",
        redirect_uri: REDIRECT_URI,
        scope: SCOPES.join(" "),
        code_challenge: challenge,
        code_challenge_method: "S256",
        state,
        show_dialog: "false",
    });
    return `${AUTH_URL}?${params.toString()}`;
}
function parseCallbackInput(input, expectedState) {
    const trimmed = input.trim();
    if (!trimmed) {
        return { error: "No input provided" };
    }
    try {
        const url = new URL(trimmed);
        const code = url.searchParams.get("code");
        const state = url.searchParams.get("state") ?? expectedState;
        if (!code) {
            return { error: "Missing 'code' parameter in URL" };
        }
        if (!state) {
            return { error: "Missing 'state' parameter. Paste the full URL." };
        }
        return { code, state };
    }
    catch {
        if (!expectedState) {
            return { error: "Paste the full redirect URL, not just the code." };
        }
        return { code: trimmed, state: expectedState };
    }
}
async function exchangeCodeForTokens(code, verifier, clientId, clientSecret) {
    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
    const response = await fetch(TOKEN_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Basic ${auth}`,
        },
        body: new URLSearchParams({
            grant_type: "authorization_code",
            code,
            redirect_uri: REDIRECT_URI,
            code_verifier: verifier,
        }),
    });
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Token exchange failed: ${errorText}`);
    }
    const data = (await response.json());
    if (!data.access_token) {
        throw new Error("No access token received");
    }
    if (!data.refresh_token) {
        throw new Error("No refresh token received. Please try again.");
    }
    const profile = await getUserProfile(data.access_token);
    const expiresAt = Date.now() + data.expires_in * 1000 - 5 * 60 * 1000;
    return {
        access: data.access_token,
        refresh: data.refresh_token,
        expires: expiresAt,
        email: profile.email,
        displayName: profile.displayName,
    };
}
async function getUserProfile(accessToken) {
    try {
        const response = await fetch(USER_PROFILE_URL, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });
        if (response.ok) {
            const data = (await response.json());
            return {
                email: data.email,
                displayName: data.display_name,
            };
        }
    }
    catch {
    }
    return {};
}
async function promptInput(message) {
    const rl = createInterface({ input: stdin, output: stdout });
    try {
        return (await rl.question(message)).trim();
    }
    finally {
        rl.close();
    }
}
async function startCallbackServer(expectedState) {
    const { createServer } = await import("node:http");
    return new Promise((resolve, reject) => {
        const server = createServer((req, res) => {
            try {
                const url = new URL(req.url ?? "", `http://${req.headers.host}`);
                if (url.pathname === "/callback") {
                    const code = url.searchParams.get("code");
                    const state = url.searchParams.get("state");
                    if (!code) {
                        res.writeHead(400, { "Content-Type": "text/html" });
                        res.end("<html><body><h1>Error</h1><p>No authorization code received.</p></body></html>");
                        server.close();
                        reject(new Error("No authorization code received"));
                        return;
                    }
                    if (state !== expectedState) {
                        res.writeHead(400, { "Content-Type": "text/html" });
                        res.end("<html><body><h1>Error</h1><p>State mismatch. Please try again.</p></body></html>");
                        server.close();
                        reject(new Error("OAuth state mismatch"));
                        return;
                    }
                    res.writeHead(200, { "Content-Type": "text/html" });
                    res.end("<html><body><h1>Success!</h1><p>You can close this window and return to the terminal.</p></body></html>");
                    server.close();
                    resolve({ code, state });
                }
            }
            catch (err) {
                res.writeHead(500, { "Content-Type": "text/html" });
                res.end("<html><body><h1>Error</h1></body></html>");
                server.close();
                reject(err);
            }
        });
        server.listen(8888, "localhost", () => {
        });
        server.on("error", (err) => {
            reject(err);
        });
    });
}
export async function loginSpotifyVpsAware(clientId, clientSecret, onUrl, onProgress) {
    if (shouldUseManualOAuthFlow()) {
        return loginSpotifyManual(clientId, clientSecret, onUrl, onProgress);
    }
    try {
        return await loginSpotifyLocal(clientId, clientSecret, onUrl, onProgress);
    }
    catch (err) {
        if (err instanceof Error &&
            (err.message.includes("EADDRINUSE") ||
                err.message.includes("port") ||
                err.message.includes("listen"))) {
            onProgress?.("Local callback server failed. Switching to manual mode...");
            return loginSpotifyManual(clientId, clientSecret, onUrl, onProgress);
        }
        throw err;
    }
}
export async function loginSpotifyLocal(clientId, clientSecret, onUrl, onProgress) {
    const { verifier, challenge } = generatePKCESync();
    const authUrl = buildAuthUrl(clientId, challenge, verifier);
    await onUrl(authUrl);
    onProgress?.("Opening browser for authorization...");
    const callbackPromise = startCallbackServer(verifier);
    const { code } = await callbackPromise;
    onProgress?.("Exchanging authorization code for tokens...");
    return exchangeCodeForTokens(code, verifier, clientId, clientSecret);
}
export async function loginSpotifyManual(clientId, clientSecret, onUrl, onProgress) {
    const { verifier, challenge } = generatePKCESync();
    const authUrl = buildAuthUrl(clientId, challenge, verifier);
    await onUrl(authUrl);
    onProgress?.("Waiting for you to paste the callback URL...");
    console.log("\n");
    console.log("=".repeat(60));
    console.log("VPS/Remote Mode - Manual OAuth");
    console.log("=".repeat(60));
    console.log("\n1. Open the URL above in your LOCAL browser");
    console.log("2. Complete the Spotify authorization");
    console.log("3. Your browser will redirect to a localhost URL that won't load");
    console.log("4. Copy the ENTIRE URL from your browser's address bar");
    console.log("5. Paste it below\n");
    console.log("The URL will look like:");
    console.log("http://localhost:8888/callback?code=xxx&state=yyy\n");
    const callbackInput = await promptInput("Paste the redirect URL here: ");
    const parsed = parseCallbackInput(callbackInput, verifier);
    if ("error" in parsed) {
        throw new Error(parsed.error);
    }
    if (parsed.state !== verifier) {
        throw new Error("OAuth state mismatch - please try again");
    }
    onProgress?.("Exchanging authorization code for tokens...");
    return exchangeCodeForTokens(parsed.code, verifier, clientId, clientSecret);
}
//# sourceMappingURL=spotify-oauth.js.map