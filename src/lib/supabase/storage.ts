import "server-only";

import { createClient } from "@supabase/supabase-js";

import { env } from "@/lib/env";
import { slugify } from "@/lib/utils";

function createSupabaseAdmin() {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required to upload logos.",
    );
  }

  return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export async function uploadTeamLogo(input: {
  file: File;
  teamName: string;
  userId: string;
}): Promise<string> {
  const supabase = createSupabaseAdmin();
  const extension = input.file.name.split(".").pop()?.toLowerCase() ?? "png";
  const safeTeamName = slugify(input.teamName) || "team";
  const path = `${input.userId}/${safeTeamName}-${crypto.randomUUID()}.${extension}`;

  const { error } = await supabase.storage
    .from(env.SUPABASE_TEAM_LOGOS_BUCKET)
    .upload(path, input.file, {
      contentType: input.file.type,
      cacheControl: "31536000",
      upsert: false,
    });

  if (error) {
    throw new Error(`Logo upload failed: ${error.message}`);
  }

  const { data } = supabase.storage
    .from(env.SUPABASE_TEAM_LOGOS_BUCKET)
    .getPublicUrl(path);

  return data.publicUrl;
}
