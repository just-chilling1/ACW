import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/api-auth";
import { getKitWithAssets } from "@/lib/instant/kit-engine";
import { buildCsvExport, buildMarkdownExport, buildTxtExport } from "@/lib/instant/export";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(req: Request, { params }: RouteParams) {
    const auth = await requireApiUser();
    if (auth.unauthorized) return auth.unauthorized;

    const { id } = await params;
    const format = new URL(req.url).searchParams.get("format") || "markdown";

    const result = await getKitWithAssets(auth.supabase, id, auth.user.id);
    if (!result) return NextResponse.json({ error: "Kit not found." }, { status: 404 });

    const { kit, assets } = result;
    const filename = `${kit.name.replace(/[^a-z0-9]/gi, "-").toLowerCase()}-promotion-kit`;

    if (format === "csv") {
        const csv = buildCsvExport(assets);
        return new NextResponse(csv, {
            headers: {
                "Content-Type": "text/csv",
                "Content-Disposition": `attachment; filename="${filename}.csv"`,
            },
        });
    }

    if (format === "txt") {
        const txt = buildTxtExport(kit, assets);
        return new NextResponse(txt, {
            headers: {
                "Content-Type": "text/plain",
                "Content-Disposition": `attachment; filename="${filename}.txt"`,
            },
        });
    }

    const markdown = buildMarkdownExport(kit, assets);
    return new NextResponse(markdown, {
        headers: {
            "Content-Type": "text/markdown",
            "Content-Disposition": `attachment; filename="${filename}.md"`,
        },
    });
}
