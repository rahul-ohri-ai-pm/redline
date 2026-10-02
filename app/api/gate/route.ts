import { handleGateRequest } from "@/lib/gate/handler";

export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  return handleGateRequest(request);
}
