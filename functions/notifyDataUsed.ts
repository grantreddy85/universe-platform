import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Called when an asset is linked to a platform-level project or hypothesis.
 * Sends an in-app notification (and email) to the asset's original creator.
 *
 * Payload:
 *   asset_id       - the asset being used
 *   project_title  - the project or hypothesis using it
 *   context        - short description of how it's being used (optional)
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { asset_id, project_title, context } = await req.json();

    if (!asset_id || !project_title) {
      return Response.json({ error: 'asset_id and project_title are required' }, { status: 400 });
    }

    // Fetch the asset to find its creator
    const asset = await base44.asServiceRole.entities.Asset.get(asset_id);
    if (!asset) {
      return Response.json({ error: 'Asset not found' }, { status: 404 });
    }

    const recipientEmail = asset.created_by;
    if (!recipientEmail) {
      return Response.json({ error: 'Asset has no creator email' }, { status: 400 });
    }

    const notifTitle = `Your data was used in a platform project`;
    const notifMessage = context
      ? `Your asset "${asset.title}" was referenced in "${project_title}". ${context}`
      : `Your asset "${asset.title}" has been used as a data source in "${project_title}" on the UniVerse platform.`;

    // Create in-app notification
    await base44.asServiceRole.entities.Notification.create({
      user_email: recipientEmail,
      title: notifTitle,
      message: notifMessage,
      type: 'data_used',
      related_entity_type: 'asset',
      related_entity_id: asset_id,
      is_read: false,
    });

    // Send email notification
    await base44.asServiceRole.integrations.Core.SendEmail({
      to: recipientEmail,
      subject: `UniVerse: Your data was used in "${project_title}"`,
      body: `
Hi there,

Great news — your research asset "${asset.title}" has been referenced or used as a data source in the platform project "${project_title}".

${context ? `Context: ${context}\n` : ''}

This contributes to your data contribution score and may generate royalty attribution when this project produces validated assets.

Log in to UniVerse to view the full details.

— The UniVerse Platform
      `.trim(),
    });

    return Response.json({ success: true, notified: recipientEmail });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});