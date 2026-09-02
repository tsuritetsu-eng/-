/**
 * UNTRODDENT Wiki AI - Cloudflare Worker
 *
 * Required secrets:
 *   OPENAI_API_KEY
 *
 * Required environment variables:
 *   VECTOR_STORE_ID
 *   OPENAI_MODEL (optional; defaults to gpt-5.6-luna)
 *   ALLOWED_ORIGIN (optional; defaults to *)
 */

export default {
  async fetch(request, env) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": env.ALLOWED_ORIGIN || "*",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Content-Type": "application/json; charset=utf-8"
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "POST only" }),
        { status: 405, headers: corsHeaders }
      );
    }

    try {
      const body = await request.json();
      const message = String(body?.message || "").trim();

      if (!message) {
        return new Response(
          JSON.stringify({ error: "message is required" }),
          { status: 400, headers: corsHeaders }
        );
      }

      if (!env.OPENAI_API_KEY || !env.VECTOR_STORE_ID) {
        return new Response(
          JSON.stringify({ error: "Worker configuration is incomplete." }),
          { status: 500, headers: corsHeaders }
        );
      }

      const model = env.OPENAI_MODEL || "gpt-5.6-luna";

      const response = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${env.OPENAI_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model,
          input: [
            {
              role: "system",
              content: [
                {
                  type: "input_text",
                  text:
                    "あなたは「アントロデン Wiki AI」です。ユーザーの質問には、登録されたアントロデンWikiの知識を最優先して回答してください。Wikiに根拠がない情報は断定せず、「Wiki内では確認できません」と明示してください。ゲーム内の数値・固有スキル・アイテム効果などは、検索結果にある情報を優先してください。簡潔で分かりやすい日本語で回答してください。"
                }
              ]
            },
            {
              role: "user",
              content: [
                {
                  type: "input_text",
                  text: message
                }
              ]
            }
          ],
          tools: [
            {
              type: "file_search",
              vector_store_ids: [env.VECTOR_STORE_ID],
              max_num_results: 8
            }
          ]
        })
      });

      const data = await response.json();

      if (!response.ok) {
        return new Response(
          JSON.stringify({
            error: data?.error?.message || "OpenAI API request failed."
          }),
          { status: response.status, headers: corsHeaders }
        );
      }

      const answer =
        data?.output_text ||
        data?.output
          ?.flatMap(x => x?.content || [])
          ?.map(x => x?.text || "")
          ?.filter(Boolean)
          ?.join("\n") ||
        "回答を取得できませんでした。";

      return new Response(
        JSON.stringify({ answer }),
        { status: 200, headers: corsHeaders }
      );
    } catch (error) {
      return new Response(
        JSON.stringify({ error: error?.message || "Unknown error" }),
        { status: 500, headers: corsHeaders }
      );
    }
  }
};
