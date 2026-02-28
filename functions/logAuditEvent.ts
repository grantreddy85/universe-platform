import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

async function sha256(message) {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { asset_id, project_id, event_type, description, metadata, actor_role } = await req.json();

    if (!asset_id || !event_type || !description) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Fetch the most recent audit event for this asset to get the previous hash
    const recentEvents = await base44.asServiceRole.entities.AuditEvent.filter(
      { asset_id },
      '-created_date',
      1
    );
    const previousHash = recentEvents[0]?.event_hash || '0000000000000000000000000000000000000000000000000000000000000000';

    // Build the canonical payload string for hashing
    const payload = JSON.stringify({
      asset_id,
      project_id: project_id || null,
      event_type,
      actor_email: user.email,
      actor_role: actor_role || user.role || 'researcher',
      description,
      metadata: metadata || {},
      previous_hash: previousHash,
      timestamp: new Date().toISOString(),
    });

    const event_hash = await sha256(payload);

    const event = await base44.asServiceRole.entities.AuditEvent.create({
      asset_id,
      project_id: project_id || null,
      event_type,
      actor_email: user.email,
      actor_role: actor_role || user.role || 'researcher',
      description,
      metadata: metadata || {},
      event_hash,
      previous_hash: previousHash,
    });

    return Response.json({ success: true, event });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});