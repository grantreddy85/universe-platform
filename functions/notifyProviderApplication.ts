import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    const applicationId = payload?.event?.entity_id;
    const eventType = payload?.event?.type;

    if (eventType !== "create") {
      return Response.json({ skipped: true });
    }

    // Fetch the application data
    const application = await base44.asServiceRole.entities.ProviderApplication.get(applicationId);
    if (!application) {
      return Response.json({ error: "Application not found" }, { status: 404 });
    }

    // Get all admin users
    const allUsers = await base44.asServiceRole.entities.User.list();
    const admins = allUsers.filter(u => u.role === "admin");

    // Parse org info for a friendly name
    let orgName = application.user_email;
    try {
      const org = JSON.parse(application.qualifications);
      if (org.institution_name) orgName = org.institution_name;
    } catch (_) {}

    // Create a notification for each admin
    for (const admin of admins) {
      await base44.asServiceRole.entities.Notification.create({
        user_email: admin.email,
        title: "New Provider Application",
        message: `${orgName} has submitted a service provider application and is awaiting your review.`,
        type: "system",
        related_entity_type: "provider_application",
        related_entity_id: applicationId,
        is_read: false,
      });
    }

    return Response.json({ success: true, notified: admins.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});