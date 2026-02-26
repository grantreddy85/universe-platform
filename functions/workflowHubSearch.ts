import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { query = '', page = 1 } = body;

        const url = query
            ? `https://workflowhub.eu/workflows.json?page=${page}&per_page=20&q=${encodeURIComponent(query)}`
            : `https://workflowhub.eu/workflows.json?page=${page}&per_page=20`;

        const res = await fetch(url, {
            headers: { 'Accept': 'application/json' }
        });

        if (!res.ok) {
            return Response.json({ error: `WorkflowHub API error: ${res.status}` }, { status: 502 });
        }

        const data = await res.json();

        // Fetch details for each workflow (title, description, type, tags)
        const workflows = await Promise.all(
            (data.data || []).map(async (wf) => {
                try {
                    const detailRes = await fetch(`https://workflowhub.eu/workflows/${wf.id}.json`, {
                        headers: { 'Accept': 'application/json' }
                    });
                    if (!detailRes.ok) return { id: wf.id, title: wf.attributes?.title || 'Unknown', description: '', tags: [], type: 'other' };
                    const detail = await detailRes.json();
                    const attrs = detail.data?.attributes || {};
                    return {
                        id: wf.id,
                        title: attrs.title || wf.attributes?.title || 'Untitled',
                        description: attrs.description || '',
                        tags: attrs.tags || [],
                        license: attrs.license || '',
                        workflow_type: attrs.workflow_class?.key || attrs.workflow_type || '',
                        source_url: `https://workflowhub.eu/workflows/${wf.id}`,
                    };
                } catch {
                    return { id: wf.id, title: wf.attributes?.title || 'Unknown', description: '', tags: [], type: 'other' };
                }
            })
        );

        return Response.json({
            workflows,
            total_pages: data.meta?.total_pages || 1,
            current_page: page
        });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});