import { EmailProvider, EmailParams } from "./provider";

export class StubEmailProvider implements EmailProvider {
  async send(params: EmailParams): Promise<void> {
    console.log("\n" + "=".repeat(60));
    console.log("[STUB EMAIL] Sending email:");
    console.log(`  To:      ${params.to}`);
    console.log(`  Subject: ${params.subject}`);
    console.log("  Body:    (HTML content logged below)");
    console.log("-".repeat(60));
    console.log(params.html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 500));
    console.log("=".repeat(60) + "\n");
  }
}
