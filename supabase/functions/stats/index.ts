import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.24.0";

console.log("Started stats function");

const headers = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Headers":
		"authorization, x-client-info, apikey, content-type",
};

serve(async (_req) => {
	try {
		// Create a Supabase client with the Auth context of the logged in user.
		const supabaseClient = createClient(
			// Supabase API URL - env var exported by default.
			Deno.env.get("SUPABASE_URL") ?? "",
			// Supabase API ANON KEY - env var exported by default.
			Deno.env.get("SUPABASE_ANON_KEY") ?? ""
		);

		// Get server count
	  const result1 = await supabaseClient
			.from("servers")
			.select("*", { count: "exact", head: true });
		if (result1.error) throw result1.error;

		// Get player count
		const result2 = await supabaseClient
			.from("players")
			.select("*", { count: "exact", head: true });
      if (result2.error) throw result2.error;

		return new Response(`
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="113.25" height="28" role="img" aria-label="Minescrap">
	<title>Minescrap</title>
	<g shape-rendering="crispEdges">
		<rect width="60" height="28" fill="#DD0031"/>
		<rect x="60" width="2" height="28" fill="#f55"/>
		<rect x="62" width="60" height="28" fill="#DD0031"/>
	</g>
	<g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" text-rendering="geometricPrecision" font-size="100">
		<image x="3" y="2" width="24" height="24" xlink:href="data:image/svg+xml;base64,PCFET0NUWVBFIHN2ZyBQVUJMSUMgIi0vL1czQy8vRFREIFNWRyAxLjEvL0VOIiAiaHR0cDovL3d3dy53My5vcmcvR3JhcGhpY3MvU1ZHLzEuMS9EVEQvc3ZnMTEuZHRkIj4KPCEtLSBVcGxvYWRlZCB0bzogU1ZHIFJlcG8sIHd3dy5zdmdyZXBvLmNvbSwgVHJhbnNmb3JtZWQgYnk6IFNWRyBSZXBvIE1peGVyIFRvb2xzIC0tPgo8c3ZnIHdpZHRoPSI4MDBweCIgaGVpZ2h0PSI4MDBweCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgoNPGcgaWQ9IlNWR1JlcG9fYmdDYXJyaWVyIiBzdHJva2Utd2lkdGg9IjAiLz4KDTxnIGlkPSJTVkdSZXBvX3RyYWNlckNhcnJpZXIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgoNPGcgaWQ9IlNWR1JlcG9faWNvbkNhcnJpZXIiPiA8cGF0aCBkPSJNMjAuNSA4LjVWNS41QzIwLjUgNS4yMzQ3OCAyMC4zOTQ2IDQuOTgwNDMgMjAuMjA3MSA0Ljc5Mjg5QzIwLjAxOTYgNC42MDUzNiAxOS43NjUyIDQuNSAxOS41IDQuNUg0LjVDNC4yMzQ3OCA0LjUgMy45ODA0MyA0LjYwNTM2IDMuNzkyODkgNC43OTI4OUMzLjYwNTM2IDQuOTgwNDMgMy41IDUuMjM0NzggMy41IDUuNVY4LjVDMy41IDguNzY1MjIgMy42MDUzNiA5LjAxOTU3IDMuNzkyODkgOS4yMDcxMUMzLjk4MDQzIDkuMzk0NjQgNC4yMzQ3OCA5LjUgNC41IDkuNUM0LjIzNDc4IDkuNSAzLjk4MDQzIDkuNjA1MzYgMy43OTI4OSA5Ljc5Mjg5QzMuNjA1MzYgOS45ODA0MyAzLjUgMTAuMjM0OCAzLjUgMTAuNVYxMy41QzMuNSAxMy43NjUyIDMuNjA1MzYgMTQuMDE5NiAzLjc5Mjg5IDE0LjIwNzFDMy45ODA0MyAxNC4zOTQ2IDQuMjM0NzggMTQuNSA0LjUgMTQuNUM0LjIzNDc4IDE0LjUgMy45ODA0MyAxNC42MDU0IDMuNzkyODkgMTQuNzkyOUMzLjYwNTM2IDE0Ljk4MDQgMy41IDE1LjIzNDggMy41IDE1LjVWMTguNUMzLjUgMTguNzY1MiAzLjYwNTM2IDE5LjAxOTYgMy43OTI4OSAxOS4yMDcxQzMuOTgwNDMgMTkuMzk0NiA0LjIzNDc4IDE5LjUgNC41IDE5LjVIMTkuNUMxOS43NjUyIDE5LjUgMjAuMDE5NiAxOS4zOTQ2IDIwLjIwNzEgMTkuMjA3MUMyMC4zOTQ2IDE5LjAxOTYgMjAuNSAxOC43NjUyIDIwLjUgMTguNVYxNS41QzIwLjUgMTUuMjM0OCAyMC4zOTQ2IDE0Ljk4MDQgMjAuMjA3MSAxNC43OTI5QzIwLjAxOTYgMTQuNjA1NCAxOS43NjUyIDE0LjUgMTkuNSAxNC41QzE5Ljc2NTIgMTQuNSAyMC4wMTk2IDE0LjM5NDYgMjAuMjA3MSAxNC4yMDcxQzIwLjM5NDYgMTQuMDE5NiAyMC41IDEzLjc2NTIgMjAuNSAxMy41VjEwLjVDMjAuNSAxMC4yMzQ4IDIwLjM5NDYgOS45ODA0MyAyMC4yMDcxIDkuNzkyODlDMjAuMDE5NiA5LjYwNTM2IDE5Ljc2NTIgOS41IDE5LjUgOS41QzE5Ljc2NTIgOS41IDIwLjAxOTYgOS4zOTQ2NCAyMC4yMDcxIDkuMjA3MTFDMjAuMzk0NiA5LjAxOTU3IDIwLjUgOC43NjUyMiAyMC41IDguNVpNMTkuNSAxOC41SDQuNVYxNS41SDE5LjVWMTguNVpNMTkuNSAxMy41SDQuNVYxMC41SDE5LjVWMTMuNVpNMTkuNSA4LjVINC41VjUuNUgxOS41VjguNVoiIGZpbGw9IiNmZmZmZmYiLz4gPHBhdGggZD0iTTYuMjUgNy43NUM2LjY2NDIxIDcuNzUgNyA3LjQxNDIxIDcgN0M3IDYuNTg1NzkgNi42NjQyMSA2LjI1IDYuMjUgNi4yNUM1LjgzNTc5IDYuMjUgNS41IDYuNTg1NzkgNS41IDdDNS41IDcuNDE0MjEgNS44MzU3OSA3Ljc1IDYuMjUgNy43NVoiIGZpbGw9IiNmZmZmZmYiLz4gPHBhdGggZD0iTTguNzUgNy43NUM5LjE2NDIxIDcuNzUgOS41IDcuNDE0MjEgOS41IDdDOS41IDYuNTg1NzkgOS4xNjQyMSA2LjI1IDguNzUgNi4yNUM4LjMzNTc5IDYuMjUgOCA2LjU4NTc5IDggN0M4IDcuNDE0MjEgOC4zMzU3OSA3Ljc1IDguNzUgNy43NVoiIGZpbGw9IiNmZmZmZmYiLz4gPHBhdGggZD0iTTYuMjUgMTIuNzVDNi42NjQyMSAxMi43NSA3IDEyLjQxNDIgNyAxMkM3IDExLjU4NTggNi42NjQyMSAxMS4yNSA2LjI1IDExLjI1QzUuODM1NzkgMTEuMjUgNS41IDExLjU4NTggNS41IDEyQzUuNSAxMi40MTQyIDUuODM1NzkgMTIuNzUgNi4yNSAxMi43NVoiIGZpbGw9IiNmZmZmZmYiLz4gPHBhdGggZD0iTTguNzUgMTIuNzVDOS4xNjQyMSAxMi43NSA5LjUgMTIuNDE0MiA5LjUgMTJDOS41IDExLjU4NTggOS4xNjQyMSAxMS4yNSA4Ljc1IDExLjI1QzguMzM1NzkgMTEuMjUgOCAxMS41ODU4IDggMTJDOCAxMi40MTQyIDguMzM1NzkgMTIuNzUgOC43NSAxMi43NVoiIGZpbGw9IiNmZmZmZmYiLz4gPHBhdGggZD0iTTYuMjUgMTcuNzVDNi42NjQyMSAxNy43NSA3IDE3LjQxNDIgNyAxN0M3IDE2LjU4NTggNi42NjQyMSAxNi4yNSA2LjI1IDE2LjI1QzUuODM1NzkgMTYuMjUgNS41IDE2LjU4NTggNS41IDE3QzUuNSAxNy40MTQyIDUuODM1NzkgMTcuNzUgNi4yNSAxNy43NVoiIGZpbGw9IiNmZmZmZmYiLz4gPHBhdGggZD0iTTguNzUgMTcuNzVDOS4xNjQyMSAxNy43NSA5LjUgMTcuNDE0MiA5LjUgMTdDOS41IDE2LjU4NTggOS4xNjQyMSAxNi4yNSA4Ljc1IDE2LjI1QzguMzM1NzkgMTYuMjUgOCAxNi41ODU4IDggMTdDOCAxNy40MTQyIDguMzM1NzkgMTcuNzUgOC43NSAxNy43NVoiIGZpbGw9IiNmZmZmZmYiLz4gPC9nPgoNPC9zdmc+"/>
		<text transform="scale(.1)" x="430" y="175" fill="#fff" font-weight="bold">${result1.count}</text>
		<image x="65" y="7" width="14" height="14" xlink:href="data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiA/Pg0KDQo8IS0tIFVwbG9hZGVkIHRvOiBTVkcgUmVwbywgd3d3LnN2Z3JlcG8uY29tLCBHZW5lcmF0b3I6IFNWRyBSZXBvIE1peGVyIFRvb2xzIC0tPg0KPHN2ZyB3aWR0aD0iODAwcHgiIGhlaWdodD0iODAwcHgiIHZpZXdCb3g9IjAgMCAyNCAyNCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4NCg0KPHRpdGxlLz4NCg0KPGcgaWQ9IkNvbXBsZXRlIj4NCg0KPGcgaWQ9InVzZXIiPg0KDQo8Zz4NCg0KPHBhdGggZD0iTTIwLDIxVjE5YTQsNCwwLDAsMC00LTRIOGE0LDQsMCwwLDAtNCw0djIiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI2ZmZmZmZiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBzdHJva2Utd2lkdGg9IjIiLz4NCg0KPGNpcmNsZSBjeD0iMTIiIGN5PSI3IiBmaWxsPSJub25lIiByPSI0IiBzdHJva2U9IiNmZmYiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIgc3Ryb2tlLXdpZHRoPSIyIi8+DQoNCjwvZz4NCg0KPC9nPg0KDQo8L2c+DQoNCjwvc3ZnPg=="/>
		<text transform="scale(.1)" x="950" y="175" fill="#fff" font-weight="bold">${result2.count}</text>
	</g>
</svg>
    `, {
			headers: {
        ...headers,
        "Content-Type": "image/svg+xml;charset=utf-8",
		"Cache-Control": "private, max-age=0, no-cache"
      },
			status: 200,
		});
	} catch (error) {
		return new Response(JSON.stringify({ error: error.message }), {
			headers: {
        ...headers,
        "Content-Type": "application/json"
      },
			status: 400,
		});
	}
});
